"use client"
import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Input } from "src/components/ui/input"
import { Label } from "src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "src/components/ui/collapsible"
import { featuresOptions, utilitiesOptions } from "src/app/data"
import { useForm, Controller, type FieldErrors, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import locationData from "src/app/data/locations.json"
import { Checkbox } from "src/components/ui/checkbox"
import { Calendar } from "src/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog"
import { formatForStorage, formatForDisplay } from "src/lib/date-utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "../ui/button"
import { toast } from 'sonner'
import DateTimePicker from "../ui/real-custom-calender"
interface City {
  name: string
  pincode: string
}

interface State {
  name: string
  code: string
  cities: City[]
}

type ExternalListingFields = {
  title: string
  category: string
  subcategory: string
  auctionType: string
  duration: string
  mediaFiles: File[]
  status: string   
  userId?: number
}

export type RealStateHandle = {
  validateForm: () => void
  openSection: (section: string) => void
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFormData: () => any
  isPropertyInfoValid: () => boolean
  isPropertyDetailsValid: () => boolean
  isAuctionDetailsValid: () => boolean
  isLegalValid: () => boolean
  isContactValid: () => boolean
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitToApi: (external: ExternalListingFields) => Promise<any>
}

const RealState = forwardRef<RealStateHandle, { auctionType?: string; subcategory?: string }>(
  (props, ref) => {
  const [propertyInformationOpen, setpropertyInformationOpen] = useState(true)
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(false)
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false)
  const [legalDetailsOpen, setlegalDetailsOpen] = useState(false)
  const [auctionDetailsOpen, setauctionDetailsOpen] = useState(false)
  const [termsDetailsOpen, settermsDetailsOpen] = useState(false)
  const [availableStates, setAvailableStates] = useState<State[]>([])
  const [availableCities, setAvailableCities] = useState<City[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  
  // const realStateRef = useRef<any>(null)

  const { auctionType, subcategory } = props

  // Define the Zod schema inside the component to access props.auctionType
  const formSchema = z
    .object({
      description: z
        .string()
        .min(10, "Description is min 10 characters")
        .refine((val) => val.trim().split(/\s+/).length <= 1000, {
          message: "Description must not exceed 1000 characters",
        }),
      propertyAddress: z.string().min(1, "Address is required."),
      propertyCountry: z.string().min(1, "Country is required."),
      propertyState: z.string().min(1, "State is required."),
      propertyCity: z.string().min(1, "City is required."),
      propertyPincode: z.string().optional(),
      bedroom: z.string().optional(),
      // bedroom: z
      //   .string()
      //   .regex(/^[0-9]+$/, "Bedroom is required.")
      //   .min(1, "Bedroom is required."),
      bathroom: z.string().optional(),
      // .string()
      // .regex(/^[0-9]+$/, "Bathroom is required.")
      // .min(1, "Bathroom is required."),
      area: z
        .string()
        .regex(/^[0-9]+$/, "Area is required.")
        .min(1, "Area is required."),
      price: z.string().min(1, "Lot is required."),
      builtInYear: z
        .string()
        .min(1, "Built-in year is required.")
        .max(4, "Year cannot exceed 4 digits")
        .regex(/^\d*$/, "Only numbers are allowed"),
      furnishing: z.string().optional(),
      parkingSpaces: z.string().optional(),
      utilities: z.array(z.string()).optional(),
      features: z.array(z.string()).optional(),
      auctionPrice: z
        .string()
        .min(1, "Price is required.")
        .regex(/^[0-9]+$/, "Only numbers are allowed"),
      auctionDate: z.string().min(1, "Date/Time is required"),
      expiry: z.string().optional(),
      ownershiptype: z
        .string()
        .min(1, "Type is required")
        .regex(/^[A-Za-z\s]+$/, "Only letters are allowed"),
      ownershiptitle: z
        .string()
        .min(1, "Title is required")
        .regex(/^[A-Za-z\s]+$/, "Only letters are allowed"),
      legalDescription: z.string().optional(),
      contactName: z
        .string()
        .regex(/^[A-Za-z\s]+$/, "Name is required")
        .min(1, "Name/Business name is required."),
      contactPhone: z.string().regex(/^\d{10}$/, "Phone number must be required"),
      contactEmail: z.string().email("Invalid email address.").min(1, "Email is required."),
      isAgent: z.string().min(1, "Please select Agent/Broker"),
      licenseNumber: z.string().optional(),
      authorizedToSell: z.boolean().refine((val) => val === true, {
        message: "You must confirm authorization to sell",
      }),
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to terms and conditions",
      }),
      media: z
        .array(z.any())
        .min(1, "At least one media file is required")
        .max(10, "You can upload a maximum of 10 files"),
    })
    .refine(
      (data) => {
        if (data.isAgent === "Yes" && !data.licenseNumber) {
          return false
        }
        return true
      },
      {
        message: "License number is required when Agent/Broker is Yes",
        path: ["licenseNumber"],
      },
    )
    .refine(
      (data) => {
        if (auctionType === "rent" && !data.expiry) {
          return false
        }
        return true
      },
      {
        message: "Lease expiry date is required",
        path: ["expiry"],
      },
    )

  type FormInputs = z.infer<typeof formSchema>


  const handleSectionToggle = (section: string) => {
    if (section === "propertyInformation") {
      setpropertyInformationOpen(true)
      setPropertyDetailsOpen(false)
      setContactDetailsOpen(false)
      setlegalDetailsOpen(false)
      setauctionDetailsOpen(false)
      settermsDetailsOpen(false)
    } else if (section === "propertydetails") {
      setPropertyDetailsOpen(true)
      setpropertyInformationOpen(false)
      setContactDetailsOpen(false)
      setlegalDetailsOpen(false)
      setauctionDetailsOpen(false)
      settermsDetailsOpen(false)
    } else if (section === "auction") {
      setauctionDetailsOpen(true)
      setpropertyInformationOpen(false)
      setPropertyDetailsOpen(false)
      setContactDetailsOpen(false)
      settermsDetailsOpen(false)
      setlegalDetailsOpen(false)
    } else if (section === "legal") {
      setlegalDetailsOpen(true)
      setpropertyInformationOpen(false)
      setPropertyDetailsOpen(false)
      setContactDetailsOpen(false)
      setauctionDetailsOpen(false)
      settermsDetailsOpen(false)
    } else if (section === "contact") {
      setContactDetailsOpen(true)
      setpropertyInformationOpen(false)
      setPropertyDetailsOpen(false)
      setlegalDetailsOpen(false)
      setauctionDetailsOpen(false)
      settermsDetailsOpen(false)
    } else if (section === "terms") {
      settermsDetailsOpen(true)
      setpropertyInformationOpen(false)
      setPropertyDetailsOpen(false)
      setContactDetailsOpen(false)
      setlegalDetailsOpen(false)
      setauctionDetailsOpen(false)
    }
  }

  // validation
  const {
    setValue,
    clearErrors,
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bedroom: "",
      bathroom: "",
      price: "",
      area: "",
      builtInYear: "",
      furnishing: "",
      parkingSpaces: "yes",
      auctionPrice: "",
      auctionDate: "",
      expiry: "",
      ownershiptype: "",
      ownershiptitle: "",
      // ownershipstatus: "",
      legalDescription: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      description: "",
      media: [],
      propertyAddress: "",
      propertyCity: "",
      propertyState: "",
      propertyPincode: "",
      utilities: [],
      features: [],
      isAgent: "",
      licenseNumber: "",
      authorizedToSell: false,
      agreeTerms: false,
    },
  })

  const onSubmit = (data: FormInputs) => {
  console.log("Inside form valid", data)
}

 useImperativeHandle(ref, () => ({
  validateForm: () => {
    handleSubmit(onSubmit, onInvalid)()
  },

  openSection: (section: string) => {
    handleSectionToggle(section)
    setTimeout(() => {
      const element = document.querySelector(`[data-section="${section}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  },

  getFormData: () => getValues(),

  isPropertyInfoValid: () => {
    const v = getValues()
    return !!(v.propertyAddress && v.propertyCountry && v.propertyState && v.propertyCity)
  },

  isPropertyDetailsValid: () => {
    const v = getValues()
    return !!(v.bedroom && v.bathroom && v.area && v.price && v.builtInYear && v.furnishing)
  },

  isAuctionDetailsValid: () => {
    const v = getValues()
    return !!(v.auctionPrice && v.auctionDate)
  },

  isLegalValid: () => {
    const v = getValues()
    return !!(v.ownershiptype && v.ownershiptitle)
  },

  isContactValid: () => {
    const v = getValues()
    return !!(
      v.contactName &&
      v.contactPhone &&
      v.contactEmail &&
      v.isAgent &&
      (v.isAgent !== "Yes" || v.licenseNumber)
    )
  },

  submitToApi: (external: ExternalListingFields) =>
    new Promise((resolve, reject) => {
      // feed media from parent so validation passes (if media is in schema)
      if (external?.mediaFiles?.length) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue("media", external.mediaFiles as any)
        clearErrors("media")
      }

      handleSubmit(
        async (data) => {
          try {
            // resolve userId
            let userId = external.userId
            if (!userId) {
              const storedUser = localStorage.getItem("user")
              userId = storedUser ? JSON.parse(storedUser)?.id : undefined
            }
            if (!userId) {
              toast.error("Please login to continue.")
              return reject(new Error("No userId found"))
            }

            const payload = {
              userId: Number(userId),
              // from parent
              title: external.title || "",
              category: external.category || "",
              subcategory: external.subcategory || (props.subcategory || ""),
              auctionType: external.auctionType || (props.auctionType || ""),
              duration: external.duration || "",
              media: (external.mediaFiles || []).map((f) => ({ name: f.name, size: f.size, type: f.type })),
              status: external.status,
              description: data.description || "",
              propertyAddress: data.propertyAddress || "",
              propertyCountry: data.propertyCountry || "",
              propertyState: data.propertyState || "",
              propertyCity: data.propertyCity || "",
              propertyPincode: data.propertyPincode || "",
              bedroom: data.bedroom || "",
              bathroom: data.bathroom || "",
              area: data.area || "",
              price: data.price || "",
              builtInYear: data.builtInYear || "",
              furnishing: data.furnishing || "",
              parkingSpaces: data.parkingSpaces || "yes",
              utilities: data.utilities || [],
              features: data.features || [],
              auctionPrice: data.auctionPrice || "",
              auctionDate: data.auctionDate || "",
              expiry: data.expiry || undefined,
              ownershiptype: data.ownershiptype || "",
              ownershiptitle: data.ownershiptitle || "",
              ownershipstatus: "",
              legalDescription: data.legalDescription || "",
              contactName: data.contactName.trim(),
              contactPhone: data.contactPhone || "",
              contactEmail: data.contactEmail.trim(),
              isAgent: data.isAgent || "",
              licenseNumber: data.licenseNumber || "",
              authorizedToSell: Boolean(data.authorizedToSell),
              agreeTerms: Boolean(data.agreeTerms),
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/realestate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

            const text = await res.text()
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let result: any
            try {
              result = JSON.parse(text)
            } catch {
              throw new Error("Invalid response format")
            }

            if (!result?.success) {
              console.error("API error:", result)
              toast.error(result?.error || "Failed to save listing")
              return reject(result)
            }

            toast.success("Real estate listing submitted successfully!")
            resolve(result)
          } catch (err) {
            console.error("Submit error:", err)
            toast.error(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`)
            reject(err)
          }
        },
        (invalid) => {
          onInvalid(invalid)
          reject(invalid)
        },
      )()
    }),
}))
  const isAgent = watch("isAgent")

  //property location
  const watchedpCountry = watch("propertyCountry")
  const watchedpState = watch("propertyState")
  const watchedpCity = watch("propertyCity")
  const watchedDescription = watch("description")

  useEffect(() => {
    if (watchedpCountry) {
      const selectedCountry = locationData.countries.find((country) => country.name === watchedpCountry)
      if (selectedCountry) {
        setAvailableStates(selectedCountry.states)
        // Reset dependent fields
        setValue("propertyState", "")
        setValue("propertyCity", "")
        setValue("propertyPincode", "")
        setAvailableCities([])
      }
    } else {
      setAvailableStates([])
      setAvailableCities([])
    }
  }, [watchedpCountry, setValue])

  useEffect(() => {
    if (watchedpState && availableStates.length > 0) {
      const selectedState = availableStates.find((state) => state.name === watchedpState)
      if (selectedState) {
        setAvailableCities(selectedState.cities)
        // Reset dependent fields
        setValue("propertyCity", "")
        setValue("propertyPincode", "")
      }
    } else {
      setAvailableCities([])
    }
  }, [watchedpState, availableStates, setValue])

  useEffect(() => {
    if (watchedpCity && availableCities.length > 0) {
      const selectedCity = availableCities.find((city) => city.name === watchedpCity)
      if (selectedCity) {
        setValue("propertyPincode", selectedCity.pincode)
      }
    }
  }, [watchedpCity, availableCities, setValue])

  const onInvalid = (invalidFields: FieldErrors<FormInputs>) => {
    
    const firstErrorFieldName = Object.keys(invalidFields)[0] as Path<FormInputs>
    if (firstErrorFieldName) {
      if (watchedDescription) {
        let sectionToOpen = ""
        if (
          ["propertyAddress", "propertyCountry", "propertyCity", "propertyState", "propertyPincode"].includes(
            firstErrorFieldName,
          )
        ) {
          sectionToOpen = "propertyInformation"
        } else if (
          [
            "bedroom", "bathroom",
            "area", "price", "builtInYear",
            "furnishing"
          ].includes(
            firstErrorFieldName,
          )
        ) {
          sectionToOpen = "propertydetails"
        } else if (["auctionPrice", "auctionDate"].includes(firstErrorFieldName)) {
          sectionToOpen = "auction"
        } else if (
          ["ownershiptype", "ownershiptitle", "ownershipstatus", "legalDescription"].includes(firstErrorFieldName)
        ) {
          sectionToOpen = "legal"
        } else if (["contactName", "contactPhone", "contactEmail", "isAgent", "licenseNumber"].includes(firstErrorFieldName)) {
          sectionToOpen = "contact"
        } else if (["authorizedToSell", "agreeTerms"].includes(firstErrorFieldName)) {
          sectionToOpen = "terms"
        }

        handleSectionToggle(sectionToOpen)
        setTimeout(() => {
          const element = document.querySelector(`[data-section="${sectionToOpen}"]`)
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 100)
      }
    }
  }

  const handleDateTimeSelect = (date: Date | null, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    // Store in DB format: DD/MM/YYYY HH:mm
    setValue("auctionDate", date && time ? formatForStorage(date, time) : "")
    if (errors.auctionDate) clearErrors("auctionDate")
    setIsCalendarOpen(false)
  }

  const handleCalendarClose = () => {
    setIsCalendarOpen(false)
  }
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen">
        {/* Left */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <Input
              placeholder="Enter your advertisement title here…"
              className={`custom-input`}
            />
          </div>

          {/* Description */}
          <div>
            <Label className="custom-label">
              Description<span className="text-red-500">*</span>(Max. 1000 characters)
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  rows={10}
                  {...field}
                  placeholder="Write a detailed description of your property..."
                  className={`custom-input input-textarea ${errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                />
              )}
            />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>
          {/* Property information */}
          <Collapsible open={propertyInformationOpen} onOpenChange={() => handleSectionToggle("propertyInformation")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="propertyInformation"
            >
              <span className="font-medium">Property information</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${propertyInformationOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="cont">
                  <Label className="custom-label">
                    Address<span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="propertyAddress"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        rows={4}
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
                  {errors.propertyAddress && (
                    <p className="error-text">{errors.propertyAddress.message}</p>
                  )}
                </div>
                <div className="flex justify-center items-start gap-4">
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
                            {locationData.countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
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
                              <SelectItem key={state.code} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.propertyState && (
                      <p className="error-text">{errors.propertyState.message}</p>
                    )}
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
                        <Input placeholder="" {...field}
                          className={`custom-input ${errors.propertyPincode ? "border-red-500" : ""}`} />
                      )}
                    />
                    {errors.propertyPincode && (
                      <p className="error-text">{errors.propertyPincode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Property features */}
          <Collapsible open={propertyDetailsOpen} onOpenChange={() => handleSectionToggle("propertydetails")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="propertydetails"
            >
              <span className="font-medium">Property features</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${propertyDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                {subcategory === "Vacant land" ? (
                  // Show only 3 fields for Vacant land
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="cont">
                      <Label className="custom-label">
                        Floor area<span className="text-red-500">*</span> (Sq. ft.)
                      </Label>
                      <Input
                        placeholder="Sq. ft."
                        {...register("area")}
                        className={`custom-input ${errors.area ? "border-red-500" : ""}`}
                      />
                      {errors.area && <p className="error-text">{errors.area.message}</p>}
                    </div>
                    <div className="cont">
                      <Label className="custom-label">
                        Lot size<span className="text-red-500">*</span>
                      </Label>
                      <Input placeholder="" {...register("price")}
                        className={`custom-input ${errors.price ? "border-red-500" : ""}`}
                      />
                      {errors.price && <p className="error-text">{errors.price.message}</p>}
                    </div>
                    <div className="cont">
                      <Label className="text-sm mb-2 block">
                        Year built<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="YYYY"
                        {...register("builtInYear")}
                        className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                      />
                      {errors.builtInYear && <p className="error-text">{errors.builtInYear.message}</p>}
                    </div>
                  </div>
                ) : (
                  // Show all fields for other subcategories
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="cont">
                        <Label className="custom-label">
                          Bedroom
                        </Label>
                        <Input
                          type="text"
                          placeholder="No. of bedroom"
                          {...register("bedroom")}
                          className={`custom-input ${errors.bedroom ? "border-red-500" : ""}`}
                          onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "")
                          }}
                        />
                        {errors.bedroom && <p className="error-text">{errors.bedroom.message}</p>}
                      </div>

                      <div className="cont">
                        <Label className="custom-label">
                          Bathroom
                        </Label>
                        <Input
                          type="text"
                          placeholder="No. of bathroom"
                          {...register("bathroom")}
                          className={`custom-input ${errors.bathroom ? "border-red-500" : ""}`}
                          onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "")
                          }}
                        />
                        {errors.bathroom && <p className="error-text">{errors.bathroom.message}</p>}
                      </div>

                      <div className="cont">
                        <Label className="custom-label">
                          Floor area <span className="text-red-500">*</span> (Sq. ft.)
                        </Label>
                        <Input
                          type="text"
                          placeholder="Sq. ft."
                          {...register("area")}
                          className={`custom-input ${errors.area ? "border-red-500" : ""}`}
                          onInput={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "")
                          }}
                        />
                        {errors.area && <p className="error-text">{errors.area.message}</p>}
                      </div>

                      <div className="cont">
                        <Label className="custom-label">
                          Lot size<span className="text-red-500">*</span>
                        </Label>
                        <Input placeholder="" {...register("price")}
                          className={`custom-input ${errors.price ? "border-red-500" : ""}`}
                        />
                        {errors.price && <p className="error-text">{errors.price.message}</p>}
                      </div>
                    </div>

                    <div>
                      {/* <h4 className="font-medium mb-4">2. Construction details</h4> */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="cont">
                          <Label className="text-sm mb-2 block">
                            Year built<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="YYYY"
                            {...register("builtInYear")}
                            maxLength={4}
                            className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/\D/g, "").slice(0, 4)
                              e.target.value = numericValue

                              if (numericValue && errors.builtInYear) {
                                clearErrors("builtInYear")
                              }
                            }}
                          />
                          {errors.builtInYear && (
                            <p className="error-text">{errors.builtInYear.message}</p>
                          )}
                        </div>
                        <div className="cont">
                          <Label className="custom-label">Parking spaces</Label>
                          <Controller
                            name="parkingSpaces"
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
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
                          <Label className="text-sm mb-2 block">
                            Furnishing
                          </Label>
                          <Controller
                            name="furnishing"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
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
                          {errors.furnishing && (
                            <p className="error-text">{errors.furnishing.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="cont">
                      <label className="custom-label">Utilities included</label>
                      <div className="flex gap-4 flex-wrap">
                        {utilitiesOptions.map((utility, i) => (
                          <label key={i} className="checkbox-container">
                            <input className="custom-checkbox" type="checkbox" value={utility} {...register("utilities")} />
                            {utility}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="cont">
                      <label className="custom-label">Additional features</label>
                      <div className="flex gap-4 flex-wrap">
                        {featuresOptions.map((feature, i) => (
                          <label key={i} className="checkbox-container">
                            <input className="custom-checkbox" type="checkbox" value={feature} {...register("features")} />
                            {feature}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <div></div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Auction Details */}
          <Collapsible open={auctionDetailsOpen} onOpenChange={() => handleSectionToggle("auction")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="auction"
            >
              <span className="font-medium">Auction details</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${auctionDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Starting bid price<span className="text-red-500">*</span>(Dollar)
                    </Label>
                    <Input
                      placeholder="Enter price"
                      {...register("auctionPrice")}
                      className={`custom-input ${errors.auctionPrice ? "border-red-500" : ""}`}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "")
                      }}
                    />
                    {errors.auctionPrice && <p className="error-text">{errors.auctionPrice.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      Inspection Date/Time<span className="text-red-500">*</span>
                    </Label>
                    <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`custom-input input-calender ${errors.auctionDate ? "border-red-500" : ""}`}
                          onClick={() => setIsCalendarOpen(true)}
                        >
                          {selectedDate ? formatForDisplay(selectedDate, selectedTime) : "Add time/days"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="custom-dialog-content">
                        <VisuallyHidden>
                          <DialogTitle>Date and time picker</DialogTitle>
                        </VisuallyHidden>
                        {/* <DateTimePicker
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onSelect={(date, time) => {
                            setSelectedDate(date)
                            setSelectedTime(time)
                            setValue("expiry", date && time ? `${formatDateDDMMYYYY(date)} ${time}` : "")
                            if (errors.expiry) clearErrors("expiry")
                            setIsCalendarOpen(false)
                          }}
                          onClose={() => setIsCalendarOpen(false)}
                        /> */}
                        <DateTimePicker
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onSelect={handleDateTimeSelect}
                          onClose={handleCalendarClose}
                        />
                      </DialogContent>
                    </Dialog>
                    {errors.auctionDate && <p className="error-text">{errors.auctionDate.message}</p>}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Legal & ownership details */}
          <Collapsible open={legalDetailsOpen} onOpenChange={() => handleSectionToggle("legal")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="legal"
            >
              <span className="font-medium">Legal & ownership details</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${legalDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Ownership type<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter Ownership type"
                      {...register("ownershiptype")}
                      className={`custom-input ${errors.ownershiptype ? "border-red-500" : ""}`}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s]/g, "")
                      }}
                    />
                    {errors.ownershiptype && (
                      <p className="error-text">{errors.ownershiptype.message}</p>
                    )}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      Title status<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter Ownership status"
                      {...register("ownershiptitle")}
                      className={`custom-input ${errors.ownershiptitle ? "border-red-500" : ""}`}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s]/g, "")
                      }}
                    />
                    {errors.ownershiptitle && (
                      <p className="error-text">{errors.ownershiptitle.message}</p>
                    )}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">Zoning</Label>
                    <Input className="custom-input" placeholder="Enter zoning" />
                  </div>
                </div>

                {auctionType === "rent" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* <div>
                      <Label className="custom-label">
                        Tenancy status<span className="text-red-500">*</span>(If rented)
                      </Label>
                      <Input
                        placeholder="Enter Tenancy status"
                        {...register("ownershipstatus")}
                        className={errors.ownershipstatus ? "border-red-500" : ""}
                      />
                      {errors.ownershipstatus && (
                        <p className="error-text">{errors.ownershipstatus.message}</p>
                      )}
                    </div> */}
                    {/* <div>
                      <Label className="custom-label">
                        Monthly rent<span className="text-red-500">*</span>
                      </Label>
                      <Input placeholder="Enter monthly rent" />
                    </div> */}
                    <div className="cont">
                      <Label className="custom-label">
                        Lease expiry date
                      </Label>
                      {/* <Input placeholder="MM/DD/YYYY" /> */}
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
                                    placeholder="DD/MM/YYYY"
                                    value={
                                      field.value
                                        ? format(new Date(field.value), "dd/MM/yyyy")
                                        : format(new Date(), "dd/MM/yyyy")
                                    }
                                    className={`custom-input input-calender`}
                                  />
                                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="custom-popover-content">
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
                        className="custom-input input-textarea"
                      />
                    )}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seller & agent contact info */}
          <Collapsible open={contactDetailsOpen} onOpenChange={() => handleSectionToggle("contact")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="contact"
            >
              <span className="font-medium">Seller & agent contact info</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${contactDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Name<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      {...register("contactName")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z\s]/g, "")
                      }}
                      className={`custom-input ${errors.contactName ? "border-red-500" : ""}`}
                    />

                    {errors.contactName && <p className="error-text">{errors.contactName.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      Phone number<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      {...register("contactPhone")}
                      maxLength={10}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "")
                      }}
                      className={`custom-input ${errors.contactPhone ? "border-red-500" : ""}`}
                    />
                    {errors.contactPhone && <p className="error-text">{errors.contactPhone.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      Email<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter email address"
                      {...register("contactEmail")}
                      className={`custom-input ${errors.contactEmail ? "border-red-500" : ""}`}
                    />
                    {errors.contactEmail && <p className="error-text">{errors.contactEmail.message}</p>}
                  </div>
                </div>
                {/* Agent/Broker + License */}
                <div className="flex items-start justify-between gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Agent/Broker<span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="isAgent"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className={`custom-input ${errors.isAgent ? "border-red-500" : ""}`}>
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
                      <Input
                        placeholder="Enter license number"
                        {...register("licenseNumber")}
                        className={`custom-input ${errors.licenseNumber ? "border-red-500" : ""}`}
                      />
                      {errors.licenseNumber && (
                        <p className="error-text">{errors.licenseNumber.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Terms & Acknowledgements */}
          <Collapsible open={termsDetailsOpen} onOpenChange={() => handleSectionToggle("terms")}>
            <CollapsibleTrigger
              className="custom-trigger"
              data-section="terms"
            >
              <span className="font-medium">Terms & Acknowledgements</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${termsDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="flex items-start space-x-2">
                  <Controller
                    name="authorizedToSell"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="authorizedToSell" checked={field.value} onCheckedChange={field.onChange} />
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
                      <Checkbox id="agreeTerms" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="agreeTerms" className="text-sm">
                    I agree to terms and conditions
                  </Label>
                </div>

                {/* Validation error messages */}
                {errors.authorizedToSell && (
                  <p className="error-text">{errors.authorizedToSell.message}</p>
                )}
                {errors.agreeTerms && <p className="error-text">{errors.agreeTerms.message}</p>}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </>
  )
})

RealState.displayName = "RealState"

export default RealState