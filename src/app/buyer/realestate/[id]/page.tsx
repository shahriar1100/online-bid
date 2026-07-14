"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "src/components/header";
import Footer from "src/components/footer";
import { Check } from "lucide-react";
import { Swiper as SwiperClass } from "swiper/types";
import AuctionPanel from "src/components/buyer/AuctionPanel";
import Loader from "src/components/loader";
import { formatStorageDateTimeForDisplay } from "src/lib/date-utils";
import QuestionSection from "src/components/qna/QuestionSection";

type ListingStatus = "Upcoming" | "Live" | "End";

interface RealEstateListing {
  id: number;
  user_id: number;
  name: string;
  category: string;
  subCategory: string;
  status: ListingStatus;
  time: string;
  price?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media?: any[]; // string[] or objects with { url }

  // Real Estate specific (matches worker mapping)
  auctionType?: string;
  duration?: string;
  propertyAddress?: string;
  propertyCountry?: string;
  propertyState?: string;
  propertyCity?: string;
  propertyPincode?: string;
  bedroom?: string;
  bathroom?: string;
  area?: string;
  lot_size?: string;
  builtInYear?: string;
  furnishing?: string;
  utilities?: string[];
  features?: string[];
  auctionPrice?: string;
  auctionDate?: string;
  expiry?: string;
  ownershipType?: string;
  ownershipTitle?: string;
  ownershipStatus?: string;
  legalDescription?: string;

  // Extras
  isFeatured?: boolean;
  featuredUntil?: number;
  createdAt?: number;
}

// Normalize media into valid image URLs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getValidImages = (media: any[] | undefined): string[] => {
  if (!media || !Array.isArray(media)) return [];
  const out: string[] = [];
  for (const item of media) {
    if (!item) continue;
    if (typeof item === "string" && item.trim() !== "") out.push(item);
    else if (
      typeof item === "object" &&
      typeof item.url === "string" &&
      item.url.trim() !== ""
    )
      out.push(item.url);
  }
  return out;
};
export const runtime = "edge";

export default function RealEstateDetails() {
  const params = useParams();
  const id = Number(params.id);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [listing, setListing] = useState<RealEstateListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Try fast render from sessionStorage (if you cached on click)
  useEffect(() => {
    if (!id) return;
    try {
      const cached = sessionStorage.getItem(`real_listing_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as RealEstateListing;
        setListing(parsed);
      }
    } catch {}
  }, [id]);

  // 2) Fetch all realestate listings, then find by id
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          },
        );

        const data = (await response.json()) as {
          success: boolean;
          error?: string;
          listings?: RealEstateListing[];
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch listing");
        }

        const found = (data.listings || []).find(
          (l: RealEstateListing) => Number(l.id) === id,
        );

        if (!found) {
          throw new Error("Listing not found");
        }

        setListing(found);

        // Update cache
        try {
          sessionStorage.setItem(`real_listing_${id}`, JSON.stringify(found));
        } catch {}
      } catch (err) {
        console.error("Error fetching listing:", err);
        if (!listing) {
          setError(
            err instanceof Error ? err.message : "Failed to load listing",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id || Number.isNaN(id)) {
    return (
      <>
        <Header />
        <div className="mt-28 container">
          <div className="text-center py-12">
            <p className="text-red-500">Invalid listing id</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading && !listing) {
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

  if (error || !listing) {
    return (
      <>
        <Header />
        <div className="mt-28 container">
          <div className="text-center py-12">
            <p className="text-red-500">{error || "Listing not found"}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const images = getValidImages(listing.media);

  return (
    <>
      <Header />
      <div className="product-details">
        <div className="flex flex-col lg:flex-row justify-center items-start gap-10 container">
          <section className="w-full lg:w-1/2 order-last lg:order-first">
            {/* Image Gallery */}
            <div className="mb-11 text-sm">
              {images.length > 0 ? (
                <>
                  <Swiper
                    modules={[Navigation, Thumbs]}
                    navigation
                    thumbs={{ swiper: thumbsSwiper }}
                    className="mb-4 rounded border product-swiper"
                  >
                    {images.map((src, i) => (
                      <SwiperSlide key={i}>
                        <div className="product-banner">
                          <Image
                            src={src}
                            alt={`${listing.name} image ${i + 1}`}
                            fill
                            className="object-cover rounded object-center"
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {images.length > 1 && (
                    <Swiper
                      modules={[Thumbs]}
                      onSwiper={setThumbsSwiper}
                      spaceBetween={12}
                      slidesPerView={4.5}
                      watchSlidesProgress
                      className="cursor-pointer"
                    >
                      {images.map((src, i) => (
                        <SwiperSlide key={i}>
                          <div className="slider-container">
                            <Image
                              src={src}
                              alt={`Thumbnail ${i + 1}`}
                              fill
                              className="object-cover w-full h-full object-center"
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  )}
                </>
              ) : (
                <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}

              <p className="section-desc">
                Category:{" "}
                <span className="font-medium">{listing.subCategory}</span>
              </p>

              <h1 className="section-title">{listing.name}</h1>

              {/* <p className="text-lg font-medium">
                Price:{" "}
                <span className="text-green-600">
                  {listing.price ? `$${listing.price}` : "Contact for price"}
                </span>
              </p> */}

              {/* Property details */}
              <div className="mt-6">
                <h2 className="headline">Property details:</h2>
                <ul className="list-disc pl-6 space-y-1">
                  {listing.propertyAddress && (
                    <li>Address: {listing.propertyAddress}</li>
                  )}
                  {listing.propertyCity && listing.propertyState && (
                    <li>
                      Location: {listing.propertyCity}, {listing.propertyState}
                    </li>
                  )}
                  {listing.propertyPincode && (
                    <li>Pincode: {listing.propertyPincode}</li>
                  )}
                  {listing.propertyCountry && (
                    <li>Country: {listing.propertyCountry}</li>
                  )}
                  {listing.area && <li>Floor Area: {listing.area} sq. ft</li>}
                  {listing.lot_size && <li>Lot Size: {listing.lot_size}</li>}
                  {listing.bedroom && <li>Bedrooms: {listing.bedroom}</li>}
                  {listing.bathroom && <li>Bathrooms: {listing.bathroom}</li>}
                  {listing.builtInYear && (
                    <li>Built Year: {listing.builtInYear}</li>
                  )}
                  {listing.furnishing && (
                    <li>Furnishing: {listing.furnishing}</li>
                  )}
                  {listing.ownershipType && (
                    <li>Ownership Type: {listing.ownershipType}</li>
                  )}
                  {listing.ownershipTitle && (
                    <li>Ownership Title: {listing.ownershipTitle}</li>
                  )}
                  {listing.ownershipStatus && (
                    <li>Ownership Status: {listing.ownershipStatus}</li>
                  )}
                  {listing.legalDescription && (
                    <li>Legal Description: {listing.legalDescription}</li>
                  )}
                  {listing.auctionType && (
                    <li>Auction Type: {listing.auctionType}</li>
                  )}
                  {listing.auctionPrice && (
                    <li>Auction Price: ${listing.auctionPrice}</li>
                  )}
                  {listing.auctionDate && (
                    <li>
                      Inspection Date/Time:{" "}
                      {formatStorageDateTimeForDisplay(listing.auctionDate)}
                    </li>
                  )}
                  {/* {listing.expiry && <li>Expiry: {listing.expiry}</li>} */}
                  {listing.expiry && (
                    <li>Expiry:{listing.expiry.split(".")[0]}</li>
                  )}
                </ul>
              </div>

              {listing.features && listing.features.length > 0 && (
                <div className="mt-6">
                  <h2 className="headline">Additional Features:</h2>
                  <ul className="space-y-2">
                    {listing.features!.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="text-green-600 w-5 h-5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {listing.utilities && listing.utilities.length > 0 && (
                <div className="mt-6">
                  <h2 className="headline">Utilities Included:</h2>
                  <ul className="space-y-2">
                    {listing.utilities!.map((utility, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="text-green-600 w-5 h-5" />
                        <span>{utility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* {listing.legalDescription && (
                <div className="mt-6">
                  <h2 className="headline">
                    Legal Description:
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {listing.legalDescription}
                  </p>
                </div>
              )} */}

              {listing.description && (
                <div className="mt-6">
                  <h2 className="headline">Description:</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {listing.description}
                  </p>
                </div>
              )}
              {/* Q&A Section */}
              <QuestionSection
                listingId={listing.id}
                listingType="realestate"
              />
            </div>
          </section>

          {/* <AuctionPanel listing={listing} /> */}
          <AuctionPanel
            key={`realestate-${listing.id}`}
            listingId={listing.id}
            listingUserId={listing.user_id}
            listingType="realestate"
            listingPrice={listing.auctionPrice || "0.00"}
            auctionStatus={listing.status}
            duration={listing.duration}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
