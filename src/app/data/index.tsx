// import { time } from "console"
// import { User } from "lucide-react"
import house1 from "../assets/images/real-state/house1.png";
import house2 from "../assets/images/real-state/house2.jpg";
import house4 from "../assets/images/real-state/house4.png";
import house5 from "../assets/images/real-state/house5.jpg";
import car1 from "../assets/images/automobile/car1.jpg";
import car2 from "../assets/images/automobile/car2.jpg";
import car3 from "../assets/images/automobile/car3.png";
import b1 from "../assets/images/business/b1.jpg";
import b2 from "../assets/images/business/b2.png";
import b3 from "../assets/images/business/b3.jpg";
import b4 from "../assets/images/business/b4.jpg";
import image1 from "../assets/images/buyer/car1.png";
import image2 from "../assets/images/buyer/car2.webp";
import image3 from "../assets/images/buyer/car3.webp";
import image4 from "../assets/images/buyer/car4.png";
import image5 from "../assets/images/buyer/car5.jpg";
import image6 from "../assets/images/buyer/car6.png";
import image7 from "../assets/images/buyer/car7.png";

export const categorySubcategories = {
  Business: ["Finance", "Healthcare", "Retail", "Technology", "Construction"],
  "Real Estate": [
    "Single family homes",
    "Townhomes",
    "Vacant land",
    "Commercial land",
    "Commercial building",
    "Farm land",
    "Rural land",
    "Condo",
  ],
  Automobiles: ["SUVs", "Sedans", "Trucks", "Bikes", "Boats"],
}

// export const categorySubcategories = {
//     Business: ["Restaurant", "Retail", "Service", "Manufacturing"],
//     "Real Estate": ["Residential", "Commercial", "Land", "Rental"],
//     Automobiles: ["Cars", "Motorcycles", "Trucks", "Parts"],
// }

export const sampleAds = [
  {
    id: 1,
    name: "Willow Creek Residence - Build square flat..",
    time: "00:00:00",
    category: "Real Estate",
    subCategory: "Residential",
    status: "Upcoming",
  },
  {
    id: 2,
    name: "Downtown Restaurant - Prime Location",
    time: "12:30:00",
    category: "Business",
    subCategory: "Restaurant",
    status: "Upcoming",
  },
  {
    id: 3,
    name: "Luxury Car Dealership - Premium Vehicles",
    time: "09:15:00",
    category: "Automobiles",
    subCategory: "Cars",
    status: "Live",
  },
  {
    id: 4,
    name: "Commercial Office Space - City Center",
    time: "14:45:00",
    category: "Real Estate",
    subCategory: "Commercial",
    status: "Live",
  },
  {
    id: 5,
    name: "Manufacturing Plant - Industrial Zone",
    time: "08:00:00",
    category: "Business",
    subCategory: "Manufacturing",
    status: "End",
  },
  {
    id: 6,
    name: "Motorcycle Parts Store - Accessories",
    time: "16:20:00",
    category: "Automobiles",
    subCategory: "Parts",
    status: "End",
  },
  {
    id: 7,
    name: "Retail Store - Fashion Boutique",
    time: "11:00:00",
    category: "Business",
    subCategory: "Retail",
    status: "Upcoming",
  },
  {
    id: 8,
    name: "Land Plot - Agricultural Use",
    time: "13:30:00",
    category: "Real Estate",
    subCategory: "Land",
    status: "Live",
  },
  {
    id: 9,
    name: "Service Center - Auto Repair",
    time: "10:45:00",
    category: "Business",
    subCategory: "Service",
    status: "End",
  },
  {
    id: 10,
    name: "Truck Rental Business - Commercial",
    time: "15:15:00",
    category: "Automobiles",
    subCategory: "Trucks",
    status: "Upcoming",
  },
  {
    id: 11,
    name: "Rental Apartment - Furnished",
    time: "17:00:00",
    category: "Real Estate",
    subCategory: "Rental",
    status: "Live",
  },
  {
    id: 12,
    name: "Restaurant Chain - Fast Food",
    time: "18:30:00",
    category: "Business",
    subCategory: "Restaurant",
    status: "End",
  },
]

export const homelisting = [
  {
    id: 1,
    image: house1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$0.00",
    time: "Starting Soon",
    status: "upcoming",
  },
  {
    id: 2,
    image: house2,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$7.00",
    time: "5 days left",
    status: "live",
    user: "NO BIDDERS",
  },
  {
    id: 3,
    image: house5,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$4.00",
    time: "18:06:12",
    status: "live",
    user: "kirankundujunior",
  },
  {
    id: 4,
    image: house4,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$11.00",
    time: "00:00:10",
    status: "live",
    user: "kirankundujunior",
  },
  {
    id: 5,
    image: house5,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$0.00",
    time: "Starting soon",
    status: "upcoming",
  },
  {
    id: 6,
    image: house4,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$7.00",
    time: "00:00:05",
    status: "live",
    user: "kirankundujunior",
  },
  {
    id: 7,
    image: house2,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$4.00",
    time: "3 days left",
    status: "live",
    user: "NO BIDDERS",
  },
  {
    id: 8,
    image: house1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$11.00",
    time: "24:00:00",
    status: "live",
    user: "kirankundujunior",
  },
];

export const realEstateListings = [
  {
    id: 1,
    image: house1,
    category: "Real Estate",
    subCategory: "Single family homes",
    price: "$450.00",
    time: "00:00:10",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 2,
    image: house2,
    category: "Real Estate",
    subCategory: "Townhomes",
    price: "$0.00",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    status: "upcoming",
  },
  {
    id: 3,
    image: house2,
    category: "Real Estate",
    subCategory: "Vacant land",
    price: "$3.50",
    time: "00:00:05",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 4,
    image: house4,
    category: "Real Estate",
    subCategory: "Commercial land",
    price: "$4.50",
    time: "21:21:21",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 5,
    image: house5,
    category: "Real Estate",
    subCategory: "Commercial building",
    price: "$2.41",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "miaods780",
    status: "upcoming",
  },
  {
    id: 6,
    image: house5,
    category: "Real Estate",
    subCategory: "Farm land",
    price: "$10.00",
    time: "5 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "NO BIDDERS",
    status: "live",
  },
  {
    id: 7,
    image: house4,
    category: "Real Estate",
    subCategory: "Rural land",
    price: "$44.50",
    time: "24:00:21",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "jack@1234",
    status: "live",
  },
  {
    id: 8,
    image: house2,
    category: "Real Estate",
    subCategory: "Condo",
    price: "$3.50",
    time: "3 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 9,
    image: house2,
    category: "Real Estate",
    subCategory: "Rural land",
    price: "$4.50",
    time: "1 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "ok5dffd",
    status: "live",
  },
  {
    id: 10,
    image: house1,
    category: "Real Estate",
    subCategory: "Condo",
    price: "$2.41",
    time: "2 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "45kiranlh",
    status: "upcoming",
  },
];

export const businesssListings = [
  {
    id: 1,
    image: b1,
    category: "Business",
    subCategory: "Finance",
    price: "$450.00",
    time: "00:00:10",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 2,
    image: b2,
    category: "Business",
    subCategory: "Healthcare",
    price: "$0.00",
    time: "21:21:21",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 3,
    image: b3,
    category: "Business",
    subCategory: "Retail",
    price: "$3.50",
    time: "starting soon",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "upcoming",
  },
  {
    id: 4,
    image: b4,
    category: "Business",
    subCategory: "Technology",
    price: "$4.50",
    time: "5 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "NO BIDDERS",
    status: "live",
  },
  {
    id: 5,
    image: b1,
    category: "Business",
    subCategory: "Construction",
    price: "$3.50",
    time: "starting soon",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "upcoming",
  },
  {
    id: 6,
    image: b2,
    category: "Business",
    subCategory: "Technology",
    price: "$0.00",
    time: "1 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "jack@1234",
    status: "live",
  },
  {
    id: 7,
    image: b3,
    category: "Business",
    subCategory: "Construction",
    price: "$44.50",
    time: "24:00:00",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "jack@1234",
    status: "live",
  },
]

export const automobileListings = [
 {
    id: 1,
    image: car1,
    category: "Automobiles",
    subCategory: "SUVs",
    price: "$450.00",
    time: "00:00:10",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 2,
    image: car2,
    category: "Automobiles",
    subCategory: "Sedans",
    price: "$5.00",
    time: "Starting soon",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "upcoming",
  },
  {
    id: 3,
    image: car3,
    category: "Automobiles",
    subCategory: "Trucks",
    price: "$13.50",
    time: "23:00:00",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "kirankundujunior",
    status: "live",
  },
  {
    id: 4,
    image: car1,
    category: "Automobiles",
    subCategory: "Bikes",
    price: "$4.50",
    time: "5 days left",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "NO BIDDERS",
    status: "live",
  },
  {
    id: 5,
    image: car2,
    category: "Automobiles",
    subCategory: "Boats",
    price: "$2.41",
    time: "00:00:05",
    title: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    user: "miaods780",
    status: "live",
  },
]

export const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
]

export const utilitiesOptions = ["Electricity", "Water supply", "Septic", "Gas", "Trash & Recycling pickup", "Internet", "Others"]
export const featuresOptions = ["Appliances", "Heating & Cooling Systems", "Flooring", "Outdoor Space", "Storage ", "Smart Home Upgrades", "Community Amenities", "Others"]
export const automobilefeaturesOptions = ["Safety", "Comfort & Convenience", "Infotainment & Connectivity", "Performance & Driving Aids", "Exterior Features", "Advanced & Luxury Features", "Others"]

export const realfeature = [
  {
    id: 1,
    image: house1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$0.00",
    time: "Starting Soon",
    status: "upcoming",
  },
  {
    id: 2,
    image: house2,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$7.00",
    time: "5 days left",
    status: "live",
    user: "NO BIDDERS",
  },
  {
    id: 3,
    image: house5,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$4.00",
    time: "24:00:00",
    status: "live",
    user: "kirankundujunior"
  },
  {
    id: 4,
    image: house4,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$11.00",
    time: "00:00:10",
    status: "live",
  },
]

export const businessfeature = [
  {
    id: 1,
    image: b1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$0.00",
    time: "Starting Soon",
    status: "upcoming",
  },
  {
    id: 2,
    image: b2,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$7.00",
    time: "5 days left",
    status: "live",
    user: "NO BIDDERS",
  },
  {
    id: 3,
    image: b3,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$4.00",
    time: "24:00:00",
    status: "live",
    user: "kirankundujunior"
  },
  {
    id: 4,
    image: b4,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$11.00",
    time: "00:00:10",
    status: "live",
  },
]

export const automobilefeature = [
  {
    id: 1,
    image: car1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$0.00",
    time: "Starting Soon",
    status: "upcoming",
  },
  {
    id: 2,
    image: car2,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$7.00",
    time: "5 days left",
    status: "live",
    user: "NO BIDDERS",
  },
  {
    id: 3,
    image: car3,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$4.00",
    time: "24:00:00",
    status: "live",
    user: "kirankundujunior"
  },
  {
    id: 4,
    image: car1,
    subCategory: "2025 Lincoln Aviator Premier - Cottage with garden and swimming pool",
    price: "$11.00",
    time: "00:00:10",
    status: "live",
  },
]

export const images = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
];

export const features = [
    "All-Wheel Drive (AWD)",
    "Apple CarPlay & Android Auto Compatibility",
    "Toyota Safety Sense 2.0 (TSS 2.0)",
    "Blind Spot Monitor with Rear Cross-Traffic Alert",
    "Power Moonroof",
    "17-Inch Alloy Wheels",
    "8-Way Power Adjustable Driver’s Seat",
    "Dual-Zone Automatic Climate Control",
    "Backup Camera",
    "LED Headlights and Daytime Running Lights",
  ];

  // bid history
  interface BidHistory {
    bid: string
    user: string
    time: string
    avatar: string
}
  export  const bidHistory: BidHistory[] = [
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$1.99", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
        { bid: "$2.00", user: "KrishtenOlkl", time: "04:06:20 PM", avatar: "/diverse-woman-portrait.png" },
]