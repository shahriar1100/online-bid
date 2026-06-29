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
    parseStorageSingleDateTime,
    formatForStorage,
    formatForDisplay,
    // formatDateForStorage,
    formatDurationForStorage,
} from "src/lib/date-utils"
import { useRouter, usePathname } from "next/navigation"
import { categorySubcategories, featuresOptions, utilitiesOptions } from "src/app/data"
// Legacy: using country-state-city package instead
// import locationData from "src/app/data/locations.json"
import { Country, State as CSCState, City as CSCCity } from "country-state-city"
import type { IState, ICity } from "country-state-city"
import locationData from "src/app/data/locations.json"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Checkbox } from "src/components/ui/checkbox"
import { Calendar } from "src/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover"
import { format } from "date-fns"
import { toast } from 'sonner'
import DateRangePicker from "src/components/ui/custom-calendar"
import DateTimePicker from "src/components/ui/real-custom-calender"


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
    media?: { name: string; size: number; type: string; url: string }[];
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
    ownershipType?: string;
    ownershipTitle?: string;
    ownershipStatus?: string;
    legalDescription?: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    isAgent?: string;
    licenseNumber?: string;
    authorizedToSell?: boolean;
    agreeTerms?: boolean;
}

interface RegistrationFormProps {
    onClose: () => void
    preselectedCategory?: string,
    data?: RealEstateAd | undefined
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

type SignupResponse = {
    success: boolean;
    error?: string;
    userId?: number;
    email?: string;
    name?: string;
    verifyUrl?: string;
    userType?: "buyer" | "seller";
};

// interface RealEstateResponse {
//     success: boolean;
//     error?: string;
// }

// Validation
const step1Schema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Property type is required"),
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
    propertyAddress: z.string().min(1, "Address is required."),
    propertyCountry: z.string().min(1, "Country is required."),
    propertyState: z.string().min(1, "State is required."),
    propertyCity: z.string().min(1, "City is required."),
    propertyPincode: z.string().optional(),
})

const step3Schema = z.object({
    bedroom: z
        .string()
        .min(1, "Bedroom is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    bathroom: z
        .string()
        .min(1, "Bathroom is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    area: z
        .string()
        .min(1, "Area is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    lot_size: z.string().min(1, "Lot is required."),
    builtInYear: z
        .string()
        .min(1, "Built-in year is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    furnishing: z.string().min(1, "Furnishing is required."),
    parkingSpaces: z.string().optional(),
    utilities: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
})
const step4Schema = z.object({
    auctionPrice: z
        .string()
        .min(1, "Price is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    auctionDate: z.string().min(1, "Date/Time is required"),
    expiry: z.string().min(1, "Date/Time is required"),
})
const step5Schema = z.object({
    ownershiptype: z
        .string()
        .min(1, "Type is required")
        .regex(/^[A-Za-z\s]+$/, "Only letters are allowed"),
    ownershiptitle: z
        .string()
        .min(1, "Title is required")
        .regex(/^[A-Za-z\s]+$/, "Only letters are allowed"),
    ownershipstatus: z.string().min(1, "Status is required"),
    monthly: z.string().min(1, "Monthly is required"),
    legalDescription: z.string().optional(),
})
const step6Schema = z.object({
    // contactName: z.string().min(1, "Name/Business name is required."),
    // contactPhone: z.string().min(1, "Phone number is required."),
    contactName: z.string()
        .regex(/^[A-Za-z\s]+$/, "Name is required")
        .min(1, "Name/Business name is required."),
    contactPhone: z.string()
        .regex(/^\d{10}$/, "Phone number must be required"),
    contactEmail: z.string().email("Invalid email address.").min(1, "Email is required."),
    isAgent: z.string().min(1, "Please select Agent/Broker"),
    licenseNumber: z.string().min(1, "Enter License Number"),
}).refine(
    (data) => data.isAgent !== "Yes" || (data.licenseNumber && data.licenseNumber.trim().length > 0),
    {
        message: "License number is required when Agent is Yes",
        path: ["licenseNumber"],
    }
);

const step7Schema = z.object({
    registrationType: z.enum(["already", "new"]),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string()
        .regex(/^[A-Za-z\s]+$/, "Name is required").min(1, "Please enter your name"),
    type: z.literal("seller"),
    authorizedToSell: z.boolean().refine((val) => val === true, {
        message: "You must confirm authorization to sell",
    }),
    agreeTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to terms and conditions",
    }),
})

// Combined schema
const fullSchema = step1Schema
    .merge(step2Schema)
    .merge(step3Schema)
    .merge(step4Schema)
    .merge(step5Schema)
    .merge(step6Schema)
    .merge(step7Schema)
    // .merge(step8Schema)
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

export default function RealStateRegistrationForm({ onClose, preselectedCategory, data, currentStep: externalCurrentStep, setCurrentStep: externalSetCurrentStep }: RegistrationFormProps) {
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
    const [aselectedDate, asetSelectedDate] = useState<Date | null>(null)
    const [aselectedTime, asetSelectedTime] = useState("")
    const [aisCalendarOpen, asetIsCalendarOpen] = useState(false)
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
    const [open, setOpen] = useState(false)
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false);
    const [adDetails, setAdDetails] = useState<RealEstateAd | null>(null);

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
        handleSubmit,
        formState: { errors },
        setValue,
        clearErrors,
        trigger,
        watch,
        register,
        getValues,
    } = useForm<FormData>({
        resolver: zodResolver(fullSchema),
        defaultValues: {
            title: data?.name || "",
            category: preselectedCategory || data?.category || "",
            subcategory: data?.subCategory || "",
            auctionType: data?.auctionType || "",
            duration: data?.duration || "",
            description: data?.description || "",
            media: data?.media || [],
            propertyAddress: data?.propertyAddress || "",
            propertyCity: data?.propertyCity || "",
            propertyState: data?.propertyState || "",
            propertyPincode: data?.propertyPincode || "",
            propertyCountry: data?.propertyCountry || "",
            bedroom: data?.bedroom || "",
            bathroom: data?.bathroom || "",
            lot_size: data?.lot_size ? String(data.lot_size) : "",
            area: data?.area || "",
            builtInYear: data?.builtInYear || "",
            furnishing: data?.furnishing || "",
            parkingSpaces: data?.parkingSpaces || "yes",
            utilities: data?.utilities || [],
            features: data?.features || [],
            auctionPrice: data?.auctionPrice || "",
            auctionDate: data?.auctionDate || "",
            monthly: data?.monthly || "",
            expiry: data?.expiry || "",
            ownershiptype: data?.ownershipType || "",
            ownershiptitle: data?.ownershipTitle || "",
            ownershipstatus: data?.ownershipStatus || "",
            legalDescription: data?.legalDescription || "",
            contactName: data?.contactName || "",
            contactPhone: data?.contactPhone || "",
            contactEmail: data?.contactEmail || "",
            isAgent: data?.isAgent || "",
            licenseNumber: data?.licenseNumber || "",
            authorizedToSell: data?.authorizedToSell || false,
            agreeTerms: data?.agreeTerms || false,
            registrationType: "already",
            email: data?.contactEmail || "",
            name: data?.contactName || "",
            type: "seller",
        },
    })

    const watchedCategory = watch("category")
    const watchedpCountry = watch("propertyCountry")
    const watchedpState = watch("propertyState")
    const watchedpCity = watch("propertyCity")
    const isAgent = watch("isAgent")
    const auctionType = watch("auctionType")
    const watchedSubcategory = watch("subcategory")

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
    // general calender
    // useEffect(() => {
    //     if (selectedDate && selectedTime) {
    //         const durationString = `${formatDateDDMMYYYY(selectedDate)} ${selectedTime}`
    //         setValue("duration", durationString)
    //         clearErrors("duration")
    //     }
    // }, [selectedDate, selectedTime, setValue, clearErrors])
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
    }, [startDate, startTime, endDate, endTime, setValue, clearErrors])

    //property location — using country-state-city package
    useEffect(() => {
        if (watchedpCountry) {
            // Find country ISO code from name
            const allCountries = Country.getAllCountries()
            const country = allCountries.find((c) => c.name === watchedpCountry)
            if (country) {
                setSelectedCountryCode(country.isoCode)
                const states = CSCState.getStatesOfCountry(country.isoCode)
                setAvailableStates(states)
                // Reset dependent fields
                setValue("propertyState", "")
                setValue("propertyCity", "")
                setValue("propertyPincode", "")
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
                setValue("propertyCity", "")
                setValue("propertyPincode", "")
            }
        } else {
            setAvailableCities([])
            setSelectedStateCode("")
        }
    }, [watchedpState, availableStates, selectedCountryCode, setValue])

    // Hybrid pincode: try locations.json first, fall back to empty for manual input
    useEffect(() => {
        if (watchedpCity && watchedpCountry) {
            // Try to find pincode from legacy locations.json
            const legacyCountry = locationData.countries.find((c) => c.name === watchedpCountry)
            if (legacyCountry) {
                const legacyState = legacyCountry.states.find((s) => s.name === watchedpState)
                if (legacyState) {
                    const legacyCity = legacyState.cities.find((c) => c.name === watchedpCity)
                    if (legacyCity) {
                        setValue("propertyPincode", legacyCity.pincode)
                        return
                    }
                }
            }
            // No pincode found in legacy data — leave empty for manual input
            setValue("propertyPincode", "")
        }
    }, [watchedpCity, watchedpCountry, watchedpState, setValue])

    // Pre-select country from header selection on mount (only for new ads)
    useEffect(() => {
        if (!data && !watchedpCountry) {
            const storedCountry = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null
            if (storedCountry) {
                const [, countryName] = storedCountry.split("|")
                if (countryName) {
                    setValue("propertyCountry", countryName)
                    clearErrors("propertyCountry")
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
    // general calender
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

    // jsDateConverter removed — use parseStorageDuration / parseStorageSingleDateTime from date-utils


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

        if (data && data.auctionDate) {
            // Parse stored "DD/MM/YYYY HH:mm" back into picker state
            const parsed = parseStorageSingleDateTime(data.auctionDate)
            asetSelectedDate(parsed.date)
            asetSelectedTime(parsed.time)
            // Store the date back in the form in storage format
            if (parsed.date && parsed.time) {
                setValue("auctionDate", formatForStorage(parsed.date, parsed.time))
            }
        }

        if (data && data.propertyCountry) {
            // Use country-state-city package for loading existing data
            const allCountries = Country.getAllCountries()
            const matchedCountry = allCountries.find((c) => c.name === data.propertyCountry)
            if (matchedCountry) {
                setValue("propertyCountry", matchedCountry.name)
                setSelectedCountryCode(matchedCountry.isoCode)
                const states = CSCState.getStatesOfCountry(matchedCountry.isoCode)
                setAvailableStates(states)
                setTimeout(() => {
                    const matchedState = states.find((s) => s.name === data.propertyState)
                    if (matchedState) {
                        setValue("propertyState", matchedState.name)
                        setSelectedStateCode(matchedState.isoCode)
                        const cities = CSCCity.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode)
                        setAvailableCities(cities)
                        setTimeout(() => {
                            const matchedCity = cities.find((c) => c.name === data.propertyCity)
                            if (matchedCity) {
                                setValue("propertyCity", matchedCity.name)
                                // Hybrid pincode: try locations.json first
                                const legacyCountry = locationData.countries.find((lc) => lc.name === data.propertyCountry)
                                const legacyState = legacyCountry?.states.find((ls) => ls.name === data.propertyState)
                                const legacyCity = legacyState?.cities.find((lc) => lc.name === data.propertyCity)
                                setValue("propertyPincode", legacyCity?.pincode || data.propertyPincode || "")
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
                "propertyAddress",
                "propertyCountry",
                "propertyCity",
                "propertyState",
                "propertyPincode",
            ])
        } else if (currentStep === 3) {
            isValid = await trigger(["area", "lot_size", "builtInYear"])
        } else if (currentStep === 4) {
            isValid = await trigger(["auctionPrice", "auctionDate"])
        } else if (currentStep === 5) {
            isValid = await trigger(["ownershiptype"])
        } else if (currentStep === 6) {
            isValid = await trigger(["contactName", "contactPhone", "contactEmail", "isAgent"])
            if (getValues("isAgent") === "Yes") {
                isValid = isValid && (await trigger(["licenseNumber"]))
            }

            // If user is already registered
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
                isValid = isValid && (await trigger(["email", "password", "authorizedToSell", "agreeTerms"]))
            } else {
                isValid = isValid && (await trigger(["name", "email", "password", "type", "authorizedToSell", "agreeTerms"]))
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

        if (!isValid) {
            setTimeout(() => {
                // scrollToFirstError(currentStep)
            }, 100)
            return
        }

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
            { number: 2, title: "Property Information" },
            { number: 3, title: "Property Features" },
            { number: 4, title: "Auction Details" },
            { number: 5, title: "Legal & Ownership Details" },
            { number: 6, title: "Seller & Agent Contact Info" },
        ]
        : [
            { number: 1, title: "General Details" },
            { number: 2, title: "Property Information" },
            { number: 3, title: "Property Features" },
            { number: 4, title: "Auction Details" },
            { number: 5, title: "Legal & Ownership Details" },
            { number: 6, title: "Seller & Agent Contact Info" },
            { number: 7, title: "Seller Details" },
        ]

    const handleRegistrationTypeChange = (value: "already" | "new") => {
        setRegistrationType(value)
        setValue("registrationType", value)

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

            // Check if user needs to be registered first
            if (data.registrationType === "new") {
                // Create new user account
                console.log("Creating new user account...");

                const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        password: data.password,
                        registrationType: "Seller" // Step 7 has type: "seller"
                    })
                });

                const signupResult: SignupResponse = await signupResponse.json();

                if (!signupResult.success) {
                    toast.error(signupResult.error || "Failed to create account");
                    setIsLoading(false);
                    return { success: false };  // Return status
                }

                userId = signupResult.userId;

                // Store user in localStorage
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
                // User is already registered, get userId from localStorage
                const storedUser = localStorage.getItem("user");
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;
                userId = parsedUser?.id;
                const isVerified = parsedUser?.is_verified === 1;
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

            console.log("Using userId for listing:", userId);

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
                title: data.title || adDetails?.name || "",
                category: data.category || adDetails?.category || "",
                subcategory: data.subcategory || adDetails?.subCategory || "",
                auctionType: data.auctionType || adDetails?.auctionType || "",
                duration: data.duration || adDetails?.duration || "",
                description: data.description || adDetails?.description || "",
                media: media.length > 0 ? media : adDetails?.media || [],
                propertyAddress: data.propertyAddress || adDetails?.propertyAddress || "",
                propertyCountry: data.propertyCountry || adDetails?.propertyCountry || "",
                propertyState: data.propertyState || adDetails?.propertyState || "",
                propertyCity: data.propertyCity || adDetails?.propertyCity || "",
                propertyPincode: data.propertyPincode || adDetails?.propertyPincode || "",
                bedroom: data.bedroom || adDetails?.bedroom || "",
                bathroom: data.bathroom || adDetails?.bathroom || "",
                area: data.area || adDetails?.area || "",
                lot_size: data.lot_size || adDetails?.lot_size || "",
                builtInYear: data.builtInYear || adDetails?.builtInYear || "",
                furnishing: data.furnishing || adDetails?.furnishing || "",
                parkingSpaces: data.parkingSpaces || adDetails?.parkingSpaces || "yes",
                utilities: data.utilities || adDetails?.utilities || [],
                features: data.features || adDetails?.features || [],
                auctionPrice: data.auctionPrice || adDetails?.auctionPrice || "",
                auctionDate: data.auctionDate || adDetails?.auctionDate || "",
                monthly: data.monthly || undefined,
                expiry: data.expiry || undefined,
                ownershiptype: data.ownershiptype || adDetails?.ownershipType || "",
                ownershiptitle: data.ownershiptitle || adDetails?.ownershipTitle || "",
                ownershipstatus: data.ownershipstatus || adDetails?.ownershipStatus || "",
                legalDescription: data.legalDescription || adDetails?.legalDescription || "",
                contactName: data.contactName.trim() || adDetails?.contactName || "",
                contactPhone: data.contactPhone || adDetails?.contactPhone || "",
                contactEmail: data.contactEmail.trim() || adDetails?.contactEmail || "",
                isAgent: data.isAgent || adDetails?.isAgent || "",
                licenseNumber: data.licenseNumber || adDetails?.licenseNumber || "",
                authorizedToSell: Boolean(data.authorizedToSell) || Boolean(adDetails?.authorizedToSell) || false,
                agreeTerms: Boolean(data.agreeTerms) || Boolean(adDetails?.agreeTerms) || false,
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

            const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate${isSellerUpdatePage ? "/" + adDetails?.id : ""}`, {
                method: `${isSellerUpdatePage ? "PUT" : "POST"}`,
                headers: headerPayload,
                body: JSON.stringify(payload),
            });

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
                    toast.success("Real estate listing created successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else if (isSellerUpdatePage) {
                    toast.success("Real estate listing updated successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else {
                    toast.success("Real estate listing submitted successfully!");
                }
            } else {
                console.error("API error:", result);
                toast.error(result.error || "Failed to save listing");
            }
        } catch (err) {
            console.error("Submit error:", err);
            toast.error(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (aselectedDate && aselectedTime) {
            // Store in DB format: DD/MM/YYYY HH:mm
            setValue("auctionDate", formatForStorage(aselectedDate, aselectedTime))
            clearErrors("auctionDate")
        }
    }, [aselectedDate, aselectedTime, setValue, clearErrors])

    const ahandleDateTimeSelect = (date: Date | null, time: string) => {
        asetSelectedDate(date)
        asetSelectedTime(time)
        asetIsCalendarOpen(false)
    }

    const ahandleCalendarClose = () => {
        asetIsCalendarOpen(false)
    }

    return (

        <form className="registration-form-seller" noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="flex-shrink-0 py-4 lg:p-8 relative w-full">

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
                                        ? "bg-blue-500 text-white"
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
                        <div className="register-popup-subcontainer2">
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
                                    Property type<span className="text-red-500">*</span>
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
                                                <SelectValue placeholder="Select property type" />
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

                            <div className="cont">
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

                            {/* <div className="cont">
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
                            <Label className="custom-label">
                                Description<span className="text-red-500">*</span> (Max. 1000 characters)
                            </Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Write a detailed description of your property…"
                                        rows={8}
                                        className={`custom-input custom-textarea ${errors.description ? "border-red-500" : "border-gray-300"
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

                        <div className="mt-6">
                            <Label className="custom-label">
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
                            <div data-media-upload>
                                {uploadedFiles.length === 0 ? (
                                    <div
                                        onClick={handleUploadClick}
                                        className={`upload-container ${errors.media ? "border-red-500" : "border-gray-300"
                                            }`}
                                    >
                                        <Upload className="upload-icon" />
                                        <p className="upload-text">
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
                                                        width={96}
                                                        height={96}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <video
                                                        src={URL.createObjectURL(file)}
                                                        className="w-full h-full object-cover"
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
                {/* Property Information */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="cont">
                            <Label className="custom-label">
                                Address<span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                name="propertyAddress"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        rows={3}
                                        placeholder="Enter complete address"
                                        {...field}
                                        className={`custom-input input-textarea ${errors.propertyAddress ? "border-red-500" : ""}`}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            if (errors.propertyAddress) clearErrors("propertyAddress")
                                        }}
                                    />
                                )}
                            />
                            {errors.propertyAddress && <p className="error-text">{errors.propertyAddress.message}</p>}
                        </div>

                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Country<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="propertyCountry"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.propertyCountry) clearErrors("propertyCountry")
                                            }}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.propertyCountry ? "border-red-500" : ""}`}>
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
                                {errors.propertyCountry && <p className="error-text">Country is required</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    State<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="propertyState"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.propertyState) clearErrors("propertyState")
                                            }}
                                            disabled={!watchedpCountry || availableStates.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.propertyState ? "border-red-500" : ""}`}>
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
                                {errors.propertyState && <p className="error-text">{errors.propertyState.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    City<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="propertyCity"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.propertyCity) clearErrors("propertyCity")
                                            }}
                                            disabled={!watchedpState || availableCities.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.propertyCity ? "border-red-500" : ""}`}>
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
                                {errors.propertyCity && <p className="error-text">{errors.propertyCity.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">Pin Code</Label>
                                <Controller
                                    name="propertyPincode"
                                    control={control}
                                    render={({ field }) => (
                                        <Input placeholder="" {...field} className={`custom-input ${errors.propertyPincode ? "border-red-500" : ""}`} />
                                    )}
                                />
                                {errors.propertyPincode && (
                                    <p className="error-text">{errors.propertyPincode.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Property features */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        {watchedSubcategory === "Vacant land" ? (
                            // Show only Floor area, Lot size, Year built in one row for Vacant land
                            <div className="register-popup-subcontainer">
                                <div className="cont">
                                    <Label className="custom-label">
                                        Floor area<span className="text-red-500">*</span> (Sq. ft.)
                                    </Label>
                                    <Controller
                                        name="area"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder=""
                                                type="text"
                                                {...field}
                                                className={`custom-input ${errors.area ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/\D/g, "");
                                                    field.onChange(numericValue);
                                                    if (numericValue.length > 0 && errors.area) {
                                                        clearErrors("area");
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                    {/* {errors.area && (
                                        <p className="error-text">{errors.area.message}</p>
                                    )} */}

                                    {errors.area && <p className="error-text">{errors.area.message}</p>}
                                </div>
                                <div className="cont">
                                    <Label className="custom-label">
                                        Lot size<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="lot_size"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder=""
                                                {...field}
                                                className={`custom-input ${errors.lot_size ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.lot_size) clearErrors("lot_size")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.lot_size && <p className="error-text">{errors.lot_size.message}</p>}
                                </div>
                                <div className="cont">
                                    <Label className="custom-label">
                                        Year built<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="builtInYear"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="YYYY"
                                                {...field}
                                                className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.builtInYear) clearErrors("builtInYear")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.builtInYear && <p className="error-text">{errors.builtInYear.message}</p>}
                                </div>
                            </div>
                        ) : (
                            // Show all fields by default for other subcategories
                            <>
                                <div className="register-popup-subcontainer">
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Bedroom
                                        </Label>
                                        <Controller
                                            name="bedroom"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder=""
                                                    type="text"
                                                    {...field}
                                                    className={`custom-input ${errors.bedroom ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        const numericValue = e.target.value.replace(/\D/g, "");
                                                        field.onChange(numericValue);
                                                        if (errors.bedroom) clearErrors("bedroom");
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
                                        {errors.bedroom && <p className="error-text">{errors.bedroom.message}</p>}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Bathroom
                                        </Label>
                                        <Controller
                                            name="bathroom"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder=""
                                                    type="text"
                                                    {...field}
                                                    className={`custom-input ${errors.bathroom ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        const numericValue = e.target.value.replace(/\D/g, "");
                                                        field.onChange(numericValue);
                                                        if (errors.bathroom) clearErrors("bathroom");
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
                                        {errors.bathroom && <p className="error-text">{errors.bathroom.message}</p>}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Floor area<span className="text-red-500">*</span> (Sq. ft.)
                                        </Label>
                                        <Controller
                                            name="area"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder=""
                                                    type="text"
                                                    {...field}
                                                    className={`custom-input ${errors.area ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        const numericValue = e.target.value.replace(/\D/g, "");
                                                        field.onChange(numericValue);
                                                        if (numericValue.length > 0 && errors.area) {
                                                            clearErrors("area");
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.area && <p className="error-text">{errors.area.message}</p>}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Lot size<span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="lot_size"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    placeholder=""
                                                    {...field}
                                                    className={`custom-input ${errors.lot_size ? "border-red-500" : ""}`}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        if (errors.lot_size) clearErrors("lot_size")
                                                    }}
                                                />
                                            )}
                                        />
                                        {errors.lot_size && <p className="error-text">{errors.lot_size.message}</p>}
                                    </div>
                                </div>
                                <div className="register-popup-subcontainer">
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Year built<span className="text-red-500">*</span>
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
                                        {errors.builtInYear && <p className="error-text">{errors.builtInYear.message}</p>}
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">Parking spaces</Label>
                                        <Controller
                                            name="parkingSpaces"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value: string) => {
                                                        field.onChange(value)
                                                    }}
                                                >
                                                    <SelectTrigger className="custom-input">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                        <SelectItem value="no">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="cont">
                                        <Label className="custom-label">
                                            Furnishing
                                        </Label>
                                        <Controller
                                            name="furnishing"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value: string) => {
                                                        field.onChange(value)
                                                        if (errors.furnishing) clearErrors("furnishing")
                                                    }}
                                                >
                                                    <SelectTrigger className={`custom-input ${errors.furnishing ? "border-red-500" : ""}`}>
                                                        <SelectValue placeholder="Select Furnishing" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                        <SelectItem value="no">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.furnishing && <p className="error-text">{errors.furnishing.message}</p>}
                                    </div>
                                </div>
                                <div className="cont">
                                    <label className="custom-label">Utilities included</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {utilitiesOptions.map((utility, i) => (
                                            <label key={i} className="checkbox-container">
                                                <input type="checkbox" className="custom-checkbox" value={utility} {...register("utilities")} />
                                                {utility}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="custom-label">Additional features</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {featuresOptions.map((feature, i) => (
                                            <label key={i} className="checkbox-container">
                                                <input type="checkbox" className="custom-checkbox" value={feature} {...register("features")} />
                                                {feature}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {/* Auction Details */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="custom-label">
                                    Starting bid price<span className="text-red-500">*</span>(Dollar)
                                </Label>
                                <Controller
                                    name="auctionPrice"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.auctionPrice ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.auctionPrice) clearErrors("auctionPrice");
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
                                {errors.auctionPrice && <p className="error-text">{errors.auctionPrice.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Inspection Date/Time<span className="text-red-500">*</span>
                                </Label>

                                <Dialog open={aisCalendarOpen} onOpenChange={asetIsCalendarOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`custom-input input-calender ${errors.auctionDate ? "border-red-500" : ""
                                                }`}
                                            onClick={() => asetIsCalendarOpen(true)}
                                        >
                                            {aselectedDate ? formatForDisplay(aselectedDate, aselectedTime) : "Add time/days"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="custom-dialog-content">
                                        <VisuallyHidden>
                                            <DialogTitle>Date and time picker</DialogTitle>
                                        </VisuallyHidden>
                                        <DateTimePicker
                                            selectedDate={aselectedDate}
                                            selectedTime={aselectedTime}
                                            onSelect={ahandleDateTimeSelect}
                                            onClose={ahandleCalendarClose}
                                        />
                                    </DialogContent>
                                </Dialog>
                                {errors.auctionDate && <p className="error-text">{errors.auctionDate.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {/* Legal & ownership details */}
                {currentStep === 5 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="cont">
                                <Label className="custom-label">
                                    Ownership type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="ownershiptype"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter ownership type"
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.ownershiptype ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                field.onChange(textOnly);
                                                if (errors.ownershiptype) clearErrors("ownershiptype");
                                            }}
                                        />
                                    )}
                                />
                                {errors.ownershiptype && <p className="error-text">{errors.ownershiptype.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">Title status</Label>
                                <Controller
                                    name="ownershiptitle"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter ownership title"
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.ownershiptitle ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                field.onChange(textOnly);
                                                if (errors.ownershiptitle) clearErrors("ownershiptitle");
                                            }}
                                        />
                                    )}
                                />
                                {errors.ownershiptitle && <p className="error-text">{errors.ownershiptitle.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">Zoning</Label>
                                {/* <Input placeholder="Enter zoning" className="custom-input" /> */}
                                <Controller
                                    name="ownershipstatus"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter zoning"
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.ownershipstatus ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const textOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                field.onChange(textOnly);
                                                if (errors.ownershipstatus) clearErrors("ownershipstatus");
                                            }}
                                        />
                                    )}
                                />
                                {errors.ownershipstatus && <p className="error-text">{errors.ownershipstatus.message}</p>}
                            </div>
                        </div>

                        {(auctionType === "rent" || auctionType === "lease") && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="cont">
                                    <Label className="custom-label">
                                        {auctionType === "rent" ? `Monthly (If Rented)` : `Lease Expiry Date`}
                                    </Label>
                                    {auctionType === "rent" && <Controller
                                        name="monthly"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Enter monthly"
                                                {...field}
                                                maxLength={10}
                                                className={`custom-input ${errors.monthly ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    // allow only digits
                                                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                    field.onChange(onlyDigits);

                                                    if (errors.monthly) clearErrors("monthly");
                                                }}
                                            />
                                        )}
                                    />}

                                    {auctionType === "lease" && <Controller
                                        name="expiry"
                                        control={control}
                                        defaultValue={new Date().toISOString()}
                                        render={({ field }) => (
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
                                                            className={`custom-input input-calender ${errors.expiry ? "border-red-500" : ""}`}
                                                        />
                                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="custom-dialog-content">
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
                                        )}
                                    />}

                                    {/* {errors.expiry && <p className="error-text">{errors.expiry.message}</p>} */}
                                </div>
                            </div>
                        )}

                        <div className="cont">
                            <Label className="custom-label">Legal description</Label>
                            <Controller
                                name="legalDescription"
                                control={control}
                                render={({ field }) => (
                                    <textarea
                                        rows={5}
                                        {...field}
                                        placeholder="Enter legal description"
                                        className="custom-input custom-textarea"
                                    />
                                )}
                            />
                        </div>
                    </div>
                )}
                {/* Seller & agent contact info */}
                {currentStep === 6 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="w-full">
                                <Label className="custom-label">
                                    Name<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="contactName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter your name"
                                            {...field}
                                            className={`custom-input ${errors.contactName ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const onlyLetters = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                field.onChange(onlyLetters);

                                                if (errors.contactName) clearErrors("contactName");
                                            }}
                                        />
                                    )}
                                />
                                {errors.contactName && <p className="error-text">{errors.contactName.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Phone number<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="contactPhone"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter phone number"
                                            {...field}
                                            maxLength={10}
                                            className={`custom-input ${errors.contactPhone ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                // allow only digits
                                                const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                field.onChange(onlyDigits);

                                                if (errors.contactPhone) clearErrors("contactPhone");
                                            }}
                                        />
                                    )}
                                />
                                {errors.contactPhone && <p className="error-text">{errors.contactPhone.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Email<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="contactEmail"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter email address"
                                            {...field}
                                            className={`custom-input ${errors.contactEmail ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.contactEmail) clearErrors("contactEmail")
                                            }}
                                        />
                                    )}
                                />
                                {errors.contactEmail && <p className="error-text">{errors.contactEmail.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Agent/Broker<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="isAgent"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.isAgent) clearErrors("isAgent")
                                            }}
                                        >
                                            <SelectTrigger className="custom-input">
                                                <SelectValue placeholder="Select Agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.isAgent && <p className="error-text">{errors.isAgent.message}</p>}
                            </div>

                            {isAgent === "Yes" && (
                                <div className="cont">
                                    <Label className="custom-label">
                                        License number<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="licenseNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Enter license number"
                                                {...field}
                                                className={`custom-input ${errors.licenseNumber ? "border-red-500" : ""}`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.licenseNumber) clearErrors("licenseNumber")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.licenseNumber && <p className="error-text">{errors.licenseNumber.message}</p>}
                                </div>
                            )}
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        className={`custom-input pr-10 ${errors.password ? "border-red-500" : ""}`} // add space for icon
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
                                <div className="flex items-start space-x-2">
                                    <Controller
                                        name="authorizedToSell"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="authorizedToSell"
                                                checked={field.value}
                                                className="border-black dark:border-white"
                                                onCheckedChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.authorizedToSell) clearErrors("authorizedToSell")
                                                }}
                                            />
                                        )}
                                    />
                                    <Label htmlFor="authorizedToSell" className="text-sm">
                                        I confirm that I am authorized to sell this property
                                    </Label>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Controller
                                        name="agreeTerms"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="agreeTerms"
                                                checked={field.value}
                                                className="border-black dark:border-white"
                                                onCheckedChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.agreeTerms) clearErrors("agreeTerms")
                                                }}
                                            />
                                        )}
                                    />
                                    <Label htmlFor="agreeTerms" className="text-sm">
                                        I agree to terms and conditions
                                    </Label>
                                </div>
                                {/* Validation error messages */}
                                {errors.authorizedToSell && <p className="error-text">{errors.authorizedToSell.message}</p>}
                                {errors.agreeTerms && <p className="error-text">{errors.agreeTerms.message}</p>}
                            </div>
                        )}

                        {registrationType === "new" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="flex items-start space-x-2">
                                    <Controller
                                        name="authorizedToSell"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="authorizedToSell"
                                                checked={field.value}
                                                className="dark:border-black"
                                                onCheckedChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.authorizedToSell) clearErrors("authorizedToSell")
                                                }}
                                            />
                                        )}
                                    />
                                    <Label htmlFor="authorizedToSell" className="text-sm">
                                        I confirm that I am authorized to sell this property.
                                    </Label>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Controller
                                        name="agreeTerms"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="agreeTerms"
                                                checked={field.value}
                                                className="dark:border-black"
                                                onCheckedChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.agreeTerms) clearErrors("agreeTerms")
                                                }}
                                            />
                                        )}
                                    />
                                    <Label htmlFor="agreeTerms" className="text-sm">
                                        I agree to terms and conditions
                                    </Label>
                                </div>
                                {/* Validation error messages */}
                                {errors.authorizedToSell && <p className="error-text">{errors.authorizedToSell.message}</p>}
                                {errors.agreeTerms && <p className="error-text">{errors.agreeTerms.message}</p>}
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
                                    onClose?.()
                                    router.push("/")
                                }}
                                className="w-32 bg-gray-800 text-white py-3 hover:bg-gray-900"
                            >
                                {`Let's Get Started`}                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}