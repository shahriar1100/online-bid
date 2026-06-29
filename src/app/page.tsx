"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, FreeMode } from "swiper/modules";
import "swiper/css"
import "swiper/css/pagination"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "src/components/ui/button"
import Header from "src/components/header"
import Footer from "src/components/footer"
import BusinessRegistrationForm from "src/components/registration-form/seller/business"
import AutomobileRegistrationForm from "src/components/registration-form/seller/automobile"
import RealStateRegistrationForm from "src/components/registration-form/seller/realstate"
// import Realfeature from "src/components/home/real-feature"
// import Automobilefeature from "src/components/home/automobile-feature"
// import Businessfeature from "src/components/home/business-feature"

import { useRouter } from "next/navigation"

import BusinessImg from "./assets/images/slide/business.webp";
import AutomobilesImg from "./assets/images/slide/automobiles.webp";
import RealEstateImg from "./assets/images/slide/real-estate.webp";
import cat1 from "./assets/images/cats/cat1.webp"
import cat2 from "./assets/images/cats/cat2.webp"
import cat3 from "./assets/images/cats/cat3.webp"
import sold from "./assets/images/real-state/sold.png"
// import noBidders from "src/app/assets/images/no-bidders.png"
import {
  fetchBidsForListings,
  getCachedHighestBid,
  formatAmount
} from "src/util/bid"
import { parseStorageDate } from "src/lib/date-utils"
import type { StaticImageData } from "next/image";
import useDisableBodyScroll from "../hooks";

import { useAppContext } from "./context";

type ListingStatus = "upcoming" | "live" | "Ended" | string

// Unified item for the home grid
interface HomeItem {
  id: number
  category: "Real Estate" | "Automobiles" | "Business"
  subCategory: string
  price?: string
  duration?: string
  time?: string
  image?: string | StaticImageData
  status: ListingStatus
}

// API response shapes
interface ApiResponse<T> {
  success: boolean
  listings?: T[]
  error?: string
}

interface AutomobileApi {
  id: number
  name: string
  category: string
  subCategory: string
  status: "Live" | "Upcoming" | "End" | string
  duration: string
  price?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media?: any[]
  isFeatured?: boolean // 🔥 Add this
  featuredUntil?: number
  automobileCountry?: string
  automobileState?: string
  automobileCity?: string
}

interface RealEstateApi {
  id: number
  name: string
  category: string
  subCategory: string
  status: "Live" | "Upcoming" | "End" | string
  duration: string
  auctionPrice?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media?: any[]
  isFeatured?: boolean // 🔥 Add this
  featuredUntil?: number
  propertyCountry?: string
  propertyState?: string
  propertyCity?: string
}

interface BusinessApi {
  id: number
  name: string
  category: string
  subCategory: string
  status: "Live" | "Upcoming" | "End" | string
  duration: string
  price?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media?: any[]
  isFeatured?: boolean // 🔥 Add this
  featuredUntil?: number
  businessCountry?: string
  businessState?: string
  businessCity?: string
}


const flashAnimation = `
@keyframes flash {
  0%, 98%, 100% { background-color: #fb2c36; }
  49%, 51% { background-color: #8f0000; }
}
.animate-flash { animation: flash 2s infinite ease-in-out; }
`

// Helpers
const normalizeStatus = (s: string): ListingStatus => {
  switch (s) {
    case "Live": return "live"
    case "Upcoming": return "upcoming"
    case "End": return "Ended"
    default: return s?.toLowerCase?.() || "upcoming"
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getValidImage = (media: any[] | undefined): string | undefined => {
  if (!media || !Array.isArray(media)) return undefined
  for (const m of media) {
    if (!m) continue
    if (typeof m === "string" && m.trim() !== "") return m
    if (typeof m === "object" && typeof m.url === "string" && m.url.trim() !== "") return m.url
  }
  return undefined
}
const isFeaturedAndValid = (item: { isFeatured?: boolean; featuredUntil?: number }): boolean => {
  if (!item.isFeatured) return false
  if (!item.featuredUntil) return true // If no expiry, assume valid

  const now = Math.floor(Date.now() / 1000) // Current timestamp in seconds
  return now < item.featuredUntil // Check if not expired
}

function getAuctionStatusAndCountdown(duration: string) {
  try {
    const [startStr, endStr] = duration.split(" to ").map(s => s.trim());
    const startDate = parseStorageDate(startStr) || new Date();
    const endDate = parseStorageDate(endStr) || new Date();

    const now = new Date();

    let status: "Upcoming" | "Live" | "End" = "Upcoming";
    let timeLeft: string | null = null;

    if (now < startDate) {
      status = "Upcoming";
      // Calculate time until start
      const diff = startDate.getTime() - now.getTime();
      timeLeft = formatTimeLeft(diff);
    } else if (now >= startDate && now <= endDate) {
      status = "Live";
      const diff = endDate.getTime() - now.getTime();
      timeLeft = formatTimeLeft(diff);
    } else {
      status = "End";
    }

    return { status, timeLeft, startDate, endDate };
  } catch {
    return { status: "Upcoming" as const, timeLeft: null, startDate: new Date(), endDate: new Date() };
  }
}

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

const getPriceColorClass = (status: ListingStatus): string => {
  switch (status) {
    case "Upcoming":
      return "price-default";
    case "Live":
      return "price-live";
    case "End":
      return "price-end";
    default:
      return "price-default";
  }
};

export default function HomePage() {
  const slides = [
    { image: BusinessImg, text: "BUSINESS ONLINE AUCTION", type: "business" },
    { image: AutomobilesImg, text: "AUTOMOBILE ONLINE AUCTION", type: "automobile" },
    { image: RealEstateImg, text: "REAL ESTATE ONLINE AUCTION", type: "realstate" },
  ]

  const [activeForm, setActiveForm] = useState<string | null>(null)

  const { state } = useAppContext();
  const { selectedCountry, selectedState, selectedCity } = state;

  const openRegistration = (type: string) => setActiveForm(type)
  const closePopup = () => setActiveForm(null)
  useDisableBodyScroll(!!activeForm)

  const router = useRouter();

  // New: Fetched data
  const [allAutoList, setAllAutoList] = useState<AutomobileApi[]>([])
  const [allRealList, setAllRealList] = useState<RealEstateApi[]>([])
  const [allBizList, setAllBizList] = useState<BusinessApi[]>([])
  const [autoList, setAutoList] = useState<AutomobileApi[]>([])
  const [realList, setRealList] = useState<RealEstateApi[]>([])
  const [bizList, setBizList] = useState<BusinessApi[]>([])
  const [loadingGrid, setLoadingGrid] = useState(true)
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  const [, setBidRefresh] = useState(0);
  useEffect(() => {
    const styleTag = document.createElement("style")
    styleTag.innerHTML = flashAnimation
    document.head.appendChild(styleTag)
    return () => {
      document.head.removeChild(styleTag)
    }
  }, [])

  // Fetch all three categories for home grid
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingGrid(true)
        const base = process.env.NEXT_PUBLIC_WRANGLER_API_URL

        const [autoRes, realRes, bizRes] = await Promise.all([
          fetch(`${base}/api/automobile`, { headers: { "Content-Type": "application/json" }, cache: "no-store" }),
          fetch(`${base}/api/realestate`, { headers: { "Content-Type": "application/json" }, cache: "no-store" }),
          fetch(`${base}/api/business`, { headers: { "Content-Type": "application/json" }, cache: "no-store" }),
        ])

        const autoData: ApiResponse<AutomobileApi> = await autoRes.json()
        const realData: ApiResponse<RealEstateApi> = await realRes.json()
        const bizData: ApiResponse<BusinessApi> = await bizRes.json()

        /* filter all types of listings by country, state and city saved in local storage */

        if (autoRes.ok && autoData.success) {
          setAllAutoList(autoData.listings || []);
          const filteredAutoList = (autoData.listings || []).filter((item) => {
            if (selectedCountry && item.automobileCountry !== selectedCountry.split("|")[1]) return false;
            if (selectedState && item.automobileState !== selectedState.split("|")[1]) return false;
            if (selectedCity && item.automobileCity !== selectedCity) return false;
            return true;
          });
          setAutoList(filteredAutoList);
        }

        if (realRes.ok && realData.success) {
          setAllRealList(realData.listings || []);
          const filteredRealList = (realData.listings || []).filter((item) => {
            if (selectedCountry && item.propertyCountry !== selectedCountry.split("|")[1]) return false;
            if (selectedState && item.propertyState !== selectedState.split("|")[1]) return false;
            if (selectedCity && item.propertyCity !== selectedCity) return false;
            return true;
          });
          setRealList(filteredRealList);
        }

        if (bizRes.ok && bizData.success) {
          setAllBizList(bizData.listings || []);
          const filteredBizList = (bizData.listings || []).filter((item) => {
            if (selectedCountry && item.businessCountry !== selectedCountry.split("|")[1]) return false;
            if (selectedState && item.businessState !== selectedState.split("|")[1]) return false;
            if (selectedCity && item.businessCity !== selectedCity) return false;
            return true;
          });
          setBizList(filteredBizList);
        }
      } catch (e) {
        console.error("Home fetch error:", e)
      } finally {
        setLoadingGrid(false)
      }
    }
    run()
  }, [])

  /* filter all types of listings by country, state and city saved in local storage */
  useEffect(() => {
    console.log("HomePage - App State:", { selectedCountry, selectedState, selectedCity });
    setAutoList(allAutoList.filter((item) => {
      if (selectedCountry && item.automobileCountry !== selectedCountry.split("|")[1]) return false;
      if (selectedState && item.automobileState !== selectedState.split("|")[1]) return false;
      if (selectedCity && item.automobileCity !== selectedCity) return false;
      return true;
    }));
    setRealList(allRealList.filter((item) => {
      if (selectedCountry && item.propertyCountry !== selectedCountry.split("|")[1]) return false;
      if (selectedState && item.propertyState !== selectedState.split("|")[1]) return false;
      if (selectedCity && item.propertyCity !== selectedCity) return false;
      return true;
    }));
    setBizList(allBizList.filter((item) => {
      if (selectedCountry && item.businessCountry !== selectedCountry.split("|")[1]) return false;
      if (selectedState && item.businessState !== selectedState.split("|")[1]) return false;
      if (selectedCity && item.businessCity !== selectedCity) return false;
      return true;
    }));
  }, [selectedCountry, selectedState, selectedCity]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const updated: Record<number, string> = {}

        const allListings = [...autoList, ...realList, ...bizList]

        allListings.forEach(listing => {
          const { status, timeLeft } = getAuctionStatusAndCountdown(listing?.duration || "")
          if (status === "Live" && timeLeft) {
            updated[listing.id] = timeLeft
          }
        })

        return { ...prev, ...updated }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [autoList, realList, bizList])

  useEffect(() => {
    if (loadingGrid) return;
    if (realList.length === 0 && autoList.length === 0 && bizList.length === 0) return;

    const fetchBids = async () => {
      // Combine all listings
      const allListings = [
        ...realList.map((item) => ({
          id: item.id,
          type: "realestate" as const,
          status: getAuctionStatusAndCountdown(item.duration || "").status,
        })),
        ...autoList.map((item) => ({
          id: item.id,
          type: "automobile" as const,
          status: getAuctionStatusAndCountdown(item.duration || "").status,
        })),
        ...bizList.map((item) => ({
          id: item.id,
          type: "business" as const,
          status: getAuctionStatusAndCountdown(item.duration || "").status,
        })),
      ];

      // Fetch bids for live auctions
      await fetchBidsForListings(allListings);

      // Trigger re-render
      setBidRefresh((prev) => prev + 1);
    };

    // Initial fetch
    fetchBids();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBids, 30000);

    return () => clearInterval(interval);
  }, [loadingGrid, realList, autoList, bizList]);

  // Normalize into home items with balanced quotas
  const homeListings: HomeItem[] = useMemo(() => {
    const autos: HomeItem[] = (autoList || []).map(a => ({
      id: a.id,
      category: "Automobiles" as const,
      subCategory: a.subCategory,
      price: a.price,
      duration: a.duration,
      image: getValidImage(a.media),
      status: normalizeStatus(a.status),
    }));

    const reals: HomeItem[] = (realList || []).map(r => ({
      id: r.id,
      category: "Real Estate" as const,
      subCategory: r.subCategory,
      price: r.auctionPrice,
      duration: r.duration,
      image: getValidImage(r.media),
      status: normalizeStatus(r.status),
    }));

    const bizs: HomeItem[] = (bizList || []).map(b => ({
      id: b.id,
      category: "Business" as const,
      subCategory: b.subCategory,
      price: b.price,
      duration: b.duration,
      image: getValidImage(b.media),
      status: normalizeStatus(b.status),
    }));

    const statusOrder = (s: ListingStatus) =>
      s === "live" ? 0 : s === "upcoming" ? 1 : s === "Ended" ? 2 : 3;

    const prioritize = (arr: HomeItem[]) =>
      [...arr].sort((a, b) => statusOrder(a.status) - statusOrder(b.status));

    const TARGET_TOTAL = 8;
    const QUOTA = {
      Automobiles: 3,
      "Real Estate": 3,
      Business: 2,
    } as const;

    const prAuto = prioritize(autos);
    const prReal = prioritize(reals);
    const prBiz = prioritize(bizs);

    // Pick per-category quotas
    const selected = [
      ...prAuto.slice(0, QUOTA.Automobiles),
      ...prReal.slice(0, QUOTA["Real Estate"]),
      ...prBiz.slice(0, QUOTA.Business),
    ];

    // Fill remainder from leftovers
    const balanced = [...selected];

    if (balanced.length < TARGET_TOTAL) {
      const leftovers = [
        ...prAuto.slice(QUOTA.Automobiles),
        ...prReal.slice(QUOTA["Real Estate"]),
        ...prBiz.slice(QUOTA.Business),
      ];

      for (const item of leftovers) {
        if (balanced.length >= TARGET_TOTAL) break;
        if (!balanced.some(b => b.category === item.category && b.id === item.id)) {
          balanced.push(item);
        }
      }
    }

    return balanced.slice(0, TARGET_TOTAL);
  }, [autoList, realList, bizList]);

  // Existing status helpers (uses lowercase)
  const getButtonStyle = (status: ListingStatus) => {
    if (status === "End") {
      return {
        text: "Bid Expired",
        className: "btn-expired"
      }
    }

    switch (status) {
      case "Upcoming":
        return { text: "Bidding Soon", className: "btn-default" }
      case "Live":
        return { text: "Place Bid", className: "btn-live" }
      default:
        return { text: "Place Bid", className: "btn-default" }
    }
  }

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case "Upcoming":
        return { text: "Upcoming", className: "badge-container default" }
      case "Live":
        return { text: "Live", className: "badge-container live" }
      case "End":
        return { text: "End", className: "badge-container end" }
      default:
        return { text: "Upcoming", className: "badge-container default" }
    }
  }

  // When a card is clicked
  const handleListingClick = (listingId: number, category: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (category === "Real Estate") {
      const full = realList.find(r => r.id === listingId);
      if (full) {
        try {
          sessionStorage.setItem(`real_listing_${listingId}`, JSON.stringify(full));
        } catch { }
      }
      router.push(`/buyer/realestate/${listingId}`);
    } else if (category === "Business") {
      const full = bizList.find(b => b.id === listingId);
      if (full) {
        try {
          sessionStorage.setItem(`biz_listing_${listingId}`, JSON.stringify(full));
        } catch { }
      }
      router.push(`/buyer/business/${listingId}`);
    } else if (category === "Automobiles") {
      // cache full record for instant details render
      const full = autoList.find(a => a.id === listingId);
      if (full) {
        try {
          sessionStorage.setItem(`auto_listing_${listingId}`, JSON.stringify(full));
        } catch { }
      }
      router.push(`/buyer/automobile/${listingId}`);
    }
  };

  // dummy countdown state (optional to keep your existing timer UI)
  const [timers, setTimers] = useState<{ [key: number]: number }>({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statuses, setStatuses] = useState<{ [key: number]: ListingStatus }>({})
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev }
        for (const k in next) if (next[k] > 0) next[k] = next[k] - 1
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize timers/statuses for items on the home grid
  useEffect(() => {
    if (!homeListings.length) return;

    // Create initial maps
    const initTimers: { [key: number]: number } = {};
    const initStatuses: { [key: number]: ListingStatus } = {};

    // Give each live item a 15-minute countdown (900s) for demo UX
    homeListings.slice(0, 8).forEach((item) => {
      if (item.status === "live") {
        initTimers[item.id] = 15 * 60; // 15 minutes
        initStatuses[item.id] = "live";
      } else {
        initStatuses[item.id] = item.status;
      }
    });

    setTimers(initTimers);
    setStatuses(initStatuses);
  }, [homeListings]);

  // Tick countdown and flip status to Ended when timers hit 0
  useEffect(() => {
    if (!Object.keys(timers).length) return;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        const endedIds: number[] = [];

        for (const key in next) {
          const id = Number(key);
          if (next[id] > 0) {
            next[id] = next[id] - 1;
            if (next[id] === 0) endedIds.push(id);
          }
        }

        if (endedIds.length) {
          setStatuses((prevS) => {
            const updated = { ...prevS };
            endedIds.forEach((id) => {
              // Flip only items that are currently live
              if ((updated[id] as ListingStatus) === "live") {
                updated[id] = "Ended";
              }
            });
            return updated;
          });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, setStatuses]);

  return (
    <>
      <Header
      // onAuthChange={handleAuthChange}
      />
      <div className="transition-colors mt-[95px]">
        {/* Banner Slider */}
        <section className="relative container custom-bottom-margin">
          <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 4000, disableOnInteraction: false }} loop pagination={{ el: ".custom-pagination", clickable: true }} className="group rounded-[8px]">
            {slides.map((slide, idx) => (
              <SwiperSlide key={idx}>
                <div onClick={() => openRegistration(slide.type)} className="banner-container">
                  <Image src={slide.image || "/placeholder.svg"} alt={slide.text} width={500} height={500} priority className="object-fill object-top w-full h-full" />

                </div>
              </SwiperSlide>
            ))}
            <div className="background-slider absolute z-[999] bottom-1.5 md:bottom-2 lg:bottom-5 w-full ">
              <div className="custom-pagination flex justify-center items-center" />
            </div>
          </Swiper>
        </section>

        {/* feature */}
        {/* feature - Modified to Slider with 3 slides */}
<section className="container non-container2 custom-bottom-margin">
  <h2 className="section-title goldman-regular">
    Explore <span className="font-bold">featured</span> posts
  </h2>
  <p className="section-desc">
    Discover top listings handpicked for you — from rare finds to high-value deals.
  </p>

  {loadingGrid ? (
    <div className="text-center py-12 text-gray-500">Loading featured listings...</div>
  ) : (
    <div className="featured-slider-container relative">
      {/* ✅ CHANGE 1: Move the entire logic OUTSIDE Swiper, wrap everything in an IIFE */}
      {(() => {
        // Create a unified type for all featured items
        type FeaturedItem = {
          id: number;
          name: string;
          category: string;
          subCategory: string;
          status: "Live" | "Upcoming" | "End" | string;
          duration: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          media?: any[];
          categoryType: "Real Estate" | "Automobiles" | "Business";
          displayPrice?: string;
        };

        const isNotEnded = (duration: string): boolean => {
          const { status } = getAuctionStatusAndCountdown(duration || "");
          return status !== "End";
        };

        // Convert all listings to unified type
        const allRealEstateItems: FeaturedItem[] = realList
          .filter(item => isFeaturedAndValid(item))
          .filter(item => isNotEnded(item.duration))
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subCategory: item.subCategory,
            status: item.status,
            duration: item.duration,
            media: item.media,
            categoryType: "Real Estate" as const,
            displayPrice: item.auctionPrice
          }));

        const allAutomobileItems: FeaturedItem[] = autoList.filter(item => isFeaturedAndValid(item)).filter(item => isNotEnded(item.duration)).slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          subCategory: item.subCategory,
          status: item.status,
          duration: item.duration,
          media: item.media,
          categoryType: "Automobiles" as const,
          displayPrice: item.price
        }));

        const allBusinessItems: FeaturedItem[] = bizList.filter(item => isFeaturedAndValid(item)).filter(item => isNotEnded(item.duration)).slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          subCategory: item.subCategory,
          status: item.status,
          duration: item.duration,
          media: item.media,
          categoryType: "Business" as const,
          displayPrice: item.price
        }));

        // Create pool of all available items
        const itemPool: FeaturedItem[] = [...allRealEstateItems, ...allAutomobileItems, ...allBusinessItems];
        const shouldAutoplay = itemPool.length > 3;

        if (itemPool.length === 0) {
          return (
            <div className="text-center py-12 text-gray-500">
              No featured listings available at the moment.
            </div>
          );
        }

        // Create 3 slides with category focus
        const slides: FeaturedItem[][] = [];

        // Slide 1: Real Estate focused
        const slide1: FeaturedItem[] = [];
        const realEstateForSlide1 = allRealEstateItems.slice(0, 3);
        slide1.push(...realEstateForSlide1);

        if (slide1.length < 3) {
          const needed = 3 - slide1.length;
          const fillers = itemPool.filter(item =>
            item.categoryType !== "Real Estate" &&
            !slide1.some(s => s.id === item.id)
          ).slice(0, needed);
          slide1.push(...fillers);
        }
        slides.push(slide1.slice(0, 3));

        // Slide 2: Automobile focused
        const slide2: FeaturedItem[] = [];
        const automobileForSlide2 = allAutomobileItems.slice(0, 3);
        slide2.push(...automobileForSlide2);

        if (slide2.length < 3) {
          const needed = 3 - slide2.length;
          const fillers = itemPool.filter(item =>
            item.categoryType !== "Automobiles" &&
            !slide2.some(s => s.id === item.id)
          ).slice(0, needed);
          slide2.push(...fillers);
        }
        slides.push(slide2.slice(0, 3));

        // Slide 3: Business focused
        const slide3: FeaturedItem[] = [];
        const businessForSlide3 = allBusinessItems.slice(0, 3);
        slide3.push(...businessForSlide3);

        if (slide3.length < 3) {
          const needed = 3 - slide3.length;
          const fillers = itemPool.filter(item =>
            item.categoryType !== "Business" &&
            !slide3.some(s => s.id === item.id)
          ).slice(0, needed);
          slide3.push(...fillers);
        }
        slides.push(slide3.slice(0, 3));

        const displaySlides = shouldAutoplay ? slides : [itemPool];

        // ✅ CHANGE 2: Return the Swiper component with conditional props
        return (
          <Swiper
            modules={[Autoplay, FreeMode]}
            loop={shouldAutoplay}                    
            freeMode={shouldAutoplay}              
            slidesPerView="auto"
            spaceBetween={16}
            allowTouchMove={shouldAutoplay}         
            speed={shouldAutoplay ? 11000 : 0}      
            autoplay={shouldAutoplay ? {             
              delay: 0, 
              disableOnInteraction: false,
            } : false}
            breakpoints={shouldAutoplay ? {         
              0: { speed: 4500 },
              640: { speed: 7000 },
              1024: { speed: 11000 },
            } : undefined}
            className="featured-swiper"
          >
            {/* ✅ CHANGE 9: Use displaySlides instead of slides */}
            {displaySlides.map((slideItems, slideIndex) => (
              <SwiperSlide key={`featured-slide-${slideIndex}`}>
                <div className="ribbon-container">
                  {slideItems.map((listing, itemIndex) => {
                    if (!listing) return null;

                    const { status, timeLeft } = getAuctionStatusAndCountdown(listing?.duration || "");
                    const countdown = countdowns[listing.id] || timeLeft;
                    const buttonStyle = getButtonStyle(status);
                    const statusBadge = getStatusBadge(status);

                    return (
                      <div
                        key={`featured-${slideIndex}-${itemIndex}-${listing.id}`}
                        className="group product-card featured-ribbon-card"
                        onClick={() => handleListingClick(listing.id, listing.categoryType)}
                      >
                        <div className="top-container">
                          <span className={`status-container ${statusBadge.className}`}>
                            ● {statusBadge.text}
                          </span>

                          {getValidImage(listing.media) ? (
                            <Image
                              src={getValidImage(listing.media)!}
                              alt={listing.subCategory}
                              fill
                              className="object-cover group-hover:scale-95 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}

                          {status === "End" && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Image src={sold} alt="Ended" width={100} height={100} className="sold-img" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="content-area">
                            <p className="title">{listing.name}</p>
                            <div className="details">
                              <div className="sub-container">
                                <p className="sub-text">Current Bid</p>
                                <div className={`${getPriceColorClass(status)}`}>
                                  {(() => {
                                    const listingTypeMap: Record<string, "realestate" | "automobile" | "business"> = {
                                      "Real Estate": "realestate",
                                      "Automobiles": "automobile",
                                      "Business": "business"
                                    };

                                    const apiType = listingTypeMap[listing.categoryType];

                                    if (status === "Upcoming") {
                                      return listing.displayPrice
                                        ? `$${formatAmount(listing.displayPrice)}`
                                        : "Contact for price";
                                    }

                                    const amount = getCachedHighestBid(
                                      apiType,
                                      listing.id,
                                      listing.displayPrice
                                    );

                                    return amount !== null
                                      ? `$${formatAmount(amount)}`
                                      : "Contact for price";
                                  })()}
                                </div>
                              </div>

                              <div className="sub-container">
                                <p className="sub-text2">Time</p>
                                {(() => {
                                  if (status === "Upcoming") {
                                    return (
                                      <span className="status-default">
                                        {countdown ? `Start in ${countdown}` : "Starting soon"}
                                      </span>
                                    );
                                  }

                                  if (status === "End") {
                                    return (
                                      <span className="status-end">
                                        Ended
                                      </span>
                                    );
                                  }

                                  if (status === "Live") {
                                    let displayText = "";
                                    if (countdown?.includes("d")) {
                                      const days = countdown.split("d")[0];
                                      displayText = `${days.trim()} days `;
                                    } else {
                                      displayText = countdown || "00:00:00";
                                    }

                                    return (
                                      <span className="status-live">
                                        {displayText}
                                      </span>
                                    );
                                  }

                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="p-3 md:p-4">
                            <Button className={`btn ${buttonStyle.className}`}>
                              {buttonStyle.text}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {slideItems.length < 3 && Array.from({ length: 3 - slideItems.length }).map((_, index) => (
                    <div key={`empty-${slideIndex}-${index}`} className="product-card opacity-0 pointer-events-none">
                      <div className="top-container bg-gray-100 dark:bg-gray-800"></div>
                      <div className="content-area">
                        <p className="title">No listing available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        );
      })()}
    </div>
  )}
</section>

        {/* Categories Section */}
        <section className="container non-container custom-bottom-margin">
          <div className="grid grid-cols-3 gap-6 mobile-view-category">
            <Link href="/buyer/automobile" className="category-link group">
              <Image src={cat3} alt="Automobile" fill className="category-img group-hover:opacity-90 group-hover:scale-95" />
              <div className="category-card"><h2 className="">Automobiles</h2></div>
            </Link>
            <Link href="/buyer/business" className="category-link group">
              <Image src={cat2} alt="Business" fill className="category-img group-hover:opacity-90 group-hover:scale-95" />
              <div className="category-card"><h2 className="">Business</h2></div>
            </Link>
            <Link href="/buyer/realestate" className="category-link group">
              <Image src={cat1} alt="Real Estate" fill className="category-img group-hover:opacity-90 group-hover:scale-95" />
              <div className="category-card"><h2 className="">Real Estate</h2></div>
            </Link>
          </div>
        </section>

        {/* Discover Real Estate */}
        <section className="container non-container custom-bottom-margin">
          <h2 className="section-title">Discover <span className="font-bold">Real Estate</span></h2>
          <p className="section-desc">Browse and bid on a wide range of real estate properties with live updates and transparent pricing.</p>

          {loadingGrid ? (
            <div className="text-center py-12 text-gray-500">Loading listings...</div>
          ) : (
            <div className="desktop-view-category mobile-view-category">
              {realList.slice(0, 8).map((listing) => {
                // ✅ Use getAuctionStatusAndCountdown like business.tsx
                const { status, timeLeft } = getAuctionStatusAndCountdown(listing?.duration || "");
                const countdown = countdowns[listing.id] || timeLeft;
                const buttonStyle = getButtonStyle(status);
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={`realestate-${listing.id}`}
                    className="group product-card"
                    onClick={() => handleListingClick(listing.id, "Real Estate")}
                  >
                    <div className="top-container">
                      <span className={`status-container ${statusBadge.className}`}>
                        ● {statusBadge.text}
                      </span>

                      {getValidImage(listing.media) ? (
                        <Image src={getValidImage(listing.media)!} alt={listing.subCategory} fill className="object-cover group-hover:scale-95 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}

                      {status === "End" && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Image src={sold} alt="Ended" width={100} height={100} className="sold-img" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="content-area">
                        <p className="title">{listing.name}</p>
                        <div className="details">
                          <div className="sub-container">
                            <p className="sub-text">Current Bid</p>
                            <div className={`${getPriceColorClass(status)}`}>
                              {(() => {
                                const amount = getCachedHighestBid(
                                  "realestate",
                                  listing.id,
                                  listing.auctionPrice
                                );

                                return amount !== null
                                  ? `$${formatAmount(amount)}`
                                  : "Contact for price";
                              })()}

                            </div>
                          </div>

                          {/* ✅ Match business.tsx countdown logic exactly */}
                          <div className="sub-container">
                            <p className="sub-text2">Time</p>
                            {(() => {
                              if (status === "Upcoming") {
                                return (
                                  <span className="status-default">
                                    {countdown ? `Start in ${countdown}` : "Starting soon"}
                                  </span>
                                );
                              }

                              if (status === "End") {
                                return (
                                  <span className="status-end">
                                    Ended
                                  </span>
                                );
                              }

                              if (status === "Live") {
                                let displayText = "";

                                if (countdown?.includes("d")) {
                                  const days = countdown.split("d")[0];
                                  displayText = `${days.trim()} days`;
                                } else {
                                  displayText = countdown || "00:00:00";
                                }

                                return (
                                  <span className="status-live">
                                    {displayText}
                                  </span>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 md:p-4">
                        <Button className={`btn ${buttonStyle.className}`}>{buttonStyle.text}</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
          }

          <div className="flex justify-center mt-9 mb-11">
            <Link href="/buyer/realestate" className="discover-btn">
              Discover More
            </Link>
          </div>
        </section>

        {/* Discover Business */}
        <section className="container non-container custom-bottom-margin">
          <h2 className="section-title">Discover <span className="font-bold">Business</span></h2>
          <p className="section-desc">Browse and bid on a wide range of business opportunities with live updates and transparent pricing.</p>

          {loadingGrid ? (
            <div className="text-center py-12 text-gray-500">Loading listings...</div>
          ) : (
            <div className="desktop-view-category mobile-view-category">
              {bizList.slice(0, 8).map((listing) => {
                const { status, timeLeft } = getAuctionStatusAndCountdown(listing?.duration || "");
                const countdown = countdowns[listing.id] || timeLeft;
                const buttonStyle = getButtonStyle(status);
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={`business-${listing.id}`}
                    className="group product-card"
                    onClick={() => handleListingClick(listing.id, "Business")}
                  >
                    <div className="top-container">
                      <span className={`status-container ${statusBadge.className}`}>
                        ● {statusBadge.text}
                      </span>

                      {getValidImage(listing.media) ? (
                        <Image src={getValidImage(listing.media)!} alt={listing.subCategory} fill className="object-cover group-hover:scale-95 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}

                      {status === "End" && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Image src={sold} alt="Ended" width={100} height={100} className="sold-img" />
                        </div>
                      )}
                    </div>
                    <div className="content-area">
                      <p className="title">{listing.name}</p>
                      <div className="details">
                        <div className="sub-container">
                          <p className="sub-text">Current Bid</p>
                          <div className={`${getPriceColorClass(status)}`}>
                            {(() => {
                              const amount = getCachedHighestBid(
                                "business",
                                listing.id,
                                listing.price
                              );

                              return amount !== null
                                ? `$${formatAmount(amount)}`
                                : "Contact for price";
                            })()}
                          </div>
                        </div>
                        <div className="sub-container">
                          <p className="sub-text2">Time</p>
                          {(() => {
                            if (status === "Upcoming") {
                              return (
                                <span className="status-default">
                                  {countdown ? `Start in ${countdown}` : "Starting soon"}
                                </span>
                              );
                            }

                            if (status === "End") {
                              return (
                                <span className="status-end">
                                  Ended
                                </span>
                              );
                            }

                            if (status === "Live") {
                              let displayText = "";

                              if (countdown?.includes("d")) {
                                const days = countdown.split("d")[0];
                                displayText = `${days.trim()} days`;
                              } else {
                                displayText = countdown || "00:00:00";
                              }

                              return (
                                <span className="status-live">
                                  {displayText}
                                </span>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <Button className={`btn ${buttonStyle.className}`}>{buttonStyle.text}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-9 mb-11">
            <Link href="/buyer/business" className="discover-btn">
              Discover More
            </Link>
          </div>
        </section>

        {/* Discover Automobiles */}
        <section className="container non-container custom-bottom-margin">
          <h2 className="section-title">Discover <span className="font-bold">Automobiles</span></h2>
          <p className="section-desc">Browse and bid on a wide range of automobiles with live updates and transparent pricing.</p>

          {loadingGrid ? (
            <div className="text-center py-12 text-gray-500">Loading listings...</div>
          ) : (
            <div className="desktop-view-category mobile-view-category">
              {autoList.slice(0, 8).map((listing) => {
                const { status, timeLeft } = getAuctionStatusAndCountdown(listing?.duration || "");
                const countdown = countdowns[listing.id] || timeLeft;
                const buttonStyle = getButtonStyle(status);
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={`automobile-${listing.id}`}
                    className="group product-card"
                    onClick={() => handleListingClick(listing.id, "Automobiles")}
                  >
                    <div className="top-container">
                      <span className={`status-container ${statusBadge.className}`}>
                        ● {statusBadge.text}
                      </span>

                      {getValidImage(listing.media) ? (
                        <Image src={getValidImage(listing.media)!} alt={listing.subCategory} fill className="object-cover group-hover:scale-95 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}

                      {status === "End" && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Image src={sold} alt="Ended" width={100} height={100} className="sold-img" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="content-area">
                        <p className="title">{listing.name}</p>
                        <div className="details">
                          <div className="sub-container">
                            <p className="sub-text">Current Bid</p>
                            <div className={`${getPriceColorClass(status)}`}>{(() => {
                              const amount = getCachedHighestBid(
                                "automobile",
                                listing.id,
                                listing.price
                              );

                              return amount !== null
                                ? `$${formatAmount(amount)}`
                                : "Contact for price";
                            })()}
                            </div>
                          </div>
                          <div className="sub-container">
                            <p className="sub-text2">Time</p>
                            {(() => {
                              if (status === "Upcoming") {
                                return (
                                  <span className="status-default">
                                    {countdown ? `Start in ${countdown}` : "Starting soon"}
                                  </span>
                                );
                              }

                              if (status === "End") {
                                return (
                                  <span className="status-end">
                                    Ended
                                  </span>
                                );
                              }

                              if (status === "Live") {
                                let displayText = "";

                                if (countdown?.includes("d")) {
                                  const days = countdown.split("d")[0];
                                  displayText = `${days.trim()} days`;
                                } else {
                                  displayText = countdown || "00:00:00";
                                }

                                return (
                                  <span className="status-live">
                                    {displayText}
                                  </span>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 md:p-4">
                        <Button className={`btn ${buttonStyle.className}`}>{buttonStyle.text}</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-9 mb-11">
            <Link href="/buyer/automobile" className="discover-btn">
              Discover More
            </Link>
          </div>
        </section>

        {/* Registration Popup */}
        {activeForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="register-popup-container">
              {(() => {
                switch (activeForm) {
                  case "business": return <BusinessRegistrationForm onClose={closePopup} preselectedCategory="Business" />
                  case "automobile": return <AutomobileRegistrationForm onClose={closePopup} preselectedCategory="Automobiles" />
                  case "realstate": return <RealStateRegistrationForm onClose={closePopup} preselectedCategory="Real Estate" />
                  default: return null
                }
              })()}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}