"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Button } from "src/components/ui/button"
import Image from "next/image"
import { categorySubcategories } from "src/app/data"
import Header from "src/components/header"
import Footer from "src/components/footer"
import sold from "src/app/assets/images/real-state/sold.png"
import { Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import Loader from "../loader"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { formatAmount, getCachedHighestBid } from "src/util/bid"
import { parseStorageDate } from "src/lib/date-utils"
import {useAppContext} from "../../app/context";

type ListingStatus = "Upcoming" | "Live" | "End"

interface Listing {
  id: number
  name: string
  category: string
  subCategory: string
  status: ListingStatus
  time: string
  auctionPrice?: string
  description?: string
  duration?: string
  media?: string[]
  isFeatured?: boolean
  featuredUntil?: number
  auctionType?: string
  propertyAddress?: string
  propertyCity?: string
  propertyState?: string
  propertyCountry?: string
  bedroom?: string
  bathroom?: string
  area?: string
}


interface ApiResponse {
  success: boolean
  listings?: Listing[]
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getValidImage = (media: any[] | undefined): string | null => {
  if (!media || !Array.isArray(media) || media.length === 0) {
    return null;
  }

  for (const item of media) {
    if (!item) continue;

    // Check if it's a string URL
    if (typeof item === 'string' && item.trim() !== '') {
      return item;
    }

    // Check for URL property
    if (typeof item === 'object' && item.url) {
      return item.url;
    }
  }

  return null;
};

const flashAnimation = `
@keyframes flash {
  0%, 98%, 100% {
    background-color: #fb2c36;
  }
  49%, 51% {
    background-color: #8f0000;
  }
}

.animate-flash {
  animation: flash 2s infinite ease-in-out;
}
`

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

// helper to format countdown
function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // More than 24 hours → show days and hours
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  // Less than 24 hours → show HH:MM:SS countdown
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

const Realstate = () => {

  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category") || "Real Estate"
  const [selectedSubCategory, setSelectedSubCategory] = useState("All")
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  const pathname = usePathname();


  const rawCategory = searchParams.get("category");
  const segment = pathname.split("/")[2]; // buyer / automobile / business / realestate

  const { state } = useAppContext();

  // Format text (capitalize)
  const format = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // const buyerSection = pathname.includes("/buyer") ? "Buyer" : null;

  // Final Category Name
  const categoryName = rawCategory
    ? format(rawCategory.toLowerCase())
    : segment
      ? format(segment.toLowerCase())
      : "";


  useEffect(() => {
    const interval = setInterval(() => {
      setListings(prevListings => {
        return prevListings.map(listing => {
          const { status } = getAuctionStatusAndCountdown(listing.duration || "")
          return { ...listing, status } // update status in listings
        })
      })

      setCountdowns(prev => {
        const updated: Record<number, string> = {}

        listings.forEach(listing => {
          const { status, timeLeft } = getAuctionStatusAndCountdown(listing.duration || "")
          if (status === "Live" && timeLeft) {
            updated[listing.id] = timeLeft
          }
        })

        return { ...prev, ...updated }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [listings])
  // Fetch listings from worker
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const data: ApiResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch listings')
        }

        const allListings = data.listings || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log('Listing statuses:', allListings.map((l: any) => ({
          id: l.id,
          name: l.name,
          status: l.status
        })))
        /* filter items if country, state and city present in app context */
        const filteredListings = allListings.filter((item) => {
          const selectedCountry = state.selectedCountry;
          const selectedState = state.selectedState;
          const selectedCity = state.selectedCity;

          if (selectedCountry && item.propertyCountry !== selectedCountry.split("|")[1]) return false;
          if (selectedState && item.propertyState !== selectedState.split("|")[1]) return false;
          if (selectedCity && item.propertyCity !== selectedCity) return false;
          return true;
        });
        const sortedListings = filteredListings.sort((a: Listing, b: Listing) => {
          if (a.isFeatured && !b.isFeatured) return -1
          if (!a.isFeatured && b.isFeatured) return 1
          return 0
        })

        setListings(sortedListings)
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  /* filter by country, state and city */
  useEffect(() => {
    const selectedCountry = state.selectedCountry;
    const selectedState = state.selectedState;
    const selectedCity = state.selectedCity;
    console.log("Filtering automobile listings for:", selectedCountry, selectedState, selectedCity);
    setListings(prevListings => prevListings.filter((item) => {
      if (selectedCountry && item.propertyCountry !== selectedCountry.split("|")[1]) return false;
      if (selectedState && item.propertyState !== selectedState.split("|")[1]) return false;
      if (selectedCity && item.propertyCity !== selectedCity) return false;
      return true;
    }));
  }, [state.selectedCountry, state.selectedState, state.selectedCity]);

  const availableSubCategories = useMemo(() => {
    return categoryFromUrl ? categorySubcategories[categoryFromUrl as keyof typeof categorySubcategories] || [] : []
  }, [categoryFromUrl])

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSubCategory = selectedSubCategory === "All" || listing.subCategory === selectedSubCategory
      return matchesSubCategory
    })
  }, [listings, selectedSubCategory])

  useEffect(() => {
    setSelectedSubCategory("All")
  }, [categoryFromUrl])


  useEffect(() => {
    const styleTag = document.createElement("style")
    styleTag.innerHTML = flashAnimation
    document.head.appendChild(styleTag)
    return () => {
      document.head.removeChild(styleTag)
    }
  }, [])

  const getButtonStyle = (listing: Listing) => {
    const currentStatus = listing.status

    if (currentStatus === "End") {
      return {
        text: "Bid Expired",
        className: "btn-expired",
      }
    }

    switch (currentStatus) {
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
        return { text: "Upcoming", className: " badge-container default" }
      case "Live":
        return { text: "Live", className: "badge-container live" }
      case "End":
        return { text: "Ended", className: "badge-container end" }
      default:
        return { text: "Upcoming", className: "badge-container default" }
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="mt-28 mb-20">
          <div className="container">
            <div className="flex justify-center items-center py-12">
              <Loader />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="mt-28 mb-20">
          <div className="container">
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const handleCardClick = (l: Listing) => {
    try {
      sessionStorage.setItem(`real_listing_${l.id}`, JSON.stringify(l));
    } catch { }

    router.push(`/buyer/realestate/${l.id}`);
  };

  return (
    <>
      <Header />
      <div className="category-page-container">
        <div className="container">
          <div className="category-header">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {/* {buyerSection && (
      <>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/buyer">{buyerSection}</BreadcrumbLink>
        </BreadcrumbItem>
      </>
    )} */}

                {categoryName && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>

            <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All </SelectItem>
                {availableSubCategories.map((subCategory) => (
                  <SelectItem key={subCategory} value={subCategory}>
                    {subCategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* <Button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2">Apply</Button> */}
          </div>

          <div className="desktop-view-category mobile-view-category">
            {filteredListings.map((listing) => {
              const buttonStyle = getButtonStyle(listing)
              const statusBadge = getStatusBadge(listing.status)
              const validImage = getValidImage(listing.media)
              return (
                <div
                  key={listing.id}
                  className="group product-card"
                  onClick={() => handleCardClick(listing)}
                >
                  {/* Featured Badge */}
                  {listing.isFeatured && (
                    <div className="featured-badge">
                      <Crown className="w-3 h-3" />
                      <span>Featured</span>
                    </div>
                  )}

                  {/* Subcategory */}

                  {/* Image */}
                  <div className="top-container">
                    <span
                      className={`status-container ${statusBadge.className}`}
                    >
                      ● {statusBadge.text}
                    </span>

                    {validImage ? (
                      <Image
                        src={validImage}
                        alt={listing.name}
                        fill
                        className="object-cover group-hover:scale-95 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}

                    {listing.status === "End" && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Image
                          src={sold}
                          alt="Ended"
                          width={100}
                          height={100}
                          className="sold-img"
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    {/* <h3 className="px-4 pt-2 font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {listing.name}
                    </h3>

                    {listing.propertyAddress && (
                      <p className="px-4 text-sm text-gray-500 line-clamp-1">
                        {listing.propertyCity}, {listing.propertyState}
                      </p>
                    )} */}


                    <div className="content-area">
                      <p className="title">{listing.name}</p>
                      <div className="details">
                        <div className="sub-container">
                          <p className="sub-text">Current Bid</p>
                          <div className={`${getPriceColorClass(listing.status)}`}>
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

                        <div className="sub-container">
                          <p className="sub-text2">Time</p>
                          {(() => {
                            const { status, timeLeft } = getAuctionStatusAndCountdown(listing.duration || "");
                            const countdown = countdowns[listing.id] || timeLeft;

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
                              // ✅ Extract only days from countdown
                              let displayText = "";
                              if (countdown?.includes("d")) {
                                const days = countdown.split("d")[0];
                                displayText = `${days.trim()} days`;
                              } else {
                                displayText = "Less than 1 day";
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

                    {/* CTA */}
                    <div className="p-3 md:p-4">
                      <Button className={`btn ${buttonStyle.className}`}>
                        {buttonStyle.text}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {
            filteredListings.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No live listings available at the moment.
              </div>
            )
          }
        </div>
      </div>

      <Footer />
    </>
  )
}

export default Realstate