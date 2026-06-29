import { auction_payments } from "../schema";
import { getDb } from "../drizzle";
import { eq, and } from "drizzle-orm";

// ========================
// AUCTION PAYMENT FUNCTIONS
// ========================

export async function createAuctionPayment(
  env: { DB: D1Database },
  data: {
    userId: number;
    listingId: number;
    listingType: "realestate" | "automobile" | "business";
    winningBid: number;
    upfrontPayment: number;
    platformFee: number;
    totalAmount: number;
    stripeSessionId: string;
  }
) {
  const db = getDb(env);
  const now = new Date();
  
  const result = await db.insert(auction_payments).values({
    user_id: data.userId,
    listing_id: data.listingId,
    listing_type: data.listingType,
    winning_bid: data.winningBid,
    upfront_payment: data.upfrontPayment,
    platform_fee: data.platformFee,
    total_amount: data.totalAmount,
    stripe_session_id: data.stripeSessionId,
    status: "pending",
    created_at: now,
  }).returning();
  
  return result[0];
}

export async function getAuctionPaymentBySessionId(
  env: { DB: D1Database },
  sessionId: string
) {
  const db = getDb(env);
  
  const payment = await db
    .select()
    .from(auction_payments)
    .where(eq(auction_payments.stripe_session_id, sessionId))
    .limit(1);
  
  return payment[0] || null;
}

export async function getAuctionPaymentForListing(
  env: { DB: D1Database },
  listingId: number,
  listingType: string,
  userId?: number
) {
  const db = getDb(env);
  
  const conditions = [
    eq(auction_payments.listing_id, listingId),
    eq(auction_payments.listing_type, listingType),
  ];
  
  if (userId) {
    conditions.push(eq(auction_payments.user_id, userId));
  }
  
  const payment = await db
    .select()
    .from(auction_payments)
    .where(and(...conditions))
    .limit(1);
  
  return payment[0] || null;
}

export async function getCompletedPaymentForListing(
  env: { DB: D1Database },
  listingId: number,
  listingType: string
) {
  const db = getDb(env);
  
  const payment = await db
    .select()
    .from(auction_payments)
    .where(
      and(
        eq(auction_payments.listing_id, listingId),
        eq(auction_payments.listing_type, listingType),
        eq(auction_payments.status, "completed")
      )
    )
    .limit(1);
  
  return payment[0] || null;
}

export async function updateAuctionPaymentStatus(
  env: { DB: D1Database },
  sessionId: string,
  data: {
    status: "pending" | "completed" | "failed" | "refunded";
    stripePaymentIntent?: string;
  }
) {
  const db = getDb(env);
  const now = new Date();
  
  const updateData: Record<string, unknown> = {
    status: data.status,
  };
  
  if (data.stripePaymentIntent) {
    updateData.stripe_payment_intent = data.stripePaymentIntent;
  }
  
  if (data.status === "completed") {
    updateData.completed_at = now;
  }
  
  const result = await db
    .update(auction_payments)
    .set(updateData)
    .where(eq(auction_payments.stripe_session_id, sessionId))
    .returning();
  
  return result[0];
}

export async function getUserPayments(
  env: { DB: D1Database },
  userId: number
) {
  const db = getDb(env);
  
  const payments = await db
    .select()
    .from(auction_payments)
    .where(eq(auction_payments.user_id, userId));
  
  return payments;
}

