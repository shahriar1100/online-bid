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

interface BusinessListing {
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

  // Business-specific (matches worker mapping)
  builtInYear?: string;
  businessAddress?: string;
  businessCountry?: string;
  businessState?: string;
  businessCity?: string;
  businessPincode?: string;

  highlight?: string;
  reason?: string;

  revenue?: string;
  profit?: string;
  assets?: string;
  inventory?: string;
  inventoryValue?: string;

  employes?: string;
  involvement?: string;
  relocatable?: string;
  homebase?: string;
  franchise?: string;
  nameFranchise?: string;

  premises?: string;
  monthly?: string;
  expiry?: string;
  facilitySize?: string;

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
    else if (typeof item === "object" && typeof item.url === "string" && item.url.trim() !== "") out.push(item.url);
  }
  return out;
};

export const runtime = 'edge';

export default function BusinessDetails() {
  const params = useParams();
  const id = Number(params.id);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const [listing, setListing] = useState<BusinessListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Try fast render from sessionStorage (if cached on click)
  useEffect(() => {
    if (!id) return;
    try {
      const cached = sessionStorage.getItem(`biz_listing_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as BusinessListing;
        setListing(parsed);
      }
    } catch { }
  }, [id]);

  // 2) Fetch all business listings, then find by id
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        const data = await response.json() as {
          success: boolean;
          error?: string;
          listings?: BusinessListing[];
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch listing");
        }

        const found = (data.listings || []).find(
          (l: BusinessListing) => Number(l.id) === id
        );

        if (!found) {
          throw new Error("Listing not found");
        }

        setListing(found);

        // Update cache
        try {
          sessionStorage.setItem(`biz_listing_${id}`, JSON.stringify(found));
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

              {/* <p className="text-lg font-medium">
                Buy it Now price:{" "}
                <span className="text-green-600">
                  {listing.price ? `$${listing.price}` : "Contact for price"}
                </span>
              </p> */}

              {/* Business details */}
              <div className="mt-6">
                <h2 className="headline">
                  Business details:
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  {listing.businessAddress && <li>Address: {listing.businessAddress}</li>}
                  {listing.businessCity && listing.businessState && (
                    <li>
                      Location: {listing.businessCity}, {listing.businessState}
                    </li>
                  )}
                  {listing.businessPincode && <li>Zip/Postal Code: {listing.businessPincode}</li>}
                  {listing.businessCountry && <li>Country: {listing.businessCountry}</li>}
                  {listing.builtInYear && <li>Established: {listing.builtInYear}</li>}
                  {listing.revenue && <li>Annual Revenue: ${listing.revenue}</li>}
                  {listing.profit && <li>Annual Profit/EBITDA: ${listing.profit}</li>}
                  {listing.assets && <li>Assets included in sale: {listing.assets}</li>}
                  {listing.inventory && <li>Inventory: {listing.inventory}</li>}
                  {listing.inventoryValue && <li> Estimated Inventory Value: ${listing.inventoryValue}</li>}
                  {listing.employes && <li>No of Employees: {listing.employes}</li>}
                  {listing.involvement && <li>Owner Involvement: {listing.involvement}</li>}
                  {listing.price && <li>Auction Price: ${listing.price}</li>}
                  {listing.relocatable && <li>Business Relocatable: {listing.relocatable}</li>}
                  {listing.homebase && <li>Business Home-based: {listing.homebase}</li>}
                  {listing.franchise && <li>Franchise: {listing.franchise}</li>}
                  {listing.nameFranchise && <li>Franchise Name: {listing.nameFranchise}</li>}
                  {listing.premises && <li>Premises: {listing.premises}</li>}
                  {listing.monthly && <li>Monthly Lease/Expenses: {listing.monthly}</li>}
                  {listing.facilitySize && <li>Facility Size: {listing.facilitySize} sq. ft</li>}
                  {/* {listing.expiry && <li>Lease Expiry: {listing.expiry}</li>} */}
                  {listing.expiry && <li>Lease Expiry:{listing.expiry.split(".")[0]}</li>}
                </ul>
              </div>

              {(listing.highlight || listing.reason) && (
                <div className="mt-6">
                  <h2 className="headline">
                    Key Highlights/Selling Points & Reason
                  </h2>
                  <ul className="space-y-2">
                    {listing.highlight && (
                      <li className="flex items-center gap-2">
                        <Check className="text-green-600 w-5 h-5" />
                        <span>{listing.highlight}</span>
                      </li>
                    )}
                    {listing.reason && (
                      <li className="flex items-center gap-2">
                        <Check className="text-green-600 w-5 h-5" />
                        <span>{listing.reason}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

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
            </div>
          </section>

          {/* <AuctionPanel listing={listing} /> */}
          <AuctionPanel
            key={`business-${listing.id}`}
            listingId={listing.id}
            listingUserId={listing.user_id}
            listingType="business"
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