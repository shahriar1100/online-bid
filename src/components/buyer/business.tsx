"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { Button } from "src/components/ui/button";
import Image from "next/image";
import { categorySubcategories } from "src/app/data";
import Header from "src/components/header";
import Footer from "src/components/footer";
import sold from "src/app/assets/images/real-state/sold.png";
import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import Loader from "../loader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { formatAmount, getCachedHighestBid } from "src/util/bid";
import { parseStorageDate } from "src/lib/date-utils";
import { useAppContext } from "../../app/context";

type ListingStatus = "Upcoming" | "Live" | "End";

interface Listing {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  status: ListingStatus;
  time: string;
  duration: string;
  price?: string;
  description?: string;
  media?: string[];
  isFeatured?: boolean;
  featuredUntil?: number;

  // Business specific fields
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessCountry?: string;
  revenue?: string;
  profit?: string;
  franchise?: string;
  employes?: string;
}

interface ApiResponse {
  success: boolean;
  listings?: Listing[];
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getValidImage = (media: any[] | undefined): string | null => {
  console.log("Media array:", media);

  if (!media || !Array.isArray(media) || media.length === 0) {
    console.log("Media is empty or not an array");
    return null;
  }

  media.forEach((item, index) => {
    console.log(`Media[${index}]:`, typeof item, item);
  });

  for (const item of media) {
    if (!item) continue;

    if (typeof item === "string" && item.trim && item.trim() !== "") {
      return item;
    }

    if (typeof item === "object") {
      const url = item.url || item.src || item.path;
      if (url && typeof url === "string" && url.trim() !== "") {
        return url;
      }
    }
  }

  return null;
};

function getAuctionStatusAndCountdown(duration: string) {
  try {
    const [startStr, endStr] = duration.split(" to ").map((s) => s.trim());
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
    return {
      status: "Upcoming" as const,
      timeLeft: null,
      startDate: new Date(),
      endDate: new Date(),
    };
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
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

const Business = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "Business";
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  const rawCategory = searchParams.get("category");
  const segment = pathname.split("/")[2];

  const { state } = useAppContext();

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
      setListings((prevListings) => {
        return prevListings.map((listing) => {
          const { status } = getAuctionStatusAndCountdown(
            listing.duration || "",
          );
          return { ...listing, status }; // update status in listings
        });
      });

      setCountdowns((prev) => {
        const updated: Record<number, string> = {};

        listings.forEach((listing) => {
          const { status, timeLeft } = getAuctionStatusAndCountdown(
            listing.duration || "",
          );
          if (status === "Live" && timeLeft) {
            updated[listing.id] = timeLeft;
          }
        });

        return { ...prev, ...updated };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [listings]);

  // Fetch listings from worker
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data: ApiResponse = await response.json();

        console.log("Business API Response:", data);

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch listings");
        }

        const allListings = data.listings || [];
        console.log("App State:", state);
        console.log("All Listings:", allListings);
        /* filter items if country, state and city present in app context */
        const filteredListings = allListings.filter((item) => {
          const selectedCountry = state.selectedCountry;
          const selectedState = state.selectedState;
          const selectedCity = state.selectedCity;

          console.log({
            dbCountry: item.businessCountry,
            selectedCountry: state.selectedCountry,
            dbState: item.businessState,
            selectedState: state.selectedState,
            dbCity: item.businessCity,
            selectedCity: state.selectedCity,
          });

          if (
            selectedCountry &&
            item.businessCountry !== selectedCountry.split("|")[1]
          )
            return false;
          if (
            selectedState &&
            item.businessState !== selectedState.split("|")[1]
          )
            return false;
          if (selectedCity && item.businessCity !== selectedCity) return false;
          return true;
        });

        const sortedListings = filteredListings.sort(
          (a: Listing, b: Listing) => {
            const statusOrder = { Live: 0, Upcoming: 1, End: 2 };
            const aOrder = statusOrder[a.status] ?? 3;
            const bOrder = statusOrder[b.status] ?? 3;

            if (aOrder !== bOrder) return aOrder - bOrder;

            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;

            return 0;
          },
        );

        setListings(sortedListings);

        console.log(`Found ${sortedListings.length} business listings`);
      } catch (err) {
        console.error("Error fetching business listings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load listings",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  /* filter by country, state and city */
  useEffect(() => {
    const selectedCountry = state.selectedCountry;
    const selectedState = state.selectedState;
    const selectedCity = state.selectedCity;
    console.log(
      "Filtering automobile listings for:",
      selectedCountry,
      selectedState,
      selectedCity,
    );
    setListings((prevListings) =>
      prevListings.filter((item) => {
        if (
          selectedCountry &&
          item.businessCountry !== selectedCountry.split("|")[1]
        )
          return false;
        if (selectedState && item.businessState !== selectedState.split("|")[1])
          return false;
        if (selectedCity && item.businessCity !== selectedCity) return false;
        return true;
      }),
    );
  }, [state.selectedCountry, state.selectedState, state.selectedCity]);

  const availableSubCategories = useMemo(() => {
    return categoryFromUrl
      ? categorySubcategories[
          categoryFromUrl as keyof typeof categorySubcategories
        ] || []
      : [];
  }, [categoryFromUrl]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSubCategory =
        selectedSubCategory === "All" ||
        listing.subCategory === selectedSubCategory;
      return matchesSubCategory;
    });
  }, [listings, selectedSubCategory]);

  useEffect(() => {
    setSelectedSubCategory("All");
  }, [categoryFromUrl]);

  const getButtonStyle = (listing: Listing) => {
    const currentStatus = listing.status;

    if (currentStatus === "End") {
      return {
        text: "Bid Expired",
        className: "btn-expired",
      };
    }

    switch (currentStatus) {
      case "Upcoming":
        return { text: "Bidding Soon", className: "btn-default" };
      case "Live":
        return { text: "Place Bid", className: "btn-live" };
      default:
        return { text: "Place Bid", className: "btn-default" };
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case "Upcoming":
        return { text: "Upcoming", className: "badge-container default" };
      case "Live":
        return { text: "Live", className: "badge-container live" };
      case "End":
        return { text: "End", className: "badge-container end" };
      default:
        return { text: "Upcoming", className: "badge-container default" };
    }
  };

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
    );
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
    );
  }

  const handleCardClick = (l: Listing) => {
    try {
      sessionStorage.setItem(`biz_listing_${l.id}`, JSON.stringify(l));
    } catch {}

    router.push(`/buyer/business/${l.id}`);
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
                {/* 
                {buyerSection && (
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

            <Select
              value={selectedSubCategory}
              onValueChange={setSelectedSubCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
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
              const buttonStyle = getButtonStyle(listing);
              const statusBadge = getStatusBadge(listing.status);
              const validImage = getValidImage(listing.media);

              return (
                <div
                  key={listing.id}
                  className="group product-card relative"
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
                  {/* <p className="title">{listing.subCategory}</p> */}
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
                    </h3> */}

                    {/* {listing.businessCity && listing.businessState && (
                      <p className="px-4 text-sm text-gray-500 line-clamp-1">
                        {listing.businessCity}, {listing.businessState}
                      </p>
                    )}

                    {listing.revenue && (
                      <p className="px-4 text-xs text-gray-600">
                        Revenue: ${listing.revenue}/year
                      </p>
                    )} */}

                    <div className="content-area">
                      <p className="title">{listing.name}</p>
                      <div className="details">
                        <div className="sub-container">
                          <p className="sub-text">Current Bid</p>
                          <div
                            className={`${getPriceColorClass(listing.status)}`}
                          >
                            {(() => {
                              const amount = getCachedHighestBid(
                                "business",
                                listing.id,
                                listing.price,
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
                            const { status, timeLeft } =
                              getAuctionStatusAndCountdown(
                                listing.duration || "",
                              );
                            const countdown =
                              countdowns[listing.id] || timeLeft;

                            // ✅ UPCOMING: Show "Starting Soon"
                            if (status === "Upcoming") {
                              return (
                                <span className="status-default">
                                  {countdown
                                    ? `Start in ${countdown}`
                                    : "Starting soon"}
                                </span>
                              );
                            }

                            // ✅ ENDED: Show "Ended"
                            if (status === "End") {
                              return <span className="status-end">Ended</span>;
                            }

                            // ✅ LIVE: Show days left OR HH:MM:SS countdown
                            if (status === "Live") {
                              let displayText = "";

                              if (countdown?.includes("d")) {
                                // More than 24 hours - show "X days left"
                                const days = countdown.split("d")[0];
                                displayText = `${days.trim()} days`;
                              } else {
                                // Less than 24 hours - show HH:MM:SS
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

                    {/* CTA */}
                    <div className="p-3 md:p-4">
                      <Button className={`btn ${buttonStyle.className}`}>
                        {buttonStyle.text}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredListings.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No business listings available at the moment.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Business;
