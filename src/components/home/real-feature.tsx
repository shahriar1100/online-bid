"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { realfeature } from "src/app/data"
import { useEffect, useState } from "react"
import moment from "moment"
import sold from "src/app/assets/images/real-state/sold.png"
import noBidders from "src/app/assets/images/no-bidders.png"

import type { StaticImageData } from "next/image";

type ListingStatus = "upcoming" | "live" | "Ended" | string

interface Listing {
  id: number
  status: ListingStatus
  subCategory: string
  price: string
  time?: string
  user?: string
  image?: string | StaticImageData
}

const formatTime = (seconds: number) => {
  const duration = moment.duration(seconds, "seconds")
  const hours = String(Math.floor(duration.asHours())).padStart(2, "0")
  const minutes = String(duration.minutes()).padStart(2, "0")
  const remainingSeconds = String(duration.seconds()).padStart(2, "0")
  return `${hours}:${minutes}:${remainingSeconds}`
}

const flashAnimation = `
@keyframes flash {
  0%, 98%, 100% {
    background-color: #fb2c36; /* red-600 (idle) */
  }
  49%, 51% {
    background-color: #8f0000; /* red-500 (flash) */
  }
}

.animate-flash {
  animation: flash 2s infinite ease-in-out;
}
`

export default function Realfeature() {
  const [timers, setTimers] = useState<{ [key: number]: number }>({})
  const [statuses, setStatuses] = useState<{ [key: number]: ListingStatus }>({})

  useEffect(() => {
    const styleTag = document.createElement("style")
    styleTag.innerHTML = flashAnimation
    document.head.appendChild(styleTag)

    const initialTimers: { [key: number]: number } = {}
    const initialStatuses: { [key: number]: ListingStatus } = {}

    realfeature.forEach((listing) => {
      initialStatuses[listing.id] = listing.status
      if (listing.time && listing.time.includes(":")) {
        const [hours, minutes, seconds] = listing.time.split(":").map(Number)
        initialTimers[listing.id] = hours * 3600 + minutes * 60 + seconds
      }
    })
    setTimers(initialTimers)
    setStatuses(initialStatuses)

    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        const newTimers = { ...prevTimers }
        let shouldUpdateStatus = false
        for (const id in newTimers) {
          if (newTimers[id] > 0) {
            newTimers[id] = newTimers[id] - 1
            if (newTimers[id] === 0) shouldUpdateStatus = true
          }
        }

        if (shouldUpdateStatus) {
          setStatuses((prevStatuses) => {
            const newStatuses = { ...prevStatuses }
            for (const id in newTimers) {
              if (newTimers[id] === 0 && newStatuses[id] === "live") {
                newStatuses[id] = "Ended"
              }
            }
            return newStatuses
          })
        }
        return newTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getButtonStyle = (listing: Listing, remainingTime: number, currentStatus: ListingStatus) => {
    if (currentStatus === "Ended") {
      return {
        text: "CONGRATULATIONS!",
        className:

          "bg-gray-200 cursor-default text-gray-600 dark:text-white font-semibold dark:text-black",

      }
    }
    if (currentStatus === "live" && remainingTime <= 10 && remainingTime > 0) {
      return {

        text: "Bid now",
        className: "bg-[#FFE102] hover:bg-yellow-300 text-black font-semibold",

      }
    }
    switch (currentStatus) {
      case "upcoming":

        return { text: "Bid now", className: "bg-gray-200 text-black" }
      case "live":
        return { text: "Bid now", className: "bg-[#FFE102] hover:bg-yellow-300 text-black font-semibold" }
      default:
        return { text: "Bid now", className: "bg-gray-200 text-black" }
    }
  }

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case "upcoming":
        return { text: "Upcoming", bg: "bg-white", textColor: "text-black" }
      case "live":
        return { text: "Live", bg: "bg-white", textColor: "text-green-600" }
      case "Ended":
        return { text: "Ended", bg: "bg-white", textColor: "text-red-600" }
      default:
        return { text: "Upcoming", bg: "bg-black", textColor: "text-white" }
    }
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {realfeature.slice(0, 8).map((listing) => {
        const remainingTime = timers[listing.id] || 0
        const currentStatus = statuses[listing.id] || listing.status
        const buttonStyle = getButtonStyle(listing, remainingTime, currentStatus)
        const isCountdownRunning = currentStatus === "live" && remainingTime > 0
        const isEndingSoon = isCountdownRunning && remainingTime < 60
        const isLiveAndLong = isCountdownRunning && remainingTime >= 60
        const statusBadge = getStatusBadge(currentStatus)

        return (
          <div
            key={listing.id}
            className="group product-card"
          >
            {/* Subcategory */}
            <p className="title">{listing.subCategory}</p>
            {/* Image */}
            <div className="relative w-full h-48">
              <span
                className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusBadge.bg} ${statusBadge.textColor}`}
              >
                ● {statusBadge.text}
              </span>

              {listing.image && (
                <Image
                  src={listing.image}
                  alt={listing.subCategory}
                  fill
                  className="object-cover group-hover:scale-95 transition-transform duration-500"
                />
              )}

              {listing.user === "NO BIDDERS" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={noBidders}
                    alt="No Bidders"
                    fill
                  />
                </div>
              )}

              {currentStatus === "Ended" && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Image
                    src={sold}
                    alt="Ended"
                    width={100}
                    height={100}
                    className="sold-img"
                  />
                </div>
              )}
            </div>


            {/* Content */}
            <div>
              <div className="content-area">
                <div className="price">{listing.price}</div>
                {currentStatus === "upcoming" ? (
                  <span className="text-gray-600 dark:text-gray-300 border-l border-[#ECEFF3] dark:border-[#ECEFF320]">Starting soon</span>
                ) : currentStatus === "Ended" ? (
                  <span className=" font-semibold bg-red-500 text-white">Ended</span>
                ) : listing.time?.includes("days") ? (
                  <span className=" bg-green-800 text-white">
                    {listing.time}
                  </span>
                ) : isLiveAndLong ? (
                  <span className=" bg-green-500 text-white animate-blink-green">
                    {formatTime(remainingTime)}
                  </span>
                ) : isEndingSoon ? (
                  <span className={` bg-red-500 text-white ${isCountdownRunning && remainingTime <= 10 ? "animate-flash" : ""}`}>
                    {formatTime(remainingTime)}
                  </span>
                ) : null}
              </div>



              {/* CTA */}
              <div className="p-4">
                <Button className={`btn ${buttonStyle.className}`}>
                  {buttonStyle.text}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>

  )
}
