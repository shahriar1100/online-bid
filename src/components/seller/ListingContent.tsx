"use client"

import Image from "next/image"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Checkbox } from "src/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "src/components/ui/table"
import { Crown, Edit, EyeIcon, MoreVertical, PlusCircle, Trash2 } from "lucide-react"
import { categorySubcategories } from "src/app/data"
import Header from "src/components/header"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "src/components/ui/dialog"
import featurepost from "src/app/assets/images/seller/feature.png"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Loader from "../loader"
import { parseDurationStringForDisplay } from "src/lib/date-utils"
interface Advertisement {
    id: number
    name: string
    category: string
    subCategory: string
    status: string
    time: string
    duration: string
    type?: string
    isFeatured?: boolean // Add this
    featuredUntil?: number
}
interface Ad {
    calculatedStatus: "Upcoming" | "Live" | "End"
}

type RealEstateResponse = {
    success: boolean
    listings?: {
        id: number
        name: string
        category: string
        subCategory: string
        status: string
        time: string
        duration: string
        isFeatured?: boolean // Add this
        featuredUntil?: number
    }[]
    error?: string
}

type AutomobileResponse = {
    success: boolean
    listings?: {
        id: number
        name: string
        category: string
        subCategory: string
        status: string
        time: string
        duration: string

        isFeatured?: boolean // Add this
        featuredUntil?: number
    }[]
    error?: string
}

type BusinessResponse = {
    success: boolean
    listings?: {
        id: number
        name: string
        category: string
        subCategory: string
        status: string
        time: string
        duration: string

        isFeatured?: boolean // Add this
        featuredUntil?: number
    }[]
    error?: string
}

type DeleteResponse = {
    success: boolean
    message?: string
    deletedId?: number
    error?: string
}

const getCompositeKey = (ad: Advertisement): string => {
    return `${ad.type || 'unknown'}-${ad.id}`;
};

// Helper function to parse composite key
const parseCompositeKey = (key: string): { type: string; id: number } => {
    const lastDashIndex = key.lastIndexOf('-');
    const type = key.substring(0, lastDashIndex);
    const id = Number(key.substring(lastDashIndex + 1));
    return { type, id };
};

const Listing = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All Categories")
    const [selectedSubCategory, setSelectedSubCategory] = useState("All Subcategories")
    const [selectedStatus, setSelectedStatus] = useState("All Status")
    // const [selectedAds, setSelectedAds] = useState<number[]>([])
    const [selectedAds, setSelectedAds] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(6)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    // const featuredAdsParam = searchParams.get("featured")
    // const [] = useState<number[]>(featuredAdsParam ? featuredAdsParam.split(",").map(Number) : [])
    // ADD THIS: Track if featured param has been processed
    const featuredProcessedRef = useRef(false)
    const [ads, setAds] = useState<Advertisement[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [, setTimeTick] = useState(0)

    const parseDateTimeLocal = (raw: string): number | null => {
        if (!raw) return null

        // extract dd/mm/yyyy hh:mm (with optional AM/PM) from anywhere in the string
        const m = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/)
        if (m) {
            const [, ddStr, mmStr, yyyyStr, hhStr, minStr, ampm] = m
            const dd = Number.parseInt(ddStr, 10)
            const mm = Number.parseInt(mmStr, 10) // 1-12
            const yyyy = Number.parseInt(yyyyStr, 10)
            let hh = Number.parseInt(hhStr, 10)
            const min = Number.parseInt(minStr, 10)

            if (ampm) {
                const cap = ampm.toUpperCase()
                if (cap === "PM" && hh < 12) hh += 12
                if (cap === "AM" && hh === 12) hh = 0
            }

            const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0)
            return isNaN(d.getTime()) ? null : d.getTime()
        }

        // Fallback to native parsing (handles ISO or locale strings if provided)
        const native = new Date(raw)
        return isNaN(native.getTime()) ? null : native.getTime()
    }

    const getCalculatedStatus = useCallback((adTime: string): string => {
        const parseDurationRange = (adTime: string): { start: number | null; end: number | null } => {
            if (!adTime) return { start: null, end: null }

            const normalized = adTime.replace(/—|–/g, "-")
            const parts = normalized
                .split(/\s+to\s+|-\s*/i)
                .map((p) => p.trim())
                .filter(Boolean)

            if (parts.length >= 2) {
                const startMs = parseDateTimeLocal(parts[0])
                let endMs: number | null = null

                if (!/end date/i.test(parts[1]) && !/end time/i.test(parts[1])) {
                    endMs = parseDateTimeLocal(parts[1])
                }

                return { start: startMs, end: endMs }
            }

            const single = parseDateTimeLocal(adTime)
            return { start: single, end: null }
        }

        const { start, end } = parseDurationRange(adTime)
        const now = Date.now()

        if (start && end) {
            if (now < start) return "Upcoming"
            if (now >= start && now <= end) return "Live"
            return "End"
        }

        if (start && !end) {
            if (now < start) return "Upcoming"
            if (now >= start) return "End"
        }

        return "End"
    }, [])


    const getStatusColor = (status: string) => {
        switch (status) {
            case "Upcoming":
                return "text-blue-600"
            case "Live":
                return "text-green-600"
            case "End":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const getStatusDot = (status: string) => {
        switch (status) {
            case "Upcoming":
                return "bg-blue-600"
            case "Live":
                return "bg-green-600"
            case "End":
                return "bg-red-600"
            default:
                return "bg-gray-600"
        }
    }

    const handleProceed = async () => {
        setLoading(true)

        try {
            const userStr = localStorage.getItem("user")
            const authToken = localStorage.getItem("authToken")

            if (!userStr || !authToken) {
                toast.error("Please login to continue")
                router.push("/")
                setLoading(false)
                return
            }

            const user = JSON.parse(userStr)

            const selectedAdData = selectedAds.map(parseCompositeKey)
            const adIds = selectedAdData.map(data => data.id)
            const listingTypes = selectedAdData.map(data => data.type)

            console.log("Creating checkout session for:", {
                userId: user.id,
                selectedAds: adIds,
                listingTypes,
            })

            const response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/payment/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    userId: Number(user.id),
                    selectedAds: adIds,
                    listingTypes: listingTypes,
                }),
            })

            const data = (await response.json()) as {
                success: boolean
                sessionId?: string
                url?: string
                error?: string
            }

            console.log("Checkout session response:", data)

            if (!response.ok || !data.url) {
                throw new Error(data.error || "Failed to create checkout session")
            }

            setOpen(false)

            window.location.href = data.url
        } catch (error) {
            console.error("Payment error:", error)
            toast.error(error instanceof Error ? error.message : "Payment failed")
            setLoading(false)
            setOpen(false)
        }
    }

    const availableSubCategories = selectedCategory
        ? categorySubcategories[selectedCategory as keyof typeof categorySubcategories] || []
        : []

    const getAdDurationString = (ad: Advertisement): string => {
        return ad?.duration || ""
    }

    const filteredAds = useMemo(() => {
        return ads
            .map((ad) => ({
                ...ad,
                // Use robust extraction so we always compute the status from duration
                calculatedStatus: getCalculatedStatus(getAdDurationString(ad)),
            }))
            .filter((ad) => {
                const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesCategory = selectedCategory === "All Categories" || ad.category === selectedCategory
                const matchesSubCategory = selectedSubCategory === "All Subcategories" || ad.subCategory === selectedSubCategory
                const matchesStatus =
                    selectedStatus === "All Status" ||
                    ad.calculatedStatus === selectedStatus ||
                    (selectedStatus === "Ended" && ad.calculatedStatus === "End")

                return matchesSearch && matchesCategory && matchesSubCategory && matchesStatus
            })
    }, [ads, searchTerm, selectedCategory, selectedSubCategory, selectedStatus, getCalculatedStatus])

    const visibleAds = filteredAds.slice(0, visibleCount)
    const hasMoreAds = filteredAds.length > visibleCount

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category)
        setSelectedSubCategory("All Subcategories")
    }


    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select ads that are NOT already featured
            const selectableAds = visibleAds
                .filter((ad) => !ad.isFeatured && ad.calculatedStatus !== "End")
                .map((ad) => getCompositeKey(ad));

            if (selectableAds.length === 0) {
                toast.error("All visible posts are already featured!");
                return;
            }

            // if (selectableAds.length < visibleAds.length) {
            //     toast.info(`${visibleAds.length - selectableAds.length} post(s) skipped - already featured`);
            // }

            setSelectedAds(selectableAds);
        } else {
            setSelectedAds([]);
        }
    };

    const handleSelectAd = (ad: Advertisement & { calculatedStatus?: string }, checked: boolean) => {
        const compositeKey = getCompositeKey(ad);

        // Check if the ad is already featured
        if (ad?.isFeatured) {
            toast.error("Oops! This post is already featured!");
            return; // Don't allow selection
        }
        if (ad.calculatedStatus === "End") {
            toast.error("This post has already ended and cannot be featured!");
            return;
        }
        if (checked) {
            setSelectedAds([...selectedAds, compositeKey])
        } else {
            setSelectedAds(selectedAds.filter((id) => id !== compositeKey))
        }
    }

    const loadMore = () => {
        setVisibleCount((prev) => prev + 6)
    }

    useEffect(() => {
        const fetchAllAds = async () => {
            try {
                setLoadingData(true)

                const userStr = localStorage.getItem("user")
                if (!userStr) {
                    console.error("No user found in localStorage")
                    setLoadingData(false)
                    return
                }

                const user = JSON.parse(userStr)
                const userId = user.id

                if (!userId) {
                    console.error("No userId found")
                    setLoadingData(false)
                    return
                }
                console.log("Fetching ads for userId:", userId)
                const authToken = localStorage.getItem("authToken")

                const realEstateRes = await fetch(
                    `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate?userId=${userId}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    },
                )
                const realEstateData: RealEstateResponse = await realEstateRes.json()

                const automobileRes = await fetch(
                    `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile?userId=${userId}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    },
                )
                const automobileData: AutomobileResponse = await automobileRes.json()

                const businessRes = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business?userId=${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                })
                const businessData: BusinessResponse = await businessRes.json()
                console.log("automobile RAW RESPONSE", automobileData.listings)
                const allListings = [
                    ...(realEstateData.success
                        ? (realEstateData.listings || []).map((ad) => ({
                            ...ad,
                            type: "realestate",
                            isFeatured: ad.isFeatured || false,
                            featuredUntil: ad.featuredUntil,
                        }))
                        : []),
                    ...(automobileData.success
                        ? (automobileData.listings || []).map((ad) => ({
                            ...ad,
                            type: "automobile",
                            isFeatured: ad.isFeatured || false,
                            featuredUntil: ad.featuredUntil,
                        }))
                        : []),
                    ...(businessData.success
                        ? (businessData.listings || []).map((ad) => ({
                            ...ad,
                            type: "business",
                            isFeatured: ad.isFeatured || false,
                            featuredUntil: ad.featuredUntil,
                        }))
                        : []),
                ]
                console.log("FINAL ADS STATE", allListings)
                setAds(allListings)

                console.log(`Fetched ${allListings.length} total listings for user ${userId}`)

                if (!realEstateData.success) {
                    console.error("Failed to fetch real estate listings:", realEstateData.error)
                }
                if (!automobileData.success) {
                    console.error("Failed to fetch automobile listings:", automobileData.error)
                }
                if (!businessData.success) {
                    console.error("Failed to fetch business listings:", businessData.error)
                }
            } catch (err) {
                console.error("Error fetching ads:", err)
            } finally {
                setLoadingData(false)
            }
        }

        fetchAllAds()
    }, [])



    useEffect(() => {
        const featuredParam = searchParams.get("featured")

        // Only process once AND only when ads are loaded
        if (featuredParam && ads.length > 0 && !featuredProcessedRef.current) {
            // Mark as processed FIRST to prevent re-runs
            featuredProcessedRef.current = true

            const featuredIds = featuredParam.split(",").map(Number).filter(id => !isNaN(id))
            console.log("Marking ads as featured:", featuredIds)

            // Update local state for immediate UI feedback
            setAds((prevAds) =>
                prevAds.map((ad) => {
                    if (featuredIds.includes(ad.id)) {
                        return {
                            ...ad,
                            isFeatured: true,
                            featuredUntil: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                        }
                    }
                    return ad
                }),
            )

            // Database update
            const updateDatabase = async () => {
                const authToken = localStorage.getItem("authToken")
                if (!authToken) return

                const featuredUntil = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

                for (const adId of featuredIds) {
                    const ad = ads.find((a) => a.id === adId)

                    if (!ad || !ad.type) {
                        console.warn(`Ad ${adId} not found or has no type`)
                        continue
                    }

                    let apiEndpoint = ""
                    if (ad.type === "realestate") {
                        apiEndpoint = `/api/realestate/${adId}`
                    } else if (ad.type === "automobile") {
                        apiEndpoint = `/api/automobile/${adId}`
                    } else if (ad.type === "business") {
                        apiEndpoint = `/api/business/${adId}`
                    }

                    try {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}${apiEndpoint}`, {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${authToken}`,
                            },
                            body: JSON.stringify({
                                isFeatured: true,
                                featuredUntil: featuredUntil,
                            }),
                        })

                        if (!response.ok) {
                            console.error(`Failed to update ad ${adId} as featured`)
                        } else {
                            console.log(`✅ Successfully marked ad ${adId} as featured`)
                        }
                    } catch (error) {
                        console.error(`Error updating ad ${adId}:`, error)
                    }
                }
            }

            updateDatabase()

            // Show success toast
            toast.success("Your listings are now featured!")

            // Clean up URL
            router.replace("/seller/listing", { scroll: false })
        }
    }, [searchParams, ads, router])

    const handleDelete = (adId: number, adType: string) => {
        toast.error("Are you sure you want to delete this listing?", {
            action: {
                label: "Delete",
                onClick: () => confirmDelete(adId, adType),
            },
            cancel: {
                label: "Cancel",
                onClick: () => toast.info("Delete cancelled"),
            },
        });
    };


    const confirmDelete = async (adId: number, adType: string) => {
        try {
            const authToken = localStorage.getItem("authToken");

            if (!authToken) {
                toast.error("Please login to delete listings");
                router.push("/");
                return;
            }

            let apiEndpoint = "";
            if (adType === "realestate") apiEndpoint = `/api/realestate/${adId}`;
            else if (adType === "automobile") apiEndpoint = `/api/automobile/${adId}`;
            else if (adType === "business") apiEndpoint = `/api/business/${adId}`;
            else return toast.error("Unknown listing type");

            const response = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}${apiEndpoint}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const result: DeleteResponse = await response.json();

            if (response.status === 401) {
                toast.error("Session expired. Please login again.");
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/");
                return;
            }

            if (response.ok && result.success) {
                toast.success("Listing deleted successfully");
                setAds((prev) => prev.filter((ad) => ad.id !== adId));
            } else {
                toast.error(result.error || "Failed to delete listing");
            }

        } catch (error) {
            console.error("Error deleting listing:", error);
            toast.error("An error occurred while deleting the listing");
        }
    };


    useEffect(() => {
        const id = setInterval(() => setTimeTick((t) => (t + 1) % 1_000_000), 30_000) // every 30s
        return () => clearInterval(id)
    }, [])

    return (
        <>
            <Header />
            <div className="seller-listing">
                <div className="container">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 justify-start md:justify-center flex-wrap w-full lg:w-max flex-col">
                            <h1 className="text-base md:text-xl whitespace-nowrap">List of Advertisements</h1>
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="custom-input custom-width"
                            />
                        </div>
                        <div className="grid grid-cols-3 lg:flex justify-end items-center gap-2 flex-row flex-wrap md:flex-nowrap">
                            {selectedAds.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 rounded-full hover:bg-gray-100 order-last md:order-first">
                                            <MoreVertical className="h-5 w-5 text-black dark:text-white dark:hover:text-black" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => setOpen(true)}>Feature your post</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="custom-input">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Categories">All Categories</SelectItem>
                                    {Object.keys(categorySubcategories).map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedSubCategory}
                                onValueChange={setSelectedSubCategory}
                                disabled={!selectedCategory || selectedCategory === "All Categories"}
                            >
                                <SelectTrigger className="custom-input">
                                    <SelectValue placeholder={selectedCategory ? "Filter" : "Filter not selected"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Subcategories">All Sub-categories</SelectItem>
                                    {availableSubCategories.map((subCategory) => (
                                        <SelectItem key={subCategory} value={subCategory}>
                                            {subCategory}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="custom-input">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Status">All Status</SelectItem>
                                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                                    <SelectItem value="Live">Live</SelectItem>
                                    <SelectItem value="End">Ended</SelectItem>
                                </SelectContent>
                            </Select>


                            <Link href="/seller/create-ads">
                                <Button className="btn-nontransparent seller-btn">
                                    <PlusCircle />  Create Ad</Button>
                            </Link>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-12">
                                            {/* <Checkbox
                                            checked={selectedAds.length === visibleAds.length && visibleAds.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        /> */}
                                            <Checkbox
                                                checked={
                                                    selectedAds.length > 0 &&
                                                    selectedAds.length === visibleAds.filter(ad => !ad.isFeatured && ad.calculatedStatus !== "End").length &&
                                                    visibleAds.some(ad => !ad.isFeatured && ad.calculatedStatus !== "End")
                                                }
                                                onCheckedChange={handleSelectAll}
                                                disabled={visibleAds.every(ad => ad.isFeatured)}
                                            />
                                        </TableHead>
                                        <TableHead className="table-head">NAME</TableHead>
                                        <TableHead className="table-head">CATEGORY</TableHead>
                                        <TableHead className="table-head">SUB-CATEGORY</TableHead>
                                        <TableHead className="table-head">STATUS</TableHead>
                                        <TableHead className="table-head">ACTION</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleAds.map((ad) => {
                                        const compositeKey = getCompositeKey(ad);
                                        return (
                                            <TableRow key={compositeKey}>
                                                {/* <TableCell className="">
                                                <Checkbox
                                                    checked={selectedAds.includes(ad.id)}
                                                    onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                                            />
                                        </TableCell> */}
                                                <TableCell className="">
                                                    <div
                                                        onClick={() => {
                                                            if (ad.isFeatured) {
                                                                toast.error("Oops! This post is already featured!");
                                                            } else if (ad.calculatedStatus === "End") {
                                                                toast.error("This post has already ended and cannot be featured!");
                                                            }
                                                        }}
                                                        className={ad.isFeatured || ad.calculatedStatus === "End" ? "cursor-not-allowed" : ""}
                                                    >
                                                        <Checkbox
                                                            checked={selectedAds.includes(compositeKey)}
                                                            onCheckedChange={(checked) => handleSelectAd(ad, checked as boolean)}
                                                            disabled={ad.isFeatured || ad.calculatedStatus === "End"}
                                                            className={ad.isFeatured || ad.calculatedStatus === "End" ? "opacity-50 pointer-events-none" : ""}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white dark:hover:text-gray-700">
                                                            {ad.name}
                                                            {ad.isFeatured && <Crown className="ml-2 w-4 h-4 text-yellow-500 inline-block" />}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{parseDurationStringForDisplay(ad.duration)}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-white dark:hover:text-gray-700">
                                                    {ad.category}
                                                </TableCell>
                                                <TableCell className="text-gray-700 dark:text-white dark:hover:text-gray-700">
                                                    {ad.subCategory}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-[6px] h-[6px] rounded-full ${getStatusDot(ad.calculatedStatus)}`} />
                                                        <span className={`font-medium ${getStatusColor(ad.calculatedStatus)}`}>
                                                            {ad.calculatedStatus === "End" ? "Ended" : ad.calculatedStatus}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="">
                                                    <div className="flex items-center justify-start gap-4 text-sm">
                                                        {(ad as Ad).calculatedStatus === "Upcoming" ? (
                                                            <Link className="action-cont" href={`/seller/update-ads/${ad.category.replace(/\s/, "").toLocaleLowerCase()}/${ad.id}`}>
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                <p>Edit</p>
                                                            </Link>
                                                        ) : (
                                                            <Link className="text-blue-600 hover:text-blue-800 text-left underline action-cont" href={`/seller/update-ads/${ad.category.replace(/\s/g, "").toLowerCase()}/${ad.id}`}>
                                                                <EyeIcon className="w-4 h-4 mr-1" />
                                                                <p>View</p>
                                                            </Link>
                                                        )}
                                                        <div
                                                            className="cursor-pointer text-red-600 hover:text-red-800 action-cont"
                                                            onClick={() => handleDelete(ad.id, ad.type || "")}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            <p>Delete</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile and iPad View */}
                        <div className="lg:hidden">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b flex items-center gap-3">
                                <Checkbox
                                    checked={
                                        selectedAds.length > 0 &&
                                        selectedAds.length === visibleAds.filter(ad => !ad.isFeatured && ad.calculatedStatus !== "End").length &&
                                        visibleAds.some(ad => !ad.isFeatured && ad.calculatedStatus !== "End")
                                    }
                                    onCheckedChange={handleSelectAll}
                                    disabled={visibleAds.every(ad => ad.isFeatured)}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select All</span>
                            </div>
                            {visibleAds.map((ad) => {
                                const compositeKey = getCompositeKey(ad);
                                return (
                                    <div key={compositeKey} className="p-4 border-b last:border-b-0 space-y-3 bg-white dark:bg-black">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    onClick={() => {
                                                        if (ad.isFeatured) {
                                                            toast.error("Oops! This post is already featured!");
                                                        } else if (ad.calculatedStatus === "End") {
                                                            toast.error("This post has already ended and cannot be featured!");
                                                        }
                                                    }}
                                                    className={ad.isFeatured || ad.calculatedStatus === "End" ? "cursor-not-allowed mt-1" : "mt-1"}
                                                >
                                                    <Checkbox
                                                        checked={selectedAds.includes(compositeKey)}
                                                        onCheckedChange={(checked) => handleSelectAd(ad, checked as boolean)}
                                                        disabled={ad.isFeatured || ad.calculatedStatus === "End"}
                                                        className={ad.isFeatured || ad.calculatedStatus === "End" ? "opacity-50 pointer-events-none" : ""}
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {ad.name}
                                                        {ad.isFeatured && <Crown className="ml-2 w-4 h-4 text-yellow-500 inline-block" />}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{parseDurationStringForDisplay(ad.duration)}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-[6px] h-[6px] rounded-full ${getStatusDot(ad.calculatedStatus)}`} />
                                                    <span className={`text-xs font-medium ${getStatusColor(ad.calculatedStatus)}`}>
                                                        {ad.calculatedStatus === "End" ? "Ended" : ad.calculatedStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm pl-7">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase mb-0.5">Category</span>
                                                <span className="text-gray-700 dark:text-white">{ad.category}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase mb-0.5">Sub-Category</span>
                                                <span className="text-gray-700 dark:text-white">{ad.subCategory}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-start gap-4 pt-2 pl-7">
                                            {(ad as Ad).calculatedStatus === "Upcoming" ? (
                                                <Link className="action-cont" href={`/seller/update-ads/${ad.category.replace(/\s/, "").toLocaleLowerCase()}/${ad.id}`}>
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    <p>Edit</p>
                                                </Link>
                                            ) : (
                                                <Link className="text-blue-600 hover:text-blue-800 underline action-cont" href={`/seller/update-ads/${ad.category.replace(/\s/g, "").toLowerCase()}/${ad.id}`}>
                                                    <EyeIcon className="w-4 h-4 mr-1" />
                                                    <p>View</p>
                                                </Link>
                                            )}
                                            <div
                                                className="cursor-pointer text-red-600 hover:text-red-800 action-cont"
                                                onClick={() => handleDelete(ad.id, ad.type || "")}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                <p>Delete</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {hasMoreAds && (
                    <div className="flex justify-center my-4">
                        <Button variant="outline" onClick={loadMore} className="px-8 bg-transparent">
                            Load More
                        </Button>
                    </div>
                )}

                {loadingData ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader />
                    </div>
                ) : filteredAds.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No advertisements found matching your criteria.</div>
                ) : null}

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md text-center">
                        <DialogHeader>
                            <DialogTitle className="sr-only">Feature Post</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4">
                            <Image src={featurepost || "/placeholder.svg"} alt="Feature Gift" width={80} height={80} />

                            <p className="text-gray-700 text-sm sm:text-base">
                                Stand out from the crowd! Featuring your post will place it at the top and increase visibility to
                                potential buyers. Complete the <span className="font-semibold">$5 payment</span> to activate.
                            </p>

                            <Button
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold text-base py-6 rounded-md"
                                onClick={handleProceed}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Proceed to Payment"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div >
        </>
    )
}
export default Listing