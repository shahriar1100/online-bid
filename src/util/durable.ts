// src/util/durable.ts

import { DurableObject } from "cloudflare:workers";
import { Resend } from "resend";

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

interface Bid {
    id: string;
    bidAmount: number;
    userId: number;
    userName: string;
    userAvatar?: string;
    timestamp: number;
}

interface AuctionState {
    listingId: number;
    listingType: "realestate" | "automobile" | "business";
    startTime: number;
    endTime: number;
    startingPrice: number;
    currentBid: number;
    highestBidder: {
        userId: number;
        userName: string;
        userAvatar?: string;
    } | null;
    status: "upcoming" | "live" | "ended";
    bidHistory: Bid[];
    listingOwnerId: number;
    finalizedInDb?: boolean;
    winnerEmailSent?: boolean;
}

interface WebSocketMessage {
    type: string;
    [key: string]: unknown;
}

interface Env {
    DB: D1Database;
    AUCTION_ROOM: DurableObjectNamespace;

    RESEND_API_KEY: string;
    FROM_EMAIL: string;

    FRONTEND_BASE_URL: string;
}

// ✅ FIX: Added listingId and listingType to session (survives hibernation)
interface WebSocketSession {
    userId: number;
    userName: string;
    userAvatar?: string;
    listingId: number;
    listingType: string;
}

function parseTimestamp(value: unknown): number {
    if (value === null || value === undefined) {
        return Date.now();
    }

    if (typeof value === 'number') {
        if (value < 10_000_000_000) {
            return value * 1000;
        }
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) {
            return parsed;
        }

        const sqliteMatch = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (sqliteMatch) {
            const [, year, month, day, hour, min, sec] = sqliteMatch.map(Number);
            return new Date(year, month - 1, day, hour, min, sec).getTime();
        }

        const num = Number(value);
        if (!isNaN(num)) {
            return num < 10_000_000_000 ? num * 1000 : num;
        }
    }

    console.warn('Could not parse timestamp:', value);
    return Date.now();
}

// ════════════════════════════════════════════════════════════════════════════════
// DURABLE OBJECT CLASS
// ════════════════════════════════════════════════════════════════════════════════

export class AuctionRoom extends DurableObject {
    protected state: DurableObjectState;
    protected env: Env;
    private auctionState: AuctionState | null = null;
    private initialized: boolean = false;

    constructor(state: DurableObjectState, env: Env) {
        super(state, env);
        this.state = state;
        this.env = env;
    }

    // Add this property to the class
private emailSendingInProgress: boolean = false;

private async sendWinnerEmail(): Promise<void> {
    if (!this.auctionState) return;

    // Skip if no winner
    if (!this.auctionState.highestBidder) {
        console.log("📧 No winner to email");
        return;
    }

    // Skip if already sent (check from storage to be safe)
    if (this.auctionState.winnerEmailSent) {
        console.log("📧 Winner email already sent (flag=true), skipping");
        return;
    }

    // Prevent duplicate sends with in-memory lock
    if (this.emailSendingInProgress) {
        console.log("📧 Email send already in progress, skipping");
        return;
    }

    // Set lock BEFORE any async operations
    this.emailSendingInProgress = true;
    
    // Also immediately set the flag and save to prevent other DO instances
    this.auctionState.winnerEmailSent = true;
    await this.state.storage.put("auctionState", this.auctionState);

    try {
        // Get winner's email from database
        const winner = await this.env.DB.prepare(
            `SELECT email, name FROM users WHERE id = ?`
        ).bind(this.auctionState.highestBidder.userId).first<{ email: string; name: string }>();

        if (!winner?.email) {
            console.error("❌ Winner email not found in database");
            // Reset flag since we couldn't send
            this.auctionState.winnerEmailSent = false;
            await this.state.storage.put("auctionState", this.auctionState);
            return;
        }

        // Build auction URL
        const auctionUrl = `${this.env.FRONTEND_BASE_URL || 'https://ibids365.com'}/buyer/${this.auctionState.listingType}/${this.auctionState.listingId}`;

        // Simple email content
        const emailHtml = `
            <p>Hi ${winner.name || this.auctionState.highestBidder.userName},</p>
            <p>Congratulations! 🎉 You have won the auction with a bid of <strong>$${this.auctionState.currentBid.toLocaleString()}</strong>.</p>
            <p>View your auction: <a href="${auctionUrl}">${auctionUrl}</a></p>
            <p>Thank you for using IBIDS 365!</p>
        `;

        // Send email
const resend = new Resend(this.env.RESEND_API_KEY);

const { error } = await resend.emails.send({
    from: this.env.FROM_EMAIL || "onboarding@resend.dev",
    to: winner.email,
    subject: "🏆 You won the auction!",
    html: emailHtml,
});

if (error) {
    console.error("❌ Winner Email Error:", error);

    this.auctionState.winnerEmailSent = false;
    await this.state.storage.put("auctionState", this.auctionState);

    return;
}

console.log(`✅ Winner email sent to ${winner.email}`);

    } catch (error) {
        console.error("❌ Failed to send winner email:", error);
        // Reset flag on failure so it can be retried
        this.auctionState.winnerEmailSent = false;
        await this.state.storage.put("auctionState", this.auctionState);
    } finally {
        this.emailSendingInProgress = false;
    }
}


private async sendOutbidEmail(
    previousUserId: number,
    previousBid: number,
    newBid: number
): Promise<void> {

    const user = await this.env.DB.prepare(
        `SELECT name, email FROM users WHERE id = ?`
    )
        .bind(previousUserId)
        .first<{ name: string; email: string }>();

    if (!user?.email) {
        console.log("❌ Previous bidder email not found");
        return;
    }

    const auctionUrl =
        `${this.env.FRONTEND_BASE_URL}/buyer/${this.auctionState?.listingType}/${this.auctionState?.listingId}`;

    const emailHtml = `
        <h2>You have been outbid!</h2>

        <p>Hi ${user.name},</p>

        <p>Another bidder has placed a higher bid on an auction you were participating in.</p>

        <p><strong>Your Bid:</strong> $${previousBid}</p>

        <p><strong>Current Highest Bid:</strong> $${newBid}</p>

        <br>

        <a href="${auctionUrl}"
           style="
           display:inline-block;
           background:#2563eb;
           color:#fff;
           padding:12px 22px;
           text-decoration:none;
           border-radius:6px;">
           Place Another Bid
        </a>

        <br><br>

        <p>IBIDS 365</p>
    `;

const resend = new Resend(this.env.RESEND_API_KEY);

const { error } = await resend.emails.send({
    from: this.env.FROM_EMAIL || "onboarding@resend.dev",
    to: user.email,
    subject: "🔔 You have been outbid!",
    html: emailHtml,
});

if (error) {
    console.error("❌ Resend Error:", error);
    return;
}

console.log("✅ Outbid email sent:", user.email);
}


    private async resyncFromListing(): Promise<void> {
        if (!this.auctionState) return;

        const listingTable = this.getListingTableName(this.auctionState.listingType);

        const listing = await this.env.DB.prepare(
            `SELECT duration FROM ${listingTable} WHERE id = ?`
        )
            .bind(this.auctionState.listingId)
            .first<{ duration: string }>();

        if (!listing?.duration) return;

        const { start, end } = this.parseDuration(listing.duration);
        const now = Math.floor(Date.now() / 1000);

        // Check if times changed
        const timesChanged = this.auctionState.startTime !== start || this.auctionState.endTime !== end;

        // Update internal state
        this.auctionState.startTime = start;
        this.auctionState.endTime = end;

        console.log("🔄 Auction resynced from listing DB", {
            listingId: this.auctionState.listingId,
            start,
            end,
            now,
            timesChanged,
        });

        // ✅ Also update auction_sessions table if times changed
        if (timesChanged) {
            const newStatus = now >= end ? "ended" : (now >= start ? "live" : "upcoming");

            await this.env.DB.prepare(`
      UPDATE auction_sessions 
      SET start_time = ?, end_time = ?, status = ?, updated_at = unixepoch()
      WHERE listing_id = ? AND listing_type = ?
    `).bind(start, end, newStatus, this.auctionState.listingId, this.auctionState.listingType).run();

            console.log("📅 Updated auction_sessions with new times");
        }

        if (now >= end) {
        this.auctionState.status = "ended";

        // ✅ NEW: Send winner email if not sent yet
        if (!this.auctionState.winnerEmailSent && this.auctionState.highestBidder) {
            console.log("📧 Auction ended during resync, sending winner email...");
            await this.sendWinnerEmail();
        }

        // Finalize if not done
        if (!this.auctionState.finalizedInDb) {
            console.log("🔥 Listing ended but session not updated — forcing finalize");
            await this.finalizeAuction();
            this.auctionState.finalizedInDb = true;
        }
        }

        await this.state.storage.put("auctionState", this.auctionState);
    }



    // ══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════

    private async initialize(listingId: number, listingType: string): Promise<void> {
        if (this.initialized && this.auctionState) {
            return;
        }

        // Try to load from Durable Object storage first
        const stored = await this.state.storage.get<AuctionState>("auctionState");

        if (stored) {
            this.auctionState = stored;
            this.initialized = true;
            // Check if status needs updating based on time
            this.updateStatusBasedOnTime();
            // ✅ FIX: If ended but not finalized, do it now
            if (this.auctionState.status === "ended" && !this.auctionState.finalizedInDb) {
                console.log("🏁 Finalizing on init (was ended but not in DB)");
                await this.finalizeAuction();
                this.auctionState.finalizedInDb = true;
            }
            await this.state.storage.put("auctionState", this.auctionState);
            return;
        }

        // Load from database if not in storage
        await this.loadFromDatabase(listingId, listingType);
    }

    // ✅ NEW: Ensure state is loaded (for use after hibernation)
    private async ensureInitialized(listingId: number, listingType: string): Promise<boolean> {
        if (this.auctionState && this.initialized) {
            return true;
        }

        try {
            await this.initialize(listingId, listingType);
            return this.auctionState !== null;
        } catch (error) {
            console.error("Failed to initialize auction state:", error);
            return false;
        }
    }

    private async loadFromDatabase(listingId: number, listingType: string): Promise<void> {
        const listingTable = this.getListingTableName(listingType);
        const listing = await this.env.DB.prepare(
            `SELECT * FROM ${listingTable} WHERE id = ?`
        ).bind(listingId).first<Record<string, unknown>>();

        if (!listing) {
            throw new Error(`Listing not found: ${listingType}/${listingId}`);
        }

        const { start, end } = this.parseDuration(listing.duration as string);

        let startingPrice = 0;
        if (listingType === "realestate") {
            startingPrice = parseFloat(String(listing.auction_start_price || 0));
        } else {
            startingPrice = parseFloat(String(listing.price || 0));
        }

        const bidsResult = await this.env.DB.prepare(
            `SELECT * FROM bids 
             WHERE listing_id = ? AND listing_type = ?
             ORDER BY created_at ASC`
        ).bind(listingId, listingType).all();

        const dbBids = bidsResult.results || [];
        const highestBid = dbBids.length ? dbBids[dbBids.length - 1] : null;

        const now = Math.floor(Date.now() / 1000);
        let status: "upcoming" | "live" | "ended" = "upcoming";
        if (now >= end) {
            status = "ended";
        } else if (now >= start) {
            status = "live";
        }

        // ✅ Check if already finalized in DB
        const existingSession = await this.env.DB.prepare(
            `SELECT status FROM auction_sessions WHERE listing_id = ? AND listing_type = ?`
        ).bind(listingId, listingType).first<{ status: string }>();

        const alreadyFinalizedInDb = existingSession?.status === "ended";

        const bidHistory: Bid[] = dbBids.map((bid: Record<string, unknown>) => ({
            id: String(bid.id),
            bidAmount: Number(bid.bid_amount),
            userId: Number(bid.user_id),
            userName: String(bid.user_name),
            userAvatar: bid.user_avatar as string | undefined,
            timestamp: parseTimestamp(bid.created_at),
        }));

        this.auctionState = {
            listingId,
            listingType: listingType as "realestate" | "automobile" | "business",
            startTime: start,
            endTime: end,
            startingPrice,
            currentBid: highestBid ? Number(highestBid.bid_amount) : startingPrice,
            highestBidder: highestBid ? {
                userId: Number(highestBid.user_id),
                userName: String(highestBid.user_name),
                userAvatar: highestBid.user_avatar as string | undefined,
            } : null,
            status,
            bidHistory,
            listingOwnerId: Number(listing.user_id),
            finalizedInDb: alreadyFinalizedInDb,
            winnerEmailSent: false,
        };

        await this.state.storage.put("auctionState", this.auctionState);
        this.initialized = true;

        if (status === "ended" && !alreadyFinalizedInDb) {
            console.log("🏁 Auction ended on first load, finalizing...");
            await this.finalizeAuction();
            this.auctionState.finalizedInDb = true;
            await this.state.storage.put("auctionState", this.auctionState);
        } else if (status !== "ended") {
            await this.scheduleStatusTransitions();
        }
    }

    private getListingTableName(listingType: string): string {
        switch (listingType) {
            case "realestate": return "real_estate_listings";
            case "automobile": return "automobile_listings";
            case "business": return "business_listings";
            default: throw new Error(`Invalid listing type: ${listingType}`);
        }
    }

    private parseDuration(duration: string): { start: number; end: number } {
        const [startStr, endStr] = duration.split(" to ").map(s => s.trim());

        const parse = (s: string): number => {
            const [datePart, timePart] = s.split(" ");
            const [day, month, year] = datePart.split("/").map(Number);
            const [hour, minute] = timePart.split(":").map(Number);

            // Create as UTC, then subtract IST offset (5:30)
            // Because the input "19:15" means 19:15 IST, not UTC
            const IST_OFFSET_SECONDS = 5 * 3600 + 30 * 60; // 5h 30m = 19800 seconds
            const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute) / 1000;
            return Math.floor(utcTimestamp - IST_OFFSET_SECONDS);
        };

        return {
            start: parse(startStr),
            end: parse(endStr),
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SCHEDULED ALARMS
    // ══════════════════════════════════════════════════════════════════════════════

    private async scheduleStatusTransitions(): Promise<void> {
        if (!this.auctionState) return;

        const now = Math.floor(Date.now() / 1000);

        if (this.auctionState.status === "upcoming" && this.auctionState.startTime > now) {
            const startMs = this.auctionState.startTime * 1000;
            await this.state.storage.setAlarm(startMs);
            console.log(`⏰ Scheduled auction START alarm for ${new Date(startMs).toISOString()}`);
        }

        if (this.auctionState.status === "live" && this.auctionState.endTime > now) {
            const endMs = this.auctionState.endTime * 1000;
            await this.state.storage.setAlarm(endMs);
            console.log(`⏰ Scheduled auction END alarm for ${new Date(endMs).toISOString()}`);
        }
    }

    async alarm(): Promise<void> {
        console.log("🔔 Alarm triggered!");

        // ✅ FIX: Restore state from storage if needed (after hibernation)
        if (!this.auctionState) {
            const stored = await this.state.storage.get<AuctionState>("auctionState");
            if (stored) {
                this.auctionState = stored;
                this.initialized = true;
            } else {
                console.error("Alarm fired but no auction state found");
                return;
            }
        }

        const previousStatus = this.auctionState.status;
        this.updateStatusBasedOnTime();

        if (this.auctionState.status !== previousStatus) {
            await this.state.storage.put("auctionState", this.auctionState);

            this.broadcast({
                type: "STATUS_CHANGE",
                // status: this.auctionState.status,
                currentBid: this.auctionState.currentBid,
                highestBidder: this.auctionState.highestBidder,
                // endTime: this.auctionState.endTime,
            });

            if (this.auctionState.status === "ended") {
                await this.finalizeAuction();
            }

            await this.scheduleStatusTransitions();
        }
    }

    private updateStatusBasedOnTime(): void {
        if (!this.auctionState) return;

        const now = Math.floor(Date.now() / 1000);

        if (now >= this.auctionState.endTime) {
            this.auctionState.status = "ended";
        } else if (now >= this.auctionState.startTime) {
            this.auctionState.status = "live";
        } else {
            this.auctionState.status = "upcoming";
        }
    }

    private async checkAndFinalizeIfEnded(): Promise<void> {
        if (!this.auctionState) return;
        this.updateStatusBasedOnTime();

        if (this.auctionState.status === "ended") {
            // Always try to send email if not sent yet
            if (!this.auctionState.winnerEmailSent && this.auctionState.highestBidder) {
                console.log("📧 Auction ended, checking if winner email needs to be sent...");
                await this.sendWinnerEmail();
            }

            // Finalize in DB if not done
            if (!this.auctionState.finalizedInDb) {
                console.log("🏁 Auto-finalizing auction (detected on request)");
                await this.finalizeAuction();
                this.auctionState.finalizedInDb = true;
                await this.state.storage.put("auctionState", this.auctionState);
            }
        }
    }

    private async finalizeAuction(): Promise<void> {
        if (!this.auctionState) return;

        console.log(`🏁 Finalizing auction ${this.auctionState.listingType}/${this.auctionState.listingId}`);

        await this.env.DB.prepare(`
            INSERT INTO auction_sessions (listing_id, listing_type, start_time, end_time, starting_price, current_bid, status, winner_user_id, winning_bid, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'ended', ?, ?, unixepoch(), unixepoch())
            ON CONFLICT(listing_id, listing_type) DO UPDATE SET
                status = 'ended',
                current_bid = excluded.current_bid,
                winner_user_id = excluded.winner_user_id,
                winning_bid = excluded.winning_bid,
                updated_at = unixepoch()
        `).bind(
            this.auctionState.listingId,
            this.auctionState.listingType,
            this.auctionState.startTime,
            this.auctionState.endTime,
            this.auctionState.startingPrice,
            this.auctionState.currentBid,
            this.auctionState.highestBidder?.userId || null,
            this.auctionState.highestBidder ? this.auctionState.currentBid : null
        ).run();

        this.broadcast({
            type: "AUCTION_ENDED",
            winner: this.auctionState.highestBidder,
            winningBid: this.auctionState.currentBid,
            listingId: this.auctionState.listingId,
            listingType: this.auctionState.listingType,
        });

        await this.sendWinnerEmail();
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // HTTP REQUEST HANDLER
    // ══════════════════════════════════════════════════════════════════════════════

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        const pathParts = url.pathname.split("/").filter(Boolean);
        const listingType = pathParts[1];
        const listingId = parseInt(pathParts[2], 10);

        // Initialize auction state
        await this.initialize(listingId, listingType);

        if (request.headers.get("Upgrade") === "websocket") {
            return this.asynchandleWebSocketUpgrade(request, url, listingId, listingType);
        }

        if (request.method === "GET") {
            return this.handleGetState();
        }

        if (request.method === "POST" && url.pathname.endsWith("/bid")) {
            return this.handlePlaceBid(request);
        }

        return new Response("Not Found", { status: 404 });
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // WEBSOCKET HANDLING
    // ══════════════════════════════════════════════════════════════════════════════

    // ✅ FIX: Accept listingId and listingType parameters
    private async asynchandleWebSocketUpgrade(
        request: Request,
        url: URL,
        listingId: number,
        listingType: string
    ): Promise<Response> {
        const userId = parseInt(url.searchParams.get("userId") || "0", 10);
        const userName = decodeURIComponent(url.searchParams.get("userName") || "Anonymous");

        console.log(`🔌 WebSocket upgrade for user: ${userName} (${userId})`);
        await this.checkAndFinalizeIfEnded()
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        this.state.acceptWebSocket(server);

        // ✅ FIX: Store listingId and listingType in attachment (survives hibernation!)
        const sessionData: WebSocketSession = {
            userId,
            userName,
            listingId,      // ✅ NEW
            listingType,    // ✅ NEW
        };
        server.serializeAttachment(sessionData);

        const connectedCount = this.state.getWebSockets().length;

        console.log(`🔌 WebSocket connected: ${userName} (${userId}), total: ${connectedCount}`);

        server.send(JSON.stringify({
            type: "INIT",
            state: {
                listingId: this.auctionState?.listingId,
                listingType: this.auctionState?.listingType,
                // status: this.auctionState?.status,
                // startTime: this.auctionState?.startTime,
                // endTime: this.auctionState?.endTime,
                startingPrice: this.auctionState?.startingPrice,
                currentBid: this.auctionState?.currentBid,
                highestBidder: this.auctionState?.highestBidder,
                bidHistory: this.auctionState?.bidHistory.slice(-50),
            },
            connectedUsers: connectedCount,
        }));

        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    private getSessionFromWebSocket(ws: WebSocket): WebSocketSession | null {
        try {
            const attachment = ws.deserializeAttachment();
            if (attachment && typeof attachment === 'object' && 'userId' in attachment) {
                return attachment as WebSocketSession;
            }
            return null;
        } catch (error) {
            console.error("Failed to deserialize WebSocket attachment:", error);
            return null;
        }
    }

    // ✅ FIX: Handle WebSocket messages with state restoration
    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        try {
            const data = JSON.parse(message as string) as WebSocketMessage;
            const session = this.getSessionFromWebSocket(ws);

            console.log(`📨 WebSocket message from ${session?.userName}:`, data.type);

            // ✅ FIX: Restore state from storage if needed (after hibernation)
            if (!this.auctionState && session) {
                console.log("🔄 Restoring auction state after hibernation...");
                const initialized = await this.ensureInitialized(session.listingId, session.listingType);
                if (!initialized) {
                    ws.send(JSON.stringify({
                        type: "ERROR",
                        message: "Failed to restore auction state",
                    }));
                    return;
                }
                console.log("✅ Auction state restored successfully");
            }

            switch (data.type) {
                case "PLACE_BID":
                    await this.handleWebSocketBid(ws, data, session);
                    break;

                case "PING":
                    ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
                    break;

                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error("WebSocket message error:", error);
            ws.send(JSON.stringify({
                type: "ERROR",
                message: error instanceof Error ? error.message : "Unknown error",
            }));
        }
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
        const session = this.getSessionFromWebSocket(ws);
        console.log(`🔌 WebSocket disconnected: ${session?.userName} (code: ${code}, reason: ${reason})`);
        const connectedCount = this.state.getWebSockets().length;

        this.broadcast({
            type: "USER_LEFT",
            connectedUsers: connectedCount,
        });
    }

    async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        const session = this.getSessionFromWebSocket(ws);
        console.error(`WebSocket error for ${session?.userName || 'unknown'}:`, error);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // BID HANDLING
    // ══════════════════════════════════════════════════════════════════════════════

    private async handleWebSocketBid(
        ws: WebSocket,
        data: WebSocketMessage,
        session: WebSocketSession | null
    ): Promise<void> {
        if (!session) {
            ws.send(JSON.stringify({ type: "BID_REJECTED", reason: "Not authenticated" }));
            return;
        }

        // ✅ FIX: Double-check state is available
        if (!this.auctionState) {
            const initialized = await this.ensureInitialized(session.listingId, session.listingType);
            if (!initialized) {
                ws.send(JSON.stringify({
                    type: "BID_REJECTED",
                    reason: "Auction state unavailable. Please refresh the page.",
                }));
                return;
            }
        }

        const bidAmount = Number(data.bidAmount);

        const result = await this.processBid({
            userId: session.userId,
            userName: session.userName,
            bidAmount,
        });

        if (!result.success) {
            ws.send(JSON.stringify({
                type: "BID_REJECTED",
                reason: result.error,
            }));
            return;
        }

        ws.send(JSON.stringify({
            type: "BID_ACCEPTED",
            bid: result.bid,
        }));
    }

    private async handlePlaceBid(request: Request): Promise<Response> {
        const body = await request.json() as {
            userId: number;
            userName: string;
            userAvatar?: string;
            bidAmount: number;
        };

        const result = await this.processBid(body);

        if (!result.success) {
            return new Response(JSON.stringify({ error: result.error }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, bid: result.bid }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    private async processBid(data: {
        userId: number;
        userName: string;
        userAvatar?: string;
        bidAmount: number;
    }): Promise<{ success: boolean; bid?: Bid; error?: string }> {
        if (!this.auctionState) {
            return { success: false, error: "Auction not initialized" };
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // ✅ FIX: Match old behavior - DON'T check auction status server-side
        // Frontend already validates status using local timezone
        // Old /api/bids endpoint never checked status - just bid amount validation
        // ═══════════════════════════════════════════════════════════════════════════

        // Check if user is bidding on their own listing
        if (data.userId === this.auctionState.listingOwnerId) {
            return { success: false, error: "You can't bid on your own listing" };
        }

        // Check if bid is higher than current highest
        if (data.bidAmount <= this.auctionState.currentBid) {
            return {
                success: false,
                error: `Bid must be higher than current highest bid of $${this.auctionState.currentBid}`
            };
        }

        // Minimum bid validation
        if (data.bidAmount < 1) {
            return { success: false, error: "Minimum bid amount is $1" };
        }

        const previousHighestBidder = this.auctionState.highestBidder;
const previousBidAmount = this.auctionState.currentBid;



        // Create the bid
        const bid: Bid = {
            id: `${Date.now()}-${data.userId}`,
            bidAmount: data.bidAmount,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            timestamp: Date.now(),
        };

        this.auctionState.currentBid = data.bidAmount;
        this.auctionState.highestBidder = {
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
        };
        this.auctionState.bidHistory.push(bid);

        await this.state.storage.put("auctionState", this.auctionState);

        await this.env.DB.prepare(`
        INSERT INTO bids (listing_id, listing_type, user_id, user_name, user_avatar, bid_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
            this.auctionState.listingId,
            this.auctionState.listingType,
            data.userId,
            data.userName,
            data.userAvatar || null,
            data.bidAmount,
            Math.floor(Date.now() / 1000)
        ).run();

        this.broadcast({
            type: "NEW_BID",
            bid: {
                id: bid.id,
                bidAmount: bid.bidAmount,
                userId: bid.userId,
                userName: bid.userName,
                userAvatar: bid.userAvatar,
                time: "Just now",
            },
            currentBid: this.auctionState.currentBid,
            highestBidder: this.auctionState.highestBidder,
        });

        console.log(`✅ Bid placed: $${data.bidAmount} by ${data.userName}`);

        if (
    previousHighestBidder &&
    previousHighestBidder.userId !== data.userId
) {
    await this.sendOutbidEmail(
        previousHighestBidder.userId,
        previousBidAmount,
        data.bidAmount
    );
}

        return { success: true, bid };
    }
    // ══════════════════════════════════════════════════════════════════════════════
    // HTTP GET STATE
    // ══════════════════════════════════════════════════════════════════════════════

    private async handleGetState(): Promise<Response> {
        if (!this.auctionState) {
            return new Response(JSON.stringify({ error: "Auction not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        await this.resyncFromListing();
        await this.checkAndFinalizeIfEnded();

        return new Response(JSON.stringify({
            success: true,
            state: {
                listingId: this.auctionState.listingId,
                listingType: this.auctionState.listingType,
                // status: this.auctionState.status,
                // startTime: this.auctionState.startTime,
                // endTime: this.auctionState.endTime,
                startingPrice: this.auctionState.startingPrice,
                currentBid: this.auctionState.currentBid,
                highestBidder: this.auctionState.highestBidder,
                bidHistory: this.auctionState.bidHistory.slice(-50),
            },
        }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // BROADCAST UTILITY
    // ══════════════════════════════════════════════════════════════════════════════

    private broadcast(message: WebSocketMessage): void {
        const messageStr = JSON.stringify(message);
        const sockets = this.state.getWebSockets();

        for (const ws of sockets) {
            try {
                ws.send(messageStr);
            } catch (error) {
                console.error("Failed to send to WebSocket:", error);
            }
        }

        console.log(`📢 Broadcast ${message.type} to ${sockets.length} clients`);
    }
}