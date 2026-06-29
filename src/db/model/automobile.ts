import { drizzle } from "drizzle-orm/d1";
import { automobile_listings } from "../schema";

export interface InsertAutomobileInput {
  userId: number;
  // General Details
  title: string;
  category: string;
  subcategory: string;
  duration: string;
  description: string;
  media?: { name: string; size: number; type: string }[];
  
  // Vehicle Details
  make: string;
  model: string;
  builtInYear: string;
  body: string;
  fuel: string;
  transmission: string;
  engine: string;
  drive: string;
  odometer: string;
  odometerUnit: string;
  
  // Vehicle Conditions
  condition: string;
  accidenthistory: string;
  history?: string;
  shistory: string;
  owner: string;
  vnumber: string;
  
  // Location
  automobileCountry: string;
  automobileState: string;
  automobileCity: string;
  automobilePincode?: string;
  
  // Pricing
  price: string;
  negotiable?: string;
  
  // Additional Features
  mobilefeature?: string[];
  warranty: string;
  warrantydetails?: string;
}

export async function insertAutomobile(
  env: { DB: D1Database }, 
  payload: InsertAutomobileInput
) {
  const db = drizzle(env.DB);
  const now = Math.floor(Date.now() / 1000);
  
  const insertRow = {
    user_id: payload.userId,
    title: payload.title,
    category: payload.category,
    subcategory: payload.subcategory,
    duration: payload.duration,
    description: payload.description,
    media: payload.media ? JSON.stringify(payload.media) : null,
    make: payload.make,
    model: payload.model,
    built_in_year: payload.builtInYear,
    body: payload.body,
    fuel: payload.fuel,
    transmission: payload.transmission,
    engine: payload.engine,
    drive: payload.drive,
    odometer: payload.odometer,
    odometer_unit: payload.odometerUnit,
    condition: payload.condition,
    accident_history: payload.accidenthistory,
    history: payload.history ?? null,
    service_history: payload.shistory,
    owner: payload.owner,
    vin_number: payload.vnumber,
    automobile_country: payload.automobileCountry,
    automobile_state: payload.automobileState,
    automobile_city: payload.automobileCity,
    automobile_pincode: payload.automobilePincode ?? null,
    price: payload.price,
    negotiable: payload.negotiable ?? null,
    mobile_feature: payload.mobilefeature ? JSON.stringify(payload.mobilefeature) : null,
    warranty: payload.warranty,
    warranty_details: payload.warrantydetails ?? null,
    featured_until: 10,
    created_at: now,
  };
  
  const [result] = await db
    .insert(automobile_listings)
    .values(insertRow)
    .returning();
    
  return result;
}