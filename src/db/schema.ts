import { sqliteTable, text, integer, real, uniqueIndex, index,} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uid: text("uid").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  name: text("name").notNull(),
  password_hash: text("password_hash").notNull(),
  role: text("role").default("user"),
  is_verified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updated_at: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});


export const real_estate_listings = sqliteTable("real_estate_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),         // FK to users table (store numeric id)
  title: text("title").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  auction_type: text("auction_type").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  media: text("media").$type<string | null>(),            // JSON string of file metadata / URLs
  property_address: text("property_address").notNull(),
  property_country: text("property_country").notNull(),
  property_state: text("property_state").notNull(),
  property_city: text("property_city").notNull(),
  property_pincode: text("property_pincode").$type<string | null>(),
  bedroom: text("bedroom").$type<string | null>(),
  bathroom: text("bathroom").$type<string | null>(),
  area: text("area").$type<string | null>(),
  lot_size: text("lot_size").$type<string | null>(),
  built_in_year: text("built_in_year").$type<string | null>(),
  furnishing: text("furnishing").$type<string | null>(),
  parking_spaces: text("parking_spaces").$type<string | null>(),
  utilities: text("utilities").$type<string | null>(),   // JSON array
  features: text("features").$type<string | null>(),     // JSON array
  auction_start_price: text("auction_start_price").$type<string | null>(),
  auction_date: text("auction_date").$type<string | null>(),
  monthly: text("monthly").$type<string | null>(),
  expiry: text("expiry").$type<string | null>(),
  ownership_type: text("ownership_type").$type<string | null>(),
  ownership_title: text("ownership_title").$type<string | null>(),
  ownership_status: text("ownership_status").$type<string | null>(),
  legal_description: text("legal_description").$type<string | null>(),
  contact_name: text("contact_name").notNull(),
  contact_phone: text("contact_phone").notNull(),
  contact_email: text("contact_email").notNull(),
  is_agent: text("is_agent").$type<string | null>(),
  license_number: text("license_number").$type<string | null>(),
  authorized_to_sell: text("authorized_to_sell").$type<string | null>(),
  agree_terms: text("agree_terms").$type<string | null>(),
  is_featured: integer("is_featured", { mode: "boolean" }).default(false),
  featured_until: integer("featured_until").$type<number | null>(),
  created_at: integer("created_at").notNull(),
});


export const automobile_listings = sqliteTable("automobile_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),

  // General Details
  title: text("title").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  media: text("media").$type<string | null>(),

  // Vehicle Details
  make: text("make").notNull(),
  model: text("model").notNull(),
  built_in_year: text("built_in_year").notNull(),
  body: text("body").notNull(),
  fuel: text("fuel").notNull(),
  transmission: text("transmission").notNull(),
  engine: text("engine").notNull(),
  drive: text("drive").notNull(),
  odometer: text("odometer").notNull(),
  odometer_unit: text("odometer_unit").notNull(),

  // Vehicle Conditions
  condition: text("condition").notNull(),
  accident_history: text("accident_history").notNull(),
  history: text("history").$type<string | null>(),
  service_history: text("service_history").notNull(),
  owner: text("owner").notNull(),
  vin_number: text("vin_number").notNull(),

  // Location
  automobile_country: text("automobile_country").notNull(),
  automobile_state: text("automobile_state").notNull(),
  automobile_city: text("automobile_city").notNull(),
  automobile_pincode: text("automobile_pincode").$type<string | null>(),

  // Pricing
  price: text("price").notNull(),
  negotiable: text("negotiable").$type<string | null>(),

  // Additional Features
  mobile_feature: text("mobile_feature").$type<string | null>(), // JSON array
  warranty: text("warranty").notNull(),
  warranty_details: text("warranty_details").$type<string | null>(),
  is_featured: integer("is_featured", { mode: "boolean" }).default(false),
  featured_until: integer("featured_until").$type<number | null>(),
  created_at: integer("created_at").notNull(),
});


export const business_listings = sqliteTable("business_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull(),

  // General Info
  title: text("title").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  auction_type: text("auction_type").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  media: text("media").$type<string | null>(),

  // Business Details
  built_in_year: text("built_in_year").$type<string | null>(),
  business_address: text("business_address").$type<string | null>(),
  business_country: text("business_country").$type<string | null>(),
  business_state: text("business_state").$type<string | null>(),
  business_city: text("business_city").$type<string | null>(),
  business_pincode: text("business_pincode").$type<string | null>(),

  // Description
  highlight: text("highlight").$type<string | null>(),
  reason: text("reason").$type<string | null>(),

  // Financials
  price: text("price").$type<string | null>(),
  revenue: text("revenue").$type<string | null>(),
  profit: text("profit").$type<string | null>(),
  assets: text("assets").$type<string | null>(),
  inventory: text("inventory").$type<string | null>(),
  inventory_value: text("inventory_value").$type<string | null>(),

  // Operations
  employes: text("employes").$type<string | null>(),
  involvement: text("involvement").$type<string | null>(),
  relocatable: text("relocatable").$type<string | null>(),
  homebase: text("homebase").$type<string | null>(),
  franchise: text("franchise").$type<string | null>(),
  name_franchise: text("name_franchise").$type<string | null>(),

  // Facilities & Lease
  premises: text("premises").$type<string | null>(),
  monthly: text("monthly").$type<string | null>(),
  expiry: text("expiry").$type<string | null>(),
  facility_size: text("facility_size").$type<string | null>(),
  is_featured: integer("is_featured", { mode: "boolean" }).default(false),
  featured_until: integer("featured_until").$type<number | null>(),
  created_at: integer("created_at").notNull(),
});


export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Link to the listing
  listing_id: integer("listing_id").notNull(),
  listing_type: text("listing_type").notNull(), // 'realestate', 'automobile', 'business'

  // Bidder info
  user_id: integer("user_id").notNull(),
  user_name: text("user_name").notNull(),
  user_avatar: text("user_avatar"), // Optional avatar URL

  // Bid details
  bid_amount: real("bid_amount").notNull(), // Store as string for precision

  // Timestamps
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// ========================
// AUCTION SESSIONS TABLE (Optional - for tracking auction state)
// ========================
export const auction_sessions = sqliteTable(
  "auction_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Link to the listing
    listing_id: integer("listing_id").notNull(),
    listing_type: text("listing_type").notNull(), // 'realestate', 'automobile', 'business'

    // Auction timing
    start_time: integer("start_time"), // Unix timestamp
    end_time: integer("end_time"),     // Unix timestamp

    // Current state
    status: text("status").default("upcoming"), // 'upcoming', 'live', 'ended'
    starting_price: real("starting_price").notNull(),
    current_bid: real("current_bid"),

    // Winner info (populated when auction ends)
    winner_user_id: integer("winner_user_id"),
    winning_bid: real("winning_bid"),

    // Timestamps
    created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
    updated_at: integer("updated_at", { mode: "timestamp" }).defaultNow(),
  },
  (t) => ({
    uniq_listing: uniqueIndex("uniq_auction_session_listing").on(t.listing_id, t.listing_type),
  })
);


// Add this to your existing schema.ts file

export const auction_payments = sqliteTable(
  "auction_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    user_id: integer("user_id").notNull(),
    listing_id: integer("listing_id").notNull(),
    listing_type: text("listing_type").notNull(),

    winning_bid: real("winning_bid").notNull(),
    upfront_payment: real("upfront_payment").notNull(),
    platform_fee: real("platform_fee").notNull(),
    total_amount: real("total_amount").notNull(),

    stripe_session_id: text("stripe_session_id").unique(),
    stripe_payment_intent: text("stripe_payment_intent"),

    status: text("status").notNull().default("pending"),

    created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
    completed_at: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => ({
    uniq_user_listing: uniqueIndex("uniq_user_listing_payment")
      .on(t.user_id, t.listing_id, t.listing_type),
  })
);

// =========================
// LISTING QUESTIONS
// =========================

export const listingQuestions = sqliteTable(
  "listing_questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    listing_id: integer("listing_id").notNull(),

    listing_type: text("listing_type", {
      enum: ["realestate", "automobile", "business"],
    }).notNull(),

    user_id: integer("user_id").notNull(),

    question: text("question").notNull(),

    status: text("status", {
      enum: ["pending", "approved", "rejected"],
    })
      .default("pending")
      .notNull(),

    is_visible: integer("is_visible", {
      mode: "boolean",
    })
      .default(true)
      .notNull(),

    is_pinned: integer("is_pinned", {
      mode: "boolean",
    })
      .default(false)
      .notNull(),

    total_answers: integer("total_answers")
      .default(0)
      .notNull(),

    last_answer_at: integer("last_answer_at", {
      mode: "timestamp_ms",
    }),

    created_at: integer("created_at", {
      mode: "timestamp_ms",
    })
      .$defaultFn(() => new Date())
      .notNull(),

    updated_at: integer("updated_at", {
      mode: "timestamp_ms",
    })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    listingIdx: index("listing_questions_listing_idx").on(
      table.listing_id,
      table.listing_type
    ),

    userIdx: index("listing_questions_user_idx").on(table.user_id),

    statusIdx: index("listing_questions_status_idx").on(table.status),
  })
);

// =========================
// LISTING ANSWERS
// =========================

export const listingAnswers = sqliteTable(
  "listing_answers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    question_id: integer("question_id")
      .references(() => listingQuestions.id, {
        onDelete: "cascade",
      })
      .notNull(),

    listing_id: integer("listing_id").notNull(),

    listing_type: text("listing_type", {
      enum: ["realestate", "automobile", "business"],
    }).notNull(),

    user_id: integer("user_id").notNull(),

    role: text("role", {
      enum: ["seller", "admin", "moderator"],
    }).notNull(),

    answer: text("answer").notNull(),

    is_best_answer: integer("is_best_answer", {
      mode: "boolean",
    })
      .default(false)
      .notNull(),

    is_visible: integer("is_visible", {
      mode: "boolean",
    })
      .default(true)
      .notNull(),

    is_edited: integer("is_edited", {
      mode: "boolean",
    })
      .default(false)
      .notNull(),

    edited_at: integer("edited_at", {
      mode: "timestamp_ms",
    }),

    created_at: integer("created_at", {
      mode: "timestamp_ms",
    })
      .$defaultFn(() => new Date())
      .notNull(),

    updated_at: integer("updated_at", {
      mode: "timestamp_ms",
    })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    questionIdx: index("listing_answers_question_idx").on(
      table.question_id
    ),

    listingIdx: index("listing_answers_listing_idx").on(
      table.listing_id,
      table.listing_type
    ),

    userIdx: index("listing_answers_user_idx").on(table.user_id),
  })
);