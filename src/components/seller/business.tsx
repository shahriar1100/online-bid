"use client"
import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Input } from "src/components/ui/input"
import { Label } from "src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "src/components/ui/collapsible"
import { useForm, Controller, type FieldErrors, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import locationData from "src/app/data/locations.json"
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover"
import { Calendar } from "src/components/ui/calendar"
import { format } from "date-fns"
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

export type BusinessHandle = {
  validateForm: () => void
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitToApi: (external: ExternalListingFields) => Promise<any>
}

const formSchema = z.object({
  description: z.string().min(10, "Description is min 10 characters").refine((val) => val.trim().split(/\s+/).length <= 1000, {
    message: "Description must not exceed 1000 characters",
  }),
  builtInYear: z.string().min(1, "Built-in year is required.").max(4, "Year cannot exceed 4 digits").regex(/^\d*$/, "Only numbers are allowed"),
  businessAddress: z.string().min(1, "Address is required."),
  businessCountry: z.string().min(1, "Country is required."),
  businessState: z.string().min(1, "State is required."),
  businessCity: z.string().min(1, "City is required."),
  businessPincode: z.string().optional(),

  highlight: z.string().min(10, "Key highlight is min 10 characters").refine((val) => val.trim().split(/\s+/).length <= 1000, {
    message: "Description must not exceed 1000 characters",
  }),
  reason: z.string().min(10, "Reason is min 10 characters").refine((val) => val.trim().split(/\s+/).length <= 1000, {
    message: "Description must not exceed 1000 characters",
  }),

  price: z.string().min(1, "Price is required.").regex(/^[0-9]+$/, "Only whole numbers are allowed"),
  revenue: z.string().min(1, "Revenue is required.").regex(/^[0-9]+$/, "Only whole numbers are allowed"),
  profit: z.string().min(1, "Annual profit is required.").regex(/^[0-9]+$/, "Only whole numbers are allowed"),

  assets: z.string().min(10, "Assets is min 10 characters").refine((val) => val.trim().split(/\s+/).length <= 1000, {
    message: "Description must not exceed 1000 characters",
  }),

  inventory: z.enum(["Yes", "No"], { message: "Please select inventory" }),
  inventoryValue: z.string().optional(),

  employes: z.string().regex(/^[0-9]+$/, "Number of employees is required").min(1, "Number of employees is required"),
  involvement: z.string().min(1, "Please select ownership involvement"),
  relocatable: z.string().min(1, "Please select business relocatable"),
  homebase: z.string().min(1, "Please select home-based"),

  franchise: z.enum(["Yes", "No"], { message: "Please select Franchise" }),
  namefranchise: z.string().optional(),

  premises: z.string().min(1, "Please select business premises"),

  monthly: z.string().optional(),
  expiry: z.string().optional(),

  facilitysize: z.string().min(1, "Please enter facility size"),
}).superRefine((data, ctx) => {
  // Inventory → Inventory value required
  if (data.inventory === "Yes" && (!data.inventoryValue || data.inventoryValue.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["inventoryValue"], message: "Estimated inventory value is required" })
  }
  // Franchise → Franchise name required
  if (data.franchise === "Yes" && (!data.namefranchise || data.namefranchise.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["namefranchise"], message: "Franchise name is required" })
  }
  // Monthly required when auctionType is lease
  // We can't read props here; enforce in submitToApi based on external.auctionType,
  // OR accept optional and we ensure in submitToApi before sending (see below).
})

type FormInputs = z.infer<typeof formSchema>

const Business = forwardRef<BusinessHandle, { auctionType?: string }>((props, ref) => {
  const { auctionType } = props
  const [BusinessDetailsOpen, setBusinessDetailsOpen] = useState(true)
  const [BusinessDescriptionOpen, setBusinessDescriptionOpen] = useState(false)
  const [facilitiesDetailsOpen, setfacilitiesDetailsOpen] = useState(false)
  const [operationalDetailsOpen, setoperationalDetailsOpen] = useState(false)
  const [financialInfoOpen, setfinancialInfoOpen] = useState(false)
  const [availableStates, setAvailableStates] = useState<State[]>([])
  const [availableCities, setAvailableCities] = useState<City[]>([])
  const [open, setOpen] = useState(false) // for expiry date popover

  const {
    setValue,
    clearErrors,
    register,
    handleSubmit,
    watch,
    control,
 
    trigger,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      builtInYear: "",
      businessAddress: "",
      businessCountry: "",
      businessState: "",
      businessCity: "",
      businessPincode: "",

      highlight: "",
      reason: "",
      price: "",
      revenue: "",
      profit: "",
      assets: "",

      inventoryValue: "",

      employes: "",
      involvement: "",
      relocatable: "",
      homebase: "",
      namefranchise: "",
      premises: "",

      monthly: "",
      expiry: "",
      facilitysize: "",
    },
  })

  const onSubmit = (data: FormInputs) => {
    console.log("Business form valid", data)
  }

  const inventory = watch("inventory")
  const franchise = watch("franchise")
  const monthly = watch("monthly")

  const watchedCountry = watch("businessCountry")
  const watchedState = watch("businessState")
  const watchedCity = watch("businessCity")

  useEffect(() => {
    if (watchedCountry) {
      const selected = locationData.countries.find((c) => c.name === watchedCountry)
      if (selected) {
        setAvailableStates(selected.states)
        setValue("businessState", "")
        setValue("businessCity", "")
        setValue("businessPincode", "")
        setAvailableCities([])
      }
    } else {
      setAvailableStates([])
      setAvailableCities([])
    }
  }, [watchedCountry, setValue])

  useEffect(() => {
    if (watchedState && availableStates.length > 0) {
      const selected = availableStates.find((s) => s.name === watchedState)
      if (selected) {
        setAvailableCities(selected.cities)
        setValue("businessCity", "")
        setValue("businessPincode", "")
      }
    } else {
      setAvailableCities([])
    }
  }, [watchedState, availableStates, setValue])

  useEffect(() => {
    if (watchedCity && availableCities.length > 0) {
      const selected = availableCities.find((c) => c.name === watchedCity)
      if (selected) setValue("businessPincode", selected.pincode)
    }
  }, [watchedCity, availableCities, setValue])

  const onInvalid = async (invalidFields: FieldErrors<FormInputs>) => {
    const first = Object.keys(invalidFields)[0] as Path<FormInputs>
    if (!first) return

    if (["builtInYear", "businessAddress", "businessCountry", "businessCity", "businessState", "businessPincode"].includes(first)) {
      setBusinessDetailsOpen(true)
    } else if (["highlight", "reason"].includes(first)) {
      setBusinessDescriptionOpen(true)
    } else if (["price", "revenue", "profit", "assets", "inventory", "inventoryValue"].includes(first)) {
      setfinancialInfoOpen(true)
    } else if (["employes", "involvement", "relocatable", "homebase", "franchise", "namefranchise"].includes(first)) {
      setoperationalDetailsOpen(true)
    } else if (["premises", "monthly", "expiry", "facilitysize"].includes(first)) {
      setfacilitiesDetailsOpen(true)
    }
  }

  useImperativeHandle(ref, () => ({
    validateForm: () => handleSubmit(onSubmit, onInvalid)(),

    submitToApi: (external: ExternalListingFields) =>
      new Promise((resolve, reject) => {
        handleSubmit(
          async (data) => {
            try {
              // Conditional requirements that depend on auctionType (from parent)
              if (external.auctionType === "lease") {
                // monthly required
                if (!data.monthly) {
                  await trigger("monthly")
                  return reject(new Error("Monthly is required for lease"))
                }
                // expiry required if monthly === "Yes"
                if (data.monthly === "Yes" && !data.expiry) {
                  await trigger("expiry")
                  return reject(new Error("Lease expiry date is required"))
                }
              }

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
                builtInYear: data.builtInYear || "",

                businessAddress: data.businessAddress || "",
                businessCountry: data.businessCountry || "",
                businessState: data.businessState || "",
                businessCity: data.businessCity || "",
                businessPincode: data.businessPincode || "",

                highlight: data.highlight || "",
                reason: data.reason || "",

                price: data.price || "",
                revenue: data.revenue || "",
                profit: data.profit || "",
                assets: data.assets || "",

                inventory: data.inventory || "",
                inventoryValue: data.inventoryValue || "",

                employes: data.employes || "",
                involvement: data.involvement || "",
                relocatable: data.relocatable || "",
                homebase: data.homebase || "",
                franchise: data.franchise || "",
                namefranchise: data.namefranchise || "",

                premises: data.premises || "",
                monthly: data.monthly || "",
                expiry: data.expiry || "",

                facilitysize: data.facilitysize || "",
              }

              const res = await fetch(`${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/business`, {
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

              toast.success("Business listing submitted successfully!")
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
    if (section === "BusinessDetails") {
      setBusinessDetailsOpen(!BusinessDetailsOpen)
      setBusinessDescriptionOpen(false)
      setfinancialInfoOpen(false)
      setoperationalDetailsOpen(false)
      setfacilitiesDetailsOpen(false)
    } else if (section === "BusinessDescription") {
      setBusinessDescriptionOpen(!BusinessDescriptionOpen)
      setBusinessDetailsOpen(false)
      setfacilitiesDetailsOpen(false)
      setoperationalDetailsOpen(false)
      setfinancialInfoOpen(false)
    } else if (section === "financial") {
      setfinancialInfoOpen(!financialInfoOpen)
      setBusinessDetailsOpen(false)
      setBusinessDescriptionOpen(false)
      setfacilitiesDetailsOpen(false)
    } else if (section === "operational") {
      setoperationalDetailsOpen(!operationalDetailsOpen)
      setBusinessDetailsOpen(false)
      setBusinessDescriptionOpen(false)
      setfacilitiesDetailsOpen(false)
      setfinancialInfoOpen(false)
    } else if (section === "facilities") {
      setfacilitiesDetailsOpen(!facilitiesDetailsOpen)
      setBusinessDetailsOpen(false)
      setBusinessDescriptionOpen(false)
      setoperationalDetailsOpen(false)
      setfinancialInfoOpen(false)
    }
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <Input placeholder="Enter your advertisement title here…" className="custom-input" />
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
                <textarea rows={10} {...field} placeholder="Write a detailed description of your business…." className={`custom-input input-textarea ${errors.description ? "border-red-500" : "border-gray-300"}`} />
              )}
            />
            {errors.description && <p className="error-text">{errors.description.message}</p>}
          </div>

          {/* Business details */}
          <Collapsible open={BusinessDetailsOpen} onOpenChange={() => handleSectionToggle("BusinessDetails")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Business details</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${BusinessDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="cont">
                  <Label className="custom-label">Year established<span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="YYYY"
                    {...register("builtInYear")}
                    maxLength={4}
                    className={`custom-input ${errors.builtInYear ? "border-red-500" : ""}`}
                    onChange={(e) => {
                      const numeric = e.target.value.replace(/\D/g, "").slice(0, 4)
                      e.target.value = numeric
                      if (numeric && errors.builtInYear) clearErrors("builtInYear")
                    }}
                  />
                  {errors.builtInYear && <p className="error-text">{errors.builtInYear.message}</p>}
                </div>

                <div className="cont">
                  <Label className="custom-label">Address<span className="text-red-500">*</span></Label>
                  <Controller
                    name="businessAddress"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="Enter complete address"
                        {...field}
                        className={`custom-input ${errors.businessAddress ? "border-red-500" : ""}`}
                        onChange={(e) => {
                          field.onChange(e)
                          if (errors.businessAddress) clearErrors("businessAddress")
                        }}
                      />
                    )}
                  />
                  {errors.businessAddress && <p className="error-text">{errors.businessAddress.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="cont">
                    <Label className="custom-label">Country<span className="text-red-500">*</span></Label>
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
                            {locationData.countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.businessCountry && <p className="error-text">Country is required</p>}
                  </div>

                  <div className="cont">
                    <Label className="custom-label">State<span className="text-red-500">*</span></Label>
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
                          disabled={!watchedCountry || availableStates.length === 0}
                        >
                          <SelectTrigger className={`custom-input ${errors.businessState ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStates.map((state) => (
                              <SelectItem key={state.code} value={state.name}>{state.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.businessState && <p className="error-text">{errors.businessState.message}</p>}
                  </div>

                  <div className="cont">
                    <Label className="custom-label">City<span className="text-red-500">*</span></Label>
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
                          disabled={!watchedState || availableCities.length === 0}
                        >
                          <SelectTrigger className={`custom-input ${errors.businessCity ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map((city, i) => (
                              <SelectItem key={i} value={city.name}>{city.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.businessCity && <p className="error-text">{errors.businessCity.message}</p>}
                  </div>

                  <div className="cont">
                    <Label className="custom-label">Zip/postal code</Label>
                    <Controller
                      name="businessPincode"
                      control={control}
                      render={({ field }) => (
                        <Input placeholder="" {...field} className={errors.businessPincode ? "border-red-500" : ""} />
                      )}
                    />
                    {errors.businessPincode && <p className="error-text">{errors.businessPincode.message}</p>}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Business descriptions */}
          <Collapsible open={BusinessDescriptionOpen} onOpenChange={() => handleSectionToggle("BusinessDescription")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Business descriptions</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${BusinessDescriptionOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="custom-label">Key Highlights / Selling Points<span className="text-red-500">*</span></Label>
                    <Controller
                      name="highlight"
                      control={control}
                      render={({ field }) => (
                        <textarea rows={5} {...field} className={`custom-input input-textarea ${errors.highlight ? "border-red-500" : "border-gray-300"}`} />
                      )}
                    />
                    {errors.highlight && <p className="error-text">{errors.highlight.message}</p>}
                  </div>
                  <div>
                    <Label className="custom-label">Reason for Selling<span className="text-red-500">*</span></Label>
                    <Controller
                      name="reason"
                      control={control}
                      render={({ field }) => (
                        <textarea rows={5} {...field} className={`custom-input input-textarea ${errors.reason ? "border-red-500" : "border-gray-300"}`} />
                      )}
                    />
                    {errors.reason && <p className="error-text">{errors.reason.message}</p>}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Financial informations */}
          <Collapsible open={financialInfoOpen} onOpenChange={() => handleSectionToggle("financial")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Financial informations</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${financialInfoOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="cont">
                    <Label className="custom-label">Asking price<span className="text-red-500">*</span>(Dollar)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter asking price"
                      {...register("price")}
                      onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ""))}
                      className={`custom-input ${errors.price ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.price && <p className="error-text">{errors.price.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">Annual revenue<span className="text-red-500">*</span>(Dollar)</Label>
                    <Input
                      type="text"
                      placeholder="Enter annual revenue"
                      {...register("revenue")}
                      onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""))}
                      className={`custom-input ${errors.revenue ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.revenue && <p className="error-text">{errors.revenue.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">Annual profit/EBITDA<span className="text-red-500">*</span>(Dollar)</Label>
                    <Input
                      type="text"
                      placeholder="Enter annual profit/EBITDA"
                      {...register("profit")}
                      onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""))}
                      className={`custom-input ${errors.profit ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.profit && <p className="error-text">{errors.profit.message}</p>}
                  </div>
                </div>

                <div className="cont">
                  <Label className="custom-label mt-6">Assets included in Sale<span className="text-red-500">*</span></Label>
                  <Controller
                    name="assets"
                    control={control}
                    render={({ field }) => (
                      <textarea rows={5} {...field} className={`custom-input input-textarea ${errors.assets ? "border-red-500" : "border-gray-300"}`} />
                    )}
                  />
                  {errors.assets && <p className="error-text">{errors.assets.message}</p>}
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="cont">
                    <Label className="custom-label">Inventory included<span className="text-red-500">*</span></Label>
                    <Controller
                      name="inventory"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(val) => {
                            field.onChange(val)
                            if (val !== "Yes") {
                              setValue("inventoryValue", "")
                              clearErrors("inventoryValue")
                            }
                          }}
                        >
                          <SelectTrigger className={`custom-input ${errors.inventory ? "border-red-500" : ""}`}>
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
                      <Input {...register("inventoryValue")} className={`custom-input ${errors.inventoryValue ? "border-red-500" : ""}`} />
                      {errors.inventoryValue && <p className="error-text">{errors.inventoryValue.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Operational details */}
          <Collapsible open={operationalDetailsOpen} onOpenChange={() => handleSectionToggle("operational")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Operational details</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${operationalDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="flex justify-center items-start gap-4">
                  <div className="cont">
                    <Label className="custom-label">Number of employees<span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      placeholder="Enter number of employees"
                      {...register("employes")}
                      className={`custom-input ${errors.employes ? "border-red-500" : ""}`}
                      onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ""))}
                    />
                    {errors.employes && <p className="error-text">{errors.employes.message}</p>}
                  </div>
                  <div className="cont">
                    <Label className="custom-label">Owner involvement<span className="text-red-500">*</span></Label>
                    <Controller
                      name="involvement"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className={`custom-input ${errors.involvement ? "border-red-500" : ""}`}>
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
                    <Label className="custom-label">Is the business relocatable?<span className="text-red-500">*</span></Label>
                    <Controller
                      name="relocatable"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className={`custom-input ${errors.relocatable ? "border-red-500" : ""}`}>
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

                  <div className="cont">
                    <Label className="custom-label">Is the business home-based?<span className="text-red-500">*</span></Label>
                    <Controller
                      name="homebase"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className={`custom-input ${errors.homebase ? "border-red-500" : ""}`}>
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
                </div>

                <div className="flex justify-center items-start gap-4">
                  <div className="cont">
                    <Label className="custom-label">Franchise<span className="text-red-500">*</span></Label>
                    <Controller
                      name="franchise"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(val) => {
                            field.onChange(val)
                            if (val !== "Yes") {
                              setValue("namefranchise", "")
                              clearErrors("namefranchise")
                            }
                          }}
                        >
                          <SelectTrigger className={`custom-input ${errors.franchise ? "border-red-500" : ""}`}>
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
                      <Label className="custom-label">Name of the franchise<span className="text-red-500">*</span></Label>
                      <Input {...register("namefranchise")} className={`custom-input ${errors.namefranchise ? "border-red-500" : ""}`} />
                      {errors.namefranchise && <p className="error-text">{errors.namefranchise.message}</p>}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Facilities and lease */}
          <Collapsible open={facilitiesDetailsOpen} onOpenChange={() => handleSectionToggle("facilities")}>
            <CollapsibleTrigger className="custom-trigger">
              <span className="font-medium">Facilities and lease</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${facilitiesDetailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="collabsible-content">
                <div className="flex justify-between items-center gap-4">
                  <div className="cont">
                    <Label className="custom-label">Business premises type<span className="text-red-500">*</span></Label>
                    <Controller
                      name="premises"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className={`custom-input ${errors.premises ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select business premises" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Retail Premises</SelectItem>
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
                      <Label className="custom-label">Monthly (if leased)<span className="text-red-500">*</span></Label>
                      <Controller
                        name="monthly"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || ""}
                            onValueChange={(val) => {
                              field.onChange(val)
                              if (val !== "Yes") {
                                setValue("expiry", "")
                                clearErrors("expiry")
                              }
                            }}
                          >
                            <SelectTrigger className={`custom-input ${errors.monthly ? "border-red-500" : ""}`}>
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
                      <Label className="custom-label">Lease expiry date</Label>
                      <Controller
                        name="expiry"
                        control={control}
                        defaultValue={new Date().toISOString()}
                        render={({ field }) => (
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <div className="relative">
                                <Input
                                  readOnly
                                  placeholder="DD/MM/YYYY"
                                  value={field.value ? format(new Date(field.value), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}
                                  className={`custom-input input-calender ${errors.expiry ? "border-red-500" : ""}`}
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
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="cont">
                  <Label className="custom-label">Facility size <span className="text-red-500">*</span>(Sq. Ft.)</Label>
                  <Input placeholder="Enter facility size" {...register("facilitysize")} className={`custom-input ${errors.facilitysize ? "border-red-500" : ""}`} />
                  {errors.facilitysize && <p className="error-text">{errors.facilitysize.message}</p>}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </>
  )
})

Business.displayName = "Business"
export default Business