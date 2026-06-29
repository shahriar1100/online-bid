"use client"

import type React from "react"
import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "src/components/ui/input"
import { Label } from "src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "src/components/ui/collapsible"
import { automobilefeaturesOptions } from "src/app/data"
import { useForm, Controller, type FieldErrors, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import locationData from "src/app/data/locations.json"
import { toast } from 'sonner'
interface City { name: string; pincode: string }
interface State { name: string; code: string; cities: City[] }

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

export type AutomobileHandle = {
  validateForm: () => void
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitToApi: (external: ExternalListingFields) => Promise<any>
  openSection: (section: string) => void
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFormData: () => any
  isVehicleDetailsValid: () => boolean
  isConditionValid: () => boolean
  isLocationValid: () => boolean
  isPricingValid: () => boolean
  isAdditionalFeaturesValid: () => boolean
}

// Schema
const formSchema = z.object({
  description: z.string().min(10, "Description is min 10 characters").refine((val) => val.trim().split(/\s+/).length <= 1000, {
    message: "Description must not exceed 1000 characters",
  }),
  make: z.string().min(1, "Field is required."),
  model: z.string().min(1, "Model is required."),
  builtInYear: z.string().min(1, "Built-in year is required.").max(4, "Year cannot exceed 4 digits").regex(/^\d*$/, "Only numbers are allowed"),
  body: z.string().min(1, "Body type is required."),
  fuel: z.string().min(1, "Fuel type is required."),
  transmission: z.string().min(1, "Transmission type is required."),
  engine: z.string().min(1, "Engine size is required."),
  drive: z.string().min(1, "Drive type is required."),
  odometer: z.string().min(1, "Odometer is required."),
  odometerUnit: z.string().min(1, "Odometer unit is required."),
  condition: z.string().min(1, "Condtion is required."),
  accidenthistory: z.string().min(1, "Please select Accident History"),
  history: z.string().optional(),
  shistory: z.string().min(1, "Please select Service History"),
  owner: z.string().min(1, "Number of previous owners is required.").regex(/^\d*$/, "Only numbers are allowed"),
  vnumber: z.string().min(1, "VIN/Chassis number is required."),

  automobileCountry: z.string().min(1, "Country is required."),
  automobileState: z.string().min(1, "State is required."),
  automobileCity: z.string().min(1, "City is required."),
  automobilePincode: z.string().optional(),

  price: z.string().min(1, "Price is required.").regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  negotiable: z.string().optional(),

  mobilefeature: z.array(z.string()).optional(),

  warranty: z.string().min(1, "Please select Warranty"),
  warrantydetails: z.string().optional(),
})
.refine((data) => (data.accidenthistory === "Yes" ? !!data.history : true), {
  message: "Accident history details are required",
  path: ["history"],
})
.refine((data) => (data.warranty === "Yes" ? !!data.warrantydetails : true), {
  message: "Warranty details is required",
  path: ["warrantydetails"],
})

type FormInputs = z.infer<typeof formSchema>

const Automobile = forwardRef<AutomobileHandle, { locationType?: string }>((props, ref) => {
  const [vehicleDetailsOpen, setvehicleDetailsOpen] = useState(true)
  const [vehicleConditionOpen, setvehicleConditionOpen] = useState(false)
  const [additionalfeatureDetailsOpen, setadditionalfeatureDetailsOpen] = useState(false)
  const [legalDetailsOpen, setlegalDetailsOpen] = useState(false)
  const [locationDetailsOpen, setlocationDetailsOpen] = useState(false)
  const [availableStates, setAvailableStates] = useState<State[]>([])
  const [availableCities, setAvailableCities] = useState<City[]>([])

  const {
    setValue,
    clearErrors,
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      make: "",
      model: "",
      builtInYear: "",
      body: "",
      fuel: "",
      transmission: "",
      engine: "",
      drive: "",
      odometer: "",
      odometerUnit: "",
      condition: "",
      accidenthistory: "",
      history: "",
      shistory: "",
      owner: "",
      vnumber: "",
      automobileCountry: "",
      automobileCity: "",
      automobileState: "",
      automobilePincode: "",
      price: "",
      negotiable: "",
      mobilefeature: [],
      warranty: "",
      warrantydetails: "",
    },
  })

  const onSubmit = (data: FormInputs) => {
    console.log("Automobile form valid", data)
  }

  // Watchers
  const accidenthistory = watch("accidenthistory")
  const warranty = watch("warranty")
  const watchedpCountry = watch("automobileCountry")
  const watchedpState = watch("automobileState")
  const watchedpCity = watch("automobileCity")

  // Clear dependents on No (better UX)
  useEffect(() => {
    if (accidenthistory !== "Yes") {
      setValue("history", "")
      clearErrors("history")
    }
  }, [accidenthistory, setValue, clearErrors])

  useEffect(() => {
    if (warranty !== "Yes") {
      setValue("warrantydetails", "")
      clearErrors("warrantydetails")
    }
  }, [warranty, setValue, clearErrors])

  // Location cascade
  useEffect(() => {
    if (watchedpCountry) {
      const country = locationData.countries.find((c) => c.name === watchedpCountry)
      if (country) {
        setAvailableStates(country.states)
        setValue("automobileState", "")
        setValue("automobileCity", "")
        setValue("automobilePincode", "")
        setAvailableCities([])
      }
    } else {
      setAvailableStates([])
      setAvailableCities([])
    }
  }, [watchedpCountry, setValue])

  useEffect(() => {
    if (watchedpState && availableStates.length > 0) {
      const state = availableStates.find((s) => s.name === watchedpState)
      if (state) {
        setAvailableCities(state.cities)
        setValue("automobileCity", "")
        setValue("automobilePincode", "")
      }
    } else {
      setAvailableCities([])
    }
  }, [watchedpState, availableStates, setValue])

  useEffect(() => {
    if (watchedpCity && availableCities.length > 0) {
      const city = availableCities.find((c) => c.name === watchedpCity)
      if (city) setValue("automobilePincode", city.pincode)
    }
  }, [watchedpCity, availableCities, setValue])

  const onInvalid = (invalidFields: FieldErrors<FormInputs>) => {
    const first = Object.keys(invalidFields)[0] as Path<FormInputs>
    if (!first) return

    if (["make", "model", "builtInYear", "body", "fuel", "transmission", "engine", "drive", "odometer", "odometerUnit"].includes(first)) {
      setvehicleDetailsOpen(true)
    } else if (["condition", "accidenthistory", "shistory", "owner", "vnumber", "history"].includes(first)) {
      if (getValues("accidenthistory") === "Yes") trigger(["history"])
      setvehicleConditionOpen(true)
    } else if (["automobileCountry", "automobileCity", "automobileState", "automobilePincode"].includes(first)) {
      setlocationDetailsOpen(true)
    } else if (["price", "negotiable"].includes(first)) {
      setlegalDetailsOpen(true)
    } else if (["mobilefeature", "warranty", "warrantydetails"].includes(first)) {
      if (getValues("warranty") === "Yes") trigger(["warrantydetails"])
      setadditionalfeatureDetailsOpen(true)
    }
  }

  useImperativeHandle(ref, () => ({
    validateForm: () => handleSubmit(onSubmit, onInvalid)(),

    openSection: (section: string) => {
      // toggle and optionally scroll
      if (section === "vehicleDetails") setvehicleDetailsOpen(true)
      if (section === "vehicleCondition") setvehicleConditionOpen(true)
      if (section === "location") setlocationDetailsOpen(true)
      if (section === "legal") setlegalDetailsOpen(true)
      if (section === "additionalfeature") setadditionalfeatureDetailsOpen(true)
    },

    getFormData: () => getValues(),

    isVehicleDetailsValid: () => {
      const v = getValues()
      return !!(v.make && v.model && v.builtInYear && v.body && v.fuel && v.transmission && v.engine && v.drive && v.odometer && v.odometerUnit)
    },

    isConditionValid: () => {
      const v = getValues()
      return !!(v.condition && v.accidenthistory && v.shistory && v.owner && v.vnumber && (v.accidenthistory !== "Yes" || v.history))
    },

    isLocationValid: () => {
      const v = getValues()
      return !!(v.automobileCountry && v.automobileState && v.automobileCity)
    },

    isPricingValid: () => {
      const v = getValues()
      return !!v.price
    },

    isAdditionalFeaturesValid: () => {
      const v = getValues()
      return !!(v.warranty && (v.warranty !== "Yes" || v.warrantydetails))
    },

    submitToApi: (external: ExternalListingFields) =>
      new Promise((resolve, reject) => {
        handleSubmit(
          async (data) => {
            try {
              // Resolve userId
              let userId = external.userId
              if (!userId) {
                const stored = localStorage.getItem("user")
                userId = stored ? JSON.parse(stored)?.id : undefined
              }
              if (!userId) {
                toast.error("Please login to continue.")
                return reject(new Error("No userId found"))
              }

              const payload = {
                userId: Number(userId),

                // From parent
                title: external.title || "",
                category: external.category || "",
                subcategory: external.subcategory || "",
                auctionType: external.auctionType || "",
                duration: external.duration || "",
                media: (external.mediaFiles || []).map((f) => ({ name: f.name, size: f.size, type: f.type })),
                status: external.status,
                // From inside form
                description: data.description || "",
                make: data.make || "",
                model: data.model || "",
                builtInYear: data.builtInYear || "",
                body: data.body || "",
                fuel: data.fuel || "",
                transmission: data.transmission || "",
                engine: data.engine || "",
                drive: data.drive || "",
                odometer: data.odometer || "",
                odometerUnit: data.odometerUnit || "",
                condition: data.condition || "",
                accidenthistory: data.accidenthistory || "",
                history: data.history || "",
                shistory: data.shistory || "",
                owner: data.owner || "",
                vnumber: data.vnumber || "",

                automobileCountry: data.automobileCountry || "",
                automobileState: data.automobileState || "",
                automobileCity: data.automobileCity || "",
                automobilePincode: data.automobilePincode || "",

                price: data.price || "",
                negotiable: data.negotiable || "",
                mobilefeature: data.mobilefeature || [],
                warranty: data.warranty || "",
                warrantydetails: data.warrantydetails || "",
              }

              // Update endpoint if yours differs
              const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/automobile`, {
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

              toast.success("Automobile listing submitted successfully!")
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

  const handleSectionToggle = (section: string) => {
    if (section === "vehicleDetails") {
      setvehicleDetailsOpen(!vehicleDetailsOpen)
      setvehicleConditionOpen(false)
      setadditionalfeatureDetailsOpen(false)
      setlegalDetailsOpen(false)
      setlocationDetailsOpen(false)
    } else if (section === "vehicleCondition") {
      setvehicleConditionOpen(!vehicleConditionOpen)
      setvehicleDetailsOpen(false)
      setadditionalfeatureDetailsOpen(false)
      setlegalDetailsOpen(false)
      setlocationDetailsOpen(false)
    } else if (section === "location") {
      setlocationDetailsOpen(!locationDetailsOpen)
      setvehicleDetailsOpen(false)
      setvehicleConditionOpen(false)
      setadditionalfeatureDetailsOpen(false)
    } else if (section === "legal") {
      setlegalDetailsOpen(!legalDetailsOpen)
      setvehicleDetailsOpen(false)
      setvehicleConditionOpen(false)
      setadditionalfeatureDetailsOpen(false)
      setlocationDetailsOpen(false)
    } else if (section === "additionalfeature") {
      setadditionalfeatureDetailsOpen(!additionalfeatureDetailsOpen)
      setvehicleDetailsOpen(false)
      setvehicleConditionOpen(false)
      setlegalDetailsOpen(false)
      setlocationDetailsOpen(false)
    }
  }

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
          <div className="cont mb-6">
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
                  placeholder="Write a detailed description of your automobile…."
                  className={`custom-input input-textarea ${errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                />
              )}
            />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>
          {/* Vehicle details */}
          <Collapsible open={vehicleDetailsOpen} onOpenChange={() => handleSectionToggle("vehicleDetails")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Vehicle details</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${vehicleDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Make<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder=""
                      {...register("make")}
                      className={`custom-input ${errors.make ? "border-red-500" : ""}`}
                    />
                    {errors.make && (
                      <p className="error-text">{errors.make.message}</p>
                    )}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      Model<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder=""
                      {...register("model")}
                      className={`custom-input ${errors.model ? "border-red-500" : ""}`}
                    />
                    {errors.model && (
                      <p className="error-text">{errors.model.message}</p>
                    )}
                  </div>
                  <div className="cont">
                    <Label className="text-sm mb-2 block">
                      Year<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="YYYY"
                      {...register("builtInYear")}
                      maxLength={4}
                      className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, "").slice(0, 4);
                        e.target.value = numericValue;

                        if (numericValue && errors.builtInYear) {
                          clearErrors("builtInYear");
                        }
                      }}
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className={`custom-input ${errors.body ? "border-red-500" : ""}`}>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className="custom-input">
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className={`custom-input ${errors.transmission ? "border-red-500" : ""}`}>
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
                    <Input
                      placeholder="Enter engine size"
                      {...register("engine")}
                      className={`custom-input ${errors.engine ? "border-red-500" : ""}`}
                    />
                    {errors.engine && (
                      <p className="error-text">{errors.engine.message}</p>
                    )}
                  </div>
                  {/* <div>
                    <Label className="custom-label">
                      Drive type<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter drive type"
                      {...register("drive")}
                      className={errors.drive ? "border-red-500" : ""}
                    />
                    {errors.drive && (
                      <p className="error-text">{errors.drive.message}</p>
                    )}
                  </div> */}
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
                  <div className="cont">
                    <Label className="custom-label">
                      Odometer/Mileage<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder=""
                      {...register("odometer")}
                      className={`custom-input ${errors.odometer ? "border-red-500" : ""}`}
                    />
                    {errors.odometer && (
                      <p className="error-text">{errors.odometer.message}</p>
                    )}
                  </div>
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
            </CollapsibleContent>
          </Collapsible>

          {/* Vehicle conditions */}
          <Collapsible open={vehicleConditionOpen} onOpenChange={() => handleSectionToggle("vehicleCondition")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Vehicle conditions</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${vehicleConditionOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Condition<span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="condition"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className={`custom-input ${errors.condition ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select Condition" />
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                          className={`custom-input input-textarea ${errors.history ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                      )}
                    />
                    {errors.history && <p className="error-text">{errors.history.message}</p>}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Service History available<span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="shistory"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                    <Input
                      placeholder="Enter number of previous owners"
                      {...register("owner")}
                      className={errors.owner ? "border-red-500" : ""}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, "");
                        e.target.value = numericValue;
                        if (numericValue && errors.owner) {
                          clearErrors("owner");
                        }
                      }}
                    />
                    {errors.owner && <p className="error-text">{errors.owner.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">
                      VIN/Chassis number<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter chassis number"
                      {...register("vnumber")}
                      className={`custom-input ${errors.vnumber ? "border-red-500" : ""}`}
                    />
                    {errors.vnumber && <p className="error-text">{errors.vnumber.message}</p>}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Location */}
          <Collapsible open={locationDetailsOpen} onOpenChange={() => handleSectionToggle("location")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Location</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${locationDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
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
                            {locationData.countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
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
                    <Label className="custom-label">
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
                              <SelectItem key={state.code} value={state.name}>
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
                    <Label className="custom-label">
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
                    <Label className="custom-label">Zip/postal code</Label>
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
            </CollapsibleContent>
          </Collapsible>

          {/* Pricing */}
          <Collapsible open={legalDetailsOpen} onOpenChange={() => handleSectionToggle("legal")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Pricing</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${legalDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="cont">
                    <Label className="custom-label">
                      Asking price<span className="text-red-500">*</span> (Dollar)
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter Price"
                      {...register("price")}
                      className={`custom-input ${errors.price ? "border-red-500" : ""}`}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, "");
                        e.target.value = numericValue;
                        if (numericValue && errors.price) {
                          clearErrors("price");
                        }
                      }}
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger className="custom-input">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Additional features */}
          <Collapsible open={additionalfeatureDetailsOpen} onOpenChange={() => handleSectionToggle("additionalfeature")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Additional features</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${additionalfeatureDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="flex gap-4 flex-wrap">
                  {automobilefeaturesOptions.map((utility, i) => (
                    <label key={i} className="checkbox-container">
                      <input className="custom-checkbox" type="checkbox" value={utility} {...register("mobilefeature")} />
                      {utility}
                    </label>
                  ))}
                </div>

                <div className="cont">
                  <Label className="custom-label">
                    Warranty included<span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="warranty"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
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
                          className={`custom-input input-textarea ${errors.warrantydetails ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                      )}
                    />
                    {errors.warrantydetails && <p className="error-text">{errors.warrantydetails.message}</p>}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </>
  )
})

Automobile.displayName = "Automobile"

export default Automobile
