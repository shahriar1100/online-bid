"use client"

import "swiper/css"
import "swiper/css/pagination"

import { useEffect, useState } from "react"
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
import { useRouter } from "next/navigation"


const CreateAds = () => {
    const router = useRouter() // <-- move inside component

    const [activeForm, setActiveForm] = useState<string>("realstate")
    const [currentStep, setCurrentStep] = useState(1)
    const closePopup = () => {
        router.push("/seller/listing")
    }
    const [, setUser] = useState<{ email: string; is_verified: number } | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const handleCategoryChange = (category: string) => {
        setActiveForm(category)
        setCurrentStep(1)
    }

    const renderForm = () => {
        const formProps = {
            onClose: closePopup,
            currentStep,
            setCurrentStep, // 🔥 Pass down setState
        }

        switch (activeForm) {
            case "business":
                return <BusinessRegistrationForm {...formProps} onClose={closePopup} preselectedCategory="Business" />
            case "automobile":
                return <AutomobileRegistrationForm {...formProps} onClose={closePopup} preselectedCategory="Automobiles" />
            case "realstate":
                return <RealStateRegistrationForm {...formProps} onClose={closePopup} preselectedCategory="Real Estate" />
            default:
                return null
        }
    }

    return (
        <>
            <Header />
            <div className="space-y-2 create-ads container">
                <div className="py-3 flex items-start gap-4 md:items-center justify-start md:justify-between flex-wrap md:flex-nowrap flex-col md:flex-row">
                    <div className="flex items-center justify-center gap-2">
                        <Link href={"/seller/listing/"}>
                            <ChevronLeft className="w-auto h-5 md:h-7" />
                        </Link>
                        <h1 className="text-base md:text-lg whitespace-nowrap">Create advertisement</h1>
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
                     {currentStep === 1 && (
                    <div className="control w-full md:w-[150px]">
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
                    </div>
                     )}
                </div>
                {renderForm()}
            </div>
            <Footer />
        </>
    )
}

export default CreateAds