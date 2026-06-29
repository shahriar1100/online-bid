// db/model/realestate.ts
import { drizzle } from "drizzle-orm/d1";
import { real_estate_listings } from "../schema";


export interface InsertRealStateInput {
  userId: number;           // keep snake_case if you like
  title: string;
  category: string;
  subcategory: string;
  auctionType: string;       // camelCase
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  propertyAddress: string;   // camelCase
  propertyCountry: string;
  propertyState: string;
  propertyCity: string;
  propertyPincode?: string;
  bedroom?: string;
  bathroom?: string;
  area?: string;
  lot_size?: string;
  builtInYear?: string;
  furnishing?: string;
  parkingSpaces?: string;
  utilities?: string[];
  features?: string[];
  auction_start_price?: string;
  auctionDate?: string;
  monthly?: string;
  expiry?: string;
  ownershiptype?: string;
  ownershiptitle?: string;
  ownershipstatus?: string;
  legalDescription?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  isAgent?: string;
  licenseNumber?: string;
  authorizedToSell?: boolean;
  agreeTerms?: boolean;
}



export async function insertRealEstate(env: { DB: D1Database }, payload: InsertRealStateInput) {
  const db = drizzle(env.DB);
  const now = Math.floor(Date.now() / 1000);

  const insertRow = {
    user_id: payload.userId,
    title: payload.title,
    category: payload.category,
    subcategory: payload.subcategory,
    auction_type: payload.auctionType,   
    duration: payload.duration,
    description: payload.description,
    media: payload.media ? JSON.stringify(payload.media) : null,
    property_address: payload.propertyAddress,
    property_country: payload.propertyCountry,
    property_state: payload.propertyState,
    property_city: payload.propertyCity,
    property_pincode: payload.propertyPincode ?? null,
    bedroom: payload.bedroom ?? null,
    bathroom: payload.bathroom ?? null,
    area: payload.area ?? null,
    lot_size: payload.lot_size ?? null,
    built_in_year: payload.builtInYear ?? null,
    furnishing: payload.furnishing,
    parking_spaces: payload.parkingSpaces ?? null,
    utilities: payload.utilities ? JSON.stringify(payload.utilities) : null,
    features: payload.features ? JSON.stringify(payload.features) : null,
    auction_start_price: payload.auction_start_price ?? null,
    auction_date: payload.auctionDate ?? null,
    monthly: payload.monthly ?? null,
    expiry: payload.expiry ?? null,
    ownership_type: payload.ownershiptype ?? null,
    ownership_title: payload.ownershiptitle ?? null,
    ownership_status: payload.ownershipstatus ?? null,
    legal_description: payload.legalDescription ?? null,
    contact_name: payload.contactName,
    contact_phone: payload.contactPhone,
    contact_email: payload.contactEmail,
    is_agent: payload.isAgent ?? null,
    license_number: payload.licenseNumber ?? null,
    authorized_to_sell: payload.authorizedToSell ? "1" : "0",
    agree_terms: payload.agreeTerms ? "1" : "0",
    featured_until: 10,
    created_at: now,
  };


  const [result] = await db.insert(real_estate_listings).values(insertRow).returning();
  return result;
}
