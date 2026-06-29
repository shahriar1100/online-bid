
// function formatPrice2(amount: number | string | undefined): string {
//   if (amount === undefined || amount === null) return "Contact for price";

//   const num =
//     typeof amount === "string"
//       ? parseFloat(amount.replace(/[^0-9.-]/g, ""))
//       : amount;

//   if (isNaN(num)) return "Contact for price";

//   return `$${num.toFixed(2)}`;
// }

// export function getCachedHighestBid(
//   listingType: "realestate" | "automobile" | "business",
//   listingId: number,
//   fallback?: string
// ): string {
//   try {
//     const raw = sessionStorage.getItem(
//       `highestBid_${listingType}_${listingId}`
//     );

//     if (!raw) return formatPrice2(fallback);

//     const parsed = JSON.parse(raw);

//     if (typeof parsed.amount === "number") {
//       return `$${parsed.amount.toFixed(2)}`;
//     }

//     return formatPrice2(fallback);
//   } catch {
//     return formatPrice2(fallback);
//   }
// }

// export function formatAmount(amount: number | string): string {
//   const num =
//     typeof amount === "string"
//       ? parseFloat(amount.replace(/[^0-9.-]/g, ""))
//       : amount;

//   if (isNaN(num)) return "0.00";

//   if (num >= 1_000_000_000) {
//     return (num / 1_000_000_000).toFixed(2) + "B";
//   } else if (num >= 1_000_000) {
//     return (num / 1_000_000).toFixed(2) + "M";
//   } else if (num >= 1_000) {
//     return (num / 1_000).toFixed(2) + "K";
//   } else {
//     return num.toFixed(2);
//   }
// }



// src/util/bid.ts

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface CachedBid {
  amount: number;
  userName?: string;
  timestamp: number;
}

interface AuctionStateResponse {
  success: boolean;
  state?: {
    status: "upcoming" | "live" | "ended";
    currentBid: number;
    startingPrice: number;
    highestBidder: { userId: number; userName: string; userAvatar?: string } | null;
  };
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════════════════════

const CACHE_TTL = 30000; // 30 seconds
const CACHE_PREFIX = "highestBid_";

// In-memory cache for current session (faster than sessionStorage)
const memoryCache = new Map<string, CachedBid>();

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

function getCacheKey(listingType: string, listingId: number): string {
  return `${CACHE_PREFIX}${listingType}_${listingId}`;
}

function formatPrice2(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return "Contact for price";

  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]/g, ""))
      : amount;

  if (isNaN(num)) return "Contact for price";

  return `$${num.toFixed(2)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Cache Management
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Save bid to both memory and sessionStorage
 */
export function saveBidToCache(
  listingType: string,
  listingId: number,
  amount: number,
  userName?: string
): void {
  const key = getCacheKey(listingType, listingId);
  const data: CachedBid = {
    amount,
    userName,
    timestamp: Date.now(),
  };

  // Save to memory cache
  memoryCache.set(key, data);

  // Save to sessionStorage
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save bid to sessionStorage:", e);
  }
}

/**
 * Get bid from cache (memory first, then sessionStorage)
 */
function getBidFromCache(listingType: string, listingId: number): CachedBid | null {
  const key = getCacheKey(listingType, listingId);

  // Check memory cache first
  const memCached = memoryCache.get(key);
  if (memCached && Date.now() - memCached.timestamp < CACHE_TTL) {
    return memCached;
  }

  // Check sessionStorage
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed: CachedBid = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        // Restore to memory cache
        memoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read bid from sessionStorage:", e);
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// API Functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch current bid from auction API
 */
export async function fetchCurrentBid(
  listingType: "realestate" | "automobile" | "business",
  listingId: number
): Promise<{ amount: number; userName?: string } | null> {
  // Check cache first
  const cached = getBidFromCache(listingType, listingId);
  if (cached) {
    return { amount: cached.amount, userName: cached.userName };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/state/${listingType}/${listingId}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data: AuctionStateResponse = await response.json();

    if (data.success && data.state) {
      const result = {
        amount: data.state.currentBid,
        userName: data.state.highestBidder?.userName,
      };

      // Cache the result
      saveBidToCache(listingType, listingId, result.amount, result.userName);

      return result;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching bid for ${listingType}/${listingId}:`, error);
    return null;
  }
}

/**
 * Batch fetch bids for multiple listings (for home page)
 * Fetches for both Live AND Ended auctions
 */
export async function fetchBidsForListings(
  listings: Array<{
    id: number;
    type: "realestate" | "automobile" | "business";
    status: string;
  }>
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  const listingsToFetch = listings.filter((l) => {
    const status = l.status.toLowerCase();
    return status === "live" || status === "end" || status === "ended";
  });

  if (listingsToFetch.length === 0) {
    return results;
  }

  // Fetch in batches to avoid overwhelming the API
  const BATCH_SIZE = 5;

  for (let i = 0; i < listingsToFetch.length; i += BATCH_SIZE) {
    const batch = listingsToFetch.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async ({ id, type }) => {
      const bid = await fetchCurrentBid(type, id);
      if (bid) {
        results.set(`${type}_${id}`, bid.amount);
      }
    });

    await Promise.all(promises);
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// Synchronous Getters (for UI rendering)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get cached bid synchronously (for rendering)
 * Returns formatted string or fallback
 */
export function getCachedHighestBid(
  listingType: "realestate" | "automobile" | "business",
  listingId: number,
  fallback?: string
): string {
  const cached = getBidFromCache(listingType, listingId);

  if (cached && typeof cached.amount === "number") {
    return `$${cached.amount.toFixed(2)}`;
  }

  return formatPrice2(fallback);
}

/**
 * Get cached bid as number (for calculations)
 */
export function getCachedBidAmount(
  listingType: "realestate" | "automobile" | "business",
  listingId: number,
  fallback?: string
): number | null {
  const cached = getBidFromCache(listingType, listingId);

  if (cached && typeof cached.amount === "number") {
    return cached.amount;
  }

  if (fallback) {
    const num = parseFloat(fallback.replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? null : num;
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// Formatting Functions
// ══════════════════════════════════════════════════════════════════════════════

export function formatAmount(amount: number | string): string {
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]/g, ""))
      : amount;

  if (isNaN(num)) return "0.00";

  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  } else {
    return num.toFixed(2);
  }
}

export function formatAmountShort(amount: number | string): string {
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]/g, ""))
      : amount;

  if (isNaN(num)) return "0";

  if (num >= 1_000_000_000) {
    return Math.floor(num / 1_000_000_000) + "B";
  } else if (num >= 1_000_000) {
    return Math.floor(num / 1_000_000) + "M";
  } else if (num >= 1_000) {
    return Math.floor(num / 1_000) + "K";
  } else {
    return Math.floor(num).toString();
  }
}