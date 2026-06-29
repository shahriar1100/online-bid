// "use client"

// import Image from "next/image"
// import { Button } from "../ui/button"
// import { useEffect, useState } from "react"
// import moment from "moment"
// import { businessfeature } from "src/app/data"
// // import { BorderBeam } from "../magicui/border-beam"

// type ListingStatus = "upcoming" | "live" | "Ended" | string

// interface Listing {
//   id: number
//   status: ListingStatus
//   subCategory: string
//   price: string
//   time?: string
//   user?: string
//   image?: string
// }

// const formatTime = (seconds: number) => {
//   const duration = moment.duration(seconds, "seconds")
//   const hours = String(Math.floor(duration.asHours())).padStart(2, "0")
//   const minutes = String(duration.minutes()).padStart(2, "0")
//   const remainingSeconds = String(duration.seconds()).padStart(2, "0")
//   return `${hours}:${minutes}:${remainingSeconds}`
// }

// export default function Businessfeature() {
//   const [timers, setTimers] = useState<{ [key: number]: number }>({})
//   const [statuses, setStatuses] = useState<{ [key: number]: ListingStatus }>({})

//   useEffect(() => {
//     const initialTimers: { [key: number]: number } = {}
//     const initialStatuses: { [key: number]: ListingStatus } = {}

//     businessfeature.forEach((listing) => {
//       initialStatuses[listing.id] = listing.status
//       // Only set a timer if the time string includes a colon, for dynamic countdowns
//       if (listing.time && listing.time.includes(":")) {
//         const [hours, minutes, seconds] = listing.time.split(":").map(Number)
//         initialTimers[listing.id] = hours * 3600 + minutes * 60 + seconds
//       }
//     })
//     setTimers(initialTimers)
//     setStatuses(initialStatuses)

//     const interval = setInterval(() => {
//       setTimers((prevTimers) => {
//         const newTimers: { [key: number]: number } = { ...prevTimers }
//         let shouldUpdateStatus = false
//         for (const id in newTimers) {
//           if (newTimers[id] > 0) {
//             newTimers[id] = newTimers[id] - 1
//             if (newTimers[id] === 0) {
//               shouldUpdateStatus = true
//             }
//           }
//         }

//         if (shouldUpdateStatus) {
//           setStatuses((prevStatuses) => {
//             const newStatuses = { ...prevStatuses }
//             for (const id in newTimers) {
//               if (newTimers[id] === 0 && newStatuses[id] === "live") {
//                 newStatuses[id] = "Ended"
//               }
//             }
//             return newStatuses
//           })
//         }
//         return newTimers
//       })
//     }, 1000)

//     return () => clearInterval(interval)
//   }, [])

//   const getButtonStyle = (listing: Listing, remainingTime: number, currentStatus: ListingStatus) => {
//     if (currentStatus === "Ended") {
//       return {
//         text: "CONGRATULATIONS!",
//         className:
//           "bg-gray hover:bg-gray border-none mt-4 text-2xl text-gray-600 font-semibold cursor-default text-center dark:text-white",
//       }
//     }
//     if (currentStatus === "live" && remainingTime <= 10 && remainingTime > 0) {
//       return {
//         text: "BID NOW",
//         className: "bg-[#FFE102] hover:bg-[#FFE102] text-black font-semibold mt-4 text-lg",
//       }
//     }
//     switch (currentStatus) {
//       case "upcoming":
//         return {
//           text: "BID NOW",
//           className: "bg-[#4F5259] hover:bg-[#4F5259] text-gray-300 text-lg",
//         }
//       case "live":
//         return {
//           text: "BID NOW",
//           className: "bg-[#FFE102] hover:bg-[#FFE102] text-black font-semibold text-lg",
//         }
//       default:
//         return {
//           text: "BID NOW",
//           className: "bg-[#D9D9D9] hover:bg-[#D9D9D9] text-black text-lg",
//         }
//     }
//   }

//   return (
//     <>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//         {businessfeature.slice(0, 8).map((listing) => {
//           const remainingTime = timers[listing.id] || 0
//           const currentStatus = statuses[listing.id] || listing.status
//           const buttonStyle = getButtonStyle(listing, remainingTime, currentStatus)
//           const isCountdownRunning = currentStatus === "live" && remainingTime > 0
//           const isEndingSoon = isCountdownRunning && remainingTime < 60
//           const isLiveAndLong = isCountdownRunning && remainingTime >= 60

//           const getStatusBadge = () => {
//             switch (currentStatus) {
//               case "upcoming":
//                 return { text: "Upcoming", bgColor: "bg-white", textColor: "text-black" }
//               case "live":
//                 return { text: "Live", bgColor: "bg-white", textColor: "text-green-500 animate-pulse" }
//               case "Ended":
//                 return { text: "Ended", bgColor: "bg-white", textColor: "text-red-500" }
//               default:
//                 return { text: "Upcoming", bgColor: "bg-black", textColor: "text-white" }
//             }
//           }

//           const statusBadge = getStatusBadge()

//           return (
//             <div
//               key={listing.id}
//               className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:bg-black dark:border-gray-500"
//             >
//               <div className="bg-gray-50 px-3 py-2 text-xs text-gray-700 border-b text-center font-medium dark:bg-black dark:text-white">
//                 {listing.subCategory}
//               </div>

//               <div className="relative w-full h-48">
//                 <div
//                   className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}
//                 >
//                   ● {statusBadge.text}
//                 </div>

//                 {listing.image && (
//                   <Image
//                     src={listing.image}
//                     alt={listing.subCategory}
//                     fill
//                     className="object-cover"
//                   />
//                 )}

//                 {listing.user === "NO BIDDERS" && (
//                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                     <div className="bg-yellow-400 text-black text-sm whitespace-nowrap font-bold px-32 py-2 transform -rotate-12 shadow-lg">
//                       NO BIDDERS!
//                     </div>
//                   </div>
//                 )}

//                 {currentStatus === "Ended" && (
//                   <div className="absolute inset-0">
//                     <Image
//                       src="/images/real-state/sold.png"
//                       alt="Ended"
//                       fill
//                       style={{ objectFit: "contain" }}
//                       className="pointer-events-none opacity-80"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="p-4">
//                 <div className="flex justify-between items-center mb-3">
//                   {/* <span className="text-green-600 text-xl">{listing.price}</span> */}
//   <span
//                     className={`text-xl ${currentStatus === "upcoming" ? "text-gray-600 dark:text-gray-500 dark:font-bold" : "text-green-600 dark:font-bold"
//                       }`}
//                   >
//                     {listing.price}
//                   </span>
//                  {currentStatus === "upcoming" ? (
//                     <div className="text-gray-600 text-xl text-center  dark:text-white">
//                       Starting
//                       <br />
//                       Soon
//                     </div>
//                   ) : currentStatus === "Ended" ? (
//                     <div className={`px-5 py-2 rounded text-xl bg-red-500 text-white h-11`}>Ended</div>
//                   ) : listing.time?.includes("Days") ? (
//                     <div className="px-3 py-1 rounded text-xl  text-gray-600 text-center dark:text-white">
//                       {listing.time}
//                       {listing.user && (
//                         <div className="text-xs text-red-500 opacity-90 mt-1  dark:text-yellow-400 font-bold ">{listing.user}</div>
//                       )}
//                     </div>
//                   ) : isLiveAndLong ? (
//                     <div className="px-3 py-1 rounded text-xl text-green-500 text-center">
//                       {formatTime(remainingTime)}
//                       {listing.user && (
//                         <div className="text-xs dark:text-white text-gray-600 font-bold opacity-90 mt-1">{listing.user}</div>
//                       )}
//                     </div>
//                   ) : isEndingSoon ? (
//                     <div className="px-5 py-2 rounded text-xl bg-red-500 text-white text-center h-11">
//                       {formatTime(remainingTime)}
//                       {listing.user && (
//                         <div className="text-xs text-yellow-500 opacity-90 mt-1">{listing.user}</div>
//                       )}
//                     </div>
//                   ) : null}
//                 </div>

//                 <Button className={`w-full text-sm py-2 rounded font-semibold ${buttonStyle.className}`}>
//                   {buttonStyle.text}
//                 </Button>
//               </div>
//               {/* <BorderBeam duration={8} size={100} /> */}
//             </div>
//           )
//         })}
//       </div>
//     </>
//   )
// }


"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { businessfeature } from "src/app/data"
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

export default function Businessfeature() {
  const [timers, setTimers] = useState<{ [key: number]: number }>({})
  const [statuses, setStatuses] = useState<{ [key: number]: ListingStatus }>({})

  useEffect(() => {
    const styleTag = document.createElement("style")
    styleTag.innerHTML = flashAnimation
    document.head.appendChild(styleTag)

    const initialTimers: { [key: number]: number } = {}
    const initialStatuses: { [key: number]: ListingStatus } = {}

    businessfeature.forEach((listing) => {
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
      {businessfeature.slice(0, 8).map((listing) => {
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
                  <span className=" bg-red-500 text-white">Ended</span>
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
