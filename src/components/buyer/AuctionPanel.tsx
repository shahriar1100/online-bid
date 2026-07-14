"use client";

import { useState, useEffect, useCallback, useRef } from "react"; // ✅ CHANGE: Added useRef for WebSocket
import Image from "next/image";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import upcoming from "src/app/assets/images/buyer/upcoming.png";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBidToCache } from "src/util/bid";
import { parseStorageDate } from "src/lib/date-utils";

interface AuctionPanelProps {
  listingId: number;
  listingUserId?: number;
  listingType: "realestate" | "automobile" | "business" | "rent";
  listingPrice?: string;
  auctionStatus?: "Upcoming" | "Live" | "End";
  duration?: string;
}

interface Bid {
  id: number | string; // ✅ CHANGE: Allow string IDs from Durable Object
  bid: string;
  user: string;
  userId: number;
  avatar?: string;
  time: string;
}

interface HighestBid {
  amount: number;
  userName: string;
  userId: number;
  avatar?: string;
}

// interface SellerContact {
//   name: string;
//   email: string;
//   phone?: string;
// }
interface SellerContact {
  name: string;
  email: string;
  phone?: string;
  roomId?: number;
}

interface AuthUser {
  id: number;
  name: string;
  userType: "buyer" | "seller";
}

// ════════════════════════════════════════════════════════════════════════════════
// ✅ NEW: WebSocket Message Types (matching your Durable Object)
// ════════════════════════════════════════════════════════════════════════════════
interface WSInitMessage {
  type: "INIT";
  state: {
    listingId: number;
    listingType: string;
    status: "upcoming" | "live" | "ended";
    startTime: number;
    endTime: number;
    startingPrice: number;
    currentBid: number;
    highestBidder: {
      userId: number;
      userName: string;
      userAvatar?: string;
    } | null;
    bidHistory: Array<{
      id: string;
      bidAmount: number;
      userId: number;
      userName: string;
      userAvatar?: string;
      timestamp: number;
    }>;
  };
  connectedUsers: number;
}

interface WSNewBidMessage {
  type: "NEW_BID";
  bid: {
    id: string;
    bidAmount: number;
    userId: number;
    userName: string;
    userAvatar?: string;
    time: string;
  };
  currentBid: number;
  highestBidder: { userId: number; userName: string; userAvatar?: string };
}

interface WSStatusChangeMessage {
  type: "STATUS_CHANGE";
  status: "upcoming" | "live" | "ended";
  currentBid: number;
  highestBidder: {
    userId: number;
    userName: string;
    userAvatar?: string;
  } | null;
  endTime: number;
}

interface WSAuctionEndedMessage {
  type: "AUCTION_ENDED";
  winner: { userId: number; userName: string; userAvatar?: string } | null;
  winningBid: number;
  listingId: number;
  listingType: string;
}

interface WSBidResponseMessage {
  type: "BID_ACCEPTED" | "BID_REJECTED";
  bid?: {
    id: string;
    bidAmount: number;
    userId: number;
    userName: string;
    userAvatar?: string;
    time: string;
  };
  reason?: string;
}

interface WSUserLeftMessage {
  type: "USER_LEFT";
  connectedUsers: number;
}

interface WSPongMessage {
  type: "PONG";
  timestamp: number;
}

interface WSErrorMessage {
  type: "ERROR";
  message: string;
}

type WebSocketMessage =
  | WSInitMessage
  | WSNewBidMessage
  | WSStatusChangeMessage
  | WSAuctionEndedMessage
  | WSBidResponseMessage
  | WSUserLeftMessage
  | WSPongMessage
  | WSErrorMessage;

const stringToColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

// ════════════════════════════════════════════════════════════════════════════════
// Utility Functions (unchanged)
// ════════════════════════════════════════════════════════════════════════════════

function formatAmountInt(amount: number | string): string {
  const num =
    typeof amount === "string"
      ? parseInt(amount.replace(/[^0-9]/g, ""), 10)
      : Math.floor(amount);

  if (isNaN(num)) return "0";

  if (num >= 1_000_000_000) {
    return Math.floor(num / 1_000_000_000) + "B";
  } else if (num >= 1_000_000) {
    return Math.floor(num / 1_000_000) + "M";
  } else if (num >= 1_000) {
    return Math.floor(num / 1_000) + "K";
  }

  return num.toString();
}

function formatBidAmount(bid: string | number): string {
  const num =
    typeof bid === "number" ? bid : parseFloat(bid.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return String(bid);
  return "$" + num.toFixed(2);
}

function getAuctionStatusAndCountdown(duration: string) {
  try {
    const [startStr, endStr] = duration.split(" to ").map((s) => s.trim());
    const startDate = parseStorageDate(startStr) || new Date();
    const endDate = parseStorageDate(endStr) || new Date();
    const now = new Date();

    let status: "Upcoming" | "Live" | "End" = "Upcoming";
    let timeLeft: string | null = null;

    if (now < startDate) {
      status = "Upcoming";
      const diff = startDate.getTime() - now.getTime();
      timeLeft = formatTimeLeft(diff);
    } else if (now >= startDate && now <= endDate) {
      status = "Live";
      const diff = endDate.getTime() - now.getTime();
      timeLeft = formatTimeLeft(diff);
    } else {
      status = "End";
    }

    return { status, timeLeft, startDate, endDate };
  } catch {
    return {
      status: "Upcoming" as const,
      timeLeft: null,
      startDate: new Date(),
      endDate: new Date(),
    };
  }
}

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════════════
// ✅ NEW: Helper to format bid time from timestamp
// ════════════════════════════════════════════════════════════════════════════════
function formatBidTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

export default function AuctionPanel({
  listingId,
  listingUserId,
  listingType,
  listingPrice,
  duration,
}: AuctionPanelProps) {
  const [auctionState, setAuctionState] = useState<
    "upcoming" | "live" | "ended"
  >("upcoming");
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [currentBid, setCurrentBid] = useState(
    listingPrice ? parseFloat(listingPrice.replace(/[^0-9.-]/g, "")) : 0,
  );
  const [highestBidder, setHighestBidder] = useState<HighestBid | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownText, setCountdownText] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [sellerContact, setSellerContact] = useState<{
    name: string;
    email: string;
    phone?: string;
    roomId?: number;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: WebSocket State and Refs
  // ════════════════════════════════════════════════════════════════════════════════
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const [user, setUser] = useState<AuthUser | null>(null);

  const AUCTION_FEE: Record<
    "realestate" | "business" | "automobile" | "rent",
    string
  > = {
    realestate:
      "The winner will be charged $495 or 1% of the final sale price, whichever is greater.",
    business:
      "The winner will be charged 4% upfront on the winning business price.",
    automobile:
      "The winner will be charged 5% upfront on the winning automobile price.",
    rent: "The winner will be charged 3% upfront on the winning rent price.",
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Get WebSocket URL
  // ════════════════════════════════════════════════════════════════════════════════
  const getWebSocketUrl = useCallback(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    // Get base URL from environment variable
    const baseUrl = process.env.NEXT_PUBLIC_WRANGLER_API_URL || "";

    // Convert HTTP to WebSocket protocol
    const wsBaseUrl = baseUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    // Build WebSocket URL with query params for authentication
    const wsUrl = new URL(
      `${wsBaseUrl}/api/auction/ws/${listingType}/${listingId}`,
    );

    if (user) {
      wsUrl.searchParams.set("userId", user.id.toString());
      wsUrl.searchParams.set("userName", user.name || "Anonymous");
    }

    return wsUrl.toString();
  }, [listingId, listingType]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Handle WebSocket Messages
  // ════════════════════════════════════════════════════════════════════════════════
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log("📨 WebSocket message received:", message.type, message);

      switch (message.type) {
        // ═══════════════════════════════════════════════════════════════════════════════
        // INIT message handler - FIXED
        // ═══════════════════════════════════════════════════════════════════════════════
        case "INIT": {
          setIsAuthenticated(true);
          const { state, connectedUsers: users } = message;

          if (state.currentBid > 0) {
            saveBidToCache(
              listingType,
              listingId,
              state.currentBid,
              state.highestBidder?.userName,
            );
          }

          // Update current bid and highest bidder
          setCurrentBid(state.currentBid);
          if (state.highestBidder) {
            setHighestBidder({
              amount: state.currentBid,
              userName: state.highestBidder.userName,
              userId: state.highestBidder.userId,
              avatar: state.highestBidder.userAvatar,
            });
          }

          // Transform bid history
          const transformedBids: Bid[] = [...state.bidHistory]
            .reverse()
            .map((bid) => ({
              id: bid.id,
              bid: `$${bid.bidAmount}`,
              user: bid.userName,
              userId: bid.userId,
              avatar: bid.userAvatar,
              time: formatBidTime(bid.timestamp),
            }));

          setBidHistory(transformedBids);
          setConnectedUsers(users);

          console.log(
            "✅ Bid data initialized from WebSocket (status calculated locally)",
          );
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // NEW_BID: Real-time bid update from another user
        // ─────────────────────────────────────────────────────────────────────────
        case "NEW_BID": {
          const {
            bid,
            currentBid: newCurrentBid,
            highestBidder: newHighestBidder,
          } = message;

          // Update current bid
          setCurrentBid(newCurrentBid);

          // Update highest bidder
          setHighestBidder({
            amount: newCurrentBid,
            userName: newHighestBidder.userName,
            userId: newHighestBidder.userId,
            avatar: newHighestBidder.userAvatar,
          });
          saveBidToCache(
            listingType,
            listingId,
            newCurrentBid,
            newHighestBidder.userName,
          );
          // Add new bid to history (at the beginning for newest first)
          const newBid: Bid = {
            id: bid.id,
            bid: `$${bid.bidAmount}`,
            user: bid.userName,
            userId: bid.userId,
            avatar: bid.userAvatar,
            time: bid.time,
          };
          setBidHistory((prev) => [newBid, ...prev]);

          // Show toast for other users' bids
          const userStr = localStorage.getItem("user");
          const currentUser = userStr ? JSON.parse(userStr) : null;
          if (!currentUser || currentUser.id !== bid.userId) {
            toast.info(
              `New bid: $${formatAmountInt(bid.bidAmount)} by ${bid.userName}`,
            );
          }

          console.log(
            `✅ New bid received: $${bid.bidAmount} by ${bid.userName}`,
          );
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // STATUS_CHANGE: Auction status changed (started/ended via alarm)
        // ─────────────────────────────────────────────────────────────────────────
        case "STATUS_CHANGE": {
          const { status, currentBid: newBid, highestBidder: winner } = message;

          setAuctionState(status);
          setCurrentBid(newBid);

          if (winner) {
            setHighestBidder({
              amount: newBid,
              userName: winner.userName,
              userId: winner.userId,
              avatar: winner.userAvatar,
            });
          }

          // Show appropriate toast
          if (status === "live") {
            toast.success("🎉 Auction is now LIVE! Start bidding!");
          } else if (status === "ended") {
            toast.info("⏱️ Auction has ended!");
          }

          console.log(`✅ Auction status changed to: ${status}`);
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // AUCTION_ENDED: Auction finished with final results
        // ─────────────────────────────────────────────────────────────────────────
        case "AUCTION_ENDED": {
          const { winner, winningBid } = message;

          setAuctionState("ended");

          if (winner) {
            setHighestBidder({
              amount: winningBid,
              userName: winner.userName,
              userId: winner.userId,
              avatar: winner.userAvatar,
            });
            setCurrentBid(winningBid);

            // Check if current user won
            const userStr = localStorage.getItem("user");
            const currentUser = userStr ? JSON.parse(userStr) : null;
            if (currentUser && currentUser.id === winner.userId) {
              toast.success("🏆 Congratulations! You won the auction!");
            } else {
              toast.info(
                `Auction ended! Winner: ${winner.userName} with $${formatAmountInt(winningBid)}`,
              );
            }
          } else {
            toast.info("Auction ended with no bids");
          }

          console.log(
            "✅ Auction ended:",
            winner ? `Winner: ${winner.userName}` : "No winner",
          );
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // BID_ACCEPTED: Confirmation that our bid was accepted
        // ─────────────────────────────────────────────────────────────────────────
        case "BID_ACCEPTED": {
          setIsSubmitting(false);
          setBidAmount("");
          toast.success("✅ Bid placed successfully!");
          console.log("✅ Bid accepted");
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // BID_REJECTED: Our bid was rejected
        // ─────────────────────────────────────────────────────────────────────────
        case "BID_REJECTED": {
          setIsSubmitting(false);
          toast.error(message.reason || "Bid was rejected");
          console.log("❌ Bid rejected:", message.reason);
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // USER_LEFT: Update connected users count
        // ─────────────────────────────────────────────────────────────────────────
        case "USER_LEFT": {
          setConnectedUsers(message.connectedUsers);
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // PONG: Keep-alive response (no action needed)
        // ─────────────────────────────────────────────────────────────────────────
        case "PONG": {
          // Connection is alive
          break;
        }

        // ─────────────────────────────────────────────────────────────────────────
        // ERROR: Server-side error
        // ─────────────────────────────────────────────────────────────────────────
        case "ERROR": {
          console.error("WebSocket error from server:", message.message);
          toast.error(message.message);
          break;
        }

        default:
          console.log(
            "Unknown WebSocket message type:",
            (message as { type: string }).type,
          );
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, []);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Connect to WebSocket
  // ════════════════════════════════════════════════════════════════════════════════
  const connectWebSocket = useCallback(() => {
    // Only connect for live auctions
    if (auctionState !== "live") {
      console.log("Skipping WebSocket connection - auction is not live");
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Check max reconnect attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(
        "Max reconnect attempts reached, falling back to HTTP polling",
      );
      return;
    }

    const wsUrl = getWebSocketUrl();
    console.log("🔌 Connecting to WebSocket:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection

        // Start ping interval to keep connection alive (every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 30000);
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = (event) => {
        setIsAuthenticated(false);
        console.log(
          `🔌 WebSocket closed: code=${event.code}, reason=${event.reason}`,
        );
        setIsConnected(false);
        wsRef.current = null;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a clean close and auction is still live
        if (event.code !== 1000 && auctionState === "live") {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          ); // Exponential backoff, max 30s

          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [auctionState, getWebSocketUrl, handleWebSocketMessage]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Disconnect WebSocket
  // ════════════════════════════════════════════════════════════════════════════════
  const disconnectWebSocket = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, "Component cleanup");
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Effect to manage WebSocket connection based on auction state
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (auctionState === "live") {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [auctionState, connectWebSocket, disconnectWebSocket]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ NEW: Trigger server finalization when auction ends on UI
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (auctionState !== "ended") return;

    // Call the state endpoint which triggers checkAndFinalizeIfEnded in DO
    const triggerFinalize = async () => {
      try {
        console.log("🔄 Triggering auction finalization on server...");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/state/${listingType}/${listingId}`,
          { cache: "no-store" },
        );

        const data = await response.json();
        console.log("✅ Finalization triggered, response:", data);
      } catch (error) {
        console.error("Failed to trigger finalization:", error);
      }
    };

    triggerFinalize();
  }, [auctionState, listingId, listingType]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ MODIFIED: Fetch bids (now as fallback when WebSocket is not connected)
  // ════════════════════════════════════════════════════════════════════════════════
  const fetchBids = useCallback(async () => {
    // Skip if WebSocket is connected (we get real-time updates)
    if (isConnected) {
      console.log("Skipping HTTP fetch - WebSocket is connected");
      return;
    }

    try {
      // ✅ CHANGE: Use the new Durable Object state endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/state/${listingType}/${listingId}`,
        { cache: "no-store" },
      );

      const data = (await response.json()) as {
        success: boolean;
        state?: {
          status: "upcoming" | "live" | "ended";
          currentBid: number;
          highestBidder: {
            userId: number;
            userName: string;
            userAvatar?: string;
          } | null;
          bidHistory: Array<{
            id: string;
            bidAmount: number;
            userId: number;
            userName: string;
            userAvatar?: string;
            timestamp: number;
          }>;
        };
        error?: string;
      };

      if (data.success && data.state) {
        // Update status from Durable Object
        // setAuctionState(data.state.status);
        setCurrentBid(data.state.currentBid);

        if (data.state.highestBidder) {
          setHighestBidder({
            amount: data.state.currentBid,
            userName: data.state.highestBidder.userName,
            userId: data.state.highestBidder.userId,
            avatar: data.state.highestBidder.userAvatar,
          });
        }

        // Transform bid history
        const transformedBids: Bid[] = [...data.state.bidHistory]
          .reverse()
          .map((bid) => ({
            id: bid.id,
            bid: `$${bid.bidAmount}`,
            user: bid.userName,
            userId: bid.userId,
            avatar: bid.userAvatar,
            time: formatBidTime(bid.timestamp),
          }));
        setBidHistory(transformedBids);
      }
    } catch (error) {
      console.error("Error fetching auction state:", error);
    }
  }, [listingId, listingType, isConnected]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ MODIFIED: Fetch bids on mount (only when not connected via WebSocket)
  // ════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    console.log("AuctionPanel props:", { listingId, listingType });

    // Initial fetch (WebSocket will take over once connected)
    if (!isConnected) {
      fetchBids();
    }
  }, [fetchBids, auctionState, isConnected, listingId, listingType]);

  // ════════════════════════════════════════════════════════════════════════════════
  // ✅ MODIFIED: Handle bid submission (via WebSocket when connected, HTTP fallback)
  // ════════════════════════════════════════════════════════════════════════════════
  const handleBidNow = async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const minimumBid = currentBid + 1;

    // Validation
    if (user?.userType === "seller") {
      toast.error("Sellers cannot place bids");
      return;
    }

    if (bidAmount === "" || bidAmount <= currentBid) {
      toast.error(`Bid must be at least $${formatAmountInt(minimumBid)}`);
      return;
    }

    if (bidAmount < 1) {
      toast.error("Minimum bid amount is $1");
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Please login to place a bid");
      router.push(`${pathname}?auth=login`);
      return;
    }

    setIsSubmitting(true);

    // ════════════════════════════════════════════════════════════════════════════
    // ✅ NEW: Try WebSocket first for real-time bidding
    // ════════════════════════════════════════════════════════════════════════════
    if (wsRef.current?.readyState === WebSocket.OPEN && isAuthenticated) {
      console.log("📤 Sending bid via WebSocket:", bidAmount);

      wsRef.current.send(
        JSON.stringify({
          type: "PLACE_BID",
          bidAmount: bidAmount,
        }),
      );
      // toast.error("Connecting to auction… please wait");
      // Note: isSubmitting will be set to false when we receive BID_ACCEPTED or BID_REJECTED
      return;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ✅ MODIFIED: HTTP fallback when WebSocket is not available
    // ════════════════════════════════════════════════════════════════════════════
    console.log("📤 Sending bid via HTTP (WebSocket not available)");

    try {
      // ✅ CHANGE: Use the new Durable Object bid endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/bid/${listingType}/${listingId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            bidAmount: bidAmount,
          }),
        },
      );

      const data = (await response.json()) as {
        success?: boolean;
        bid?: {
          id: string;
          bidAmount: number;
          userId: number;
          userName: string;
          userAvatar?: string;
        };
        error?: string;
      };

      if (response.ok && data.success) {
        toast.success("Bid placed successfully!");
        setBidAmount("");

        // Update local state (if WebSocket reconnects, it will sync)
        if (data.bid) {
          const newBid: Bid = {
            id: data.bid.id,
            bid: `$${data.bid.bidAmount}`,
            user: data.bid.userName,
            userId: data.bid.userId,
            avatar: data.bid.userAvatar,
            time: "Just now",
          };
          setBidHistory((prev) => [newBid, ...prev]);
          setCurrentBid(data.bid.bidAmount);
          setHighestBidder({
            amount: data.bid.bidAmount,
            userName: data.bid.userName,
            userId: data.bid.userId,
            avatar: data.bid.userAvatar,
          });
        }
      } else {
        toast.error(data.error || "Failed to place bid");
      }
    } catch (error) {
      console.error("Bid error:", error);
      toast.error("Failed to place bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // Handle Pay Now (unchanged)
  // ════════════════════════════════════════════════════════════════════════════════
  const handlePayNow = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Please login to continue");
      router.push(`${pathname}?auth=login`);
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/pay-now`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId,
            listingType,
          }),
        },
      );

      const data = (await res.json()) as { error?: string; url?: string };

      if (!res.ok) {
        toast.error(data.error || "Payment failed");
        return;
      }

      if (!data.url) {
        toast.error("Stripe session not created");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Pay Now error:", err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!duration) {
      console.warn("⚠️ No duration provided to AuctionPanel");
      return;
    }

    const updateAuctionState = () => {
      const { status, timeLeft } = getAuctionStatusAndCountdown(duration);

      // Always update countdown text
      setCountdownText(timeLeft || "");

      // ✅ THIS is the ONLY place that should set auctionState
      if (status === "End") {
        if (auctionState !== "ended") {
          console.log("⏱️ Auction ENDED (calculated from duration)");
          setAuctionState("ended");

          // Clean up WebSocket
          if (wsRef.current) {
            wsRef.current.close(1000, "Auction ended");
            wsRef.current = null;
          }
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
        }
      } else if (status === "Live") {
        if (auctionState !== "live") {
          console.log("🔴 Auction is LIVE (calculated from duration)");
          setAuctionState("live");
        }
      } else if (status === "Upcoming") {
        if (auctionState !== "upcoming") {
          console.log("⏳ Auction is UPCOMING (calculated from duration)");
          setAuctionState("upcoming");
        }
      }
    };

    updateAuctionState();
    const interval = setInterval(updateAuctionState, 1000);
    return () => clearInterval(interval);
  }, [duration, auctionState]); // ✅ Remove isConnected dependency - always use local calculation

  // ════════════════════════════════════════════════════════════════════════════════
  // Fetch seller contact AFTER auction ends & payment is verified
  // This also triggers finalizeAuctionIfNeeded on the server
  // ════════════════════════════════════════════════════════════════════════════════
  // useEffect(() => {
  //   if (auctionState !== "ended") return;

  //   const token = localStorage.getItem("authToken");
  //   if (!token) return;

  //   fetch(
  //     `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/contact/${listingType}/${listingId}`,
  //     {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }
  //   )
  //     .then(res => {
  //       if (!res.ok) return null;
  //       return res.json() as Promise<SellerContact>;
  //     })
  //     .then(data => {
  //       if (data?.name && data?.email) {
  //         setSellerContact(data);
  //       }
  //     })
  //     .catch(err => {
  //       console.error("Failed to fetch seller contact:", err);
  //     });
  // }, [auctionState, listingId, listingType]);
  useEffect(() => {
    if (auctionState !== "ended") return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    async function loadSellerContact() {
      try {
        console.log("===== LOAD SELLER CONTACT =====");
        console.log("LISTING =", listingType, listingId);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/auction/contact/${listingType}/${listingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("CONTACT STATUS =", res.status);

        const data: SellerContact = await res.json();

        console.log("CONTACT RESPONSE =", data);

        if (res.ok && data?.name && data?.email) {
          console.log("SELLER CONTACT FOUND");
          setSellerContact(data as SellerContact);
        } else {
          console.log("SELLER CONTACT NOT FOUND");
        }
      } catch (err) {
        console.error("Failed to fetch seller contact:", err);
      }
    }

    loadSellerContact();
  }, [auctionState, listingId, listingType]);

  // ════════════════════════════════════════════════════════════════════════════════
  // UI Helpers (unchanged)
  // ════════════════════════════════════════════════════════════════════════════════

  const getStatusColor = () => {
    switch (auctionState) {
      case "upcoming":
        return "badge-container default";
      case "live":
        return "badge-container live";
      case "ended":
        return "badge-container end";
    }
  };

  const getStatusText = () => {
    switch (auctionState) {
      case "upcoming":
        return "Upcoming";
      case "live":
        return "Live";
      case "ended":
        return "Ended";
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isSeller = user?.userType === "seller";
  const isWinner =
    auctionState === "ended" &&
    user?.userType === "buyer" &&
    highestBidder?.userId === user?.id;

  const calculatePlatformFee = (
    amount: number,
    listingType: "realestate" | "automobile" | "business" | "rent",
  ) => {
    const fixed = 495;
    const onePercentOfWinningBid = amount * 0.01;

    switch (listingType) {
      case "realestate":
        return Math.max(fixed, onePercentOfWinningBid);
      case "automobile":
        return (amount * 0.05).toFixed(2);

      case "business":
        return (amount * 0.04).toFixed(2);

      case "rent":
        return (amount * 0.03).toFixed(2);
    }
  };

  // ════════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════════

  return (
    <section className="w-full lg:w-1/2 auction-panel">
      <div className="bg-gradient-to-b from-black to-gray-600 text-white h-max p-4 md:p-6 rounded">
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* Header - ✅ MODIFIED: Added connection status indicator */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-between items-center mb-6 border-b border-[#333B48] pb-3 partipant_name">
          <div>
            <p>Current Bid:</p>
            {/* ✅ NEW: Connection status indicator for live auctions */}
            {auctionState === "live" && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected
                    ? `Live • ${connectedUsers} watching`
                    : "Connecting..."}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg lg:text-2xl font-bold">
              $
              {auctionState === "upcoming"
                ? "0.00"
                : formatAmountInt(currentBid)}
            </p>
          </div>
        </div>

        {/* User Info (unchanged) */}
        <div className="flex justify-between items-center gap-3 mb-10">
          <div className="flex items-center gap-3">
            {/* <div className={`w-auto h-9 lg:h-12 rounded-full overflow-hidden flex items-center justify-center ${auctionState === "upcoming" ? "bg-gray-200" : ""}`}>
              <Image
                src={auctionState === "upcoming" ? upcomingDp : auctionState === "live" ? liveDp : endDp}
                alt="User avatar"
                width={100}
                height={100}
                className="object-cover object-center w-full h-full"
              />
            </div> */}
            {/* Letter Avatar */}
            <div
              className="h-9 w-9 lg:h-12 lg:w-12 rounded-full flex items-center justify-center text-white font-semibold uppercase select-none text-base md:text-xl goldman-regular"
              style={{
                backgroundColor:
                  auctionState === "upcoming"
                    ? "#e5e7eb"
                    : stringToColor(highestBidder?.userName || "User"),
              }}
            >
              {auctionState === "upcoming"
                ? "NA"
                : highestBidder?.userName?.charAt(0) || "NA"}
            </div>
            <div>
              <div className="sub-text2">
                {auctionState === "upcoming"
                  ? "Current highest Bidder"
                  : auctionState === "live"
                    ? "Current highest Bidder"
                    : "Winner"}
              </div>
              <div className="partipant_name">
                {auctionState === "upcoming"
                  ? "Waiting for participant..."
                  : highestBidder?.userName || "No bids yet"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`status-container ${getStatusColor()}`}>
              • {getStatusText()}
            </div>
            <div className="text-green-400 text-sm md:text-lg font-medium">
              {auctionState === "upcoming"
                ? countdownText
                  ? `Starts in ${countdownText}`
                  : "Starting soon"
                : auctionState === "ended"
                  ? "Ended"
                  : countdownText}
            </div>
            <div className="sub-text2">
              {auctionState === "upcoming"
                ? "Time until start"
                : auctionState === "ended"
                  ? ""
                  : "Time remaining"}
            </div>
          </div>
        </div>

        {/* Bid History Header (unchanged) */}
        <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-white mb-4 px-2">
          <div>Bid</div>
          <div>User</div>
          <div>Time</div>
        </div>

        {/* Bid History (unchanged structure) */}
        <div className="flex-1">
          {auctionState === "upcoming" ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Image
                src={upcoming}
                alt="Check Icon"
                width={100}
                height={100}
                className="w-auto h-20 md:h-28 object-contain"
              />
            </div>
          ) : bidHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-400">
                {auctionState === "ended"
                  ? "The bid has expired. Better luck next time!"
                  : "No bids yet. Be the first one!"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 h-80 overflow-auto custom-scrollbar mb-10">
              {bidHistory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-3 gap-4 items-center py-1 px-2"
                >
                  <div className="font-medium text-sm md:text-base">
                    {formatBidAmount(item.bid)}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <Image
                      src={item.avatar || liveDp}
                      alt="User"
                      width={100}
                      height={100}
                      className="rounded-full w-auto h-6"
                    /> */}
                    {/* Letter Avatar */}
                    <div
                      className="min-h-6 min-w-6 rounded-full flex items-center justify-center text-white text-xs font-semibold uppercase select-none"
                      style={{
                        backgroundColor: stringToColor(item.user || "User"),
                      }}
                    >
                      {item.user?.charAt(0) || "NA"}
                    </div>
                    <span className="text-sm">{item.user}</span>
                  </div>
                  <div className="text-sm text-gray-400">{item.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons - Upcoming (unchanged) */}
        {auctionState === "upcoming" && (
          <div className="text-center space-y-3">
            <Button
              className="buyerpay"
              onClick={handlePayNow}
              disabled={isSubmitting}
            >
              Notify me
            </Button>
            <p className="text-xs text-white">
              Click on notify me and we&apos;ll email you the next time this
              item comes up for auction.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* Action Buttons - Live - ✅ MODIFIED: Disabled when not connected */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {auctionState === "live" &&
          !isSeller &&
          user &&
          listingUserId != user.id && (
            <div className="space-y-3">
              <div className="paynow-container">
                <div className="flex flex-wrap md:flex-nowrap items-center w-full gap-y-1">
                  <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">
                    Enter amount * ($)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    step={1}
                    value={bidAmount}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "") {
                        setBidAmount("");
                        return;
                      }

                      const intValue = Math.floor(Number(value));

                      if (!Number.isNaN(intValue)) {
                        setBidAmount(intValue);
                      }
                    }}
                    className="custom-input"
                    placeholder={`Minimum bid $${formatAmountInt(Math.floor(currentBid) + 1)}`}
                  />
                </div>
                {/* ✅ CHANGE: Button now shows connection status */}
                <Button
                  className="buyerpay"
                  onClick={handleBidNow}
                  disabled={isSubmitting || !isAuthenticated}
                >
                  {isAuthenticated ? "Bid now" : "Connecting…"}
                </Button>
              </div>
              <p className="text-xs md:text-sm text-gray-300 mt-2 leading-snug text-center">
                ℹ️ {AUCTION_FEE[listingType]}
              </p>
              {/* ✅ NEW: Show connection warning if disconnected */}
              {!isConnected && auctionState === "live" && (
                <p className="text-xs text-yellow-400 text-center">
                  ⚠️ Live updates paused. Your bid will still be placed.
                </p>
              )}
            </div>
          )}

        {/* Action Buttons - Ended (unchanged) */}
        {auctionState === "ended" && isWinner && (
          <div className="space-y-3">
            {sellerContact ? (
              <div className="bg-white text-black p-4 rounded space-y-4">
                <div>
                  <p>
                    <strong>Seller Name:</strong> {sellerContact.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {sellerContact.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {sellerContact.phone}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!sellerContact?.roomId) return;
                    router.push(`/chat?roomId=${sellerContact.roomId}`);
                  }}
                >
                  Chat with Seller
                </Button>
              </div>
            ) : (
              <div className="paynow-container">
                <div className="text-sm text-[#333b48]">
                  <p>
                    <span className="font-semibold text-black">
                      ${calculatePlatformFee(highestBidder.amount, listingType)}
                    </span>{" "}
                    (Platform Fee - {AUCTION_FEE[listingType]})
                  </p>
                  <p>
                    Please pay the platform fee to reveal the contact
                    information.
                  </p>
                </div>
                <Button className="buyerpay" onClick={handlePayNow}>
                  Pay now
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
