// "use client"

// import { useState, useMemo, useEffect, Suspense } from "react"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select"
// import { Button } from "src/components/ui/button"
// import Image from "next/image"
// import { categorySubcategories, realEstateListings, automobileListings, businesssListings } from "src/app/data"
// import Header from "src/components/header"
// import Footer from "src/components/footer"
// import { useSearchParams } from "next/navigation"

// const Automobile = () => {
//   const searchParams = useSearchParams()
//   const categoryFromUrl = searchParams.get("category") || "Automobiles"

//   const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl)
//   const [selectedSubCategory, setSelectedSubCategory] = useState("All")

//   useEffect(() => {
//     const categoryParam = searchParams.get("category")
//     if (categoryParam && categoryParam !== selectedCategory) {
//       setSelectedCategory(categoryParam)
//       setSelectedSubCategory("All") // Reset subcategory when category changes
//     }
//   }, [searchParams, selectedCategory])

//   const listingsData = useMemo(() => {
//     if (selectedCategory === "Real Estate") return realEstateListings
//     if (selectedCategory === "Business") return businesssListings
//     return automobileListings
//   }, [selectedCategory])

//   const availableSubCategories = useMemo(() => {
//     return selectedCategory ? categorySubcategories[selectedCategory as keyof typeof categorySubcategories] || [] : []
//   }, [selectedCategory])

//   const filteredListings = useMemo(() => {
//     return listingsData.filter((listing) => {
//       const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory
//       const matchesSubCategory = selectedSubCategory === "All" || listing.subCategory === selectedSubCategory
//       return matchesCategory && matchesSubCategory
//     })
//   }, [listingsData, selectedCategory, selectedSubCategory])

//   return (
//     <>
//       <Header />
//       <div className="container mx-auto p-6">
//         <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
//           {/* <div className="text-lg font-semibold text-gray-800">Category: {selectedCategory}</div> */}

//           <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="All Subcategories" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="All">All Subcategories</SelectItem>
//               {availableSubCategories.map((subCategory) => (
//                 <SelectItem key={subCategory} value={subCategory}>
//                   {subCategory}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           <Button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2">Apply</Button>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
//           {filteredListings.map((listing) => (
//             <div key={listing.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
//               <div className="relative w-full h-40">
//                 <Image
//                   src={listing.image || "/placeholder.svg"}
//                   alt={listing.title}
//                   fill
//                   style={{ objectFit: "cover" }}
//                   className="rounded-t-lg"
//                 />
//                 {listing.discount && (
//                   <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
//                     {listing.discount}
//                   </div>
//                 )}
//                 {listing.status === "no-new-bidders" && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className="bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-2 rotate-[-15deg] transform origin-center">
//                       NO NEW BIDDERS!
//                     </div>
//                   </div>
//                 )}
//                 {listing.status === "sold" && (
//                   <div className="absolute inset-0">
//                     <Image
//                       src="/images/automobile/sold.png"
//                       alt="Sold"
//                       fill
//                       style={{ objectFit: "contain" }}
//                       className="pointer-events-none opacity-80"
//                     />
//                   </div>
//                 )}
//               </div>
//               <div className="p-4">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-lg font-bold text-gray-900">{listing.price}</span>
//                   <span className="text-sm text-red-600">{listing.time}</span>
//                 </div>
//                 <h3 className="text-base font-semibold text-gray-800 mb-1 truncate">{listing.title}</h3>
//                 <div className="text-sm text-gray-600 mb-1">{listing.user}</div>
//                 <div className="text-sm text-gray-600 mb-4">{listing.bidPack}</div>
//                 {listing.status === "active" && (
//                   <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-md">Bid Now</Button>
//                 )}
//                 {listing.status === "bidding-soon" && (
//                   <Button className="w-full bg-gray-400 text-white py-2 rounded-md cursor-not-allowed" disabled>
//                     Bidding soon...
//                   </Button>
//                 )}
//                 {listing.status === "sold" && (
//                   <div className="w-full text-center text-green-600 font-bold py-2">Sold!</div>
//                 )}
//                 {listing.status === "no-new-bidders" && (
//                   <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-md">Bid Now</Button>
//                 )}
//                 {listing.buyNowPrice && listing.status !== "sold" && (
//                   <div className="text-center text-sm text-gray-500 mt-2">Buy it now for {listing.buyNowPrice}</div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         {filteredListings.length === 0 && (
//           <div className="text-center py-8 text-gray-500">No listings found matching your criteria.</div>
//         )}
//       </div>
//       <Footer />
//         <Suspense fallback={<div>Loading...</div>}>
//     </Suspense>
//     </>
//   )
// }
// export default Automobile

"use client"

import { Suspense } from "react"
import Automobile from "src/components/buyer/automobile"
import Loader from "src/components/loader"

export default function AutomobilePage() {
  return (
    <Suspense fallback={<div><Loader/></div>}>
      <Automobile />
    </Suspense>
  )
}