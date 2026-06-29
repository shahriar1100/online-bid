"use client"
export const runtime = 'edge'
import "swiper/css"
import "swiper/css/pagination"

import { useEffect, useState, use } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

import { Label } from "src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import Header from "src/components/header"
import Footer from "src/components/footer"
import BusinessRegistrationForm from "src/components/registration-form/seller/business"
import AutomobileRegistrationForm from "src/components/registration-form/seller/automobile"
import RealStateRegistrationForm from "src/components/registration-form/seller/realstate"
//import { homelisting } from "./data"
import { useRouter, usePathname } from "next/navigation"

import useDisableBodyScroll from "../../../../../hooks";
import Loader from "src/components/loader"

interface RealEstateAd {
    id: string;
    name: string;
    description: string;
    lot_size: number;
    location: string;
    images: string[];
    status: string; // e.g., "Active", "Sold", "Pending"
    auctionEndDate?: string; // Optional, if applicable
    isFeatured: boolean;
    featuredUntil?: string; // Optional, if applicable
    category: string;
    subCategory: string;
    auctionType: string;
    duration: string;
    media: { name: string; size: number; type: string, url: string }[];
    propertyAddress: string;
    propertyCountry: string;
    propertyState: string;
    propertyCity: string;
    propertyPincode?: string;
    bedroom?: string;
    bathroom?: string;
    area?: string;
    builtInYear?: string;
    furnishing?: string;
    parkingSpaces?: string;
    utilities?: string[];
    features?: string[];
    auctionPrice?: string;
    auctionDate?: string;
    monthly?: string;
    expiry?: string;
    ownershiptype?: string;
    ownershiptitle?: string;
    ownershipstatus?: string;
    legalDescription?: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    isAgent?: string;
    licenseNumber?: string;
    authorizedToSell?: boolean;
    agreeTerms?: boolean;
}

interface AutomobileAd {
    id: string;
    title: string;
    description: string;
    price: number;
    make: string;
    model: string;
    year: number;
    images: string[];
    status: string; // e.g.,    "Active", "Sold", "Pending" 
    auctionEndDate?: string; // Optional, if applicable
    isFeatured: boolean;
    featuredUntil?: string; // Optional, if applicable
    category: string;
    subcategory: string;
    duration: string;
    media: { name: string; size: number; type: string, url: string }[];
    builtInYear: string;
    body: string;
    fuel: string;
    transmission: string;
    engine: string;
    drive: string;
    odometer: string;
    odometerUnit: string;
    condition: string;
    accidenthistory: string;
    history?: string;
    shistory: string;
    owner: string;
    vnumber: string;
    automobileCountry: string;
    automobileState: string;
    automobileCity: string;
    automobilePincode?: string;
    negotiable?: string;
    mobilefeature?: string[];
    warranty: string;
    warrantydetails?: string;
}

interface BusinessAd {
    id: string;
    title: string;
    description: string;
    price: number;
    industry: string;
    location: string;
    images: string[];
    status: string; // e.g., "Active", "Sold", "Pending"
    auctionEndDate?: string; // Optional, if applicable
    isFeatured: boolean;
    featuredUntil?: string; // Optional, if applicable
    category: string;
    subcategory: string;
    auctionType: string;
    duration: string;
    media: { name: string; size: number; type: string, url: string }[];
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
    namefranchise?: string;
    premises?: string;
    monthly?: string;
    expiry?: string;
    facilitysize?: string;
}

type Ad = RealEstateAd | AutomobileAd | BusinessAd;

const UpdateAds = ({ params }: { params: Promise<{ id: string, category: string }> }) => {
    const router = useRouter() // <-- move inside component
    const pathname = usePathname()

    const { id, category } = use(params);

    const [ad, setAd] = useState<Ad>({} as Ad);
    const [loadingData, setLoadingData] = useState<boolean>(false);

    const formType = {
        "REALESTATE": "realestate",
        "AUTOMOBILES": "automobiles",
        "BUSINESS": "business"
    }

    useDisableBodyScroll(loadingData);

    // Form state
    const [activeForm, setActiveForm] = useState<string>("")
    const closePopup = () => {
        router.push("/seller/listing")
    }
    const [, setUser] = useState<{ email: string; is_verified: number } | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }

        const fetchAd = async () => {
            try {
                setLoadingData(true);

                // Get the user from localStorage (assuming you store it there after login)
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    console.error("No user found in localStorage");
                    setLoadingData(false);
                    return;
                }

                const user = JSON.parse(userStr);
                const userId = user.id;
                const listingId = id;
                const type = category.toLowerCase();

                if (!userId) {
                    console.error("No userId found");
                    setLoadingData(false);
                    return;
                }
                console.log(`Fetching ads for userId: ${userId} and listingId: ${listingId} of type: ${type}`);
                const authToken = localStorage.getItem('authToken');

                // Fetch real estate listings
                let response: Response;
                if (type === formType.REALESTATE) {
                    response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate?userId=${userId}&listingId=${listingId}`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                    });
                } else if (type === formType.AUTOMOBILES) {
                    response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile?userId=${userId}&listingId=${listingId}`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                    });
                } else if (type === formType.BUSINESS) {
                    response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business?userId=${userId}&listingId=${listingId}`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                    });
                } else {
                    console.error("Invalid category type");
                    setLoadingData(false);
                    return;
                }

                // Log any errors
                if (!response.ok) {
                    console.error("Failed to fetch listings:", response.statusText);
                    setLoadingData(false);
                    return;
                }

                const adDetails: { success: boolean; listing?: Ad; error?: string; } = await response.json();

                console.log("Ad Details Response:", adDetails.listing);

                setAd(adDetails?.listing ? adDetails.listing : {} as Ad);

                // Log counts for debugging
                console.log(`Fetched ${JSON.stringify(adDetails)} listing details for user ${userId}`);
                setActiveForm(type);

            } catch (err) {
                console.error("Error fetching ad:", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchAd();
    }, [category, formType.AUTOMOBILES, formType.BUSINESS, formType.REALESTATE, id])

    const handleCategoryChange = (category: string) => {
        setActiveForm(category)
    }

    const renderForm = () => {
        switch (activeForm) {
            case formType.BUSINESS:
                return <BusinessRegistrationForm onClose={closePopup} data={activeForm === formType.BUSINESS ? ad as RealEstateAd : undefined} preselectedCategory="Business" />
            case formType.AUTOMOBILES:
                return <AutomobileRegistrationForm onClose={closePopup} data={activeForm === formType.AUTOMOBILES ? ad as RealEstateAd : undefined} preselectedCategory="Automobiles" />
            case formType.REALESTATE:
                return <RealStateRegistrationForm onClose={closePopup} data={activeForm === formType.REALESTATE ? ad as RealEstateAd : undefined} preselectedCategory="Real Estate" />
            default:
                return <Loader/>
        }
    }

    const isSellerUpdatePage = pathname.startsWith("/seller/update-ads") // 🔥 check seller pages

    return (
        <>
            <Header />
            <div className="space-y-2 my-20 create-ads container">
                <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center justify-center gap-2">
                        <Link href={"/seller/listing/"}>
                            <ChevronLeft className="w-auto h-5 md:h-7" />
                        </Link>
                        <h1 className="text-base md:text-lg whitespace-nowrap">Update advertisement</h1>
                    </div>

                    {/* <Button
                        type="submit"
                        className="btn-nontransparent seller-btn flex items-center justify-center"
                        onClick={handleSubmit(onSubmit, onInvalid)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Publishing...
                        </>
                        ) : (
                        "PUBLISH"
                        )}
                    </Button> */}

                    {/* Category */}
                    {!isSellerUpdatePage && <div className="control">
                        <Label className="custom-label">
                            Category<span className="text-red-500">*</span>
                        </Label>
                        <Select value={activeForm} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="custom-input">
                                <SelectValue placeholder="Add category" className="text-sm text-gray-500" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="realstate">Real Estate</SelectItem>
                                <SelectItem value="automobile">Automobiles</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>}
                </div>
                <div className="flex justify-center items-center mb-10">
                    {renderForm()}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default UpdateAds