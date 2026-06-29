"use client"

import Image from "next/image"
import React from "react"
import { useState, useRef, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Upload, Plus, Trash, Loader2, EyeOff, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Label } from "src/components/ui/label"
import { Button } from "src/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "src/components/ui/dialog"
import { Input } from "src/components/ui/input"
import { Textarea } from "src/components/ui/textarea"
import {
    parseStorageDuration,
    formatForDisplay,
    formatDurationForStorage,
} from "src/lib/date-utils"
import { useRouter, usePathname } from "next/navigation"
import { automobilefeaturesOptions, categorySubcategories } from "src/app/data"
// Legacy: using country-state-city package instead
// import locationData from "src/app/data/locations.json"
import { Country, State as CSCState, City as CSCCity } from "country-state-city"
import type { IState, ICity } from "country-state-city"
import locationData from "src/app/data/locations.json"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { toast } from 'sonner'
import DateRangePicker from "src/components/ui/custom-calendar"

interface AutomobileAd {
    id?: string;
    name?: string;
    category?: string;
    subCategory?: string;
    auctionType?: string;
    duration?: string;
    description?: string;
    media?: Array<{ name: string; size: number; type: string, url: string }>;
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
    accidentHistory?: string;
    history?: string;
    serviceHistory?: string;
    owner?: string;
    vinNumber?: string;
    automobileCountry?: string;
    automobileState?: string;
    automobileCity?: string;
    automobilePincode?: string;
    price?: string;
    negotiable?: string;
    mobileFeatures?: string[];
    warranty?: string;
    warrantyDetails?: string;
}

interface RegistrationFormProps {
    onClose: () => void
    preselectedCategory?: string,
    data?: AutomobileAd | undefined
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

// Validation
const step1Schema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Vehicle type is required"),
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
    make: z.string().min(1, "Field is required."),
    model: z.string().min(1, "Model is required."),
    builtInYear: z
        .string()
        .min(1, "Built-in year is required.")
        .regex(/^\d+$/, "Only numbers are allowed"),
    body: z.string().min(1, "Body type is required."),
    fuel: z.string().min(1, "Fuel type is required."),
    transmission: z.string().min(1, "Transmission type is required."),
    engine: z.string().min(1, "Engine size is required."),
    drive: z.string().min(1, "Drive type is required."),
    odometer: z.string().min(1, "Odometer is required."),
    odometerUnit: z.string().min(1, "Odometer unit is required."),
})

const step3Schema = z.object({
    condition: z.string().min(1, "Condtion is required."),
    accidenthistory: z.string().min(1, "Please select Accident History"),
    // history: z.string().min(1, "Please enter Accident History details"),
    history: z.string().optional(),
    shistory: z.string().min(1, "Please select Service History"),
    owner: z
        .string()
        .min(1, "Number of previous owners is required")
        .regex(/^\d*$/, "Only numbers are allowed"),
    vnumber: z.string().min(1, "VIN/Chassis number is required."),
})
const step4Schema = z.object({
    automobileCountry: z.string().min(1, "Country is required."),
    automobileState: z.string().min(1, "State is required."),
    automobileCity: z.string().min(1, "City is required."),
    automobilePincode: z.string().optional(),
})
const step5Schema = z.object({
    price: z
        .string()
        .min(1, "Price is required.")
        .regex(/^\d*$/, "Only numbers are allowed"),
    negotiable: z.string().optional(),
})
const step6Schema = z.object({
    mobilefeature: z.array(z.string()).optional(),
    warranty: z.string().min(1, "Please select Warranty"),
    warrantydetails: z.string().min(1, "Warranty details is required"),
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

export default function AutomobileRegistrationForm({ onClose, preselectedCategory, data, currentStep: externalCurrentStep, setCurrentStep: externalSetCurrentStep }: RegistrationFormProps) {
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
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false)
    const [adDetails, setAdDetails] = useState<AutomobileAd | null>(null);

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
        register,
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
            make: data?.make || "",
            model: data?.model || "",
            builtInYear: data?.builtInYear || "",
            body: data?.body || "",
            fuel: data?.fuel || "",
            transmission: data?.transmission || "",
            engine: data?.engine || "",
            drive: data?.drive || "",
            odometer: data?.odometer || "",
            odometerUnit: data?.odometerUnit || "",
            condition: data?.condition || "",
            accidenthistory: data?.accidentHistory || "",
            history: data?.history || "",
            shistory: data?.serviceHistory || "",
            owner: data?.owner || "",
            vnumber: data?.vinNumber || "",
            automobileCountry: data?.automobileCountry || "",
            automobileCity: data?.automobileCity || "",
            automobileState: data?.automobileState || "",
            automobilePincode: data?.automobilePincode || "",
            price: data?.price || "",
            negotiable: data?.negotiable ? "yes" : "no",
            mobilefeature: data?.mobileFeatures || [],
            warranty: data?.warranty || "",
            warrantydetails: data?.warrantyDetails || "",
            registrationType: "already",
            type: "seller",
        },
    })

    // const steps = [
    //     { number: 1, title: "General Details" },
    //     { number: 2, title: "Vehicle Details" },
    //     { number: 3, title: "Vehicle Conditions" },
    //     { number: 4, title: "Location" },
    //     { number: 5, title: "Pricing" },
    //     { number: 6, title: "Additional Features" },
    //     { number: 7, title: "Seller Details" },
    // ]

    const watchedCategory = watch("category")
    const accidenthistory = watch("accidenthistory")
    const warranty = watch("warranty")
    //automoile location
    const watchedpCountry = watch("automobileCountry")
    const watchedpState = watch("automobileState")
    const watchedpCity = watch("automobileCity")

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

    //automobile location — using country-state-city package
    useEffect(() => {
        if (watchedpCountry) {
            const allCountries = Country.getAllCountries()
            const country = allCountries.find((c) => c.name === watchedpCountry)
            if (country) {
                setSelectedCountryCode(country.isoCode)
                const states = CSCState.getStatesOfCountry(country.isoCode)
                setAvailableStates(states)
                // Reset dependent fields
                setValue("automobileState", "")
                setValue("automobileCity", "")
                setValue("automobilePincode", "")
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
                setValue("automobileCity", "")
                setValue("automobilePincode", "")
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
                        setValue("automobilePincode", legacyCity.pincode)
                        return
                    }
                }
            }
            setValue("automobilePincode", "")
        }
    }, [watchedpCity, watchedpCountry, watchedpState, setValue])

    // Pre-select country from header selection on mount (only for new ads)
    useEffect(() => {
        if (!data && !watchedpCountry) {
            const storedCountry = typeof window !== "undefined" ? localStorage.getItem("selectedCountry") : null
            if (storedCountry) {
                const [, countryName] = storedCountry.split("|")
                if (countryName) {
                    setValue("automobileCountry", countryName)
                    clearErrors("automobileCountry")
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
        console.log("files : ", files);
        setDeletedFiles(files);

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

        if (data && data.automobileCountry) {
            const allCountries = Country.getAllCountries()
            const matchedCountry = allCountries.find((c) => c.name === data.automobileCountry)
            if (matchedCountry) {
                setValue("automobileCountry", matchedCountry.name)
                setSelectedCountryCode(matchedCountry.isoCode)
                const states = CSCState.getStatesOfCountry(matchedCountry.isoCode)
                setAvailableStates(states)
                setTimeout(() => {
                    const matchedState = states.find((s) => s.name === data.automobileState)
                    if (matchedState) {
                        setValue("automobileState", matchedState.name)
                        setSelectedStateCode(matchedState.isoCode)
                        const cities = CSCCity.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode)
                        setAvailableCities(cities)
                        setTimeout(() => {
                            const matchedCity = cities.find((c) => c.name === data.automobileCity)
                            if (matchedCity) {
                                setValue("automobileCity", matchedCity.name)
                                const legacyCountry = locationData.countries.find((lc) => lc.name === data.automobileCountry)
                                const legacyState = legacyCountry?.states.find((ls) => ls.name === data.automobileState)
                                const legacyCity = legacyState?.cities.find((lc) => lc.name === data.automobileCity)
                                setValue("automobilePincode", legacyCity?.pincode || data.automobilePincode || "")
                            }
                        }, 100);
                    }
                }, 100);
            }
        }
    }, [data, setValue]);

    // const handleNext = async () => {
    //     let isValid = false

    //     if (currentStep === 1) {
    //         isValid = await trigger(["title", "category", "subcategory", "duration", "description", "media"])
    //     } else if (currentStep === 2) {
    //         isValid = await trigger([
    //             "make", "model", "builtInYear", "body", "fuel", "transmission", "engine", "drive", "odometer", "odometerUnit",
    //         ])
    //     } else if (currentStep === 3) {
    //         isValid = await trigger([
    //             "condition", "accidenthistory", "history", "shistory", "owner", "vnumber"
    //         ])
    //         if (getValues("accidenthistory") === "Yes") {
    //             isValid = isValid && (await trigger(["history"]));
    //         }
    //     } else if (currentStep === 4) {
    //         isValid = await trigger([
    //             "automobileCountry", "automobileCity", "automobileState", "automobilePincode"
    //         ])
    //     } else if (currentStep === 5) {
    //         isValid = await trigger([
    //             "price", "negotiable"
    //         ])
    //     } else if (currentStep === 6) {
    //         isValid = await trigger([
    //             "mobilefeature", "warranty"
    //         ])
    //         if (getValues("warranty") === "Yes") {
    //             isValid = isValid && (await trigger(["warrantydetails"]));
    //         }
    //     } else if (currentStep === 7) {
    //         isValid = await trigger(["registrationType"])
    //         if (registrationType === "already") {
    //             isValid = isValid && (await trigger(["email", "password"]))
    //         } else {
    //             isValid = isValid && (await trigger(["name", "email", "password", "type"]))
    //         }

    //         if (isValid) {
    //             const formData = getValues()
    //             onSubmit(formData)
    //             return
    //         }
    //     }
    //     //autoscrolling
    //     if (!isValid) {
    //         setTimeout(() => {
    //             let firstError: HTMLElement | null = null;

    //             // Check if the "media" field specifically has an error
    //             if (errors.media) {
    //                 firstError =
    //                     (document.querySelector("[data-media-upload]") as HTMLElement) ||
    //                     (document.querySelector('input[type="file"]')?.closest("div") as HTMLElement) ||
    //                     (document.querySelector(".media-upload") as HTMLElement) ||
    //                     (Array.from(document.querySelectorAll("p"))
    //                         .find((p) => p.textContent?.includes("At least one media file is required"))
    //                         ?.closest("div") as HTMLElement) ||
    //                     (Array.from(document.querySelectorAll("label"))
    //                         .find((label) => label.textContent?.includes("Upload media"))
    //                         ?.parentElement as HTMLElement);

    //                 if (firstError) {
    //                     console.log("[v0] Scrolling to MEDIA field");
    //                     firstError.scrollIntoView({
    //                         behavior: "smooth",
    //                         block: "center",
    //                         inline: "nearest",
    //                     });

    //                     // Try focusing file input 
    //                     const fileInput = firstError.querySelector('input[type="file"]') as HTMLInputElement;
    //                     const uploadArea = firstError.querySelector('[role="button"], .cursor-pointer') as HTMLElement;

    //                     if (fileInput) {
    //                         setTimeout(() => fileInput.focus(), 300);
    //                     } else if (uploadArea) {
    //                         setTimeout(() => uploadArea.focus(), 300);
    //                     }
    //                 } else {
    //                     console.log("[v0] Could not find MEDIA upload element!");
    //                 }
    //             } else {
    //                 firstError =
    //                     (document.querySelector(".text-red-500, .border-red-500, [aria-invalid='true']") as HTMLElement) || null;

    //                 if (firstError) {
    //                     firstError.scrollIntoView({
    //                         behavior: "smooth",
    //                         block: "center",
    //                     });

    //                     const inputEl = firstError.querySelector("input, textarea, select") as HTMLElement;
    //                     if (inputEl) {
    //                         setTimeout(() => inputEl.focus(), 300);
    //                     }
    //                 }
    //             }
    //         }, 100);
    //     }

    //     if (isValid && currentStep < 7) {
    //         setCurrentStep(currentStep + 1)
    //     }
    // }

    const handleNext = async () => {
        let isValid = false;

        if (currentStep === 1) {
            if (adDetails?.media && adDetails.media.length > 0) {
                isValid = await trigger([
                    "title",
                    "category",
                    "subcategory",
                    "duration",
                    "description"
                ]);
            } else {
                isValid = await trigger([
                    "title",
                    "category",
                    "subcategory",
                    "duration",
                    "description",
                    "media"
                ]);
            }
        } else if (currentStep === 2) {
            isValid = await trigger([
                "make",
                "model",
                "builtInYear",
                "body",
                "fuel",
                "transmission",
                "engine",
                "drive",
                "odometer",
                "odometerUnit",
            ]);
        } else if (currentStep === 3) {
            isValid = await trigger([
                "condition",
                "accidenthistory",
                "history",
                "shistory",
                "owner",
                "vnumber",
            ]);

            if (getValues("accidenthistory") === "Yes") {
                isValid = isValid && (await trigger(["history"]));
            }
        } else if (currentStep === 4) {
            isValid = await trigger([
                "automobileCountry",
                "automobileCity",
                "automobileState",
                "automobilePincode",
            ]);
        } else if (currentStep === 5) {
            isValid = await trigger(["price", "negotiable"]);
        } else if (currentStep === 6) {
            isValid = await trigger(["mobilefeature", "warranty"]);
            if (getValues("warranty") === "Yes") {
                isValid = isValid && (await trigger(["warrantydetails"]));
            }

            // If user already registered, submit and redirect
            if (isValid && isUserRegistered) {
                const formData = getValues();
                await onSubmit(formData);
                //router.push("/seller/listing");
                return;
            }
        } else if (currentStep === 7) {
            // For unregistered users
            isValid = await trigger(["registrationType"]);
            if (registrationType === "already") {
                isValid = isValid && (await trigger(["email", "password"]));
            } else {
                isValid = isValid && (await trigger(["name", "email", "password", "type"]));
            }

            if (isValid) {
                const formData = getValues();
                await onSubmit(formData);
                //router.push("/seller/listing");
                return;
            }
        }

        // Auto-scroll to first error
        if (!isValid) {
            setTimeout(() => {
                let firstError: HTMLElement | null = null;

                // Scroll to MEDIA field if invalid
                if (errors.media) {
                    firstError =
                        (document.querySelector("[data-media-upload]") as HTMLElement) ||
                        (document.querySelector('input[type="file"]')?.closest("div") as HTMLElement) ||
                        (document.querySelector(".media-upload") as HTMLElement) ||
                        (Array.from(document.querySelectorAll("p"))
                            .find((p) =>
                                p.textContent?.includes("At least one media file is required")
                            )
                            ?.closest("div") as HTMLElement) ||
                        (Array.from(document.querySelectorAll("label"))
                            .find((label) => label.textContent?.includes("Upload media"))
                            ?.parentElement as HTMLElement);

                    if (firstError) {
                        console.log("Scrolling to MEDIA field");
                        firstError.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "nearest",
                        });

                        const fileInput = firstError.querySelector(
                            'input[type="file"]'
                        ) as HTMLInputElement;
                        const uploadArea = firstError.querySelector(
                            '[role="button"], .cursor-pointer'
                        ) as HTMLElement;

                        if (fileInput) {
                            setTimeout(() => fileInput.focus(), 300);
                        } else if (uploadArea) {
                            setTimeout(() => uploadArea.focus(), 300);
                        }
                    } else {
                        console.log("[v0] Could not find MEDIA upload element!");
                    }
                } else {
                    firstError =
                        (document.querySelector(
                            ".text-red-500, .border-red-500, [aria-invalid='true']"
                        ) as HTMLElement) || null;

                    if (firstError) {
                        firstError.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });

                        const inputEl = firstError.querySelector(
                            "input, textarea, select"
                        ) as HTMLElement;
                        if (inputEl) {
                            setTimeout(() => inputEl.focus(), 300);
                        }
                    }
                }
            }, 100);
        }

        // Move to next step if valid
        const maxStep = isUserRegistered ? 6 : 7;
        if (isValid && currentStep < maxStep) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const steps = isUserRegistered
        ? [
            { number: 1, title: "General Details" },
            { number: 2, title: "Vehicle Details" },
            { number: 3, title: "Vehicle Conditions" },
            { number: 4, title: "Location" },
            { number: 5, title: "Pricing" },
            { number: 6, title: "Additional Features" },
        ]
        : [
            { number: 1, title: "General Details" },
            { number: 2, title: "Vehicle Details" },
            { number: 3, title: "Vehicle Conditions" },
            { number: 4, title: "Location" },
            { number: 5, title: "Pricing" },
            { number: 6, title: "Additional Features" },
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

    const onSubmit = async (data: FormData) => {
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
                ///return { success: true, showingModal: true };

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

                    await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/uploads/`, {
                        method: "DELETE",
                        headers: headerPayload,
                        body: formData,
                    });
                }
            }
            /* file to be uploaded */
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
                duration: data.duration || adDetails?.duration || "",
                description: data.description || adDetails?.description || "",
                media: media.length > 0 ? media : adDetails?.media || [],
                make: data.make || adDetails?.make || "",
                model: data.model || adDetails?.model || "",
                builtInYear: data.builtInYear || adDetails?.builtInYear || "",
                body: data.body || adDetails?.body || "",
                fuel: data.fuel || adDetails?.fuel || "",
                transmission: data.transmission || adDetails?.transmission || "",
                engine: data.engine || adDetails?.engine || "",
                drive: data.drive || adDetails?.drive || "",
                odometer: data.odometer || adDetails?.odometer || "",
                odometerUnit: data.odometerUnit || adDetails?.odometerUnit || "",
                condition: data.condition || adDetails?.condition || "",
                accidenthistory: data.accidenthistory || adDetails?.accidentHistory || "",
                history: data.history || adDetails?.history || "",
                shistory: data.shistory || adDetails?.serviceHistory || "",
                owner: data.owner || adDetails?.owner || "",
                vnumber: data.vnumber || adDetails?.vinNumber || "",
                automobileCountry: data.automobileCountry || adDetails?.automobileCountry || "",
                automobileState: data.automobileState || adDetails?.automobileState || "",
                automobileCity: data.automobileCity || adDetails?.automobileCity || "",
                automobilePincode: data.automobilePincode || adDetails?.automobilePincode || "",
                price: data.price || adDetails?.price || "",
                negotiable: data.negotiable || adDetails?.negotiable || "",
                mobilefeature: data.mobilefeature || adDetails?.mobileFeatures || [],
                warranty: data.warranty || adDetails?.warranty || "",
                warrantydetails: data.warrantydetails || adDetails?.warrantyDetails || "",
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

            const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile${isSellerUpdatePage ? "/" + adDetails?.id : ""}`, {
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
                    toast.success("Automobile listing created successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else if (isSellerUpdatePage) {
                    toast.success("Automobile listing updated successfully!");
                    setTimeout(() => {
                        router.push("/seller/listing");
                    }, 100);
                } else {
                    toast.success("Automobile listing submitted successfully!");
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
                                        ? "bg-blue-500 text-white"
                                        : step.number < currentStep
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 text-[#4B5563]"
                                        }`}
                                >
                                    {step.number}
                                    <span className="step-title step-ex">
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
                                    Vehicle type<span className="text-red-500">*</span>
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
                                                <SelectValue placeholder="Select vehicle type" />
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

                            {/* <div>
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
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.auctionType ? "border-red-500" : "border-gray-300"
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
                            </div> */}

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
                            <Label className="custom-label mt-6">
                                Description<span className="text-red-500">*</span> (Max. 1000 characters)
                            </Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Write a detailed description of your automobile…"
                                        rows={8}
                                        className={`custom-input input-textarea ${errors.description ? "border-red-500" : "border-gray-300"
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
                            <Label className="custom-label mt-6">
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
                {/* Vehicle details */}
                {currentStep === 2 && (
                    <div className="space-y-0">
                        <div className="register-popup-subcontainer2">
                            <div className="cont">
                                <Label className="custom-label">
                                    Make<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="make"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            {...field}
                                            className={`custom-input ${errors.make ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.make) clearErrors("make")
                                            }}
                                        />
                                    )}
                                />
                                {errors.make && (
                                    <p className="error-text">{errors.make.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Model<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="model"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            {...field}
                                            className={`custom-input ${errors.model ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.model) clearErrors("model")
                                            }}
                                        />
                                    )}
                                />
                                {errors.model && (
                                    <p className="error-text">{errors.model.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Year<span className="text-red-500">*</span>
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
                                <Label className="custom-label">
                                    Body type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="body"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.body) clearErrors("body")
                                            }}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.body ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Select body type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">High Ground Clearance</SelectItem>
                                                <SelectItem value="door">4-wheeler</SelectItem>
                                                <SelectItem value="wheel">2-wheeler</SelectItem>
                                                <SelectItem value="hull">Hull</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.body && <p className="error-text">{errors.body.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Fuel type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="fuel"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.fuel) clearErrors("fuel")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.fuel ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Select Fuel type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="petrol">Petrol</SelectItem>
                                                <SelectItem value="gasoline">Gasoline</SelectItem>
                                                <SelectItem value="diesel">Diesel</SelectItem>
                                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                                <SelectItem value="electric">Electric</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.fuel && <p className="error-text">{errors.fuel.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Transmission<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="transmission"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.transmission) clearErrors("transmission")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.transmission ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Select Transmission" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manual">Manual</SelectItem>
                                                <SelectItem value="automatic">Automatic</SelectItem>
                                                <SelectItem value="semi-automatic">Semi-automatic</SelectItem>
                                                <SelectItem value="cvt">CVT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.transmission && (
                                    <p className="error-text">{errors.transmission.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Engine size<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="engine"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter engine size"
                                            {...field}
                                            className={`custom-input ${errors.engine ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.engine) clearErrors("engine")
                                            }}
                                        />
                                    )}
                                />
                                {errors.engine && (
                                    <p className="error-text">{errors.engine.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Drive type<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="drive"
                                    control={control}
                                    rules={{ required: "Drive type is required" }}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                if (errors.drive) clearErrors("drive");
                                            }}
                                            value={field.value || ""}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.drive ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select drive type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FWD">FWD</SelectItem>
                                                <SelectItem value="RWD">RWD</SelectItem>
                                                <SelectItem value="AWD">AWD</SelectItem>
                                                <SelectItem value="4WD">4WD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.drive && (
                                    <p className="error-text">{errors.drive.message}</p>
                                )}
                            </div>
                            {/* Odometer / Mileage Input */}
                            <div className="cont">
                                <Label className="custom-label">
                                    Odometer/Mileage<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="odometer"
                                    control={control}
                                    rules={{ required: "Odometer/Mileage is required" }}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter value"
                                            {...field}
                                            className={`custom-input ${errors.odometer ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                if (errors.odometer) clearErrors("odometer");
                                            }}
                                        />
                                    )}
                                />
                                {errors.odometer && (
                                    <p className="error-text">
                                        {errors.odometer.message}
                                    </p>
                                )}

                            </div>

                            {/* Unit Dropdown */}
                            <div className="cont">
                                <Label className="custom-label">
                                    Unit<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="odometerUnit"
                                    control={control}
                                    rules={{ required: "Unit is required" }}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                if (errors.odometerUnit) clearErrors("odometerUnit");
                                            }}
                                            value={field.value}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.odometerUnit ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="km/L">km/L</SelectItem>
                                                <SelectItem value="mpg">mpg</SelectItem>
                                                <SelectItem value="km/kWh">km/kWh</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.odometerUnit && (
                                    <p className="error-text">
                                        {errors.odometerUnit.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Vehicle conditions */}
                {currentStep === 3 && (
                    <div className="space-y-0">
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Condition<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="condition"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.condition) clearErrors("condition")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.condition ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="good">Good</SelectItem>
                                                <SelectItem value="average">Average</SelectItem>
                                                <SelectItem value="bellow-average">Below Average</SelectItem>
                                                <SelectItem value="not-good">Not good</SelectItem>
                                                <SelectItem value="excellent">Excellent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.condition && (
                                    <p className="error-text">{errors.condition.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Accident history<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="accidenthistory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.accidenthistory) clearErrors("accidenthistory")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.accidenthistory ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select Accident History" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.accidenthistory && <p className="error-text">{errors.accidenthistory.message}</p>}
                            </div>
                        </div>
                        {accidenthistory === "Yes" && (
                            <div className="cont">
                                <Label className="custom-label mt-6">
                                    Accident history<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="history"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            rows={5}
                                            {...field}
                                            placeholder=""
                                            className={`custom-input input-textarea  ${errors.history ? "border-red-500" : "border-gray-300"
                                                }`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.history) clearErrors("history")
                                            }}
                                        />
                                    )}
                                />
                                {errors.history && <p className="error-text">{errors.history.message}</p>}
                            </div>
                        )}
                        <div className="register-popup-subcontainer my-6">
                            <div className="cont">
                                <Label className="custom-label">
                                    Service History available<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="shistory"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.shistory) clearErrors("shistory")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.shistory ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select Service History" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.shistory && <p className="error-text">{errors.shistory.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Number of previous owners<span className="text-red-500">*</span>
                                </Label>
                                {/* <Controller
                                    name="owner"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter number of previous owners"
                                            {...field}
                                            className={errors.owner ? "border-red-500" : ""}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.owner) clearErrors("owner")
                                            }}
                                        />
                                    )}
                                /> */}
                                <Controller
                                    name="owner"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter number of previous owners"
                                            type="text"
                                            {...field}
                                            className={`custom-input ${errors.owner ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, "");
                                                field.onChange(numericValue);
                                                if (errors.owner) clearErrors("owner");
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
                                {errors.owner && <p className="error-text">{errors.owner.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    VIN/Chassis number<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="vnumber"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder="Enter chassis number"
                                            {...field}
                                            className={`custom-input ${errors.vnumber ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.vnumber) clearErrors("vnumber")
                                            }}
                                        />
                                    )}
                                />
                                {errors.vnumber && <p className="error-text">{errors.vnumber.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {/* Location */}
                {currentStep === 4 && (
                    <div className="space-y-0">
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    Country<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="automobileCountry"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.automobileCountry) clearErrors("automobileCountry")
                                            }}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.automobileCountry ? "border-red-500" : ""}`}>
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
                                {errors.automobileCountry && <p className="error-text">Country is required</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    State<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="automobileState"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.automobileState) clearErrors("automobileState")
                                            }}
                                            disabled={!watchedpCountry || availableStates.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.automobileState ? "border-red-500" : ""}`}>
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
                                {errors.automobileState && (
                                    <p className="error-text">{errors.automobileState.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">
                                    City<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="automobileCity"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.automobileCity) clearErrors("automobileCity")
                                            }}
                                            disabled={!watchedpState || availableCities.length === 0}
                                        >
                                            <SelectTrigger className={`custom-input ${errors.automobileCity ? "border-red-500" : ""}`}>
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
                                {errors.automobileCity && <p className="error-text">{errors.automobileCity.message}</p>}
                            </div>
                            <div className="cont">
                                <Label className="custom-label mt-3">Zip/postal code</Label>
                                <Controller
                                    name="automobilePincode"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            {...field}
                                            className={`custom-input ${errors.automobilePincode ? "border-red-500" : ""}`}
                                        />
                                    )}
                                />
                                {errors.automobilePincode && (
                                    <p className="error-text">{errors.automobilePincode.message}</p>
                                )}
                            </div>
                        </div>

                    </div>
                )}
                {/* Pricing */}
                {currentStep === 5 && (
                    <div className="space-y-0">
                        <div className="register-popup-subcontainer">
                            <div className="cont">
                                <Label className="custom-label">
                                    Asking price<span className="text-red-500">*</span>(Dollar)
                                </Label>
                                {/* <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            placeholder=""
                                            {...field}
                                            className={errors.price ? "border-red-500" : ""}
                                            onChange={(e) => {
                                                field.onChange(e)
                                                if (errors.price) clearErrors("price")
                                            }}
                                        />
                                    )}
                                /> */}
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
                                {errors.price && (
                                    <p className="error-text">{errors.price.message}</p>
                                )}
                            </div>
                            <div className="cont">
                                <Label className="custom-label">
                                    Negotiable
                                </Label>
                                <Controller
                                    name="negotiable"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.negotiable) clearErrors("negotiable")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.negotiable ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select Negotiable" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes</SelectItem>
                                                <SelectItem value="no">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {/* {errors.negotiable && (
                                    <p className="error-text">{errors.negotiable.message}</p>
                                )} */}
                            </div>
                        </div>
                    </div>
                )}
                {/* Additional features */}
                {currentStep === 6 && (
                    <div className="space-y-0">
                        <div className="">
                            <Label className="custom-label">
                                Features
                                {/* <span className="text-red-500">*</span> */}
                            </Label>
                            <div className="flex gap-4 flex-wrap">
                                {automobilefeaturesOptions.map((utility, i) => (
                                    <label key={i} className="checkbox-container">
                                        <input className="custom-checkbox" type="checkbox" value={utility} {...register("mobilefeature")} />
                                        {utility}
                                    </label>
                                ))}
                            </div>

                            <div className="cont mt-6">
                                <Label className="custom-label">
                                    Warranty included<span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="warranty"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ""}
                                            onValueChange={(value: string) => {
                                                field.onChange(value)
                                                if (errors.warranty) clearErrors("warranty")
                                            }}>
                                            <SelectTrigger className={`custom-input ${errors.warranty ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder="Select warranty included" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Yes">Yes</SelectItem>
                                                <SelectItem value="No">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.warranty && <p className="error-text">{errors.warranty.message}</p>}
                            </div>
                            {warranty === "Yes" && (
                                <div className="cont">
                                    <Label className="custom-label mt-6">
                                        Warranty details<span className="text-red-500">*</span>
                                    </Label>
                                    <Controller
                                        name="warrantydetails"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                rows={5}
                                                {...field}
                                                placeholder=""
                                                className={`custom-input input-textarea
                                                     ${errors.warrantydetails ? "border-red-500" : "border-gray-300"
                                                    }`}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (errors.warrantydetails) clearErrors("warrantydetails")
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.warrantydetails && <p className="error-text">{errors.warrantydetails.message}</p>}
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
                                    onClose?.()
                                    router.push("/")
                                }}
                                className="btn-nontransparent"
                            >
                                {`Let's Get Started`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
