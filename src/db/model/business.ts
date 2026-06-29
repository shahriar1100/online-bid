import { drizzle } from "drizzle-orm/d1";
import { business_listings } from "../schema";

export interface InsertBusinessInput {
  userId: number;
  
  // General Details
  title: string;
  category: string;
  subcategory: string;
  auctionType: string;
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  
  // Business Details
  builtInYear?: string;
  businessAddress?: string;
  businessCountry?: string;
  businessState?: string;
  businessCity?: string;
  businessPincode?: string;
  
  // Business Descriptions
  highlight?: string;
  reason?: string;
  
  // Financial Information
  price?: string;
  revenue?: string;
  profit?: string;
  assets?: string;
  inventory?: string;
  inventoryValue?: string;
  
  // Operational Details
  employes?: string;
  involvement?: string;
  relocatable?: string;
  homebase?: string;
  franchise?: string;
  namefranchise?: string;
  
  // Facilities and Lease
  premises?: string;
  monthly?: string;
  expiry?: string;
  facilitysize?: string;
}

export async function insertBusiness(
  env: { DB: D1Database },
  payload: InsertBusinessInput
) {
  const db = drizzle(env.DB);
  const now = Math.floor(Date.now() / 1000);

  const insertRow = {
    user_id: payload.userId,
    
    // General Info
    title: payload.title,
    category: payload.category,
    subcategory: payload.subcategory,
    auction_type: payload.auctionType,
    duration: payload.duration,
    description: payload.description,
    media: payload.media ? JSON.stringify(payload.media) : null,
    
    // Business Details
    built_in_year: payload.builtInYear ?? null,
    business_address: payload.businessAddress ?? null,
    business_country: payload.businessCountry ?? null,
    business_state: payload.businessState ?? null,
    business_city: payload.businessCity ?? null,
    business_pincode: payload.businessPincode ?? null,
    
    // Description
    highlight: payload.highlight ?? null,
    reason: payload.reason ?? null,
    
    // Financials
    price: payload.price ?? null,
    revenue: payload.revenue ?? null,
    profit: payload.profit ?? null,
    assets: payload.assets ?? null,
    inventory: payload.inventory ?? null,
    inventory_value: payload.inventoryValue ?? null,
    
    // Operations
    employes: payload.employes ?? null,
    involvement: payload.involvement ?? null,
    relocatable: payload.relocatable ?? null,
    homebase: payload.homebase ?? null,
    franchise: payload.franchise ?? null,
    name_franchise: payload.namefranchise ?? null,
    
    // Facilities & Lease
    premises: payload.premises ?? null,
    monthly: payload.monthly ?? null,
    expiry: payload.expiry ?? null,
    facility_size: payload.facilitysize ?? null,
    
    featured_until: 10,
    created_at: now,
  };

  const [result] = await db
    .insert(business_listings)
    .values(insertRow)
    .returning();
    
  return result;
}