import { bids, auction_sessions } from "../schema";
import { getDb } from "../drizzle";
import { eq, and, desc } from "drizzle-orm";

// ========================
// BID FUNCTIONS
// ========================

export async function createBid(
  env: { DB: D1Database },
  data: {
    listingId: number;
    listingType: "realestate" | "automobile" | "business";
    userId: number;
    userName: string;
    userAvatar?: string;
    bidAmount: number;
  }
) {
  const db = getDb(env);
  const now = new Date();
  
  const result = await db.insert(bids).values({
    listing_id: data.listingId,
    listing_type: data.listingType,
    user_id: data.userId,
    user_name: data.userName,
    user_avatar: data.userAvatar || null,
    bid_amount: data.bidAmount,
    created_at: now,
  }).returning();
  
  return result[0];
}

export async function getBidsForListing(
  env: { DB: D1Database },
  listingId: number,
  listingType: string
) {
  const db = getDb(env);
  
  const allBids = await db
    .select()
    .from(bids)
    .where(
      and(
        eq(bids.listing_id, listingId),
        eq(bids.listing_type, listingType)
      )
    )
    .orderBy(desc(bids.created_at));
  
  return allBids;
}

export async function getHighestBid(
  env: { DB: D1Database },
  listingId: number,
  listingType: string
) {
  const db = getDb(env);
  
  const allBids = await db
    .select()
    .from(bids)
    .where(
      and(
        eq(bids.listing_id, listingId),
        eq(bids.listing_type, listingType)
      )
    )
    .orderBy(desc(bids.bid_amount))
    .limit(1);
  
  return allBids[0] || null;
}

export async function getUserBidsForListing(
  env: { DB: D1Database },
  listingId: number,
  listingType: string,
  userId: number
) {
  const db = getDb(env);
  
  const userBids = await db
    .select()
    .from(bids)
    .where(
      and(
        eq(bids.listing_id, listingId),
        eq(bids.listing_type, listingType),
        eq(bids.user_id, userId)
      )
    )
    .orderBy(desc(bids.created_at));
  
  return userBids;
}

// ========================
// AUCTION SESSION FUNCTIONS
// ========================

export async function createAuctionSession(
  env: { DB: D1Database },
  data: {
    listingId: number;
    listingType: "realestate" | "automobile" | "business";
    startTime: number;
    endTime: number;
    startingPrice: number;
  }
) {
  const db = getDb(env);
  const now = new Date();
  
  const result = await db.insert(auction_sessions).values({
    listing_id: data.listingId,
    listing_type: data.listingType,
    start_time: data.startTime,
    end_time: data.endTime,
    starting_price: data.startingPrice,
    current_bid: data.startingPrice,
    status: "upcoming",
    created_at: now,
    updated_at: now,
  }).returning();
  
  return result[0];
}

export async function getAuctionSession(
  env: { DB: D1Database },
  listingId: number,
  listingType: string
) {
  const db = getDb(env);
  
  const session = await db
    .select()
    .from(auction_sessions)
    .where(
      and(
        eq(auction_sessions.listing_id, listingId),
        eq(auction_sessions.listing_type, listingType)
      )
    )
    .limit(1);
  
  return session[0] || null;
}

export async function updateAuctionSession(
  env: { DB: D1Database },
  listingId: number,
  listingType: string,
  data: {
    status?: string;
    currentBid?: string;
    winnerUserId?: number;
    winningBid?: string;
  }
) {
  const db = getDb(env);
  const now = new Date();
  
  const updateData: Record<string, unknown> = {
    updated_at: now,
  };
  
  if (data.status) updateData.status = data.status;
  if (data.currentBid) updateData.current_bid = data.currentBid;
  if (data.winnerUserId) updateData.winner_user_id = data.winnerUserId;
  if (data.winningBid) updateData.winning_bid = data.winningBid;
  
  const result = await db
    .update(auction_sessions)
    .set(updateData)
    .where(
      and(
        eq(auction_sessions.listing_id, listingId),
        eq(auction_sessions.listing_type, listingType)
      )
    )
    .returning();
  
  return result[0];
}