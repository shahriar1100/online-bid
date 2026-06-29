"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { FaUser } from "react-icons/fa"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { useState, useEffect, Suspense, useRef } from "react"
import SignupForm from "src/components/signup"
import LoginForm from "src/components/login"
import PasswordForm from "src/components/forgotPassword"
import Link from "next/link"
import { toast } from 'sonner'
import { AnimatedThemeToggler } from "src/components/magicui/animated-theme-toggler";
// import logo from "../app/assets/images/tops.png"
import useDisableBodyScroll from "../hooks";
import UserTypeToggle from "./UserTypeToggle";
import LocationSelector from "./geolocation";
import { Search, X } from "lucide-react";
import { useAppContext } from "../app/context";
import Image from "next/image";
import logoDark from "../app/assets/images/logo_dark.png"
import logoWhite from "../app/assets/images/logo_white.png"
import Loader from "./loader"

interface NavbarProps {
  onAuthChange?: () => void
}
interface ApiResponse {
  success: boolean
  listings?: Array<{ id: string; title: string; type: string, country?: string; state?: string; city?: string }>
  error?: string
}

function NavbarContent({ onAuthChange }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsHook = useSearchParams()
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [mode, setMode] = useState<"signup" | "login" | "forgot">("signup")

  const [, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ email: string; name?: string; is_verified: number } | null>(null)

  const [currentCategory, setCurrentCategory] = useState<string>("Browse Categories")
  const [showDropdown, setShowDropdown] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  useDisableBodyScroll(isPopupOpen);

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const { state } = useAppContext();

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search))
  }, [])

  useEffect(() => {
    if (!searchParams) return

    const verified = searchParams.get("verified")
    const email = searchParams.get("email")

    if (verified === "true" && email) {
      openLogin()
      toast.success(`Email verified: ${decodeURIComponent(email)}`)

      const url = new URL(window.location.href)
      url.searchParams.delete("verified")
      url.searchParams.delete("email")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (pathname === "/buyer/realestate") {
      setCurrentCategory("Real Estate")
    } else if (pathname === "/buyer/business") {
      setCurrentCategory("Business")
    } else if (pathname === "/buyer/automobile") {
      setCurrentCategory("Automobiles")
    } else {
      setCurrentCategory("Browse Categories")
    }
  }, [pathname])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const auth = params.get("auth");

  //   if (auth === "login") {
  //     openLogin();

  //     // clean URL
  //     const url = new URL(window.location.href);
  //     url.searchParams.delete("auth");
  //     window.history.replaceState({}, "", url.toString());
  //   }
  // }, []);

  useEffect(() => {
    const auth = searchParamsHook?.get("auth");

    if (auth === "login") {
      sessionStorage.setItem("loginReturnPath", pathname);
      openLogin();

      // Clean URL without causing navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParamsHook, pathname]);

  const openSignup = () => {
    setMode("signup")
    setIsPopupOpen(true)
  }
  const openLogin = () => {
    setMode("login")
    setIsPopupOpen(true)
  }
  const openForgot = () => {
    setMode("forgot")
    setIsPopupOpen(true)
  }
  const closePopup = () => setIsPopupOpen(false)

  const handleLoginSuccess = (userData: { id: string; email: string; name?: string; is_verified: number; userType: "buyer" | "seller", token?: string; }) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    document.cookie = `userType=${userData.userType};path=/;max-age=172800`;
    if (userData.token) {
      localStorage.setItem("authToken", userData.token);
    }
    setIsLoggedIn(true)
    setIsPopupOpen(false)

    onAuthChange?.()
    const returnPath = sessionStorage.getItem("loginReturnPath");
    sessionStorage.removeItem("loginReturnPath"); // Clean up

    // ✅ If there's a return path and it's not the home page, stay on that page
    if (returnPath && returnPath !== "/") {
      // User was on a specific page (like auction) - just stay there
      // The popup is already closed, user is now logged in and can continue
      router.refresh(); // Optional: refresh to update any auth-dependent UI
      return;
    }

    if (userData.userType === "seller") {
      router.push("/seller/listing")
    } else {
      router.push("/") // buyer goes to home
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    document.cookie = "userType=; expires=Fri, 31 Jan 1970 12:00:00 UTC; path=/";
    setUser(null)
    setShowDropdown(false)
    onAuthChange?.()
    router.push("/")
  }

  const getHeightClass = () => {
    if (mode === "signup") return "h-max md:h-[607px]"
    if (mode === "login") return "h-max md:h-[500px]"
    if (mode === "forgot") return "h-max md:h-[500px]"
    return ""
  }

  const handleSelect = (value: string) => {
    if (value === "real-estate") router.push("/buyer/realestate?category=Real%20Estate")
    if (value === "Business") router.push("/buyer/business?category=Business")
    if (value === "automobiles") router.push("/buyer/automobile?category=Automobiles")
  }

  const isSellerPage = pathname.startsWith("/seller") // 🔥 check seller pages

  /* need to create a product autocomplete for the search bar using /api/searchListings api */
  /* onchange of searchQuery api should call to get products by search string */
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listings, setListings] = useState<Array<{ id: string; title: string; type: string }>>([]);
  useEffect(() => {
    if (searchQuery.length === 0) return;

    const delayDebounceFn = setTimeout(async () => {
      // API call here
      console.log("Searching for:", searchQuery);
      // You can implement the API call to /api/searchListings here
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/searchListings?q=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data: ApiResponse = await response.json()

      console.log('Search API Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listings')
      }

      // Process the API response here
      console.log("Search results:", data);

      const allSearchListings = data.listings || [];

      /* filter items if country, state and city present in app context */
      const filteredListings = allSearchListings.filter((item) => {
        const selectedCountry = state.selectedCountry;
        const selectedState = state.selectedState;
        const selectedCity = state.selectedCity;

        if (selectedCountry && item.country !== selectedCountry.split("|")[1]) return false;
        if (selectedState && item.state !== selectedState.split("|")[1]) return false;
        if (selectedCity && item.city !== selectedCity) return false;
        return true;
      });

      // Update the listings state with the search results
      setListings(filteredListings);

    }, 500); // Delay of 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);



  return (
    <>
      <nav className="border-b py-2 md:py-4 bg-white dark:bg-black dark:border-gray-700 fixed z-999 w-full top-0 left-0">
        <div className="container flex justify-between items-center flex-nowrap">
          <div className="flex flex-wrap flex-col md:flex-nowrap md:flex-row md:items-center md:gap-6 justify-start md:justify-between items-start">
            {!isSellerPage ? (
              // Buyer / public pages → logo goes to homepage
              <Link href="/" passHref>
                <span className="logo">
                  <Image
                    src={logoDark}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img dark:hidden"
                  />
                  <Image
                    src={logoWhite}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img hidden dark:block"
                  />
                </span>
              </Link>
            ) : (
              // Seller pages → logo keeps you on /seller/listing
              <Link href="/seller/listing" passHref>
                <span className="logo">
                  <Image
                    src={logoDark}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img dark:hidden"
                  />
                  <Image
                    src={logoWhite}
                    alt="iBIDS Logo"
                    width={100}
                    height={100}
                    className="logo-img hidden dark:block"
                  />
                </span>
              </Link>
            )}

            {/* 🔥 Hide Browse Categories if seller */}
            {!isSellerPage && (
              <Select onValueChange={handleSelect}>
                <SelectTrigger className="hidden lg:flex w-[180px] dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder={currentCategory} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                  <SelectItem value="Business" className="dark:text-white dark:hover:bg-gray-700">
                    Business
                  </SelectItem>
                  <SelectItem value="real-estate" className="dark:text-white dark:hover:bg-gray-700">
                    Real Estate
                  </SelectItem>
                  <SelectItem value="automobiles" className="dark:text-white dark:hover:bg-gray-700">
                    Automobiles
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* <Link href={""} className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
            Winners
          </Link>
          <Link href={"/help/auction"} className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400">
            Help
          </Link> */}
            {!isSellerPage && (
              <LocationSelector />
            )}
            {/* <AnimatedThemeToggler className="rounded-full p-2 transition-all hover:bg-gray-200 dark:hover:bg-gray-700" /> */}
          </div>
          {/* Right side */}
          <div className="flex items-center justify-end gap-2 md:gap-3 ">
            {/* 🔥 Search bar (hidden if seller) */}
            {!isSellerPage && (
              <>
                {isSearchOpen ? (
                  <X
                    className="cursor-pointer text-dark w-auto h-5"
                    onClick={() => setIsSearchOpen(false)}
                  />
                ) : (
                  <Search
                    className="cursor-pointer text-dark w-auto h-5"
                    onClick={() => setIsSearchOpen(true)}
                  />
                )}
              </>
            )}
            <AnimatedThemeToggler className="rounded-full p-2 transition-all hover:bg-gray-200 dark:hover:bg-gray-700" />
            {/*  If logged in show user icon with dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <FaUser
                  className="text-gray-700 dark:text-gray-200 text-lg cursor-pointer w-auto h-4"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 text-sm">
                    {/* <button
                      onClick={() => {
                        router.push("/profile")
                        setShowDropdown(false)
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      My Profile
                    </button> */}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 dark:text-white cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // If not logged in show Login button
              <button
                onClick={openLogin}
                className="loginSignupbtn"
              >
                <FaUser
                  className=""
                />
                Login/Signup
              </button>
            )}
            {user?.is_verified === 1 && (
              <Suspense fallback={<div><Loader/></div>}>
                <UserTypeToggle />
              </Suspense>
            )}
          </div>
        </div>
      </nav>

      {isPopupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className={`custom-popup-container ${getHeightClass()}`}>
            {mode === "signup" && (
              <SignupForm onClose={closePopup} onSwitchToLogin={openLogin} onSuccessLogin={handleLoginSuccess} />
            )}
            {mode === "login" && (
              <LoginForm
                onClose={closePopup}
                onSwitchToSignup={openSignup}
                onSwitchToPassword={openForgot}
                onSuccessLogin={handleLoginSuccess}
              />
            )}
            {mode === "forgot" && <PasswordForm onClose={closePopup} onSwitchToLogin={openLogin} />}
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="searchbar-container">
          <div className="bg-white px-4 py-3 md:px-6 md:py-4 shadow w-full dark:bg-black">
            <div className="container non-container header">
              <form className="w-full relative flex justify-between items-center gap-4">
                <input
                  type="search"
                  placeholder="Search products..."
                  required
                  className="custom-input-header"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus={true}
                />
                <button
                  type="submit"
                  className="px-4 md:px-6 py-2 bg-[#333B48] text-white rounded-full hover:bg-[#4a5363] transition text-sm md:text-base">
                  <span className="effect group-hover:-translate-x-40 ease"></span>
                  <span className="relative">Search</span>
                </button>
              </form>
            </div>
          </div>
          <div className="search-results-container">
            <div className="container overflow-y-auto h-80 custom-scrollbar">
              {listings.length === 0 ? (
                <div className="p-2.5 md:p-4 text-gray-500 text-center">No results found.</div>
              ) : (
                listings.map((listing, idx) => (
                  <div
                    key={`listing-${idx}`}
                    className="p-2.5 md:p-4 border-b hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(`/buyer/${listing.type.toLowerCase()}/${listing.id}`);
                    }}
                  >
                    {listing.title} ({listing.type})
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// 👇 Export the wrapped version as default
export default function Navbar({ onAuthChange }: NavbarProps) {
  return (
    <Suspense fallback={<div></div>}>
      <NavbarContent onAuthChange={onAuthChange} />
    </Suspense>
  )
}

