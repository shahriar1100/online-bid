"use client"

import { useEffect, useState } from "react"
import { Country, State, City, IState } from "country-state-city"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { LocationEdit } from "lucide-react"
import { useAppContext } from "../app/context";

type LocationInfo = {
  countryName: string
  countryCode: string
  stateName: string
  stateCode: string
  city: string | null
}

type IpApiResponse = {
  country_code: string
  region: string
  city: string
}

function normalizeName(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export default function LocationSelector() {
  const { dispatch } = useAppContext();

  // ১. ইনিশিয়াল স্টেট সবসময় ফাঁকা বা ডিফল্ট থাকবে (যাতে সার্ভার ও ক্লায়েন্ট ম্যাচ করে)
  const [location, setLocation] = useState<LocationInfo>({
    countryName: "",
    countryCode: "",
    stateName: "",
    stateCode: "",
    city: null,
  })

  // Hydration কনফ্লিক্ট এড়াতে একটি মাউন্টেড স্টেট
  const [isMounted, setIsMounted] = useState(false);

  // ২. পেজ লোড (Mount) হওয়ার পর LocalStorage থেকে ডেটা পড়া
  useEffect(() => {
    setIsMounted(true);
    
    const storedCountry = localStorage.getItem("selectedCountry");
    const storedState = localStorage.getItem("selectedState");
    const storedCity = localStorage.getItem("selectedCity");

    if (storedCountry || storedState || storedCity) {
      setLocation({
        countryName: storedCountry ? storedCountry.split("|")[1] : "",
        countryCode: storedCountry ? storedCountry.split("|")[0] : "",
        stateName: storedState ? storedState.split("|")[1] : "",
        stateCode: storedState ? storedState.split("|")[0] : "",
        city: storedCity || null,
      });
    }
  }, []);

  const countries = Country.getAllCountries()
  const states = location.countryCode ? State.getStatesOfCountry(location.countryCode) : []
  const cities = location.stateCode
    ? City.getCitiesOfState(location.countryCode, location.stateCode)
    : []

  // Auto-detect location via IP
  useEffect(() => {
    // যদি আগে থেকেই লোকাল স্টোরেজে ডেটা থাকে, তাহলে আর এপিআই কল করার দরকার নেই
    const storedCountry = localStorage.getItem("selectedCountry");
    if (storedCountry) return;

    fetch("/api/geo")
      .then((res) => res.json() as Promise<IpApiResponse>)
      .then((data) => {
        const country = countries.find((c) => c.isoCode === data.country_code)

        let state: IState | undefined = undefined
        if (country) {
          const allStates = State.getStatesOfCountry(country.isoCode)
          const target = normalizeName(data.region)

          state = allStates.find(
            (s) => normalizeName(s.name) === target || normalizeName(s.name).includes(target)
          )
        }

        const newLocation = {
          countryName: country?.name || "",
          countryCode: country?.isoCode || "",
          stateName: state?.name || "",
          stateCode: state?.isoCode || "",
          city: data.city || null,
        };

        setLocation(newLocation);

        if (country) {
          localStorage.setItem("selectedCountry", country.isoCode + "|" + country.name);
          dispatch({ type: "SET_COUNTRY", payload: country.isoCode + "|" + country.name });
        }
        if (state) {
          localStorage.setItem("selectedState", state.isoCode + "|" + state.name);
          dispatch({ type: "SET_STATE", payload: state.isoCode + "|" + state.name });
        }
        if (data.city) {
          localStorage.setItem("selectedCity", data.city);
          dispatch({ type: "SET_CITY", payload: data.city });
        }
      })
      .catch((err) => console.error("IP location failed", err))
  }, [countries, dispatch])

  // Hydration এড়াতে যতক্ষণ মাউন্ট না হয়, ততক্ষণ একটি স্কেলিটন বা ফাঁকা লেআউট দেখানো
  if (!isMounted) {
    return (
      <div className="flex justify-start items-center opacity-0">
        <LocationEdit className="w-auto h-4 md:h-5" />
        <div className="w-[120px] h-8"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-center">
      <LocationEdit className="w-auto h-4 md:h-5" />
      {/* Country */}
      <Select
        value={location.countryCode && location.countryName ? location.countryCode + "|" + location.countryName : undefined}
        onValueChange={(val) => {
          const [code, name] = val.split("|");
          setLocation({ countryName: name, countryCode: code, stateName: "", stateCode: "", city: null });
          localStorage.setItem("selectedCountry", val);
          localStorage.removeItem("selectedState");
          localStorage.removeItem("selectedCity");
          dispatch({ type: "SET_COUNTRY", payload: val });
        }}
      >
        <SelectTrigger className="custom-select mobile-view">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.isoCode} value={c.isoCode + "|" + c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State */}
      <Select
        value={location.stateCode && location.stateName ? location.stateCode + "|" + location.stateName : undefined}
        onValueChange={(val) => {
          const [code, name] = val.split("|");
          setLocation({ ...location, stateCode: code, stateName: name, city: null });
          localStorage.setItem("selectedState", val);
          localStorage.removeItem("selectedCity");
          dispatch({ type: "SET_STATE", payload: val });
        }}
        disabled={!location.countryCode}
      >
        <SelectTrigger className="custom-select hidden">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {states.map((s) => (
            <SelectItem key={s.isoCode} value={s.isoCode + "|" + s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City */}
      <Select
        value={location.city || undefined}
        onValueChange={(val) => {
          setLocation({ ...location, city: val });
          localStorage.setItem("selectedCity", val);
          dispatch({ type: "SET_CITY", payload: val });
        }}
        disabled={!location.stateCode}
      >
        <SelectTrigger className="custom-select hidden">
          <SelectValue placeholder="Select City" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.name} value={city.name}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}