// app/buyer/automobile/[id]/page.tsx
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

type ListingStatus = "Upcoming" | "Live" | "End";

interface AutomobileListing {
  id: number;
  user_id: number;
  name: string;
  category: string;
  subCategory: string;
  status: ListingStatus;
  duration?: string;
  price?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media?: any[]; // string[] or objects with { url }

  // Automobile specific (matches worker mapping)
  make?: string;
  model?: string;
  builtInYear?: string;
  body?: string;
  fuel?: string;
  transmission?: string;
  engine?: string;
  drive?: string;
  odometer?: string;
  odometerUnit?: string;
  condition?: string;
  mobileFeatures?: string[];
  accidentHistory?: string;
  serviceHistory?: string;
  automobileCity?: string;
  automobileState?: string;
  automobileCountry?: string;
  automobilePincode?: string;
  warranty?: string;
  warrantyDetails?: string;
  vinNumber?: string;
  owner?: number;
  // Extras
  isFeatured?: boolean;
  featuredUntil?: number;
  createdAt?: number;
}

export const runtime = 'edge';

// Helper to normalize media into valid image URLs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getValidImages = (media: any[] | undefined): string[] => {
  if (!media || !Array.isArray(media)) return [];
  const out: string[] = [];
  for (const item of media) {
    if (!item) continue;
    if (typeof item === "string" && item.trim() !== "") out.push(item);
    else if (typeof item === "object" && typeof item.url === "string" && item.url.trim() !== "") out.push(item.url);
  }
  return out;
};

export default function AutomobileDetails() {
  const params = useParams();
  const id = Number(params.id);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [listing, setListing] = useState<AutomobileListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Try fast render from sessionStorage (if you cached on click)
  useEffect(() => {
    if (!id) return;
    try {
      const cached = sessionStorage.getItem(`auto_listing_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as AutomobileListing;
        setListing(parsed);
      }
    } catch { }
  }, [id]);

  // 2) Fetch all, then find by id (works with current /api/automobile)
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        const data = await response.json() as {
          success: boolean;
          error?: string;
          listings?: AutomobileListing[];
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch listing");
        }

        const found = (data.listings || []).find(
          (l: AutomobileListing) => Number(l.id) === id
        );

        if (!found) {
          throw new Error("Listing not found");
        }

        setListing(found);

        // Update cache for back/forward navigation
        try {
          sessionStorage.setItem(`auto_listing_${id}`, JSON.stringify(found));
        } catch { }
      } catch (err) {
        console.error("Error fetching listing:", err);
        if (!listing) {
          setError(err instanceof Error ? err.message : "Failed to load listing");
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
                Category: <span className="font-medium">{listing.subCategory}</span>
              </p>

              <h1 className="section-title">{listing.name}</h1>

              {/* <p className="text-base font-medium">
                Buy it Now price:{" "}
                <span className="text-green-600">
                  {listing.price ? `$${listing.price}` : "Contact for price"}
                </span>
              </p> */}

              <div className="mt-6">
                <h2 className="headline">
                  Vehicle details:
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  {listing.make && <li>Make: {listing.make}</li>}
                  {listing.model && <li>Model: {listing.model}</li>}
                  {listing.price && <li>Auction Price: ${listing.price}</li>}
                  {listing.builtInYear && <li>Year: {listing.builtInYear}</li>}
                  {listing.body && <li>Body Type: {listing.body}</li>}
                  {listing.fuel && <li>Fuel Type: {listing.fuel}</li>}
                  {listing.transmission && <li>Transmission: {listing.transmission}</li>}
                  {listing.engine && <li>Engine: {listing.engine}</li>}
                  {listing.drive && <li>Drive: {listing.drive}</li>}
                  {/* {listing.odometer && (
                    <li>
                      Odometer: {listing.odometer} {listing.odometerUnit}
                    </li>
                  )} */}
                  {listing.odometer && (
                    <li>
                      Odometer/Mileage: {listing.odometer}
                    </li>
                  )}
                  {listing.odometerUnit && (
                    <li>
                      Unit: {listing.odometerUnit}
                    </li>
                  )}
                  {listing.condition && <li>Condition: {listing.condition}</li>}
                  {listing.automobileCity && listing.automobileState && (
                    <li>
                      Location: {listing.automobileCity}, {listing.automobileState}
                    </li>
                  )}
                  {listing.automobilePincode && <li>PIN Code: {listing.automobilePincode}</li>}
                  {listing.automobileCountry && <li>Country: {listing.automobileCountry}</li>}
                  {listing.warranty && <li>Warranty: {listing.warranty}</li>}
                  {listing.warrantyDetails && <li>Warranty Details: {listing.warrantyDetails}</li>}
                </ul>
              </div>
              <div className="mt-6">
                <h2 className="headline">Ownership & History</h2>
                <ul className="list-disc pl-6 space-y-1">
                  {listing.owner !== undefined && <li>Previous Owners: {listing.owner}</li>}
                  {listing.accidentHistory && <li>Accident History: {listing.accidentHistory}</li>}
                  {listing.serviceHistory && <li>Service History: {listing.serviceHistory}</li>}
                  {listing.vinNumber && <li>VIN Number: {listing.vinNumber}</li>}
                </ul>
              </div>
              {listing.description && (
                <div className="mt-6">
                  <h2 className="headline">
                    Description:
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {listing.description}
                  </p>
                </div>
              )}

              {listing.mobileFeatures && listing.mobileFeatures.length > 0 && (
                <div className="mt-6">
                  <h2 className="headline">
                    Features:
                  </h2>
                  <ul className="space-y-2">
                    {listing.mobileFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="text-green-600 w-5 h-5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* <AuctionPanel listing={listing} /> */}
          <AuctionPanel
            key={`automobile-${listing.id}`}
            listingId={listing.id}
            listingUserId={listing.user_id}
            listingType="automobile"
            listingPrice={listing.price || "0.00"}
            auctionStatus={listing.status}
            duration={listing.duration}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}