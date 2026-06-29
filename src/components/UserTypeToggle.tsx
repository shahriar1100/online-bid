"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ShoppingCart, Store } from "lucide-react"

export default function UserTypeToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [userType, setUserType] = useState<"buyer" | "seller">("buyer")

  useEffect(() => {
    const queryUserType = searchParams.get("userType")

    if (queryUserType === "seller") {
      setUserType("seller")
    } else if (queryUserType === "buyer") {
      setUserType("buyer")
    } else if (pathname.startsWith("/seller")) {
      setUserType("seller")
    } else {
      setUserType("buyer")
    }
  }, [pathname, searchParams])

  const handleChangeUserType = async (nextUserType: "buyer" | "seller") => {
    if (nextUserType === userType) return

    await fetch(
      `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/auth/me/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
        body: JSON.stringify({ userType: nextUserType }),
      }
    )

    // Update localStorage user
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      user.userType = nextUserType
      localStorage.setItem("user", JSON.stringify(user))
    }
    document.cookie = `userType=${nextUserType}; path=/; sameSite=lax`
    setUserType(nextUserType)

    // Route change (same behavior as before)
    if (nextUserType === "seller") {
      router.push("/seller/listing")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="inline-flex rounded-full bg-gray-200 p-1">
      {/* Seller Button */}
      <button
        onClick={() => handleChangeUserType("seller")}
        disabled={userType === "seller"}
        className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 md:px-4 md:py-2 text-[11px] leading-3 md:text-[13px] font-semibold transition-all
          ${
            userType === "seller"
              ? "bg-green-500 text-white shadow-md cursor-default"
              : "bg-transparent text-gray-400 hover:text-gray-600"
          }`}
      >
        <Store className="w-4 h-auto hidden md:block" />
        Seller
      </button>

      {/* Buyer Button */}
      <button
        onClick={() => handleChangeUserType("buyer")}
        disabled={userType === "buyer"}
        className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 md:px-4 md:py-2 text-[11px] leading-3 md:text-[13px] font-semibold transition-all
          ${
            userType === "buyer"
              ? "bg-blue-500 text-white shadow-md cursor-default"
              : "bg-transparent text-gray-400 hover:text-gray-600"
          }`}
      >
        <ShoppingCart className="w-4 h-auto hidden md:block" />
        Buyer
      </button>
    </div>
  )
}
