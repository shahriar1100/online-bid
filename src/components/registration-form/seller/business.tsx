"use client"

import Image from "next/image"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Upload, Plus, Trash, CalendarIcon, EyeOff, Eye, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Label } from "src/components/ui/label"
import { Button } from "src/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "src/components/ui/dialog"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
// import { formatDateDDMMYYYY } from "src/components/ui/custom-calendar"
import {
    parseStorageDuration,
    formatForDisplay,
    formatDurationForStorage,
} from "src/lib/date-utils"
import { useRouter, usePathname } from "next/navigation"
import { categorySubcategories } from "src/app/data"
// Legacy: using country-state-city package instead
// import locationData from "src/app/data/locations.json"
import { Country, State as CSCState, City as CSCCity } from "country-state-city"
import type { IState, ICity } from "country-state-city"
import locationData from "src/app/data/locations.json"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover"
import { Calendar } from "src/components/ui/calendar"
import { format } from "date-fns"
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'sonner'
import DateRangePicker from "src/components/ui/custom-calendar"

interface BusinessAd {
    id?: string;
    name?: string;
    category?: string;
    subCategory?: string;
    auctionType?: string;
    duration?: string;
    description?: string;
    media?: { name: string; size: number; type: string; url: string }[];
    builtInYear?: string;
    businessAddress?: string;
    businessCountry?: string;
    businessState?: string;
    businessCity?: string;
    businessPincode?: string;
    highlight?: string;
    reason?: string;
    price?: string;
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
    facilitySize?: string;
}

interface RegistrationFormProps {
    onClose: () => void
    preselectedCategory?: string,
    data?: BusinessAd | undefined
    currentStep?: number
    setCurrentStep?: React.Dispatch<React.SetStateAction<number>>
}

// Legacy City/State interfaces kept for hybrid pincode lookup from locations.json
// interface LegacyCity {
//     name: string
//     pincode: string
// }

// interface LegacyState {
//     name: string
//     code: string
//     cities: LegacyCity[]
// }

interface SignupResponse {
    success: boolean;
    userId?: number;
    email?: string;
    error?: string;
    name?: string;
    verifyUrl?: string;
    userType?: "buyer" | "seller";
}

// Validation
const step1Schema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Business type is required"),
    auctionType: z.string().min(1, "Auction sale type is required"),
    duration: z.string().refine(
        (val) => {
            // First check if empty
            if (!val || val.trim() === "") {
                return false;
            }

            // Check if it contains " to "
            if (!val.includes(" to ")) {
                return false;
            }
            const parts = val.split(" to ");
            // Must have exactly 2 parts
            if (parts.length !== 2) {
                return false;
            }

            const [startPart, endPart] = parts;

            // Both parts must match date/time format MM/DD/YYYY HH:MM (U.S. format)
            const dateTimePattern = /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/;

            return dateTimePattern.test(startPart.trim()) &&
                dateTimePattern.test(endPart.trim());
        },
        { message: "Please select both start and end date/time" }
    ),
    description: z
        .string()
        .min(10, "Description is min 10 characters")
        .refine((val) => val.trim().split(/\s+/).length <= 1000, {
            message: "Description must not exceed 1000 characters",
        }),
    media: z.array(z.any()).min(1, "At least one media file is required").max(10, "You can upload a maximum of 10 files"),
})

const step2Schema = z.object({
    builtInYear: z
        .string()
        .min(1, "Built-in year is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    businessAddress: z.string().min(1, "Address is required."),
    businessCountry: z.string().min(1, "Country is required."),
    businessState: z.string().min(1, "State is required."),
    businessCity: z.string().min(1, "City is required."),
    businessPincode: z.string().optional(),
})

const step3Schema = z.object({
    highlight: z
        .string()
        .min(10, "Key highlight is min 10 characters")
        .refine((val) => val.trim().split(/\s+/).length <= 1000, {
            message: "Description must not exceed 1000 characters",
        }),
    reason: z
        .string()
        .min(10, "Reason is min 10 characters")
        .refine((val) => val.trim().split(/\s+/).length <= 1000, {
            message: "Description must not exceed 1000 characters",
        }),
})
const step4Schema = z.object({
    price: z
        .string()
        .min(1, "Price is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    revenue: z
        .string()
        .min(1, "Annual revenue is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    profit: z
        .string()
        .min(1, "Annual profit/EBITDA is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    assets: z
        .string()
        .min(10, "Assets is min 10 characters")
        .refine((val) => val.trim().split(/\s+/).length <= 1000, {
            message: "Description must not exceed 1000 characters",
        }),
    inventory: z.string().min(1, "Please select inventory include"),
    inventoryValue: z.string().min(1, "Please enter inventory value"),
})
const step5Schema = z.object({
    employes: z
        .string()
        .min(1, "Number of employees are required")
        .regex(/^\d+$/, "Only numbers are allowed"),
    involvement: z.string().min(1, "Please select ownership involvement"),
    relocatable: z.string().min(1, "Please select business relocatable"),
    homebase: z.string().min(1, "Please select home-based"),
    franchise: z.string().min(1, "Please select Franchise"),
    namefranchise: z.string().min(1, "Please select Franchise name")
}).refine(
    (data) => data.franchise !== "Yes" || (data.namefranchise && data.namefranchise.trim().length > 0),
    {
        message: "Franchise name is required when Franchise is Yes",
        path: ["namefranchise"],
    }
);

const step6Schema = z.object({
    premises: z.string().min(1, "Please select business premises"),
    monthly: z.string().min(1, "Please select month"),
    expiry: z.string().optional(),
    facilitysize: z.string().min(1, "Please enter facility size"),
})
const step7Schema = z.object({
    registrationType: z.enum(["already", "new"]),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string()
        .regex(/^[A-Za-z\s]+$/, "Name is required").min(1, "Please enter your name"),
    type: z.literal("seller"),
})

// Combined schema
const fullSchema = step1Schema
    .merge(step2Schema)
    .merge(step3Schema)
    .merge(step4Schema)
    .merge(step5Schema)
    .merge(step6Schema)
    .merge(step7Schema)
    .superRefine((data, ctx) => {
        if (data.registrationType === "new" && (!data.name || data.name.trim() === "")) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter your name",
                path: ["name"],
            })
        }
    })
type FormData = z.infer<typeof fullSchema>

export default function BusinessRegistrationForm({ onClose, preselectedCategory, data, currentStep: externalCurrentStep, setCurrentStep: externalSetCurrentStep }: RegistrationFormProps) {
    // const [currentStep, setCurrentStep] = useState(1)
    const [internalCurrentStep, setInternalCurrentStep] = useState(1)
    const currentStep = externalCurrentStep ?? internalCurrentStep
    const setCurrentStep = externalSetCurrentStep ?? setInternalCurrentStep
    const [isUserRegistered, setIsUserRegistered] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || "Real State")
    const [, setSelectedSubcategory] = useState("")
    console.log("data", data)

    //for bydefault time and date select
    // const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    // const [selectedTime, setSelectedTime] = useState<string>(
    //     new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    // )
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [startTime, setStartTime] = useState<string>("12:00")
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [endTime, setEndTime] = useState<string>("12:00")
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [deletedFiles, setDeletedFiles] = useState<{ name: string; size: number; type: string, url: string }[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showVerificationModal, setShowVerificationModal] = useState(false)
    const router = useRouter()
    const pathname = usePathname();
    const isSallerCreatePage = pathname.startsWith("/seller/create-ads") // 🔥 check seller pages
    const isSellerUpdatePage = pathname.startsWith("/seller/update-ads") // 🔥 check seller pages
    const [registrationType, setRegistrationType] = useState<"already" | "new">("already")
    const [availableStates, setAvailableStates] = useState<IState[]>([])
    const [availableCities, setAvailableCities] = useState<ICity[]>([])
    // Track country/state ISO codes for country-state-city package lookups
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")
    const [, setSelectedStateCode] = useState<string>("")
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false);
    const [adDetails, setAdDetails] = useState<BusinessAd | null>(null);

    useEffect(() => {
        const activeStepEl = stepRefs.current[currentStep - 1]
        if (activeStepEl) {
            activeStepEl.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            })
        }
    }, [currentStep])

    const {
        control,
        formState: { errors },
        setValue,
        clearErrors,
        trigger,
        watch,
        getValues,
    } = useForm<FormData>({
        resolver: zodResolver(fullSchema),
        defaultValues: {
            title: data?.name || "",
            category: preselectedCategory || data?.category || "",
            subcategory: data?.subCategory || "",
            auctionType: data?.auctionType || "",
            duration: data?.duration || "",
            media: data?.media || [],
            description: data?.description || "",
            builtInYear: data?.builtInYear || "",
            businessAddress: data?.businessAddress || "",
            businessCountry: data?.businessCountry || "",
            businessState: data?.businessState || "",
            businessCity: data?.businessCity || "",
            businessPincode: data?.businessPincode || "",
            highlight: data?.highlight || "",
            reason: data?.reason || "",
            price: data?.price || "",
            revenue: data?.revenue || "",
            profit: data?.profit || "",
            assets: data?.assets || "",
            inventory: data?.inventory || "",
            inventoryValue: data?.inventoryValue || "",
            employes: data?.employes || "",
            involvement: data?.involvement || "",
            relocatable: data?.relocatable || "",
            homebase: data?.homebase || "",
            franchise: data?.franchise || "",
            namefranchise: data?.namefranchise || "",
            premises: data?.premises || "",
            monthly: data?.monthly || "",
            expiry: data?.expiry || "",
            facilitysize: data?.facilitySize || "",
            registrationType: "already",
            type: "seller",
        },
    })

    // const steps = [
    //     { number: 1, title: "General Details" },
    //     { number: 2, title: "Business Details" },
    //     { number: 3, title: "Business Descriptions" },
    //     { number: 4, title: "Financial Informations" },
    //     { number: 5, title: "Operational Details" },
    //     { number: 6, title: "Facilities and Lease" },
    //     { number: 7, title: "Seller Details" },
    // ]

    const watchedCategory = watch("category")
    const inventory = watch("inventory")
    const franchise = watch("franchise")
    const monthly = watch("monthly")
    //business location
    const watchedpCountry = watch("businessCountry")
    const watchedpState = watch("businessState")
    const watchedpCity = watch("businessCity")

    const auctionType = watch("auctionType")

    useEffect(() => {
        if (watchedCategory !== selectedCategory) {
            setSelectedCategory(watchedCategory)
            if (watchedCategory !== selectedCategory) {
                setSelectedSubcategory("")
                setValue("subcategory", "")
            }
        }
    }, [watchedCategory, selectedCategory, setValue])

    useEffect(() => {
        setValue("media", uploadedFiles)
        if (uploadedFiles.length > 0) {
            clearErrors("media")
        }
    }, [uploadedFiles, setValue, clearErrors])

    useEffect(() => {
        if (startDate && startTime && endDate && endTime) {
            // Store in DB format: DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm
            const durationString = formatDurationForStorage(startDate, startTime, endDate, endTime)
            setValue("duration", durationString);
            clearErrors("duration");
        } else {
            // If either is missing, clear the field (will trigger validation error)
            setValue("duration", "");
        }
    }, [startDate, startTime, endDate, endTime, setValue, clearErrors]);
    //business location — using country-state-city package
    useEffect(() => {
        if (watchedpCountry) {
            const allCountries = Country.getAllCountries()
            const country = allCountries.find((c) => c.name === watchedpCountry)
            if (country) {
                setSelectedCountryCode(country.isoCode)
                const states = CSCState.getStatesOfCountry(country.isoCode)
                setAvailableStates(states)
                // Reset dependent fields
                setValue("businessState", "")
                setValue("businessCity", "")
                setValue("businessPincode", "")
                setAvailableCities([])
                setSelectedStateCode("")
            }
        } else {
            setAvailableStates([])
            setAvailableCities([])
            setSelectedCountryCode("")
            setSelectedStateCode("")
        }
    }, [watchedpCountry, setValue])

    useEffect(() => {
        if (watchedpState && availableStates.length > 0 && selectedCountryCode) {
            const state = availableStates.find((s) => s.name === watchedpState)
            if (state) {
                setSelectedStateCode(state.isoCode)
                const cities = CSCCity.getCitiesOfState(selectedCountryCode, state.isoCode)
                setAvailableCities(cities)
                // Reset dependent fields
                setValue("businessCity", "")
                setValue("businessPincode", "")
            }
        } else {
            setAvailableCities([])
            setSelectedStateCode("")
        }
    }, [watchedpState, availableStates, selectedCountryCode, setValue])

    // Hybrid pincode: try locations.json first, fall back to empty for manual input
    useEffect(() => {
        if (watchedpCity && watchedpCountry) {
            const legacyCountry = locationData.countries.find((c) => c.name === watchedpCountry)
            if (legacyCountry) {
                const legacyState = legacyCountry.states.find((s) => s.name === watchedpState)
                if (legacyState) {
                    const legacyCity = legacyState.cities.find((c) => c.name === watchedpCity)
                    if (legacyCity) {
                        setValue("businessPincode", legacyCity.pincode)
                        return
                    }
                }
            }
            setValue("businessPincode", "")
        }
    }, [watchedpCity, watchedpCountry, watchedpState, setValue])

    // Pre-select country from header selection on mount (only for new ads)
    useEffect(() => {
        if (!data && !watchedpCountry) {
            const storedCountry = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null
            if (storedCountry) {
                const [, countryName] = storedCountry.split("|")
                if (countryName) {
                    setValue("businessCountry", countryName)
                    clearErrors("businessCountry")
                }
            }
        }
    }, [data, watchedpCountry, setValue, clearErrors])

    const handleCategoryChange = (value: string) => {
        if (!preselectedCategory) {
            setValue("category", value)
            setValue("subcategory", "")
            setSelectedCategory(value)
            setSelectedSubcategory("")
            clearErrors("category")
        }
    }

    const handleSubcategoryChange = (value: string) => {
        setValue("subcategory", value)
        setSelectedSubcategory(value)
        clearErrors("subcategory")
    }

    // const handleDateTimeSelect = (date: Date | null, time: string) => {
    //     setSelectedDate(date)
    //     setSelectedTime(time)
    //     setIsCalendarOpen(false)
    // }
    const handleDateTimeSelect = (
        newStartDate: Date | null,
        newStartTime: string,
        newEndDate: Date | null,
        newEndTime: string,
    ) => {
        setStartDate(newStartDate)
        setStartTime(newStartTime)
        setEndDate(newEndDate)
        setEndTime(newEndTime)
        setIsCalendarOpen(false)
    }
    const handleCalendarClose = () => {
        setIsCalendarOpen(false)
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        const newFiles = [...uploadedFiles, ...files]
        setUploadedFiles(newFiles)
    }

    const handleDeleteFile = (index: number) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index)
        setUploadedFiles(newFiles)
    }

    const handleDeleteFileFromDb = (media: { name: string; size: number; type: string, url: string }, index: number) => {
        const m = [];
        m.push(media);
        const files = [...deletedFiles, ...m];
        setDeletedFiles(files);
        console.log("files : ", files);
        if (adDetails && adDetails.media) {
            const DbMedia = adDetails.media.filter((_, i) => i !== index);
            adDetails.media = DbMedia;
            console.log("adDetails.media : ", adDetails.media);
        }
    }

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            const userData = JSON.parse(storedUser)
            setIsUserRegistered(userData.is_verified === 1)
        }
    }, [])

    // jsDateConverter removed — use parseStorageDuration from date-utils


    useEffect(() => {
        if (data) {
            setAdDetails(data);
        }

        if (data && data.subCategory) {
            setSelectedSubcategory(data.subCategory)
            setValue("subcategory", data.subCategory)
        }

        if (data && data.duration) {
            // Parse stored "DD/MM/YYYY HH:mm to DD/MM/YYYY HH:mm" back into picker state
            const parsed = parseStorageDuration(data.duration)
            setStartDate(parsed.startDate)
            setStartTime(parsed.startTime)
            setEndDate(parsed.endDate)
            setEndTime(parsed.endTime)
        }

        if (data && data.businessCountry) {
            const allCountries = Country.getAllCountries()
            const matchedCountry = allCountries.find((c) => c.name === data.businessCountry)
            if (matchedCountry) {
                setValue("businessCountry", matchedCountry.name)
                setSelectedCountryCode(matchedCountry.isoCode)
                const states = CSCState.getStatesOfCountry(matchedCountry.isoCode)
                setAvailableStates(states)
                setTimeout(() => {
                    const matchedState = states.find((s) => s.name === data.businessState)
                    if (matchedState) {
                        setValue("businessState", matchedState.name)
                        setSelectedStateCode(matchedState.isoCode)
                        const cities = CSCCity.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode)
                        setAvailableCities(cities)
                        setTimeout(() => {
                            const matchedCity = cities.find((c) => c.name === data.businessCity)
                            if (matchedCity) {
                                setValue("businessCity", matchedCity.name)
                                const legacyCountry = locationData.countries.find((lc) => lc.name === data.businessCountry)
                                const legacyState = legacyCountry?.states.find((ls) => ls.name === data.businessState)
                                const legacyCity = legacyState?.cities.find((lc) => lc.name === data.businessCity)
                                setValue("businessPincode", legacyCity?.pincode || data.businessPincode || "")
                            }
                        }, 100);
                    }
                }, 100);
            }
        }
    }, [data, setValue]);

    const handleNext = async () => {
        let isValid = false

        if (currentStep === 1) {
            if (adDetails?.media && adDetails.media.length > 0) {
                isValid = await trigger(["title", "category", "subcategory", "auctionType", "duration", "description"])
            } else {
                isValid = await trigger(["title", "category", "subcategory", "auctionType", "duration", "description", "media"])
            }
        } else if (currentStep === 2) {
            isValid = await trigger([
                "builtInYear",
                "businessAddress",
                "businessCountry",
                "businessCity",
                "businessState",
                "businessPincode",
            ])
        } else if (currentStep === 3) {
            isValid = await trigger(["highlight", "reason"])
        } else if (currentStep === 4) {
            isValid = await trigger(["price", "revenue", "profit", "assets", "inventory"])
            if (getValues("inventory") === "Yes") {
                isValid = isValid && (await trigger(["inventoryValue"]))
            }
        } else if (currentStep === 5) {
            isValid = await trigger(["employes", "involvement", "relocatable", "homebase", "franchise"])
            if (getValues("franchise") === "Yes") {
                isValid = isValid && (await trigger(["namefranchise"]))
            }
        } else if (currentStep === 6) {
            isValid = await trigger(["premises", "facilitysize"])
            if (getValues("auctionType") === "lease") {
                isValid = isValid && (await trigger(["monthly"]))
            }

            // If user is already registered, submit and go to listing
            if (isValid && isUserRegistered) {
                const formData = getValues()
                await onSubmit(formData)
                //router.push("/seller/listing")
                return
            }
        } else if (currentStep === 7) {
            // For unregistered users
            isValid = await trigger(["registrationType"])
            if (registrationType === "already") {
                isValid = isValid && (await trigger(["email", "password"]))
            } else {
                isValid = isValid && (await trigger(["name", "email", "password", "type"]))
            }


            if (isValid) {
                const formData = getValues()
                // await onSubmit(formData)

                const result = await onSubmit(formData)

                // If verification modal is not shown, redirect
                if (!result?.showingModal) {
                    //router.push("/seller/listing")
                }
                return
            }
        }

        // Auto-scroll to first validation error (kept your existing logic)
        if (!isValid) {
            setTimeout(() => {
                let firstError: HTMLElement | null = null;
                if (errors.media) {
                    firstError =
                        (document.querySelector("[data-media-upload]") as HTMLElement) ||
                        (document.querySelector('input[type="file"]')?.closest("div") as HTMLElement) ||
                        (document.querySelector(".media-upload") as HTMLElement) ||
                        (Array.from(document.querySelectorAll("p"))
                            .find((p) => p.textContent?.includes("At least one media file is required"))
                            ?.closest("div") as HTMLElement) ||
                        (Array.from(document.querySelectorAll("label"))
                            .find((label) => label.textContent?.includes("Upload media"))
                            ?.parentElement as HTMLElement);

                    if (firstError) {
                        firstError.scrollIntoView({ behavior: "smooth", block: "center" })
                        const fileInput = firstError.querySelector('input[type="file"]') as HTMLInputElement
                        const uploadArea = firstError.querySelector('[role="button"], .cursor-pointer') as HTMLElement
                        if (fileInput) setTimeout(() => fileInput.focus(), 300)
                        else if (uploadArea) setTimeout(() => uploadArea.focus(), 300)
                    }
                } else {
                    firstError =
                        (document.querySelector(".text-red-500, .border-red-500, [aria-invalid='true']") as HTMLElement) || null

                    if (firstError) {
                        firstError.scrollIntoView({ behavior: "smooth", block: "center" })
                        const inputEl = firstError.querySelector("input, textarea, select") as HTMLElement
                        if (inputEl) setTimeout(() => inputEl.focus(), 300)
                    }
                }
            }, 100)
            return
        }

        // Move to next step if valid
        const maxStep = isUserRegistered ? 6 : 7
        if (isValid && currentStep < maxStep) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const steps = isUserRegistered
        ? [
            { number: 1, title: "General Details" },
            { number: 2, title: "Business Details" },
            { number: 3, title: "Business Descriptions" },
            { number: 4, title: "Financial Informations" },
            { number: 5, title: "Operational Details" },
            { number: 6, title: "Facilities and Lease" },
        ]
        : [
            { number: 1, title: "General Details" },
            { number: 2, title: "Business Details" },
            { number: 3, title: "Business Descriptions" },
            { number: 4, title: "Financial Informations" },
            { number: 5, title: "Operational Details" },
            { number: 6, title: "Facilities and Lease" },
            { number: 7, title: "Seller Details" },
        ]

    const handleRegistrationTypeChange = (value: "already" | "new") => {
        setRegistrationType(value)
        setValue("registrationType", value)

        // Clear opposite fields when switching
        if (value === "already") {
            setValue("name", "")
            clearErrors(["name"])
        } else {
            clearErrors(["email", "password"])
        }
    }

    const onSubmit = async (data: FormData): Promise<{ success: boolean; showingModal?: boolean } | void> => {
        setIsLoading(true);
        try {
            let userId: number | undefined;

            // Handle new user registration
            if (data.registrationType === "new") {
                const signupResponse = await fetch('/api/auth/signup', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        password: data.password,
                        registrationType: "Seller"
                    })
                });

                const signupResult: SignupResponse = await signupResponse.json();

                if (!signupResult.success) {
                    toast.error(signupResult.error || "Failed to create account");
                    setIsLoading(false);
                    return { success: false };  // Return status
                }

                userId = signupResult.userId;

                /* localStorage.setItem("user", JSON.stringify({
                    id: signupResult.userId,
                    email: signupResult.email,
                    name: data.name,
                    userType: "seller",
                    is_verified: 0
                })); */

                setShowVerificationModal(true);
                setIsLoading(false);
                //return { success: true, showingModal: true };

                console.log("New user created with ID:", userId);
            } else {
                const storedUser = localStorage.getItem("user");
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                const isVerified = parsedUser?.is_verified === 1;
                userId = parsedUser?.id;

                if (!userId) {
                    toast.error("Please login to continue.");
                    return;
                }


                if (!isVerified) {
                    toast.error("Please verify your email before creating a listing.");
                    setShowVerificationModal(true);
                    setIsLoading(false);
                    return; // Don't create listing until verified
                }
            }

            /* ------------------ UPLOAD MEDIA ------------------ */
            const media: { name: string; size: number; type: string; url?: string }[] = [];
            /* file to be deleted */
            if (deletedFiles.length > 0) {
                for (const f of deletedFiles) {
                    console.log("Deleting file:", f);
                    const formData = new FormData();
                    formData.append("file", f.url.replace(`https://pub-925e11758c384112b352fa4ab58ba020.r2.dev/`, ""));
                    let headerPayload: Record<string, string> = {
                        //"Content-Type": "multipart/form-data, application/x-www-form-urlencoded",
                    };

                    if (isSellerUpdatePage || isSallerCreatePage) {
                        headerPayload = {
                            ...headerPayload,
                            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`
                        };
                    }

                    await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/uploads`, {
                        method: "DELETE",
                        headers: headerPayload,
                        body: formData,
                    });
                }
            }

            if (uploadedFiles.length > 0) {
                let upload: { url: string } | null = null;
                /* const res = await fetch(`/api/upload?fileName=${image.name}&fileType=${image.type}`);
                const { url, public_url } = await res.json() as { url: string, public_url: string };
                public_url_of_uploaded_img = public_url;
                const buffer = Buffer.from(await image.arrayBuffer());
                const uploadRes = await fetch(url, {
                    method: "PUT",
                    headers: {
                        "Content-Type": image.type, // e.g. "image/jpeg" or "image/png"
                    },
                    body: image,
                }); */

                for (const f of uploadedFiles) {
                    console.log("Uploading file:", f.name);
                    const formData = new FormData();
                    formData.append("file", f);

                    let headerPayload: Record<string, string> = {
                        //"Content-Type": "multipart/form-data, application/x-www-form-urlencoded",
                    };

                    if (isSellerUpdatePage || isSallerCreatePage) {
                        headerPayload = {
                            ...headerPayload,
                            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`
                        };
                    }

                    const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/uploads`, {
                        method: "PUT",
                        headers: headerPayload,
                        body: formData,
                    });

                    upload = await res.json() as { url: string };
                    if (upload && upload.url) {
                        media.push({
                            name: f.name,
                            size: f.size,
                            type: f.type,
                            url: upload.url,
                        });
                        console.log(`Uploaded ${f.name} to ${upload.url}`);
                    } else {
                        console.error(`Failed to upload file: ${f.name}`);
                    }
                }

            }

            media.push(...(adDetails?.media || []).filter(m => !uploadedFiles.find(f => f.name === m.name)));

            const payload = {
                userId: Number(userId),

                // General Details
                title: data.title || adDetails?.name || "",
                category: data.category || adDetails?.category || "",
                subcategory: data.subcategory || adDetails?.subCategory || "",
                auctionType: data.auctionType || adDetails?.auctionType || "",
                duration: data.duration || adDetails?.duration || "",
                description: data.description || adDetails?.description || "",
                media: media.length > 0 ? media : adDetails?.media || [],

                // Business Details
                builtInYear: data.builtInYear || adDetails?.builtInYear || "",
                businessAddress: data.businessAddress || adDetails?.businessAddress || "",
                businessCountry: data.businessCountry || adDetails?.businessCountry || "",
                businessState: data.businessState || adDetails?.businessState || "",
                businessCity: data.businessCity || adDetails?.businessCity || "",
                businessPincode: data.businessPincode || adDetails?.businessPincode || "",

                // Business Descriptions
                highlight: data.highlight || adDetails?.highlight || "",
                reason: data.reason || adDetails?.reason || "",

                // Financial Information
                price: data.price || adDetails?.price || "",
                revenue: data.revenue || adDetails?.revenue || "",
                profit: data.profit || adDetails?.profit || "",
                assets: data.assets || adDetails?.assets || "",
                inventory: data.inventory || adDetails?.inventory || "",
                inventoryValue: data.inventoryValue || adDetails?.inventoryValue || "",

                // Operational Details
                employes: data.employes || adDetails?.employes || "",
                involvement: data.involvement || adDetails?.involvement || "",
                relocatable: data.relocatable || adDetails?.relocatable || "",
                homebase: data.homebase || adDetails?.homebase || "",
                franchise: data.franchise || adDetails?.franchise || "",
                namefranchise: data.namefranchise || adDetails?.namefranchise || "",

                // Facilities and Lease
                premises: data.premises || adDetails?.premises || "",
                monthly: data.monthly || adDetails?.monthly || "",
                expiry: data.expiry || adDetails?.expiry || "",
                facilitysize: data.facilitysize || adDetails?.facilitySize || "",
            };

            // Send directly to your Cloudflare Worker (bypass Next.js route)
            let headerPayload: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (isSellerUpdatePage || isSallerCreatePage) {
                headerPayload = {
                    ...headerPayload,
                    Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`
                };
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business${isSellerUpdatePage ? "/" + adDetails?.id : ""}`, {
                method: `${isSellerUpdatePage ? "PUT" : "POST"}`,
                headers: headerPayload,
                body: JSON.stringify(payload),
            });

            // Read raw response text
            const responseText = await res.text();
            console.log("Raw API response:", responseText);

            let result;
            try {
                result = JSON.parse(responseText);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                console.error("Failed to parse response:", responseText);
                throw new Error("Invalid response format");
            }

            if (result.success) {
                onClose();
                if (isSallerCreatePage) {
                    toast.success("Business listing created successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else if (isSellerUpdatePage) {
                    toast.success("Business listing updated successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else {
                    toast.success("Business listing submitted successfully!");
                }
                //router.push("/seller/listing");
            } else {
                toast.error(result.error || "Failed to save listing");
            }
        } catch (err) {
            console.error("Submit error:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
        } finally {
            setIsLoading(false);
        }
    };

    const [open, setOpen] = useState(false)

    // function closePopup(arg0: boolean) {
    //     throw new Error("Function not implemented.")
    // }

    return (
        <div className="registration-form-seller">
            {/* Header */}
            <div className="flex-shrink-0 py-4 lg:p-8 relative w-full">
                {/* <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button> */}
                {/* Step */}
                <div className="step-counter">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="flex items-center"
                            ref={(el) => { stepRefs.current[index] = el; }}
                        >
                            <div className="number-container">
                                <div
                                    className={`step-number ${step.number === currentStep
                                        ? " bg-blue-500 text-white"
                                        : step.number < currentStep
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 text-[#4B5563]"
                                        }`}
                                >
                                    {step.number}
                                    <span className="step-title">
                                        {step.title}
                                    </span>
                                </div>
                            </div>

                            {index < steps.length - 1 && (
                                <div className="step-line">
                                    <div className="default" />
                                    <div
                                        className={`step-full ${currentStep > step.number
                                            ? "w-full"
                                            : currentStep === step.number
                                                ? "w-full"
                                                : "w-0"
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-8 mb-5 custom-scrollbar customPadding">
                {/* General Details */}
                {currentStep === 1 && (
                    <div className="space-y-0">
                        <div className="register-popup-subcontainer2 mb-6">
                            <div className="cont">
                                <Label className="custom-label">
                                    Title<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder="Enter your advertisement title"
                                            className={`custom-input ${errors.title ? "border-red-500" : "border-gray-300"
                                                }`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.title) clearErrors("title")
                                            }}
                                        />
                                    )}
                                />
                                {errors.title && <p className="error-text">{errors.title.message}</p>}
                            </div>

                            <div className="cont">
                                <Label className="custom-label">
                                    Category<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={handleCategoryChange} disabled={!!preselectedCategory}>
                                            <SelectTrigger
                                                className={`custom-input ${errors.category ? "border-red-500" : "border-gray-300"
                                                    } ${preselectedCategory ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                            >
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Real Estate">Real Estate</SelectItem>
                                                <SelectItem value="Automobiles">Automobiles</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.category && <p className="error-text">{errors.category.message}</p>}
                            </div>

                            <div className="cont">
                                <Label className="custom-label">
                                    Business type/industry<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="subcategory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={handleSubcategoryChange} disabled={!selectedCategory}>
                                            <SelectTrigger
                                                className={`custom-input ${errors.subcategory ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            >
                                                <SelectValue placeholder="Select business type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedCategory &&
                                                    categorySubcategories[selectedCategory as keyof typeof categorySubcategories]?.map((sub) => (
                                                        <SelectItem key={sub} value={sub}>
                                                            {sub}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.subcategory && <p className="error-text">{errors.subcategory.message}</p>}
                            </div>

                            <div>
                                <Label className="custom-label">
                                    Auction type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="auctionType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.auctionType) clearErrors("auctionType")
                                            }}
                                        >
                                            <SelectTrigger
                                                className={`custom-input ${errors.auctionType ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            >
                                                <SelectValue placeholder="Select Sale Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sale">Sale</SelectItem>
                                                <SelectItem value="lease">Lease</SelectItem>
                                                <SelectItem value="rent">Rent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.auctionType && <p className="error-text">{errors.auctionType.message}</p>}
                            </div>

                            {/* <div>
                                <Label className="custom-label">
                                    Duration<span className="text-red-500">*</span>
                                </Label>
                                <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`custom-input input-calender ${errors.duration ? "border-red-500" : ""
                                                }`}
                                            onClick={() => setIsCalendarOpen(true)}
                                        >
                                            {selectedDate
                                                ? `${formatDateDDMMYYYY(selectedDate)} ${selectedTime}`
                                                : "Add time/days"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="custom-dialog-content">
                                        <VisuallyHidden>
                                            <DialogTitle>Date and time picker</DialogTitle>
                                        </VisuallyHidden>
                                        <DateTimePicker
                                            selectedDate={selectedDate}
                                            selectedTime={selectedTime}
                                            onSelect={handleDateTimeSelect}
                                            onClose={handleCalendarClose}
                                        />
                                    </DialogContent>
                                </Dialog>
                                {errors.duration && <p className="error-text">{errors.duration.message}</p>}
                            </div> */}
                            <div className="cont">
                                <Label className="custom-label">
                                    Duration<span className="text-red-500">*</span>
                                </Label>
                                <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`custom-input input-calender ${errors.duration ? "border-red-500" : ""}`}
                                            onClick={() => setIsCalendarOpen(true)}
                                        >
                                            {startDate && endDate
                                                ? formatForDisplay(startDate, startTime) + " to " + formatForDisplay(endDate, endTime)
                                                : startDate && !endDate
                                                    ? formatForDisplay(startDate, startTime) + " - Select End Date"
                                                    : "Start - End"
                                            }
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="custom-dialog-content">
                                        <VisuallyHidden>
                                            <DialogTitle>Date and time picker</DialogTitle>
                                        </VisuallyHidden>
                                        <DateRangePicker
                                            startDate={startDate}
                                            startTime={startTime}
                                            endDate={endDate}
                                            endTime={endTime}
                                            onSelect={handleDateTimeSelect}
                                            onClose={handleCalendarClose}
                                        />
                                    </DialogContent>
                                </Dialog>
                                {errors.duration && <p className="error-text">{errors.duration.message}</p>}
                            </div>
                        </div>

                        <div className="mt-6">
                            <Label className="custom-label mt-4">
                                Description<span className="text-red-500">*</span> (Max. 1000 characters)
                            </Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Write a detailed description of your business…."
                                        rows={8}
                                        className={`custom-input input-textarea  ${errors.description ? "border-red-500" : "border-gray-300"
                                            }`}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            if (errors.description) clearErrors("description")
                                        }}
                                    />
                                )}
                            />
                            {errors.description && <p className="error-text">{errors.description.message}</p>}
                        </div>

                        <div className="mt-6" data-media-upload>
                            <Label className="custom-label mt-4">
                                Upload media<span className="text-red-500">*</span>
                            </Label>
                            {adDetails?.media && adDetails.media.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Existing media:</p>
                                    <div className="file-container">
                                        {adDetails.media.map((file, index) => (
                                            <div key={index} className="file-item group">
                                                {file.type.startsWith("image/") ? (
                                                    <Image
                                                        src={file.url || "/placeholder.svg"}
                                                        alt={`Media ${index + 1}`}
                                                        width={96}
                                                        height={96}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <video
                                                        src={file.url}
                                                        className="w-full h-full object-cover"
                                                        controls={false}
                                                        muted
                                                        loop
                                                    />
                                                )}
                                                <div className="absolute inset-0 flex items-start justify-end p-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <div
                                                        onClick={() => handleDeleteFileFromDb(file, index)}
                                                        className="delete-icon-container"
                                                    >
                                                        <Trash className="delete-icon" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                {uploadedFiles.length === 0 ? (
                                    <div
                                        onClick={handleUploadClick}
                                        className={`upload-container ${errors.media ? "border-red-500" : "border-gray-300"
                                            }`}
                                    >
                                        <Upload className="upload-icon" />
                                        <p className="upload-text"
                                        >
                                            Click here to upload or drop media here
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            multiple
                                            accept="image/*,video/*"
                                        />
                                    </div>
                                ) : (
                                    <div className="file-container">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="file-item group">
                                                {file.type.startsWith("image/") ? (
                                                    <Image
                                                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                                                        alt={`Uploaded media ${index + 1}`}
                                                        width={100}
                                                        height={100}
                                                        className="w-full h-full object-cover object-center"
                                                    />
                                                ) : (
                                                    <video
                                                        src={URL.createObjectURL(file)}
                                                        className="w-full h-full object-cover object-center"
                                                        controls={false}
                                                        muted
                                                        loop
                                                    />
                                                )}
                                                <div className="absolute inset-0 flex items-start justify-end p-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <div
                                                        onClick={() => handleDeleteFile(index)}
                                                        className="delete-icon-container"
                                                    >
                                                        <Trash className="delete-icon" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show "+" upload card only if less than 10 files */}
                                        {uploadedFiles.length < 10 && (
                                            <div
                                                className="upload-files"
                                                onClick={handleUploadClick}
                                            >
                                                <Plus className="plus-icon" />
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            multiple
                                            accept="image/*,video/*"
                                        />
                                    </div>
                                )}
                                {errors.media && <p className="error-text">{errors.media.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {/* Business Details */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-sm mb-2 block">
                                Year established<span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="builtInYear"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="YYYY"
                                        type="text"
                                        {...field}
                                        maxLength={4}
                                        className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                                        onChange={(e) => {
                                            const numericValue = e.target.value.replace(/\D/g, "");
                                            field.onChange(numericValue);
                                            if (errors.builtInYear) clearErrors("builtInYear");
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                !/[0-9]/.test(e.key) &&
                                                e.key !== "Backspace" &&
                                                e.key !== "ArrowLeft" &&
                                                e.key !== "ArrowRight" &&
                                                e.key !== "Tab"
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                )}
                            />
                            {errors.builtInYear && (
                                <p className="error-text">{errors.builtInYear.message}</p>
                            )}
                        </div>

                        <div>
                            <Label className="custom-label">
                                Address<span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="businessAddress"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        rows={3}
                                        placeholder="Enter complete address"
                                        {...field}
                                        className={`custom-input input-textarea ${errors.businessAddress ? "border-red-500" : ""}`}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            if (errors.businessAddress) clearErrors("businessAddress")
                                        }}
                                    />
                                )}
                            />
                            {errors.businessAddress && <p className="error-text">{errors.businessAddress.message}</p>}
                        </div>

                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    Country<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="businessCountry"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.businessCountry) clearErrors("businessCountry")
                                            }}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.businessCountry ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Country.getAllCountries().map((country) => (
                                                    <SelectItem key={country.isoCode} value={country.name}>
                                                        {country.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.businessCountry && <p className="error-text">Country is required</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    State<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="businessState"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.businessState) clearErrors("businessState")
                                            }}
                                            disabled={!watchedpCountry || availableStates.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.businessState ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableStates.map((state) => (
                                                    <SelectItem key={state.isoCode} value={state.name}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.businessState && <p className="error-text">{errors.businessState.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    City<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="businessCity"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.businessCity) clearErrors("businessCity")
                                            }}
                                            disabled={!watchedpState || availableCities.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.businessCity ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select city" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCities.map((city, index) => (
                                                    <SelectItem key={index} value={city.name}>
                                                        {city.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.businessCity && <p className="error-text">{errors.businessCity.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">Zip/postal code</Label>
                                <Controller
                                    name="businessPincode"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="" {...field}
                                            className={`custom-input ${errors.businessPincode ? "border-red-500" : ""}`} />
                                    )}
                                />
                                {errors.businessPincode && (
                                    <p className="error-text">{errors.businessPincode.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Business descriptions */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="flex justify-start items-start flex-wrap gap-4">
                            <div className="cont">
                                <Label className="custom-label mt-6">
                                    Key Highlights / Selling Points<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="highlight"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            rows={8}
                                            {...field}
                                            placeholder=""
                                            className={`custom-input input-textarea ${errors.highlight ? "border-red-500" : "border-gray-300"
                                                }`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.highlight) clearErrors("highlight")
                                            }}
                                        />
                                    )}
                                />
                                {errors.highlight && <p className="error-text">{errors.highlight.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    Reason for Selling<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="reason"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            rows={8}
                                            {...field}
                                            placeholder=""
                                            className={`custom-input input-textarea ${errors.reason ? "border-red-500" : "border-gray-300"
                                                }`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.reason) clearErrors("reason")
                                            }}
                                        />
                                    )}
                                />
                                {errors.reason && <p className="error-text">{errors.reason.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {/* Financial informations */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Asking price<span className="text-red-500">*</span>(Dollar)
                                </Label>
                                <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.price ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.price) clearErrors("price");
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    !/[0-9]/.test(e.key) &&
                                                    e.key !== "Backspace" &&
                                                    e.key !== "ArrowLeft" &&
                                                    e.key !== "ArrowRight" &&
                                                    e.key !== "Tab"
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                                {errors.price && <p className="error-text">{errors.price.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Annual revenue<span className="text-red-500">*</span>(Dollar)
                                </Label>
                                <Controller
                                    name="revenue"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.revenue ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.revenue) clearErrors("revenue");
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    !/[0-9]/.test(e.key) &&
                                                    e.key !== "Backspace" &&
                                                    e.key !== "ArrowLeft" &&
                                                    e.key !== "ArrowRight" &&
                                                    e.key !== "Tab"
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                                {errors.revenue && <p className="error-text">{errors.revenue.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Annual profit/EBITDA<span className="text-red-500">*</span>(Dollar)
                                </Label>
                                <Controller
                                    name="profit"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.profit ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.profit) clearErrors("profit");
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    !/[0-9]/.test(e.key) &&
                                                    e.key !== "Backspace" &&
                                                    e.key !== "ArrowLeft" &&
                                                    e.key !== "ArrowRight" &&
                                                    e.key !== "Tab"
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                                {errors.profit && <p className="error-text">{errors.profit.message}</p>}
                            </div>
                        </div>
                        <div>
                            <Label className="custom-label mt-6">
                                Assets included in Sale<span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="assets"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        rows={5}
                                        {...field}
                                        placeholder=""
                                        className={`w-full h-34 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.assets ? "border-red-500" : "border-gray-300"
                                            }`}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            if (errors.assets) clearErrors("assets")
                                        }}
                                    />
                                )}
                            />
                            {errors.assets && <p className="error-text">{errors.assets.message}</p>}
                        </div>
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Inventory included<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="inventory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.inventory) clearErrors("inventory")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select Inventory" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.inventory && <p className="error-text">{errors.inventory.message}</p>}
                            </div>

                            {inventory === "Yes" && (
                                <div className="cont">
                                    <Label className="custom-label">Estimated inventory value<span className="text-red-500">*</span></Label>
                                    <Controller
                                        name="inventoryValue"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder=""
                                                {...field}
                                                className={`custom-input ${errors.inventoryValue ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.inventoryValue) clearErrors("inventoryValue")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.inventoryValue && (
                                        <p className="error-text">{errors.inventoryValue.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Operational details */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Number of employees<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="employes"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter number of employees"
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.employes ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.employes) clearErrors("employes");
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    !/[0-9]/.test(e.key) &&
                                                    e.key !== "Backspace" &&
                                                    e.key !== "ArrowLeft" &&
                                                    e.key !== "ArrowRight" &&
                                                    e.key !== "Tab"
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    )}
                                />
                                {errors.employes && <p className="error-text">{errors.employes.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Owner involvement<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="involvement"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.involvement) clearErrors("involvement")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select owner involvement" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.involvement && <p className="error-text">{errors.involvement.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Is the business relocatable?<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="relocatable"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.relocatable) clearErrors("relocatable")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select business relocatable" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.relocatable && <p className="error-text">{errors.relocatable.message}</p>}
                            </div>
                        </div>

                        <div className="cont">
                            <Label className="custom-label">
                                Is the business home-based?<span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="homebase"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value || ""}
                                        onValueChange={(value: string) => {
                                            field.onChange(value)
                                            if (errors.homebase) clearErrors("homebase")
                                        }}
                                    >
                                        <SelectTrigger className="custom-input">
                                            <SelectValue placeholder="Select business home-based" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.homebase && <p className="error-text">{errors.homebase.message}</p>}
                        </div>
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Franchise<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="franchise"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.franchise) clearErrors("franchise")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select franchise" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.franchise && <p className="error-text">{errors.franchise.message}</p>}
                            </div>

                            {franchise === "Yes" && (
                                <div className="cont">
                                    <Label className="custom-label">
                                        Name of the franchise<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="namefranchise"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Enter franchise name"
                                                {...field}
                                                className={`custom-input ${errors.namefranchise ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.namefranchise) clearErrors("namefranchise")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.namefranchise && <p className="error-text">{errors.namefranchise.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Facilities and lease */}
                {currentStep === 6 && (
                    <div className="space-y-6">
                        <div className="flex justify-start items-start gap-4 flex-wrap md:flex-nowrap">
                            <div className="cont">
                                <Label className="custom-label">
                                    Business premises type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="premises"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.premises) clearErrors("premises")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select business premises" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="retal">Retail Premises</SelectItem>
                                                <SelectItem value="office">Office Premises</SelectItem>
                                                <SelectItem value="industrial">Industrial Premises</SelectItem>
                                                <SelectItem value="hospitality">Hospitality & Leisure Premises</SelectItem>
                                                <SelectItem value="mixed">Mixed-use Premises</SelectItem>
                                                <SelectItem value="specialized">Other Specialized Premises</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.premises && <p className="error-text">{errors.premises.message}</p>}
                            </div>

                            {auctionType === "lease" && (
                                <div className="cont">
                                    <Label className="custom-label">
                                        Monthly (if leased)
                                    </Label>
                                    <Controller
                                        name="monthly"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || ""}
                                                onValueChange={(value: string) => {
                                                    field.onChange(value)
                                                    if (errors.monthly) clearErrors("monthly")
                                                }}
                                            >
                                                <SelectTrigger className="custom-input">
                                                    <SelectValue placeholder="Select monthly" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Yes">Yes</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.monthly && <p className="error-text">{errors.monthly.message}</p>}
                                </div>
                            )}

                            {auctionType === "lease" && monthly === "Yes" && (
                                <div className="cont">
                                    <Label className="custom-label">
                                        Lease expiry date
                                    </Label>
                                    {/* <Controller
                                        name="expiry"
                                        control={control}
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="relative">
                                                        <Input
                                                            readOnly
                                                            placeholder="MM/DD/YYYY"
                                                            value={
                                                                field.value
                                                                    ? format(new Date(field.value), "MM/dd/yyyy")
                                                                    : ""
                                                            }
                                                            className={`pr-10 ${errors.expiry ? "border-red-500" : ""}`}
                                                        />
                                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none cursor-pointer" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date)}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    /> */}
                                    <Controller
                                        name="expiry"
                                        control={control}
                                        defaultValue={new Date().toISOString()}
                                        render={({ field }) => {
                                            return (
                                                <Popover open={open} onOpenChange={setOpen}>
                                                    <PopoverTrigger asChild>
                                                        <div className="relative">
                                                            <Input
                                                                readOnly
                                                                placeholder="MM/DD/YYYY"
                                                                value={
                                                                    field.value
                                                                        ? format(new Date(field.value), "MM/dd/yyyy")
                                                                        : format(new Date(), "MM/dd/yyyy")
                                                                }
                                                                className="custom-input input-calender"
                                                            //   className={`pr-10 ${errors.expiry ? "border-red-500" : ""}`}
                                                            />
                                                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer" />
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="z-[9999]">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : new Date()}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    field.onChange(date.toISOString())
                                                                    setOpen(false)
                                                                }
                                                            }}
                                                            disabled={(date) =>
                                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                                            }
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )
                                        }}
                                    />

                                    {/* {errors.expiry && <p className="error-text">{errors.expiry.message}</p>} */}
                                </div>
                            )}
                        </div>
                        <div className="cont">
                            <Label className="custom-label">
                                Facility size <span className="text-red-500">*</span>(Sq. Ft.)
                            </Label>
                            <Controller
                                name="facilitysize"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder=""
                                        {...field}
                                        className={`custom-input ${errors.facilitysize ? "border-red-500" : ""}`}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            if (errors.facilitysize) clearErrors("facilitysize")
                                        }}
                                    />
                                )}
                            />
                            {errors.facilitysize && <p className="error-text">{errors.facilitysize.message}</p>}
                        </div>
                    </div>
                )}
                {/* Seller Details */}
                {!isUserRegistered && currentStep === 7 && (
                    <div className="space-y-6">
                        <div className="mb-4">
                            <Label className="text-sm font-medium block mb-2">Are you already registered?</Label>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <input
                                        id="alreadyRegistered"
                                        type="radio"
                                        value="already"
                                        name="registrationType"
                                        className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                        checked={registrationType === "already"}
                                        onChange={(e) => handleRegistrationTypeChange(e.target.value as "already")}
                                    />
                                    <Label htmlFor="alreadyRegistered" className="statusYN">
                                        Yes
                                    </Label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="newRegistration"
                                        type="radio"
                                        value="new"
                                        name="registrationType"
                                        className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                        checked={registrationType === "new"}
                                        onChange={(e) => handleRegistrationTypeChange(e.target.value as "new")}
                                    />
                                    <Label htmlFor="newRegistration" className="statusYN">
                                        No
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {registrationType === "already" && (
                            <div className="register-popup-subcontainer">
                                <div className="cont">
                                    <Label className="custom-label">
                                        Email<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Enter your email address"
                                                type="email"
                                                {...field}
                                                className={`custom-input ${errors.email ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.email) clearErrors("email")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                                </div>
                                {/* <div className="cont">
                                    <Label className="custom-label">
                                        Password<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Enter your password"
                                                type="password"
                                                {...field}
                                                className={`custom-input ${errors.password ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.password) clearErrors("password")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                                </div> */}
                                <div className="cont relative">
                                    <Label className="custom-label">
                                        Password<span className="text-red-500">*</span>
                                    </Label>

                                    <div className="relative">
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder="Enter your password"
                                                    type={showPassword ? "text" : "password"}
                                                    {...field}
                                                    className={`custom-input pr-10 ${errors.password ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        if (errors.password) clearErrors("password")
                                                    }}
                                                />
                                            )}
                                        />

                                        <button
                                            type="button"
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="error-text">{errors.password.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {registrationType === "new" && (
                            <div className="space-y-4">
                                <div className="register-popup-subcontainer">
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Name<span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="name"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder="Enter your name"
                                                    {...field}
                                                    className={`custom-input ${errors.name ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        const onlyLetters = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                        field.onChange(onlyLetters)
                                                        if (errors.name) clearErrors("name")
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.name && <p className="error-text">{errors.name.message}</p>}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Email<span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder="Enter your email address"
                                                    type="email"
                                                    {...field}
                                                    className={`custom-input ${errors.email ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        if (errors.email) clearErrors("email")
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.email && <p className="error-text">{errors.email.message}</p>}
                                    </div>
                                </div>
                                <div className="register-popup-subcontainer">
                                    {/* <div className="cont">
                                        <Label className="custom-label">
                                            Password<span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="password"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder="Please Enter password"
                                                    type="password"
                                                    {...field}
                                                    className={`custom-input ${errors.password ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        if (errors.password) clearErrors("password")
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.password && <p className="error-text">{errors.password.message}</p>}
                                    </div> */}
                                    <div className="cont relative">
                                        <Label className="custom-label">
                                            Password<span className="text-red-500">*</span>
                                        </Label>

                                        <div className="relative">
                                            <Controller
                                                name="password"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        placeholder="Please Enter password"
                                                        type={showPassword ? "text" : "password"}
                                                        {...field}
                                                        className={`custom-input pr-10 ${errors.password ? "border-red-500" : ""}`}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            if (errors.password) clearErrors("password")
                                                        }}
                                                    />
                                                )}
                                            />

                                            <button
                                                type="button"
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {errors.password && (
                                            <p className="error-text">{errors.password.message}</p>
                                        )}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Type<span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ }) => (
                                                <Select value="seller" disabled>
                                                    <SelectTrigger className="custom-input">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="seller">Seller</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.type && <p className="error-text">{errors.type.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* button */}
            <div className="footer">
                <div className="flex justify-between items-center w-full">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="btn-transparent"
                    >
                        Cancel
                    </Button>

                    <div className="flex gap-3">
                        {/* Previous Button - Show on all steps except step 1 */}
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                onClick={handlePrevious}
                                variant="outline"
                                className="btn-transparent"
                                disabled={isLoading}
                            >
                                Previous
                            </Button>
                        )}

                        {isUserRegistered && currentStep === 6 ? (
                            <Button
                                type="submit"
                                onClick={handleNext}
                                className="btn-nontransparent flex items-center justify-center gap-1"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        ) : currentStep < (isUserRegistered ? 6 : 7) ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="btn-nontransparent"
                                disabled={isLoading}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                onClick={handleNext}
                                className="btn-nontransparent flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {/* Verification Modal */}
            {showVerificationModal && (
                <div className="verification-overlay">
                    <div className="verfication-modal">
                        <button
                            onClick={() => setShowVerificationModal(false)}
                            className="cross-button"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            </div>

                            <p className="msg-text">
                                <span className="block">Your verification link is on its way ✉️</span>
                                <span className="block">Tap the link in your inbox to verify</span>
                            </p>
                            <Button
                                onClick={() => {
                                    console.log("Sending verification link...")
                                    setShowVerificationModal(false)
                                    // close the "Register now" popup
                                    onClose?.()
                                    router.push("/")
                                }}
                                className="btn-nontransparent"
                            >
                                {`Let's Get Started`}                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
