"use client"

import { useEffect, useState } from "react"
// import { useGeolocated } from "react-geolocated"
import { Country, State, City, IState } from "country-state-city"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { LocationEdit } from "lucide-react"
import {useAppContext} from "../app/context";

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

// Helper: remove accents & normalize
function normalizeName(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export default function LocationSelector() {
  // useGeolocated({
  //   positionOptions: { enableHighAccuracy: true },
  //   userDecisionTimeout: 5000,
  // })

  const { dispatch } = useAppContext();

  const selectedCountry = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null;
  const selectedState = typeof window !== "undefined" ? localStorage.getItem("selectedState") : null;
  const selectedCity = typeof window !== "undefined" ? localStorage.getItem("selectedCity") : null;

  const defaultLocation: LocationInfo = {
    countryName: selectedCountry ? selectedCountry.split("|")[1] : "",
    countryCode: selectedCountry ? selectedCountry.split("|")[0] : "",
    stateName: selectedState ? selectedState.split("|")[1] : "",
    stateCode: selectedState ? selectedState.split("|")[0] : "",
    city: selectedCity || null,
  };

  const [location, setLocation] = useState<LocationInfo>({
    countryName: defaultLocation.countryName,
    countryCode: defaultLocation.countryCode,
    stateName: defaultLocation.stateName,
    stateCode: defaultLocation.stateCode,
    city: defaultLocation.city,
  })

  const countries = Country.getAllCountries()
  const states = location.countryCode ? State.getStatesOfCountry(location.countryCode) : []
  const cities = location.stateCode
    ? City.getCitiesOfState(location.countryCode, location.stateCode)
    : []

  // Auto-detect location via IP
  useEffect(() => {
    //{process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business
    /* if no local storage data then only call api */
    if (location.countryCode || location.stateCode || location.city) return;
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

        setLocation({
          countryName: country?.name || "",
          countryCode: country?.isoCode || "",
          stateName: state?.name || "",
          stateCode: state?.isoCode || "",
           city: data.city || null,
        });

        localStorage.setItem("selectedCountry", (country?.isoCode || "") + "|" + (country?.name || ""));
        localStorage.setItem("selectedState", (state?.isoCode || "") + "|" + (state?.name || ""));
        localStorage.setItem("selectedCity", data.city || "");
      })
      .catch((err) => console.error("IP location failed", err))
  }, [countries])

  return (
    <div className="flex justify-start items-center">
      <LocationEdit className="w-auto h-4 md:h-5" />
      {/* Country */}
      <Select
        value={location.countryCode != "" && location.countryName != "" ? location.countryCode + "|" + location.countryName : ""}
        onValueChange={(val) => {
          const [code, name] = val.split("|");
          setLocation({ countryName: name, countryCode: code, stateName: "", stateCode: "", city: null });
          localStorage.setItem("selectedCountry", val);
          localStorage.removeItem("selectedState");
          localStorage.removeItem("selectedCity");
          dispatch({
            type: "SET_COUNTRY",
            payload: val
          });
        }}
      >
        <SelectTrigger className="custom-select mobile-view">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.isoCode} value={c.isoCode+"|"+c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State */}
      <Select
        value={location.stateCode != "" && location.stateName != "" ?location.stateCode+"|"+location.stateName : ""}
        onValueChange={(val) => {
          const [code, name] = val.split("|");
          setLocation({ ...location, stateCode: code, stateName: name, city: null });
          localStorage.setItem("selectedState", val);
          localStorage.removeItem("selectedCity");
          dispatch({
            type: "SET_STATE",
            payload: val
          });
        }}
        disabled={!location.countryCode}
      >
        <SelectTrigger className="custom-select hidden">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {states.map((s) => (
            <SelectItem key={s.isoCode} value={s.isoCode+"|"+s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City */}
      <Select
        value={location.city || ""}
        onValueChange={(val) => {
          setLocation({ ...location, city: val });
          localStorage.setItem("selectedCity", val);
          dispatch({
            type: "SET_CITY",
            payload: val
          });
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
