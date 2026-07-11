import { insertUser, findUserByEmail, verifyUser, phoneExists } from "./db/model/user";
import { insertRealEstate, type InsertRealStateInput, } from "./db/model/realstate";
import { insertAutomobile, type InsertAutomobileInput } from "./db/model/automobile";
import { insertBusiness, type InsertBusinessInput } from "./db/model/business";
import { eq, and, desc, sql } from "drizzle-orm";
import { Stripe } from "stripe";
import { real_estate_listings, users, automobile_listings, business_listings, bids, auction_sessions, auction_payments } from "./db/schema";
import { drizzle } from "drizzle-orm/d1";
import { signJWT, verifyJWT, verifyStoredPassword, hashPasswordForStore } from "./util/jwt";
import { sendEmail } from "./util/smtp";
import { ENV } from "./util/env";
import { newUserRegistrationAdminEmail, newListingNotificationEmail } from "./util/emailTemplates";
import { calculatePlatformFee } from "./util/calculatePlatformFee";
export { AuctionRoom } from "./util/durable";
import { listingQuestions } from "./db/model/listing-question";
import { listingAnswers } from "./db/model/listing-answer";
import { createRoom } from "./lib/chat/createRoom";
import { getRooms } from "./lib/chat/getRooms";
import { createChatRoom } from "./lib/chat/createRoom";
import { sendMessage } from "./lib/chat/sendMessage";
import { getMessages } from "./lib/chat/getMessages";


export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  R2_BUCKET: R2Bucket;
  FRONTEND_BASE_URL: string;
  AUCTION_ROOM: DurableObjectNamespace;
}

interface SignupBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  registrationType: "Buyer" | "Seller";
}

interface LoginBody {
  email: string;
  password: string;
}

// Dynamic CORS helper
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Allow all origins for now
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE,PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
function parseDuration(duration: string): { start: number; end: number } {
  // Expected format: DD/MM/YYYY HH:mm
  const [startStr, endStr] = duration.split("to").map(s => s.trim());

  const parse = (s: string) => {
    const [datePart, timePart] = s.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return Math.floor(new Date(year, month - 1, day, hour, minute).getTime() / 1000);
  };

  return {
    start: parse(startStr),
    end: parse(endStr),
  };
}

// Add this helper function at the top of your worker file
async function authenticateRequest(req: Request, env: Env): Promise<{ userId: number; email: string; role: string } | null> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);

    if (!payload || !payload.userId) {
      return null;
    }

    return {
      userId: Number(payload.userId),
      email: payload.email as string,
      role: payload.role as string
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
function getListingTable(listingType: string) {
  switch (listingType) {
    case "business":
      return business_listings;
    case "realestate":
      return real_estate_listings;
    case "automobile":
      return automobile_listings;
    default:
      return null;
  }
}

async function finalizeAuctionIfNeeded(
  env: Env,
  listingId: number,
  listingType: "realestate" | "automobile" | "business"
) {
  const db = drizzle(env.DB);
  const now = Math.floor(Date.now() / 1000);

  console.log(`\n🔍 ===== finalizeAuctionIfNeeded =====`);
  console.log(`🔍 listingId: ${listingId}, listingType: ${listingType}`);
  console.log(`🔍 Current time (unix): ${now} (${new Date(now * 1000).toISOString()})`);

  // 1️⃣ Try to get existing session
  const existingSession = await db
    .select()
    .from(auction_sessions)
    .where(
      and(
        eq(auction_sessions.listing_id, listingId),
        eq(auction_sessions.listing_type, listingType)
      )
    )
    .get();

  console.log(`🔍 Existing session: ${existingSession ? JSON.stringify(existingSession) : 'null'}`);

  // ✅ FIX: Restore the old logic for existing session
  if (existingSession) {
    // If still live (not ended yet), return as is
    if (existingSession.end_time && now < existingSession.end_time) {
      console.log(`🔍 Auction still live, returning existing session`);
      return existingSession;
    }

    // If already ended with valid winner, return it
    if (existingSession.status === "ended") {
      console.log(`🔍 Auction already ended, returning existing session`);
      return existingSession;
    }

    // ✅ Session exists but needs to be finalized/fixed
    console.log(`🔍 Auction ended but not finalized, updating...`);

    const highestBid = await db
      .select()
      .from(bids)
      .where(
        and(
          eq(bids.listing_id, listingId),
          eq(bids.listing_type, listingType)
        )
      )
      .orderBy(desc(bids.bid_amount))
      .limit(1)
      .get();

    const winnerUserId = highestBid?.user_id ?? null;
    const winningBidAmount = highestBid?.bid_amount ?? null;
    const currentBidAmount = highestBid?.bid_amount ?? existingSession.current_bid;

    // Double-check if auction has ended
    if (!existingSession.end_time || now < existingSession.end_time) {
      console.log(`🔍 Auction not ended yet (end_time check)`);
      return existingSession;
    }

    // ✅ Update existing session to ended
    await db
      .update(auction_sessions)
      .set({
        status: "ended",
        current_bid: currentBidAmount,
        winner_user_id: winnerUserId,
        winning_bid: winningBidAmount,
        updated_at: new Date(),
      })
      .where(eq(auction_sessions.id, existingSession.id));

    console.log(`✅ Updated session ${existingSession.id} with winner: ${winnerUserId}`);

    return {
      ...existingSession,
      status: "ended" as const,
      current_bid: currentBidAmount,
      winner_user_id: winnerUserId,
      winning_bid: winningBidAmount,
    };
  }

  // 2️⃣ No session exists - need to create one
  console.log(`🔍 No existing session found, creating new one...`);

  const listingTable = getListingTable(listingType);
  if (!listingTable) {
    console.log(`❌ Invalid listing table for type: ${listingType}`);
    return null;
  }

  const listing = await db
    .select()
    .from(listingTable)
    .where(eq(listingTable.id, listingId))
    .get();

  if (!listing) {
    console.log(`❌ Listing not found: ${listingId}`);
    return null;
  }

  console.log(`🔍 Found listing, duration: "${listing.duration}"`);

  console.log("Duration raw:", listing.duration);

  const { start, end } = parseDuration(listing.duration);

  console.log("Start:", new Date(start * 1000).toString());
  console.log("End:", new Date(end * 1000).toString());
  console.log("Now:", new Date(now * 1000).toString());



  console.log(`🔍 Parsed duration:`);
  console.log(`   start: ${start} (${new Date(start * 1000).toISOString()})`);
  console.log(`   end: ${end} (${new Date(end * 1000).toISOString()})`);
  console.log(`   now: ${now}, end: ${end}`);
  console.log(`   isEnded: ${now >= end}`);

  if (isNaN(start) || isNaN(end) || start === 0 || end === 0) {
    console.error(`❌ Failed to parse duration: "${listing.duration}"`);
    return null;
  }

  let startingPrice = 0;
  if (listingType === "realestate") {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    startingPrice = Number((listing as any).auction_start_price ?? 0);
  } else if (listingType === "automobile") {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    startingPrice = Number((listing as any).price ?? 0);
  } else if (listingType === "business") {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    startingPrice = Number((listing as any).price ?? 0);
  }

  console.log(`🔍 Starting price: ${startingPrice}`);

  const isEnded = now >= end;
  let winnerUserId: number | null = null;
  let winningBidAmount: number | null = null;
  let currentBidAmount = startingPrice;
  const status: "upcoming" | "live" | "ended" = now < start ? "upcoming" : (isEnded ? "ended" : "live");

  console.log(`🔍 Calculated status: ${status}, isEnded: ${isEnded}`);

  if (isEnded) {
    const highestBid = await db
      .select()
      .from(bids)
      .where(
        and(
          eq(bids.listing_id, listingId),
          eq(bids.listing_type, listingType)
        )
      )
      .orderBy(desc(bids.bid_amount))
      .limit(1)
      .get();

    console.log(`🔍 Highest bid: ${highestBid ? JSON.stringify(highestBid) : 'null'}`);

    if (highestBid) {
      winnerUserId = highestBid.user_id;
      winningBidAmount = highestBid.bid_amount;
      currentBidAmount = highestBid.bid_amount;
    }
  }

  console.log(`🔍 Winner: userId=${winnerUserId}, bid=${winningBidAmount}`);

  try {
    console.log(`🔍 Inserting new session...`);

    const [created] = await db
      .insert(auction_sessions)
      .values({
        listing_id: listingId,
        listing_type: listingType,
        start_time: start,
        end_time: end,
        starting_price: startingPrice,
        current_bid: currentBidAmount,
        status: status,
        winner_user_id: winnerUserId,
        winning_bid: winningBidAmount,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [auction_sessions.listing_id, auction_sessions.listing_type],
        set: {
          status: status,
          current_bid: currentBidAmount,
          winner_user_id: winnerUserId,
          winning_bid: winningBidAmount,
          updated_at: new Date(),
        },
      })
      .returning();

    console.log(`✅ Created session:`, JSON.stringify(created));
    return created;

  } catch (error) {
    console.error(`❌ Insert error:`, error);

    const existing = await db
      .select()
      .from(auction_sessions)
      .where(
        and(
          eq(auction_sessions.listing_id, listingId),
          eq(auction_sessions.listing_type, listingType)
        )
      )
      .get();

    return existing || null;
  }
}
const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);


    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders() });
    }

    // ========================
    // CHAT - CREATE ROOM
    // ========================
    if (url.pathname === "/api/chat/create-room" && req.method === "POST") {
      return createRoom(req, env);
    }

    // ========================
    // CHAT - GET ROOMS
    // ========================
    if (url.pathname === "/api/chat/rooms" && req.method === "GET") {
      return getRooms(req, env);
    }

    // ========================
    // CHAT - SEND MESSAGE
    // ========================
    if (url.pathname === "/api/chat/send" && req.method === "POST") {
      return sendMessage(req, env);
    }

    // ========================
    // CHAT - GET MESSAGES
    // ========================
    if (url.pathname === "/api/chat/messages" && req.method === "GET") {
      return getMessages(req, env);
    }

    // ========================
    // SIGNUP
    // ========================
    if (url.pathname === "/auth/signup" && req.method === "POST") {
      let body: SignupBody;

      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      if (!body.name || !body.email || !body.password || !body.registrationType) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const existing = await findUserByEmail(env, body.email);
      if (existing) {
        return new Response(JSON.stringify({ error: "Email already registered" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      if (body.phone) {
        const phoneInUse = await phoneExists(env, body.phone);
        if (phoneInUse) {
          return new Response(
            JSON.stringify({ success: false, error: "Phone number already registered" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }
      }

      try {
        const user = await insertUser(env, body.email, body.name, body.phone, body.password, body.registrationType);

        const verifyUrl = `${url.origin}/auth/verify?email=${encodeURIComponent(body.email)}`;

        try {
          const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
              }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
              }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 40px 30px; background-color: #f9fafb; }
              .content h2 { color: #1f2937; margin-top: 0; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important; 
                padding: 14px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600;
                font-size: 16px;
              }
              .link-box {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
                color: #667eea;
                font-size: 14px;
              }
              .footer { 
                text-align: center; 
                padding: 30px 20px; 
                color: #6b7280; 
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
              }
              .info-box {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to IBIDS 365</h1>
              </div>
              <div class="content">
                <h2>Hi ${body.name},</h2>
                <p>Thank you for signing up as a <strong>${body.registrationType}</strong>!</p>
                <p>To get started with bidding and listing items, please verify your email address.</p>
                
                <div class="button-container">
                  <a href="${verifyUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p style="text-align: center; color: #6b7280; font-size: 14px;">Or copy and paste this link:</p>
                <div class="link-box">${verifyUrl}</div>
                
                <div class="info-box">
                  <strong>This link expires in 24 hours.</strong>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p><strong>IBID</strong></p>
                <p>&copy; ${new Date().getFullYear()} IBIDS 365. All rights reserved.</p>
                <p style="font-size: 12px; margin-top: 10px;">
                  This email was sent to ${body.email}
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

          await sendEmail(
            body.email,
            "Verify your IBIDS 365 account",
            emailHtml
          );

          console.log("Verification email sent successfully");
        } catch (err) {
          console.error("Failed to send email:", err);
        }

        // Send admin notification email (fire-and-forget — does not block signup)
        // try {
        //   console.log('admin email', ENV.ADMIN_EMAIL);

        //   const adminHtml = newUserRegistrationAdminEmail({
        //     name: body.name,
        //     email: body.email,
        //     phone: body.phone,
        //     registrationType: body.registrationType,
        //   });
        //   await sendEmail(
        //     ENV.ADMIN_EMAIL,
        //     `New User Registration: ${body.name} (${body.registrationType}) - IBIDS 365`,
        //     adminHtml
        //   );
        //   console.log("Admin notification email sent for new user:", body.email);
        // } catch (adminErr) {
        //   console.error("Failed to send admin notification email:", adminErr);
        // }

        return new Response(
          JSON.stringify({
            success: true,
            userId: user.id,
            email: body.email,
            name: body.name,
            phone: user.phone,
            verifyUrl,
            userType: body.registrationType.toLowerCase() as "buyer" | "seller",
          }),
          { headers: getCorsHeaders() }
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Internal server error";
        return new Response(JSON.stringify({ error: msg }), {
          status: 500,
          headers: getCorsHeaders(),
        });
      }
    }

    // ========================
    // LOGIN
    // ========================
    if (url.pathname === "/auth/login" && req.method === "POST") {
      try {
        let body: LoginBody;
        try {
          body = await req.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: getCorsHeaders(),
          });
        }

        if (!body.email || !body.password) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: getCorsHeaders(),
          });
        }

        const user = await findUserByEmail(env, body.email);
        console.log("LOGIN USER =", user);
        if (!user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: getCorsHeaders(),
          });
        }

        // if (user.password_hash !== body.password) {
        //   return new Response(JSON.stringify({ error: "Invalid password" }), {
        //     status: 401,
        //     headers: getCorsHeaders(),
        //   });
        // }

        const ok = await verifyStoredPassword(body.password, user.password_hash);

        if (!ok) {
          return new Response(JSON.stringify({ error: "Invalid password" }), {
            status: 401,
            headers: getCorsHeaders(),
          });
        }
        user.is_verified = true;
        if (!user.is_verified) {
          return new Response(JSON.stringify({ error: "Email not verified. Please check your inbox." }), {
            status: 403,
            headers: getCorsHeaders(),
          });
        }

        // Generate JWT token
        console.log("JWT USER =", {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.is_verified,
        });

        const token = await signJWT(
          {
            userId: user.id,
            email: user.email,
            role: user.role
          },
          env.JWT_SECRET,
          24 * 60 * 60 // 24 hours expiry
        );

        const safeUser = {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          is_verified: user.is_verified,
          userType: (user.role ?? "buyer").toLowerCase() as "buyer" | "seller",
        };
        console.log("LOGIN RESPONSE =", safeUser);
        return new Response(JSON.stringify({ success: true, user: safeUser, token }), {
          headers: getCorsHeaders(),
        });
      } catch (error) {
        console.log('worker error', error);

        const msg = error instanceof Error ? error.message : "Internal server error";
        return new Response(JSON.stringify({ error: msg }), {
          status: 500,
          headers: getCorsHeaders(),
        });
      }
    }

    // ========================
    // VERIFY EMAIL
    // ========================
    if (url.pathname === "/auth/verify" && req.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(JSON.stringify({ error: "Missing email" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const user = await findUserByEmail(env, email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: getCorsHeaders(),
        });
      }

      // Verify if needed
      const verifiedUser = user.is_verified ? user : await verifyUser(env, email);

      const safeUser = {
        id: verifiedUser.id,
        uid: verifiedUser.uid,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
        is_verified: verifiedUser.is_verified,
        userType: (verifiedUser.role ?? "buyer").toLowerCase() as "buyer" | "seller",
      };

      // Console log server side
      console.log("✅ Verification complete:", safeUser.email);

      // FRONTEND REDIRECT URL
      const redirectUrl = `https://ibids365.com/?verified=true&email=${encodeURIComponent(
        safeUser.email
      )}`;

      // Return HTML response (not JSON / 302)
      // Gmail and most email clients block 302 redirects
      // so we use a small HTML page with JS redirect
      const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Email Verified</title>
        <meta http-equiv="refresh" content="2; url=${redirectUrl}" />
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            text-align: center; 
            padding-top: 100px; 
            background: #f9fafb;
            color: #111827;
          }
          .card {
            display: inline-block;
            background: white;
            padding: 40px 50px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .success {
            font-size: 22px;
            font-weight: 600;
            color: #16a34a;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <p class="success">✅ Email verified successfully!</p>
          <p>Redirecting you to the iBIDS 365...</p>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = "${redirectUrl}";
          }, 2000);
        </script>
      </body>
    </html>
  `;

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    // ========================
    // FORGOT PASSWORD
    // ========================

    if (url.pathname === "/auth/forgot-password" && req.method === "POST") {
      const body = (await req.json()) as { email?: string };
      const email = body.email;

      if (!email) {
        return new Response(JSON.stringify({ error: "Missing email" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const user = await findUserByEmail(env, email);
      if (!user) {
        // Do NOT reveal user existence (security best practice)
        return new Response(JSON.stringify({ success: true, message: "If the email exists, a reset link was sent." }), {
          headers: getCorsHeaders(),
        });
      }

      const token = await signJWT({ email }, env.JWT_SECRET, 15 * 60); // 15 min expiry

      // Use frontend URL for the reset page
      const resetUrl = `${env.FRONTEND_BASE_URL}/reset-password?token=${token}`;

      // Send the email
      try {
        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
        </body>
      </html>
    `;

        await sendEmail(
          email,
          "Reset your IBIDS 365 password",
          emailHtml
        );

        console.log("Password reset email sent to:", email);
      } catch (err) {
        console.error("Failed to send reset email:", err);
        return new Response(JSON.stringify({ error: "Failed to send email" }), {
          status: 500,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify({ success: true, message: "If the email exists, a reset link was sent." }), {
        headers: getCorsHeaders(),
      });
    }

    // ========================
    // RESET PASSWORD
    // ========================
    if (url.pathname === "/auth/reset-password" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload || !payload.email) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify({ success: true, email: payload.email }), {
        headers: getCorsHeaders(),
      });
    }

    if (url.pathname === "/auth/reset-password" && req.method === "POST") {
      const body = (await req.json()) as { token?: string; newPassword?: string };
      const token = body.token;
      const newPassword = body.newPassword;
      if (!token || !newPassword) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload || !payload.email) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const user = await findUserByEmail(env, payload.email as string);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: getCorsHeaders(),
        });
      }

      // update password
      const db = drizzle(env.DB);
      const hashed = await hashPasswordForStore(newPassword);
      await db.update(users)
        .set({
          password_hash: hashed,
          updated_at: new Date(),
        })
        .where(eq(users.email, payload.email as string));

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), {
        headers: getCorsHeaders(),
      });
    }

    if (url.pathname === "/auth/me/update" && req.method === "POST") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          userType: string;
        };

        const db = drizzle(env.DB);

        // Update the user's userType
        await db
          .update(users)
          .set({
            role: body.userType.toLowerCase() == "seller" ? "Seller" : "Buyer",
          })
          .where(eq(users.id, authUser.userId));

        console.log(`✅ Updated user ${authUser.userId} - userType: ${body.userType}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "User updated successfully"
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("POST user error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // CONTACT FORM
    // ========================
    if (url.pathname === "/contact" && req.method === "POST") {
      let body: { name: string; email: string; subject: string; message: string };
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      if (!body.name || !body.email || !body.subject || !body.message) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      try {
        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; background-color: #f9fafb; }
            .field { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin: 12px 0; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
            .value { font-size: 15px; color: #111827; margin-top: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Support Ticket</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${body.name} &lt;${body.email}&gt;</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${body.subject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="value">${body.message}</div>
              </div>
            </div>
            <div class="footer">
              <p>IBIDS 365 Support &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

        await sendEmail(
          "developers@ibids365.com",
          `Support Ticket: ${body.subject}`,
          emailHtml
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: getCorsHeaders(),
        });
      } catch (err) {
        console.error("Contact email failed:", err);
        return new Response(JSON.stringify({ error: "Failed to send email" }), {
          status: 500,
          headers: getCorsHeaders(),
        });
      }
    }

    // ========================
    // GET SELLER CONTACT (POST-PAYMENT)
    // ========================
    if (url.pathname.startsWith("/api/auction/contact/") && req.method === "GET") {
      const parts = url.pathname.split("/");
      const listingType = parts[4] as "realestate" | "automobile" | "business";
      const listingId = Number(parts[5]);

      if (!listingType || isNaN(listingId)) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      // 🔐 Authenticate buyer
      const auth = await authenticateRequest(req, env);
      if (!auth) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: getCorsHeaders(),
        });
      }

      // 🔥 FINALIZE AUCTION IF NEEDED (THIS IS THE KEY)
      const session = await finalizeAuctionIfNeeded(env, listingId, listingType);

      if (!session || session.status !== "ended") {
        return new Response(
          JSON.stringify({ error: "Auction not ended" }),
          { status: 403, headers: getCorsHeaders() }
        );
      }

      if (session.winner_user_id !== auth.userId) {
        return new Response(
          JSON.stringify({ error: "Not auction winner" }),
          { status: 403, headers: getCorsHeaders() }
        );
      }

      const db = drizzle(env.DB);

      // 2️⃣ Check payment (SKIPPED IN TEST MODE)

      const payment = await db
        .select()
        .from(auction_payments)
        .where(
          and(
            eq(auction_payments.listing_id, listingId),
            eq(auction_payments.listing_type, listingType),
            eq(auction_payments.user_id, auth.userId),
            eq(auction_payments.status, "completed")
          )
        )
        .get();

      if (!payment) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 403,
          headers: getCorsHeaders(),
        });
      }


      // 3️⃣ Get seller contact
      const listingTable = getListingTable(listingType);
      if (!listingTable) {
        return new Response(JSON.stringify({ error: "Invalid listing type" }), {
          status: 400,
          headers: getCorsHeaders(),
        });
      }

      const seller = await db
        .select({
          name: users.name,
          email: users.email,
          phone: users.phone,
        })
        .from(listingTable)
        .innerJoin(users, eq(users.id, listingTable.user_id))
        .where(eq(listingTable.id, listingId))
        .get();

      if (!seller) {
        return new Response(JSON.stringify({ error: "Seller not found" }), {
          status: 404,
          headers: getCorsHeaders(),
        });
      }

      return new Response(JSON.stringify(seller), {
        headers: getCorsHeaders(),
      });
    }



    function formatCreatedTime(timestamp: number): string {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Add this helper function near the top with other helpers
    function checkIfFeatured(is_featured: boolean | null, featured_until: number | null): boolean {
      if (!is_featured || !featured_until) return false;
      const now = Math.floor(Date.now() / 1000);
      return featured_until > now;
    }

    if (url.pathname === "/api/questions" && req.method === "GET") {
      try {
        const listingId = Number(url.searchParams.get("listingId"));
        const listingType = url.searchParams.get("listingType");

        if (!listingId || !listingType) {
          return Response.json(
            {
              success: false,
              message: "listingId and listingType are required",
            },
            {
              status: 400,
              headers: getCorsHeaders(),
            }
          );
        }

        const db = drizzle(env.DB);

        const questions = await db
          .select({
            id: listingQuestions.id,
            question: listingQuestions.question,
            createdAt: listingQuestions.createdAt,
            userId: listingQuestions.userId,
            status: listingQuestions.status,
            totalAnswers: listingQuestions.totalAnswers,
            role: users.role,
          })
          .from(listingQuestions)
          .leftJoin(users, eq(users.id, listingQuestions.userId))
          .where(
            and(
              eq(listingQuestions.listingId, listingId),
              eq(listingQuestions.listingType, listingType as any),
              eq(listingQuestions.isVisible, true)
            )
          )
          .orderBy(desc(listingQuestions.createdAt));

        console.log("QUESTIONS =", questions);
        return Response.json(
          {
            success: true,
            questions,
          },
          {
            headers: getCorsHeaders(),
          }
        );
      } catch (error) {
        console.error("GET QUESTIONS ERROR:", error);

        return Response.json(
          {
            success: false,
            message: "Internal server error",
          },
          {
            status: 500,
            headers: getCorsHeaders(),
          }
        );
      }
    }

    if (url.pathname === "/api/questions" && req.method === "POST") {
      try {
        const authUser = await authenticateRequest(req, env);

        if (!authUser) {
          return Response.json(
            {
              success: false,
              message: "Unauthorized",
            },
            {
              status: 401,
              headers: getCorsHeaders(),
            }
          );
        }

        const body = await req.json() as {
          listingId: number;
          listingType: "realestate" | "automobile" | "business";
          sellerId: number;
          question: string;
        };

        if (
          !body.listingId ||
          !body.listingType ||
          !body.question
        ) {
          return Response.json(
            {
              success: false,
              message: "Missing required fields",
            },
            {
              status: 400,
              headers: getCorsHeaders(),
            }
          );
        }

        const db = drizzle(env.DB);

        console.log("BODY:", body);
        console.log("AUTH USER:", authUser);

        const result = await db
          .insert(listingQuestions)
          .values({
            listingId: body.listingId,
            listingType: body.listingType,
            userId: authUser.userId,
            question: body.question,
            status: "approved",
          })
          .returning();

        return Response.json(
          {
            success: true,
            question: result[0],
          },
          {
            headers: getCorsHeaders(),
          }
        );
      } catch (error) {
        console.error("POST QUESTION ERROR:", error);

        if (error instanceof Error) {
          console.error(error.stack);
        }

        return Response.json(
          {
            success: false,
            message: String(error),
          },
          {
            status: 500,
            headers: getCorsHeaders(),
          }
        );
      }
    }

    if (url.pathname === "/api/answers" && req.method === "POST") {
      try {
        const authUser = await authenticateRequest(req, env);

        if (!authUser) {
          return Response.json(
            {
              success: false,
              message: "Unauthorized",
            },
            {
              status: 401,
              headers: getCorsHeaders(),
            }
          );
        }

        const body = (await req.json()) as {
          questionId: number;
          listingId: number;
          listingType: "realestate" | "automobile" | "business";
          answer: string;
        };

        if (
          !body.questionId ||
          !body.listingId ||
          !body.listingType ||
          !body.answer
        ) {
          return Response.json(
            {
              success: false,
              message: "Missing required fields",
            },
            {
              status: 400,
              headers: getCorsHeaders(),
            }
          );
        }

        const db = drizzle(env.DB);

        // Only Seller can reply
        // const user = await db
        //   .select()
        //   .from(users)
        //   .where(eq(users.id, authUser.userId))
        //   .limit(1);

        // const currentUser = user[0];
        // console.log("CURRENT USER =", currentUser);

        // if (!currentUser || currentUser.role !== "Seller") {
        //   return Response.json(
        //     {
        //       success: false,
        //       message: "Only sellers can reply.",
        //     },
        //     {
        //       status: 403,
        //       headers: getCorsHeaders(),
        //     }
        //   );
        // }

        const result = await db
          .insert(listingAnswers)
          .values({
            questionId: body.questionId,
            listingId: body.listingId,
            listingType: body.listingType,
            userId: authUser.userId,
            role: "seller",
            answer: body.answer,
          })
          .returning();

        // Increase reply count
        const question = (
          await db
            .select()
            .from(listingQuestions)
            .where(eq(listingQuestions.id, body.questionId))
            .limit(1)
        )[0];

        if (question) {
          await db
            .update(listingQuestions)
            .set({
              totalAnswers: question.totalAnswers + 1,
              lastAnswerAt: Date.now(),
            })
            .where(eq(listingQuestions.id, body.questionId));
        }

        return Response.json(
          {
            success: true,
            answer: result[0],
          },
          {
            headers: getCorsHeaders(),
          }
        );
      } catch (error) {
        console.error("POST ANSWER ERROR:", error);

        return Response.json(
          {
            success: false,
            message: String(error),
          },
          {
            status: 500,
            headers: getCorsHeaders(),
          }
        );
      }
    }

    if (url.pathname === "/api/answers" && req.method === "GET") {
      try {
        const questionId = Number(url.searchParams.get("questionId"));

        if (!questionId) {
          return Response.json(
            {
              success: false,
              message: "questionId is required",
            },
            {
              status: 400,
              headers: getCorsHeaders(),
            }
          );
        }

        const db = drizzle(env.DB);

        const answers = await db
          .select()
          .from(listingAnswers)
          .where(
            and(
              eq(listingAnswers.questionId, questionId),
              eq(listingAnswers.isVisible, true)
            )
          )
          .orderBy(desc(listingAnswers.createdAt));

        return Response.json(
          {
            success: true,
            answers,
          },
          {
            headers: getCorsHeaders(),
          }
        );
      } catch (error) {
        console.error("GET ANSWERS ERROR:", error);

        return Response.json(
          {
            success: false,
            message: String(error),
          },
          {
            status: 500,
            headers: getCorsHeaders(),
          }
        );
      }
    }

    /* --------- UPLOAD ------------ */
    if (url.pathname === "/api/uploads") {
      const key = url.pathname.slice(1);
      console.log("File upload request for key:", key);
      switch (req.method) {
        case "PUT": {
          /* await this.env.R2.put(key, request.body, {
            onlyIf: request.headers,
            httpMetadata: request.headers,
          });
          return new Response(`Put ${key} successfully!`); */
          const formData = await req.formData();
          const file = formData.get("file");

          if (!file) {
            return new Response("No file uploaded", { status: 400, headers: getCorsHeaders() });
          }

          let fileName = "uploaded-file";
          let fileType = "application/octet-stream";
          let fileStream: ReadableStream | null = null;

          if (file instanceof Blob) {
            fileName = file.name || "uploaded-file";
            fileType = file.type || "application/octet-stream";
            fileStream = file.stream();
          } else if (typeof file === "string") {
            // Not expected, but fallback
            fileStream = new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(file));
                controller.close();
              }
            });
          }

          const key = `uploads/${Date.now()}-${fileName}`;

          await env.R2_BUCKET.put(key, fileStream!, {
            httpMetadata: { contentType: fileType },
          });
          const check = await env.R2_BUCKET.get(key);

          console.log("CHECK AFTER PUT:", !!check);


          console.log("UPLOAD SUCCESS:", key);
          console.log(`File ${fileName} uploaded as ${key}`);
          // Public URL (you need R2 public bucket enabled)
          const publicUrl = `${ENV.R2_PREVIEW_BUCKET_URL}/${key}`;
          console.log("publicUrl : ", publicUrl);
          return Response.json({ url: publicUrl }, { status: 200, headers: getCorsHeaders() });
        }
        case "GET": {
          const object = await env.R2_BUCKET.get(key, {
            onlyIf: req.headers,
            range: req.headers,
          });

          if (object === null) {
            return Response.json({ msg: "Object Not Found" }, { status: 404, headers: getCorsHeaders() });
          }

          const publicUrl = `${ENV.R2_PREVIEW_BUCKET_URL}/${key}`;
          console.log("publicUrl : ", publicUrl);
          return Response.json({ url: publicUrl }, { status: 200, headers: getCorsHeaders() });
        }
        case "DELETE": {
          const formData = await req.formData();
          const file = formData.get("file");

          if (!file) {
            return new Response("No file found", { status: 400, headers: getCorsHeaders() });
          }

          const key = `${file}`;
          console.log(`Key to be delete from R2 is ${key}`);
          const object = await env.R2_BUCKET.get(key, {
            onlyIf: req.headers,
            range: req.headers,
          });

          if (object === null) {
            return Response.json({ msg: "Object Not Found" }, { status: 404, headers: getCorsHeaders() });
          }

          await env.R2_BUCKET.delete(key);

          return Response.json({ msg: "Bucket Object has been deleted!" }, { status: 200, headers: getCorsHeaders() });
        }
        default:
          return Response.json({ msg: "Method Not Allowed" }, { status: 405, headers: { ...getCorsHeaders(), "Allow": "PUT, GET, DELETE" } });
      }
    }

    // ========================
    // REAL ESTATE LISTINGS
    // ========================
    if (url.pathname === "/api/realestate" && req.method === "POST") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        const body: InsertRealStateInput = {
          userId: Number(raw.userId),
          title: raw.title,
          category: raw.category,
          subcategory: raw.subcategory,
          auctionType: raw.auctionType,
          duration: raw.duration,
          description: raw.description,
          media: raw.media || [],
          propertyAddress: raw.propertyAddress,
          propertyCountry: raw.propertyCountry,
          propertyState: raw.propertyState,
          propertyCity: raw.propertyCity,
          propertyPincode: raw.propertyPincode || undefined,
          bedroom: raw.bedroom || undefined,
          bathroom: raw.bathroom || undefined,
          area: raw.area || undefined,
          lot_size: raw.lot_size || undefined,
          builtInYear: raw.builtInYear || undefined,
          furnishing: raw.furnishing || undefined,
          parkingSpaces: raw.parkingSpaces || undefined,
          utilities: raw.utilities || [],
          features: raw.features || [],
          auction_start_price: raw.auctionPrice || undefined,
          auctionDate: raw.auctionDate || undefined,
          monthly: raw.monthly || undefined,
          expiry: raw.expiry || undefined,
          ownershiptype: raw.ownershiptype || undefined,
          ownershiptitle: raw.ownershiptitle || undefined,
          ownershipstatus: raw.ownershipstatus || undefined,
          legalDescription: raw.legalDescription || undefined,
          contactName: raw.contactName,
          contactPhone: raw.contactPhone,
          contactEmail: raw.contactEmail,
          isAgent: raw.isAgent || undefined,
          licenseNumber: raw.licenseNumber || undefined,
          authorizedToSell: !!raw.authorizedToSell,
          agreeTerms: !!raw.agreeTerms,
        };

        const missingFields: string[] = [];

        if (!body.userId || isNaN(body.userId)) {
          console.log("userId failed validation");
          missingFields.push("userId");
        }
        if (!body.title || body.title.trim() === "") {
          console.log("title failed validation");
          missingFields.push("title");
        }
        if (!body.category || body.category.trim() === "") {
          console.log("category failed validation");
          missingFields.push("category");
        }
        if (!body.contactName || body.contactName.trim() === "") {
          console.log("contactName failed validation");
          missingFields.push("contactName");
        }
        if (!body.contactEmail || body.contactEmail.trim() === "") {
          console.log("contactEmail failed validation");
          missingFields.push("contactEmail");
        }

        if (missingFields.length > 0) {
          console.log("Validation failed. Missing fields:", missingFields);
          return new Response(
            JSON.stringify({
              error: "Missing required fields",
              fields: missingFields,
              debug: {
                rawReceived: {
                  userId: raw.userId,
                  title: raw.title,
                  category: raw.category,
                  contactName: raw.contactName,
                  contactEmail: raw.contactEmail
                },
                processedReceived: {
                  userId: body.userId,
                  title: body.title,
                  category: body.category,
                  contactName: body.contactName,
                  contactEmail: body.contactEmail
                }
              }
            }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        console.log("All validations passed!", body);

        const inserted = await insertRealEstate(env, body);

        // Send listing notification emails to seller and admin (fire-and-forget)
        try {
          const db = drizzle(env.DB);
          const seller = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, body.userId))
            .get();

          if (seller) {
            const listingDetails = {
              title: body.title,
              category: body.category,
              subcategory: body.subcategory || "",
              listingType: "Real Estate" as const,
              auctionType: body.auctionType || undefined,
              duration: body.duration || undefined,
              price: body.auction_start_price ? `$${body.auction_start_price}` : undefined,
              location: [body.propertyCity, body.propertyState, body.propertyCountry]
                .filter(Boolean).join(", ") || undefined,
            };

            // Email to seller
            await sendEmail(
              seller.email,
              `Your Listing Has Been Created: ${body.title} - IBIDS 365`,
              newListingNotificationEmail(seller.name, listingDetails, true)
            );

            // Email to admin
            await sendEmail(
              ENV.ADMIN_EMAIL,
              `New Real Estate Listing: ${body.title} - IBIDS 365`,
              newListingNotificationEmail("Admin", listingDetails, false)
            );

            console.log("Listing notification emails sent for Real Estate:", body.title);
          }
        } catch (emailErr) {
          console.error("Failed to send listing notification emails (Real Estate):", emailErr);
        }

        return new Response(JSON.stringify({ success: true, listing: inserted }), {
          headers: getCorsHeaders(),
        });
      } catch (e) {
        console.error("API Error:", e);
        const msg = e instanceof Error ? e.message : "Internal server error";
        return new Response(JSON.stringify({ error: msg }), { status: 500, headers: getCorsHeaders() });
      }
    }

    if (url.pathname === "/api/realestate" && req.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        const listingId = url.searchParams.get("listingId");

        if (listingId) {
          // Fetch and return single listing by ID
          const db = drizzle(env.DB);
          const listing = await db
            .select()
            .from(real_estate_listings)
            .where(and(
              eq(real_estate_listings.id, Number(listingId)),
              eq(real_estate_listings.user_id, Number(userId))
            ))
            .limit(1)
            .get();

          if (!listing) {
            return new Response(JSON.stringify({ error: "Listing not found" }), {
              status: 404,
              headers: getCorsHeaders(),
            });
          }

          const transformedListing = {
            id: listing.id,
            user_id: listing.user_id,
            name: listing.title,
            category: listing.category,
            subCategory: listing.subcategory,
            time: formatCreatedTime(listing.created_at),
            auctionType: listing.auction_type,
            duration: listing.duration,
            description: listing.description,
            media: listing.media ? JSON.parse(listing.media) : [],
            propertyAddress: listing.property_address,
            propertyCountry: listing.property_country,
            propertyState: listing.property_state,
            propertyCity: listing.property_city,
            propertyPincode: listing.property_pincode,
            bedroom: listing.bedroom,
            bathroom: listing.bathroom,
            area: listing.area,
            lot_size: listing.lot_size,
            builtInYear: listing.built_in_year,
            furnishing: listing.furnishing,
            parkingSpaces: listing.parking_spaces,
            utilities: listing.utilities ? JSON.parse(listing.utilities) : [],
            features: listing.features ? JSON.parse(listing.features) : [],
            auctionPrice: listing.auction_start_price,
            auctionDate: listing.auction_date,
            monthly: listing.monthly,
            expiry: listing.expiry,
            ownershipType: listing.ownership_type,
            ownershipTitle: listing.ownership_title,
            ownershipStatus: listing.ownership_status,
            legalDescription: listing.legal_description,
            contactName: listing.contact_name,
            contactPhone: listing.contact_phone,
            contactEmail: listing.contact_email,
            isAgent: listing.is_agent,
            licenseNumber: listing.license_number,
            authorizedToSell: listing.authorized_to_sell === "1",
            agreeTerms: listing.agree_terms === "1",

            // ADD FEATURED STATUS
            isFeatured: checkIfFeatured(listing.is_featured, listing.featured_until),
            featuredUntil: listing.featured_until,
            createdAt: listing.created_at
          };

          return new Response(JSON.stringify({ success: true, listing: transformedListing }), {
            headers: getCorsHeaders(),
          });
        } // else proceed to fetch all listings
        else {
          const db = drizzle(env.DB);
          console.log("GET /api/realestate userId:", userId);

          let listings;
          if (userId) {
            listings = await db
              .select()
              .from(real_estate_listings)
              .where(eq(real_estate_listings.user_id, Number(userId)))
              .orderBy(desc(real_estate_listings.created_at));
          } else {
            listings = await db
              .select()
              .from(real_estate_listings)
              .orderBy(desc(real_estate_listings.created_at));
          }

          const transformedListings = await Promise.all(
            listings.map(async (listing) => {

              const session = await finalizeAuctionIfNeeded(
                env,
                listing.id,
                "realestate"
              );

              return {
                id: listing.id,
                user_id: listing.user_id,
                name: listing.title,
                category: listing.category,
                subCategory: listing.subcategory,
                time: formatCreatedTime(listing.created_at),


                status: session?.status ?? "upcoming",

                auctionType: listing.auction_type,
                duration: listing.duration,
                description: listing.description,
                media: listing.media ? JSON.parse(listing.media) : [],
                propertyAddress: listing.property_address,
                propertyCountry: listing.property_country,
                propertyState: listing.property_state,
                propertyCity: listing.property_city,
                propertyPincode: listing.property_pincode,
                bedroom: listing.bedroom,
                bathroom: listing.bathroom,
                area: listing.area,
                lot_size: listing.lot_size,
                builtInYear: listing.built_in_year,
                furnishing: listing.furnishing,
                parkingSpaces: listing.parking_spaces,
                utilities: listing.utilities ? JSON.parse(listing.utilities) : [],
                features: listing.features ? JSON.parse(listing.features) : [],
                auctionPrice: listing.auction_start_price,
                auctionDate: listing.auction_date,
                monthly: listing.monthly,
                expiry: listing.expiry,
                ownershipType: listing.ownership_type,
                ownershipTitle: listing.ownership_title,
                ownershipStatus: listing.ownership_status,
                legalDescription: listing.legal_description,
                contactName: listing.contact_name,
                contactPhone: listing.contact_phone,
                contactEmail: listing.contact_email,
                isAgent: listing.is_agent,
                licenseNumber: listing.license_number,
                authorizedToSell: listing.authorized_to_sell === "1",
                agreeTerms: listing.agree_terms === "1",

                isFeatured: checkIfFeatured(
                  listing.is_featured,
                  listing.featured_until
                ),
                featuredUntil: listing.featured_until,
                createdAt: listing.created_at,
              };
            })
          );

          return new Response(JSON.stringify({ success: true, listings: transformedListings }), {
            headers: getCorsHeaders(),
          });
        }
      } catch (e) {
        console.error("GET /api/realestate error:", e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }), {
          status: 500,
          headers: getCorsHeaders(),
        });
      }
    }



    // ========================
    // AUTOMOBILE LISTINGS
    // ========================
    if (url.pathname === "/api/automobile" && req.method === "POST") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        const body: InsertAutomobileInput = {
          userId: Number(raw.userId),
          title: raw.title,
          category: raw.category,
          subcategory: raw.subcategory,
          duration: raw.duration,
          description: raw.description,
          media: raw.media || [],
          make: raw.make,
          model: raw.model,
          builtInYear: raw.builtInYear,
          body: raw.body,
          fuel: raw.fuel,
          transmission: raw.transmission,
          engine: raw.engine,
          drive: raw.drive,
          odometer: raw.odometer,
          odometerUnit: raw.odometerUnit,
          condition: raw.condition,
          accidenthistory: raw.accidenthistory,
          history: raw.history || undefined,
          shistory: raw.shistory,
          owner: raw.owner,
          vnumber: raw.vnumber,
          automobileCountry: raw.automobileCountry,
          automobileState: raw.automobileState,
          automobileCity: raw.automobileCity,
          automobilePincode: raw.automobilePincode || undefined,
          price: raw.price,
          negotiable: raw.negotiable || undefined,
          mobilefeature: raw.mobilefeature || [],
          warranty: raw.warranty,
          warrantydetails: raw.warrantydetails || undefined,
        };

        const missingFields: string[] = [];

        if (!body.userId || isNaN(body.userId)) missingFields.push("userId");
        if (!body.title?.trim()) missingFields.push("title");
        if (!body.category?.trim()) missingFields.push("category");
        if (!body.make?.trim()) missingFields.push("make");
        if (!body.model?.trim()) missingFields.push("model");
        if (!body.price?.trim()) missingFields.push("price");

        if (missingFields.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields",
              fields: missingFields
            }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const inserted = await insertAutomobile(env, body);

        // Send listing notification emails to seller and admin (fire-and-forget)
        try {
          const db = drizzle(env.DB);
          const seller = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, body.userId))
            .get();

          if (seller) {
            const listingDetails = {
              title: body.title,
              category: body.category,
              subcategory: body.subcategory || "",
              listingType: "Automobile" as const,
              duration: body.duration || undefined,
              price: body.price ? `$${body.price}` : undefined,
              location: [body.automobileCity, body.automobileState, body.automobileCountry]
                .filter(Boolean).join(", ") || undefined,
            };

            // Email to seller
            await sendEmail(
              seller.email,
              `Your Listing Has Been Created: ${body.title} - IBIDS 365`,
              newListingNotificationEmail(seller.name, listingDetails, true)
            );

            // Email to admin
            await sendEmail(
              ENV.ADMIN_EMAIL,
              `New Automobile Listing: ${body.title} - IBIDS 365`,
              newListingNotificationEmail("Admin", listingDetails, false)
            );

            console.log("Listing notification emails sent for Automobile:", body.title);
          }
        } catch (emailErr) {
          console.error("Failed to send listing notification emails (Automobile):", emailErr);
        }

        return new Response(
          JSON.stringify({ success: true, listing: inserted }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("Automobile API Error:", e);
        const msg = e instanceof Error ? e.message : "Internal server error";
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // Add GET endpoint for automobiles
    if (url.pathname === "/api/automobile" && req.method === "GET") {
      try {
        const userId = url.searchParams.get("userId");
        const listingId = url.searchParams.get("listingId");

        const db = drizzle(env.DB);

        if (listingId) {
          // Fetch and return single listing by ID
          const listing = await db
            .select()
            .from(automobile_listings)
            .where(and(
              eq(automobile_listings.id, Number(listingId)),
              eq(automobile_listings.user_id, Number(userId))
            ))
            .limit(1)
            .get();

          if (!listing) {
            return new Response(
              JSON.stringify({ error: "Listing not found" }),
              { status: 404, headers: getCorsHeaders() }
            );
          }

          const transformedListing = {
            id: listing.id,
            user_id: listing.user_id,
            name: listing.title,
            category: listing.category,
            subCategory: listing.subcategory,
            time: formatCreatedTime(listing.created_at),
            duration: listing.duration,
            description: listing.description,
            media: listing.media ? JSON.parse(listing.media) : [],
            // Vehicle details
            make: listing.make,
            model: listing.model,
            builtInYear: listing.built_in_year,
            body: listing.body,
            fuel: listing.fuel,
            transmission: listing.transmission,
            engine: listing.engine,
            drive: listing.drive,
            odometer: listing.odometer,
            odometerUnit: listing.odometer_unit,
            condition: listing.condition,

            // Map snake_case → camelCase
            accidentHistory: listing.accident_history,
            history: listing.history,
            serviceHistory: listing.service_history,
            owner: listing.owner,
            vinNumber: listing.vin_number,

            // Location
            automobileCountry: listing.automobile_country,
            automobileState: listing.automobile_state,
            automobileCity: listing.automobile_city,
            automobilePincode: listing.automobile_pincode,

            // Pricing
            price: listing.price,
            negotiable: listing.negotiable === "1",

            // Features
            mobileFeatures: listing.mobile_feature ? JSON.parse(listing.mobile_feature) : [],
            warranty: listing.warranty,
            warrantyDetails: listing.warranty_details,

            // ADD FEATURED STATUS
            isFeatured: checkIfFeatured(listing.is_featured, listing.featured_until),
            featuredUntil: listing.featured_until,

            createdAt: listing.created_at,
          };

          return new Response(
            JSON.stringify({ success: true, listing: transformedListing }),
            { headers: getCorsHeaders() }
          );
        } // else proceed to fetch all listings
        else {
          console.log("GET automobile userId:", userId);
          let listings;
          if (userId) {
            listings = await db
              .select()
              .from(automobile_listings)
              .where(eq(automobile_listings.user_id, Number(userId)))
              .orderBy(desc(automobile_listings.created_at));
          } else {
            listings = await db
              .select()
              .from(automobile_listings)
              .orderBy(desc(automobile_listings.created_at));
          }

          const transformedListings = listings.map(listing => ({
            id: listing.id,
            user_id: listing.user_id,
            name: listing.title,
            category: listing.category,
            subCategory: listing.subcategory,
            time: formatCreatedTime(listing.created_at),
            duration: listing.duration,
            description: listing.description,
            media: listing.media ? JSON.parse(listing.media) : [],
            // Vehicle details
            make: listing.make,
            model: listing.model,
            builtInYear: listing.built_in_year,
            body: listing.body,
            fuel: listing.fuel,
            transmission: listing.transmission,
            engine: listing.engine,
            drive: listing.drive,
            odometer: listing.odometer,
            odometerUnit: listing.odometer_unit,
            condition: listing.condition,

            // Map snake_case → camelCase
            accidentHistory: listing.accident_history,
            history: listing.history,
            serviceHistory: listing.service_history,
            owner: listing.owner,
            vinNumber: listing.vin_number,

            // Location
            automobileCountry: listing.automobile_country,
            automobileState: listing.automobile_state,
            automobileCity: listing.automobile_city,
            automobilePincode: listing.automobile_pincode,

            // Pricing
            price: listing.price,
            negotiable: listing.negotiable === "1",

            // Features
            mobileFeatures: listing.mobile_feature ? JSON.parse(listing.mobile_feature) : [],
            warranty: listing.warranty,
            warrantyDetails: listing.warranty_details,

            // ADD FEATURED STATUS
            isFeatured: checkIfFeatured(listing.is_featured, listing.featured_until),
            featuredUntil: listing.featured_until,

            createdAt: listing.created_at,
          }));


          return new Response(
            JSON.stringify({ success: true, listings: transformedListings }),
            { headers: getCorsHeaders() }
          );
        }
      } catch (e) {
        console.error("GET automobile error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }


    // ========================
    // BUSINESS LISTINGS
    // ========================
    if (url.pathname === "/api/business" && req.method === "POST") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        const body: InsertBusinessInput = {
          userId: Number(raw.userId),

          // General Details
          title: raw.title,
          category: raw.category,
          subcategory: raw.subcategory,
          auctionType: raw.auctionType,
          duration: raw.duration,
          description: raw.description,
          media: raw.media || [],

          // Business Details
          builtInYear: raw.builtInYear || undefined,
          businessAddress: raw.businessAddress || undefined,
          businessCountry: raw.businessCountry || undefined,
          businessState: raw.businessState || undefined,
          businessCity: raw.businessCity || undefined,
          businessPincode: raw.businessPincode || undefined,

          // Business Descriptions
          highlight: raw.highlight || undefined,
          reason: raw.reason || undefined,

          // Financial Information
          price: raw.price || undefined,
          revenue: raw.revenue || undefined,
          profit: raw.profit || undefined,
          assets: raw.assets || undefined,
          inventory: raw.inventory || undefined,
          inventoryValue: raw.inventoryValue || undefined,

          // Operational Details
          employes: raw.employes || undefined,
          involvement: raw.involvement || undefined,
          relocatable: raw.relocatable || undefined,
          homebase: raw.homebase || undefined,
          franchise: raw.franchise || undefined,
          namefranchise: raw.namefranchise || undefined,

          // Facilities and Lease
          premises: raw.premises || undefined,
          monthly: raw.monthly || undefined,
          expiry: raw.expiry || undefined,
          facilitysize: raw.facilitysize || undefined,
        };

        const missingFields: string[] = [];

        if (!body.userId || isNaN(body.userId)) missingFields.push("userId");
        if (!body.title?.trim()) missingFields.push("title");
        if (!body.category?.trim()) missingFields.push("category");
        if (!body.subcategory?.trim()) missingFields.push("subcategory");
        if (!body.auctionType?.trim()) missingFields.push("auctionType");

        if (missingFields.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields",
              fields: missingFields
            }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const inserted = await insertBusiness(env, body);

        // Send listing notification emails to seller and admin (fire-and-forget)
        try {
          const db = drizzle(env.DB);
          const seller = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, body.userId))
            .get();

          if (seller) {
            const listingDetails = {
              title: body.title,
              category: body.category,
              subcategory: body.subcategory || "",
              listingType: "Business" as const,
              auctionType: body.auctionType || undefined,
              duration: body.duration || undefined,
              price: body.price ? `$${body.price}` : undefined,
              location: [body.businessCity, body.businessState, body.businessCountry]
                .filter(Boolean).join(", ") || undefined,
            };

            // Email to seller
            await sendEmail(
              seller.email,
              `Your Listing Has Been Created: ${body.title} - IBIDS 365`,
              newListingNotificationEmail(seller.name, listingDetails, true)
            );

            // Email to admin
            await sendEmail(
              ENV.ADMIN_EMAIL,
              `New Business Listing: ${body.title} - IBIDS 365`,
              newListingNotificationEmail("Admin", listingDetails, false)
            );

            console.log("Listing notification emails sent for Business:", body.title);
          }
        } catch (emailErr) {
          console.error("Failed to send listing notification emails (Business):", emailErr);
        }

        return new Response(
          JSON.stringify({ success: true, listing: inserted }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("Business API Error:", e);
        const msg = e instanceof Error ? e.message : "Internal server error";
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // Add GET endpoint for business
    if (url.pathname === "/api/business" && req.method === "GET") {
      console.log("========== BUSINESS GET ROUTE ==========");
      console.log("Request URL:", req.url);
      try {
        const userId = url.searchParams.get("userId");
        const listingId = url.searchParams.get("listingId");

        console.log("listingId:", listingId);
        console.log("userId:", userId);

        const db = drizzle(env.DB);
        console.log("DB Binding:", env.DB);

        if (listingId) {
          // Fetch and return single listing by ID
          const listing = await db
            .select()
            .from(business_listings)
            .where(and(
              eq(business_listings.id, Number(listingId)),
              eq(business_listings.user_id, Number(userId))
            ))
            .limit(1)
            .get();

          if (!listing) {
            return new Response(
              JSON.stringify({ error: "Listing not found" }),
              { status: 404, headers: getCorsHeaders() }
            );
          }

          const transformedListing = {
            id: listing.id,
            user_id: listing.user_id,
            name: listing.title,
            category: listing.category,
            subCategory: listing.subcategory,
            time: formatCreatedTime(listing.created_at),
            // General Info
            auctionType: listing.auction_type,
            duration: listing.duration,
            description: listing.description,
            media: listing.media ? JSON.parse(listing.media) : [],

            // Business Details
            builtInYear: listing.built_in_year,
            businessAddress: listing.business_address,
            businessCountry: listing.business_country,
            businessState: listing.business_state,
            businessCity: listing.business_city,
            businessPincode: listing.business_pincode,

            // Descriptions
            highlight: listing.highlight,
            reason: listing.reason,

            // Financials
            price: listing.price,
            revenue: listing.revenue,
            profit: listing.profit,
            assets: listing.assets,
            inventory: listing.inventory,
            inventoryValue: listing.inventory_value,

            // Operations
            employes: listing.employes,
            involvement: listing.involvement,
            relocatable: listing.relocatable,
            homebase: listing.homebase,
            franchise: listing.franchise,
            nameFranchise: listing.name_franchise,

            // Facilities & Lease
            premises: listing.premises,
            monthly: listing.monthly,
            expiry: listing.expiry,
            facilitySize: listing.facility_size,
            isFeatured: checkIfFeatured(listing.is_featured, listing.featured_until),
            featuredUntil: listing.featured_until,
            // ... add other fields as needed
            createdAt: listing.created_at,
          };

          return new Response(
            JSON.stringify({ success: true, listing: transformedListing }),
            { headers: getCorsHeaders() }
          );
        } // else proceed to fetch all listings 
        else {

          let listings;
          if (userId) {
            listings = await db
              .select()
              .from(business_listings)
              .where(eq(business_listings.user_id, Number(userId)))
              .orderBy(desc(business_listings.created_at));
          } else {
            listings = await db
              .select()
              .from(business_listings)
              .orderBy(desc(business_listings.created_at));
          }

          console.log("Raw listings from DB:", listings);

          const transformedListings = listings.map(listing => ({
            id: listing.id,
            user_id: listing.user_id,
            name: listing.title,
            category: listing.category,
            subCategory: listing.subcategory,
            time: formatCreatedTime(listing.created_at),

            // General Info
            auctionType: listing.auction_type,
            duration: listing.duration,
            description: listing.description,
            media: listing.media ? JSON.parse(listing.media) : [],

            // Business Details
            builtInYear: listing.built_in_year,
            businessAddress: listing.business_address,
            businessCountry: listing.business_country,
            businessState: listing.business_state,
            businessCity: listing.business_city,
            businessPincode: listing.business_pincode,

            // Descriptions
            highlight: listing.highlight,
            reason: listing.reason,

            // Financials
            price: listing.price,
            revenue: listing.revenue,
            profit: listing.profit,
            assets: listing.assets,
            inventory: listing.inventory,
            inventoryValue: listing.inventory_value,

            // Operations
            employes: listing.employes,
            involvement: listing.involvement,
            relocatable: listing.relocatable,
            homebase: listing.homebase,
            franchise: listing.franchise,
            nameFranchise: listing.name_franchise,

            // Facilities & Lease
            premises: listing.premises,
            monthly: listing.monthly,
            expiry: listing.expiry,
            facilitySize: listing.facility_size,
            isFeatured: checkIfFeatured(listing.is_featured, listing.featured_until),
            featuredUntil: listing.featured_until,
            createdAt: listing.created_at,
          }));

          console.log("Transformed listings:", transformedListings);
          console.log("Returning", transformedListings.length, "business listings");

          return new Response(
            JSON.stringify({ success: true, listings: transformedListings }),
            { headers: getCorsHeaders() }
          );
        }
      } catch (e) {
        console.error("GET business error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    const searchListings = async (env: Env, query: string) => {
      const db = drizzle(env.DB);
      const realEstateResults = (await (await db
        .select({
          id: real_estate_listings.id,
          title: real_estate_listings.title,
          country: real_estate_listings.property_country,
          state: real_estate_listings.property_state,
          city: real_estate_listings.property_city
        })
        .from(real_estate_listings)
        .where(
          sql`LOWER(${real_estate_listings.title}) LIKE ${`%${query.toLowerCase()}%`}`
        ))).map(r => ({ ...r, type: 'real-state' }));

      const automobileResults = (await (await db
        .select({
          id: automobile_listings.id,
          title: automobile_listings.title,
          country: automobile_listings.automobile_country,
          state: automobile_listings.automobile_state,
          city: automobile_listings.automobile_city
        })
        .from(automobile_listings)
        .where(
          sql`LOWER(${automobile_listings.title}) LIKE ${`%${query.toLowerCase()}%`}`
        ))).map(r => ({ ...r, type: 'automobile' }));

      const businessResults = (await (await db
        .select({
          id: business_listings.id,
          title: business_listings.title,
          country: business_listings.business_country,
          state: business_listings.business_state,
          city: business_listings.business_city
        })
        .from(business_listings)
        .where(
          sql`LOWER(${business_listings.title}) LIKE ${`%${query.toLowerCase()}%`}`
        ))).map(r => ({ ...r, type: 'business' }));

      return [...realEstateResults, ...automobileResults, ...businessResults];
    };

    /* search for product items by search string which will search product items from all the types and return the link to show the item  */
    if (url.pathname === "/api/searchListings" && req.method === "GET") {
      try {
        const searchQuery = url.searchParams.get("q") || "";
        const results = await searchListings(env, searchQuery);
        return new Response(
          JSON.stringify({ success: true, listings: results }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("Search Listings error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // CORS OPTIONS FOR BIDS
    // ========================
    if (url.pathname === "/api/bids" && req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }

    if (url.pathname.match(/^\/api\/bids\/\w+\/\d+$/) && req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }


    // ========================
    // GET BIDS FOR A LISTING
    // ========================
    if (url.pathname.match(/^\/api\/bids\/\w+\/\d+$/) && req.method === "GET") {
      try {
        const pathParts = url.pathname.split('/');
        const listingType = pathParts[3] as "realestate" | "automobile" | "business";
        const listingId = Number(pathParts[4]);
        await finalizeAuctionIfNeeded(env, listingId, listingType);
        if (!['realestate', 'automobile', 'business'].includes(listingType)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing type" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

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

        // Transform to frontend format
        const transformedBids = allBids.map(bid => ({
          id: bid.id,
          bid: `$${bid.bid_amount}`,
          user: bid.user_name,
          userId: bid.user_id,
          avatar: bid.user_avatar,
          time: formatBidTime(bid.created_at),
          createdAt: bid.created_at,
        }));

        // Get highest bid
        const highestBid = allBids[0] ?? null;

        return new Response(
          JSON.stringify({
            success: true,
            bids: transformedBids,
            highestBid: highestBid ? {
              amount: highestBid.bid_amount,
              userName: highestBid.user_name,
              userId: highestBid.user_id,
              avatar: highestBid.user_avatar,
            } : null,
            totalBids: allBids.length,
          }),
          {
            status: 200,
            headers: {
              ...getCorsHeaders(),
              // ✅ Prevent caching for real-time updates
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
      } catch (e) {
        console.error("GET bids error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // CREATE A NEW BID
    // ========================
    if (url.pathname === "/api/bids" && req.method === "POST") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          listingId: number;
          listingType: "realestate" | "automobile" | "business";
          bidAmount: string;
        };

        // Validate
        if (!body.listingId || !body.listingType || !body.bidAmount) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        if (!['realestate', 'automobile', 'business'].includes(body.listingType)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing type" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const bidAmountNum = parseFloat(body.bidAmount);
        if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid bid amount" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        // Minimum bid is $1
        if (bidAmountNum < 1) {
          return new Response(
            JSON.stringify({ error: "Minimum bid amount is $1" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Get user info
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, authUser.userId))
          .limit(1);

        if (!user) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        // Check if bid is higher than current highest
        const existingBids = await db
          .select()
          .from(bids)
          .where(
            and(
              eq(bids.listing_id, body.listingId),
              eq(bids.listing_type, body.listingType)
            )
          )
          .orderBy(desc(bids.bid_amount))
          .limit(1);

        const currentHighest = existingBids[0];
        if (currentHighest && currentHighest.user_id === authUser.userId) {
          return new Response(
            JSON.stringify({ error: "You can't bid your own list item." }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        if (currentHighest && currentHighest.bid_amount >= bidAmountNum) {
          return new Response(
            JSON.stringify({
              error: `Bid must be higher than current highest bid of $${currentHighest.bid_amount}`
            }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        // Create the bid
        const now = new Date();
        const [newBid] = await db.insert(bids).values({
          listing_id: body.listingId,
          listing_type: body.listingType,
          user_id: authUser.userId,
          user_name: user.name,
          user_avatar: null, // Add avatar field to users table if needed
          bid_amount: Number(body.bidAmount),
          created_at: now,
        }).returning();

        console.log(`✅ New bid created: $${body.bidAmount} by ${user.name} for ${body.listingType}/${body.listingId}`);
        console.log("Bidder Email:", user.email);
        console.log("Bidder Name:", user.name);
        console.log("Bid Amount:", body.bidAmount);
        console.log("Listing ID:", body.listingId);
        console.log("Listing Type:", body.listingType);
        return new Response(
          JSON.stringify({
            success: true,
            bid: {
              id: newBid.id,
              bid: `$${newBid.bid_amount}`,
              user: newBid.user_name,
              userId: newBid.user_id,
              time: "Just now",
              createdAt: newBid.created_at,
            },
            message: "Bid placed successfully",
          }),
          { status: 201, headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("POST bid error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // DELETE REAL ESTATE LISTING (Secure with JWT)
    // ========================
    if (url.pathname.startsWith("/api/realestate/") && req.method === "DELETE") {
      try {
        // Authenticate the request
        const authUser = await authenticateRequest(req, env);

        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = pathParts[pathParts.length - 1];

        if (!listingId || isNaN(Number(listingId))) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Get the listing to verify ownership
        const [listing] = await db
          .select()
          .from(real_estate_listings)
          .where(eq(real_estate_listings.id, Number(listingId)))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        // Check if the authenticated user owns this listing
        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized: You can only delete your own listings" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // Delete the listing
        await db
          .delete(real_estate_listings)
          .where(eq(real_estate_listings.id, Number(listingId)));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Real estate listing deleted successfully",
            deletedId: listingId
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("DELETE real estate error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }


    // ========================
    // DELETE AUTOMOBILE LISTING (Secure with JWT)
    // ========================
    if (url.pathname.startsWith("/api/automobile/") && req.method === "DELETE") {
      try {
        // Authenticate the request
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split("/");
        const listingId = pathParts[pathParts.length - 1];

        if (!listingId || isNaN(Number(listingId))) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Get the listing to verify ownership
        const [listing] = await db
          .select()
          .from(automobile_listings)
          .where(eq(automobile_listings.id, Number(listingId)))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        // Check if the authenticated user owns this listing
        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized: You can only delete your own listings" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // Delete the listing
        await db
          .delete(automobile_listings)
          .where(eq(automobile_listings.id, Number(listingId)));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Automobile listing deleted successfully",
            deletedId: listingId,
          }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("DELETE automobile error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // DELETE BUSINESS LISTING (Secure with JWT)
    // ========================
    if (url.pathname.startsWith("/api/business/") && req.method === "DELETE") {
      try {
        // Authenticate the request
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split("/");
        const listingId = pathParts[pathParts.length - 1];

        if (!listingId || isNaN(Number(listingId))) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Get the listing to verify ownership
        const [listing] = await db
          .select()
          .from(business_listings)
          .where(eq(business_listings.id, Number(listingId)))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        // Check if the authenticated user owns this listing
        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized: You can only delete your own listings" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // Delete the listing
        await db
          .delete(business_listings)
          .where(eq(business_listings.id, Number(listingId)));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Business listing deleted successfully",
            deletedId: listingId,
          }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("DELETE business error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // UPDATE REAL ESTATE LISTING (PATCH)
    // ========================
    if (url.pathname.match(/^\/api\/realestate\/\d+$/) && req.method === "PATCH") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          isFeatured?: boolean;
          featuredUntil?: number;
        };

        const db = drizzle(env.DB);

        // Verify ownership
        const [listing] = await db
          .select()
          .from(real_estate_listings)
          .where(eq(real_estate_listings.id, listingId))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // Update the listing
        await db
          .update(real_estate_listings)
          .set({
            is_featured: body.isFeatured ?? listing.is_featured,
            featured_until: body.featuredUntil ?? listing.featured_until,
          })
          .where(eq(real_estate_listings.id, listingId));

        console.log(`✅ Updated real estate listing ${listingId} - featured: ${body.isFeatured}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Listing updated successfully"
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PATCH real estate error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // UPDATE AUTOMOBILE LISTING (PATCH)
    // ========================
    if (url.pathname.match(/^\/api\/automobile\/\d+$/) && req.method === "PATCH") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          isFeatured?: boolean;
          featuredUntil?: number;
        };

        const db = drizzle(env.DB);

        const [listing] = await db
          .select()
          .from(automobile_listings)
          .where(eq(automobile_listings.id, listingId))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        await db
          .update(automobile_listings)
          .set({
            is_featured: body.isFeatured ?? listing.is_featured,
            featured_until: body.featuredUntil ?? listing.featured_until,
          })
          .where(eq(automobile_listings.id, listingId));

        console.log(`✅ Updated automobile listing ${listingId} - featured: ${body.isFeatured}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Listing updated successfully"
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PATCH automobile error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // UPDATE BUSINESS LISTING (PATCH)
    // ========================
    if (url.pathname.match(/^\/api\/business\/\d+$/) && req.method === "PATCH") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          isFeatured?: boolean;
          featuredUntil?: number;
        };

        const db = drizzle(env.DB);

        const [listing] = await db
          .select()
          .from(business_listings)
          .where(eq(business_listings.id, listingId))
          .limit(1);

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (listing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        await db
          .update(business_listings)
          .set({
            is_featured: body.isFeatured ?? listing.is_featured,
            featured_until: body.featuredUntil ?? listing.featured_until,
          })
          .where(eq(business_listings.id, listingId));

        console.log(`✅ Updated business listing ${listingId} - featured: ${body.isFeatured}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Listing updated successfully"
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PATCH business error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }


    // ========================
    // UPDATE REAL ESTATE LISTING (PUT - Full Update)
    // ========================
    if (url.pathname.match(/^\/api\/realestate\/\d+$/) && req.method === "PUT") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Verify ownership
        const [existingListing] = await db
          .select()
          .from(real_estate_listings)
          .where(eq(real_estate_listings.id, listingId))
          .limit(1);

        if (!existingListing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (existingListing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // Parse the request body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        // Build update object with all fields
        const updateData = {
          title: raw.title || existingListing.title,
          category: raw.category || existingListing.category,
          subcategory: raw.subcategory || existingListing.subcategory,
          auction_type: raw.auctionType || existingListing.auction_type,
          duration: raw.duration || existingListing.duration,
          description: raw.description || existingListing.description,
          media: raw.media ? JSON.stringify(raw.media) : existingListing.media,
          property_address: raw.propertyAddress || existingListing.property_address,
          property_country: raw.propertyCountry || existingListing.property_country,
          property_state: raw.propertyState || existingListing.property_state,
          property_city: raw.propertyCity || existingListing.property_city,
          property_pincode: raw.propertyPincode || existingListing.property_pincode,
          bedroom: raw.bedroom || existingListing.bedroom,
          bathroom: raw.bathroom || existingListing.bathroom,
          area: raw.area || existingListing.area,
          lot_size: raw.lot_size || existingListing.lot_size,
          built_in_year: raw.builtInYear || existingListing.built_in_year,
          furnishing: raw.furnishing || existingListing.furnishing,
          parking_spaces: raw.parkingSpaces !== undefined ? raw.parkingSpaces : existingListing.parking_spaces,
          utilities: raw.utilities ? JSON.stringify(raw.utilities) : existingListing.utilities,
          features: raw.features ? JSON.stringify(raw.features) : existingListing.features,
          auction_start_price: raw.auctionPrice || existingListing.auction_start_price,
          auction_date: raw.auctionDate || existingListing.auction_date,
          monthly: raw.monthly || existingListing.monthly,
          expiry: raw.expiry || existingListing.expiry,
          ownership_type: raw.ownershiptype || existingListing.ownership_type,
          ownership_title: raw.ownershiptitle || existingListing.ownership_title,
          ownership_status: raw.ownershipstatus || existingListing.ownership_status,
          legal_description: raw.legalDescription || existingListing.legal_description,
          contact_name: raw.contactName || existingListing.contact_name,
          contact_phone: raw.contactPhone || existingListing.contact_phone,
          contact_email: raw.contactEmail || existingListing.contact_email,
          is_agent: raw.isAgent || existingListing.is_agent,
          license_number: raw.licenseNumber || existingListing.license_number,
          authorized_to_sell: raw.authorizedToSell !== undefined ? String(raw.authorizedToSell ? "1" : "0") : existingListing.authorized_to_sell,
          agree_terms: raw.agreeTerms !== undefined ? String(raw.agreeTerms ? "1" : "0") : existingListing.agree_terms,
          featured_until: existingListing.featured_until,
          updated_at: Math.floor(Date.now() / 1000)
        };

        // Update the listing
        await db
          .update(real_estate_listings)
          .set(updateData)
          .where(eq(real_estate_listings.id, listingId));

        console.log(`✅ Updated real estate listing ${listingId}`);

        // Fetch and return the updated listing
        const [updatedListing] = await db
          .select()
          .from(real_estate_listings)
          .where(eq(real_estate_listings.id, listingId))
          .limit(1);

        const transformedListing = {
          id: updatedListing.id,
          name: updatedListing.title,
          category: updatedListing.category,
          subCategory: updatedListing.subcategory,
          time: formatCreatedTime(updatedListing.created_at),
          auctionType: updatedListing.auction_type,
          duration: updatedListing.duration,
          description: updatedListing.description,
          media: updatedListing.media ? JSON.parse(updatedListing.media) : [],
          propertyAddress: updatedListing.property_address,
          propertyCountry: updatedListing.property_country,
          propertyState: updatedListing.property_state,
          propertyCity: updatedListing.property_city,
          propertyPincode: updatedListing.property_pincode,
          bedroom: updatedListing.bedroom,
          bathroom: updatedListing.bathroom,
          area: updatedListing.area,
          lot_size: updatedListing.lot_size,
          builtInYear: updatedListing.built_in_year,
          furnishing: updatedListing.furnishing,
          parkingSpaces: updatedListing.parking_spaces,
          utilities: updatedListing.utilities ? JSON.parse(updatedListing.utilities) : [],
          features: updatedListing.features ? JSON.parse(updatedListing.features) : [],
          auctionPrice: updatedListing.auction_start_price,
          auctionDate: updatedListing.auction_date,
          monthly: updatedListing.monthly,
          expiry: updatedListing.expiry,
          ownershipType: updatedListing.ownership_type,
          ownershipTitle: updatedListing.ownership_title,
          ownershipStatus: updatedListing.ownership_status,
          legalDescription: updatedListing.legal_description,
          contactName: updatedListing.contact_name,
          contactPhone: updatedListing.contact_phone,
          contactEmail: updatedListing.contact_email,
          isAgent: updatedListing.is_agent,
          licenseNumber: updatedListing.license_number,
          authorizedToSell: updatedListing.authorized_to_sell === "1",
          agreeTerms: updatedListing.agree_terms === "1",
          isFeatured: checkIfFeatured(updatedListing.is_featured, updatedListing.featured_until),
          featuredUntil: updatedListing.featured_until,
          createdAt: updatedListing.created_at
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: "Real estate listing updated successfully",
            listing: transformedListing
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PUT real estate error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // UPDATE AUTOMOBILE LISTING (PUT - Full Update)
    // ========================
    if (url.pathname.match(/^\/api\/automobile\/\d+$/) && req.method === "PUT") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Verify ownership
        const [existingListing] = await db
          .select()
          .from(automobile_listings)
          .where(eq(automobile_listings.id, listingId))
          .limit(1);

        if (!existingListing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (existingListing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        const updateData = {
          title: raw.title || existingListing.title,
          category: raw.category || existingListing.category,
          subcategory: raw.subcategory || existingListing.subcategory,
          duration: raw.duration || existingListing.duration,
          description: raw.description || existingListing.description,
          media: raw.media ? JSON.stringify(raw.media) : existingListing.media,
          make: raw.make || existingListing.make,
          model: raw.model || existingListing.model,
          built_in_year: raw.builtInYear || existingListing.built_in_year,
          body: raw.body || existingListing.body,
          fuel: raw.fuel || existingListing.fuel,
          transmission: raw.transmission || existingListing.transmission,
          engine: raw.engine || existingListing.engine,
          drive: raw.drive || existingListing.drive,
          odometer: raw.odometer || existingListing.odometer,
          odometer_unit: raw.odometerUnit || existingListing.odometer_unit,
          condition: raw.condition || existingListing.condition,
          accident_history: raw.accidenthistory || existingListing.accident_history,
          history: raw.history || existingListing.history,
          service_history: raw.shistory || existingListing.service_history,
          owner: raw.owner || existingListing.owner,
          vin_number: raw.vnumber || existingListing.vin_number,
          automobile_country: raw.automobileCountry || existingListing.automobile_country,
          automobile_state: raw.automobileState || existingListing.automobile_state,
          automobile_city: raw.automobileCity || existingListing.automobile_city,
          automobile_pincode: raw.automobilePincode || existingListing.automobile_pincode,
          price: raw.price || existingListing.price,
          negotiable: raw.negotiable !== undefined ? String(raw.negotiable ? "1" : "0") : existingListing.negotiable,
          mobile_feature: raw.mobilefeature ? JSON.stringify(raw.mobilefeature) : existingListing.mobile_feature,
          warranty: raw.warranty || existingListing.warranty,
          warranty_details: raw.warrantydetails || existingListing.warranty_details,
          is_featured: existingListing.is_featured,
          featured_until: existingListing.featured_until,
          updated_at: Math.floor(Date.now() / 1000)
        };

        // Update the listing
        await db
          .update(automobile_listings)
          .set(updateData)
          .where(eq(automobile_listings.id, listingId));

        console.log(`✅ Updated automobile listing ${listingId}`);

        // Fetch and return the updated listing
        const [updatedListing] = await db
          .select()
          .from(automobile_listings)
          .where(eq(automobile_listings.id, listingId))
          .limit(1);

        const transformedListing = {
          id: updatedListing.id,
          name: updatedListing.title,
          category: updatedListing.category,
          subCategory: updatedListing.subcategory,
          time: formatCreatedTime(updatedListing.created_at),
          make: updatedListing.make,
          model: updatedListing.model,
          builtInYear: updatedListing.built_in_year,
          body: updatedListing.body,
          fuel: updatedListing.fuel,
          transmission: updatedListing.transmission,
          engine: updatedListing.engine,
          drive: updatedListing.drive,
          odometer: updatedListing.odometer,
          odometerUnit: updatedListing.odometer_unit,
          condition: updatedListing.condition,
          accidentHistory: updatedListing.accident_history,
          history: updatedListing.history,
          serviceHistory: updatedListing.service_history,
          owner: updatedListing.owner,
          vinNumber: updatedListing.vin_number,
          automobileCountry: updatedListing.automobile_country,
          automobileState: updatedListing.automobile_state,
          automobileCity: updatedListing.automobile_city,
          automobilePincode: updatedListing.automobile_pincode,
          price: updatedListing.price,
          negotiable: updatedListing.negotiable === "1",
          mobileFeatures: updatedListing.mobile_feature ? JSON.parse(updatedListing.mobile_feature) : [],
          warranty: updatedListing.warranty,
          warrantyDetails: updatedListing.warranty_details,
          isFeatured: checkIfFeatured(updatedListing.is_featured, updatedListing.featured_until),
          featuredUntil: updatedListing.featured_until,
          createdAt: updatedListing.created_at
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: "Automobile listing updated successfully",
            listing: transformedListing
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PUT automobile error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // UPDATE BUSINESS LISTING (PUT - Full Update)
    // ========================
    if (url.pathname.match(/^\/api\/business\/\d+$/) && req.method === "PUT") {
      try {
        const authUser = await authenticateRequest(req, env);
        if (!authUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const pathParts = url.pathname.split('/');
        const listingId = Number(pathParts[pathParts.length - 1]);

        if (isNaN(listingId)) {
          return new Response(
            JSON.stringify({ error: "Invalid listing ID" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        // Verify ownership
        const [existingListing] = await db
          .select()
          .from(business_listings)
          .where(eq(business_listings.id, listingId))
          .limit(1);

        if (!existingListing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            { status: 404, headers: getCorsHeaders() }
          );
        }

        if (existingListing.user_id !== authUser.userId) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (await req.json()) as Record<string, any>;

        const updateData = {
          title: raw.title || existingListing.title,
          category: raw.category || existingListing.category,
          subcategory: raw.subcategory || existingListing.subcategory,
          auction_type: raw.auctionType || existingListing.auction_type,
          duration: raw.duration || existingListing.duration,
          description: raw.description || existingListing.description,
          media: raw.media ? JSON.stringify(raw.media) : existingListing.media,
          built_in_year: raw.builtInYear || existingListing.built_in_year,
          business_address: raw.businessAddress || existingListing.business_address,
          business_country: raw.businessCountry || existingListing.business_country,
          business_state: raw.businessState || existingListing.business_state,
          business_city: raw.businessCity || existingListing.business_city,
          business_pincode: raw.businessPincode || existingListing.business_pincode,
          highlight: raw.highlight || existingListing.highlight,
          reason: raw.reason || existingListing.reason,
          price: raw.price || existingListing.price,
          revenue: raw.revenue || existingListing.revenue,
          profit: raw.profit || existingListing.profit,
          assets: raw.assets || existingListing.assets,
          inventory: raw.inventory || existingListing.inventory,
          inventory_value: raw.inventoryValue || existingListing.inventory_value,
          employes: raw.employes || existingListing.employes,
          involvement: raw.involvement || existingListing.involvement,
          relocatable: raw.relocatable || existingListing.relocatable,
          homebase: raw.homebase || existingListing.homebase,
          franchise: raw.franchise || existingListing.franchise,
          name_franchise: raw.namefranchise || existingListing.name_franchise,
          premises: raw.premises || existingListing.premises,
          monthly: raw.monthly || existingListing.monthly,
          expiry: raw.expiry || existingListing.expiry,
          facility_size: raw.facilitysize || existingListing.facility_size,
          featured_until: existingListing.featured_until,
          updated_at: Math.floor(Date.now() / 1000)
        };

        // Update the listing
        await db
          .update(business_listings)
          .set(updateData)
          .where(eq(business_listings.id, listingId));

        console.log(`✅ Updated business listing ${listingId}`);

        // Fetch and return the updated listing
        const [updatedListing] = await db
          .select()
          .from(business_listings)
          .where(eq(business_listings.id, listingId))
          .limit(1);

        const transformedListing = {
          id: updatedListing.id,
          name: updatedListing.title,
          category: updatedListing.category,
          subCategory: updatedListing.subcategory,
          time: formatCreatedTime(updatedListing.created_at),
          auctionType: updatedListing.auction_type,
          duration: updatedListing.duration,
          description: updatedListing.description,
          media: updatedListing.media ? JSON.parse(updatedListing.media) : [],
          builtInYear: updatedListing.built_in_year,
          businessAddress: updatedListing.business_address,
          businessCountry: updatedListing.business_country,
          businessState: updatedListing.business_state,
          businessCity: updatedListing.business_city,
          businessPincode: updatedListing.business_pincode,
          highlight: updatedListing.highlight,
          reason: updatedListing.reason,
          price: updatedListing.price,
          revenue: updatedListing.revenue,
          profit: updatedListing.profit,
          assets: updatedListing.assets,
          inventory: updatedListing.inventory,
          inventoryValue: updatedListing.inventory_value,
          employes: updatedListing.employes,
          involvement: updatedListing.involvement,
          relocatable: updatedListing.relocatable,
          homebase: updatedListing.homebase,
          franchise: updatedListing.franchise,
          nameFranchise: updatedListing.name_franchise,
          premises: updatedListing.premises,
          monthly: updatedListing.monthly,
          expiry: updatedListing.expiry,
          facilitySize: updatedListing.facility_size,
          isFeatured: checkIfFeatured(updatedListing.is_featured, updatedListing.featured_until),
          featuredUntil: updatedListing.featured_until,
          createdAt: updatedListing.created_at
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: "Business listing updated successfully",
            listing: transformedListing
          }),
          { headers: getCorsHeaders() }
        );

      } catch (e) {
        console.error("PUT business error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // --- Create Checkout Session ---
    if (url.pathname === "/api/payment/create-checkout-session" && req.method === "POST") {
      try {


        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-10-29.clover",
        });

        const auth = await authenticateRequest(req, env);
        if (!auth) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: getCorsHeaders() }
          );
        }

        const body = await req.json() as {
          userId: number;
          selectedAds: number[];
          listingTypes: string[]; // Add this to track which type each ad is
        };

        if (body.userId !== auth.userId) {
          return new Response(
            JSON.stringify({ error: "User ID mismatch" }),
            { status: 403, headers: getCorsHeaders() }
          );
        }

        if (!body.selectedAds || body.selectedAds.length === 0) {
          return new Response(
            JSON.stringify({ error: "No ads selected" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Feature Your Listings",
                  description: `Feature ${body.selectedAds.length} listing(s) for 30 days`,
                },
                unit_amount: 500, // $5.00 per ad
              },
              quantity: body.selectedAds.length,
            },
          ],
          // success_url: `${env.FRONTEND_BASE_URL}/sucessPay?selectedAds=${body.selectedAds.join(',')}&returnPath=/seller/listing&payment=success&session_id={CHECKOUT_SESSION_ID}`,
          success_url: `${env.FRONTEND_BASE_URL}/sucessPay?selectedAds=${body.selectedAds.join(',')}&listingTypes=${(body.listingTypes || []).join(',')}&returnPath=/seller/listing&payment=success&session_id={CHECKOUT_SESSION_ID}`,
          // cancel_url: `${env.FRONTEND_BASE_URL}/unsucessPay?selectedAds=${body.selectedAds.join(',')}&returnPath=/seller/listing&userType=seller`,
          // worker.ts
          cancel_url: `${env.FRONTEND_BASE_URL}/unsucessPay?type=featured&selectedAds=${body.selectedAds.join(',')}&listingTypes=${(body.listingTypes || []).join(',')}&returnPath=/seller/listing`,
          metadata: {
            type: "featured",
            userId: body.userId.toString(),
            selectedAds: JSON.stringify(body.selectedAds),
            listingTypes: JSON.stringify(body.listingTypes || []),
          },
        });

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: session.id,
            url: session.url,
          }),
          { headers: getCorsHeaders() }
        );
      } catch (err) {
        console.error("Stripe session error:", err);
        return new Response(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : "Failed to create session",
          }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // AUCTION PAY NOW
    // ========================
    if (url.pathname === "/api/auction/pay-now" && req.method === "POST") {
      try {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-10-29.clover",
        });

        const auth = await authenticateRequest(req, env);
        if (!auth) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: getCorsHeaders(),
          });
        }

        const body = await req.json() as {
          listingId: number;
          listingType: "realestate" | "automobile" | "business";
        };

        const sessionData = await finalizeAuctionIfNeeded(
          env,
          body.listingId,
          body.listingType
        );
        console.log("========== PAY NOW DEBUG ==========");
        console.log("sessionData =", sessionData);

        if (!sessionData || sessionData.status !== "ended") {
          return new Response(JSON.stringify({ error: "Auction not ended" }), {
            status: 403,
            headers: getCorsHeaders(),
          });
        }

        if (sessionData.winner_user_id !== auth.userId) {
          return new Response(JSON.stringify({ error: "Not auction winner" }), {
            status: 403,
            headers: getCorsHeaders(),
          });
        }

        const db = drizzle(env.DB);

        // Check existing payment (idempotent)
        const existingPayment = await db
          .select()
          .from(auction_payments)
          .where(
            and(
              eq(auction_payments.user_id, auth.userId),
              eq(auction_payments.listing_id, body.listingId),
              eq(auction_payments.listing_type, body.listingType)
            )
          )
          .get();

        if (existingPayment?.status === "completed") {
          return new Response(
            JSON.stringify({ error: "Already paid" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const platform_fee = calculatePlatformFee(
          sessionData.winning_bid ?? 0,
          body.listingType
        );

        const listingTable = getListingTable(body.listingType);

        if (!listingTable) {
          return new Response(
            JSON.stringify({ error: "Invalid listing type" }),
            {
              status: 400,
              headers: getCorsHeaders(),
            }
          );
        }

        const listing = await db
          .select()
          .from(listingTable)
          .where(eq(listingTable.id, body.listingId))
          .get();

        if (!listing) {
          return new Response(
            JSON.stringify({ error: "Listing not found" }),
            {
              status: 404,
              headers: getCorsHeaders(),
            }
          );
        }

        const checkout = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Auction Platform Fee",
                  description: `Unlock seller contact for ${body.listingType} #${body.listingId}`,
                },
                unit_amount: Math.round(platform_fee * 100),
              },
              quantity: 1,
            },
          ],
          success_url: `${env.FRONTEND_BASE_URL}/sucessPay?type=auction&listingId=${body.listingId}&listingType=${body.listingType}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.FRONTEND_BASE_URL}/unsucessPay?type=auction`,
          metadata: {
            type: "auction",
            userId: auth.userId.toString(),
            sellerId: listing.user_id.toString(),
            listingId: body.listingId.toString(),
            listingType: body.listingType,
          },
        });

        // Insert or update payment row
        if (!existingPayment) {
          await db.insert(auction_payments).values({
            user_id: auth.userId,
            listing_id: body.listingId,
            listing_type: body.listingType,
            winning_bid: 0,
            upfront_payment: 0,
            platform_fee: 0,
            total_amount: 0,
            stripe_session_id: checkout.id,
            status: "pending",
          });
        }

        return new Response(
          JSON.stringify({ url: checkout.url }),
          { headers: getCorsHeaders() }
        );
      } catch (err) {
        console.error("Auction PayNow error:", err);
        return new Response(
          JSON.stringify({ error: "Failed to create checkout session" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }


    // --- Stripe Webhook ---
    if (url.pathname === "/api/webhook" && req.method === "POST") {
      let event: Stripe.Event;

      try {
        // Check for secrets first
        if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
          return new Response("Stripe not configured", { status: 500 });
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-10-29.clover",
        });
        const payload = await req.text();
        const sig = req.headers.get("stripe-signature") as string;

        event = stripe.webhooks.constructEvent(
          payload,
          sig,
          env.STRIPE_WEBHOOK_SECRET
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentType = session.metadata?.type;

        // ================================
        // 🔥 AUCTION PAYMENT
        // ================================
        if (paymentType === "auction") {
          const db = drizzle(env.DB);
          const now = new Date();

          await db
            .update(auction_payments)
            .set({
              status: "completed",
              stripe_payment_intent: session.payment_intent as string,
              completed_at: now,
            })
            .where(
              and(
                eq(auction_payments.listing_id, Number(session.metadata?.listingId)),
                eq(auction_payments.listing_type, session.metadata?.listingType as string),
                eq(auction_payments.user_id, Number(session.metadata?.userId))
              )
            );
          console.log(
            `✅ Auction payment completed for ${session.metadata?.listingType}/${session.metadata?.listingId}`
          );
        }

        // ================================
        // ⭐ FEATURED LISTINGS
        // ================================
        if (paymentType === "featured") {
          const db = drizzle(env.DB);

          try {
            const selectedAds = JSON.parse(session.metadata?.selectedAds || "[]") as number[];
            const listingTypes = JSON.parse(session.metadata?.listingTypes || "[]") as string[];
            const userId = Number(session.metadata?.userId);

            const featuredUntil =
              Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

            for (let i = 0; i < selectedAds.length; i++) {
              const adId = selectedAds[i];
              const type = listingTypes[i] || "realestate";

              if (type === "realestate") {
                await db.update(real_estate_listings)
                  .set({ is_featured: true, featured_until: featuredUntil })
                  .where(eq(real_estate_listings.id, adId));
              } else if (type === "automobile") {
                await db.update(automobile_listings)
                  .set({ is_featured: true, featured_until: featuredUntil })
                  .where(eq(automobile_listings.id, adId));
              } else if (type === "business") {
                await db.update(business_listings)
                  .set({ is_featured: true, featured_until: featuredUntil })
                  .where(eq(business_listings.id, adId));
              }
            }

            console.log(`✅ Featured ${selectedAds.length} ads for user ${userId}`);
          } catch (err) {
            console.error("Featured listing webhook error:", err);
          }
        }
      }



      return new Response(JSON.stringify({ received: true }), {
        status: 200,
      });
    }

    // --- Update Featured Status (called by webhook) ---
    if (url.pathname === "/api/payment/update-featured-status" && req.method === "POST") {
      try {
        const body = await req.json() as {
          userId: string;
          selectedAds: number[];
          listingTypes: string[];
        };

        console.log("Updating featured status for:", body);

        const selectedAds = body.selectedAds;
        const listingTypes = body.listingTypes;

        // Calculate featured_until as Unix timestamp (30 days from now)
        const featuredUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        const db = drizzle(env.DB);

        // Update each listing based on type
        for (let i = 0; i < selectedAds.length; i++) {
          const adId = selectedAds[i];
          const type = listingTypes[i] || 'realestate';

          if (type === 'realestate') {
            await db.update(real_estate_listings)
              .set({
                is_featured: true,
                featured_until: featuredUntil
              })
              .where(eq(real_estate_listings.id, adId));
          } else if (type === 'automobile') {
            await db.update(automobile_listings)
              .set({
                is_featured: true,
                featured_until: featuredUntil
              })
              .where(eq(automobile_listings.id, adId));
          } else if (type === 'business') {
            await db.update(business_listings)
              .set({
                is_featured: true,
                featured_until: featuredUntil
              })
              .where(eq(business_listings.id, adId));
          }
        }

        console.log(`Featured ${selectedAds.length} ads for user ${body.userId} until ${new Date(featuredUntil * 1000).toISOString()}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully featured ${selectedAds.length} ads`,
            featuredUntil: featuredUntil
          }),
          { headers: getCorsHeaders() }
        );

      } catch (err) {
        console.error("Error updating featured status:", err);
        return new Response(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : "Failed to update featured status"
          }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // ========================
    // VERIFY AUCTION PAYMENT (FALLBACK)
    // ========================
    if (url.pathname === "/api/auction/verify-payment" && req.method === "POST") {
      const auth = await authenticateRequest(req, env);
      if (!auth) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: getCorsHeaders() }
        );
      }
      try {
        const { sessionId } = await req.json() as { sessionId: string };

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-10-29.clover",
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
          return new Response(
            JSON.stringify({ error: "Payment not completed" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        if (session.metadata?.type !== "auction") {
          return new Response(
            JSON.stringify({ error: "Invalid payment type" }),
            { status: 400, headers: getCorsHeaders() }
          );
        }

        const db = drizzle(env.DB);

        await db
          .update(auction_payments)
          .set({
            status: "completed",
            stripe_payment_intent: session.payment_intent as string,
            completed_at: new Date(),
          })
          .where(
            and(
              eq(auction_payments.listing_id, Number(session.metadata.listingId)),
              eq(auction_payments.listing_type, session.metadata.listingType),
              eq(auction_payments.user_id, auth.userId)
            )
          );

        const listingId = Number(session.metadata?.listingId);
        const listingType = session.metadata?.listingType as
          | "realestate"
          | "automobile"
          | "business";

        const sellerId = Number(session.metadata?.sellerId);

        const room = await createChatRoom(db, {
          listingId,
          listingType,
          buyerId: auth.userId,
          sellerId,
        });

        console.log("💬 Chat room ready:", room.id);

        return new Response(
          JSON.stringify({
            success: true,
            roomId: room.id,
            room,
          }),
          { headers: getCorsHeaders() }  // ✅ Add CORS headers
        );

      } catch (err) {
        console.error("Verify payment error:", err);
        return new Response(
          JSON.stringify({
            error: err instanceof Error ? err.message : "Verification failed"
          }),
          { status: 500, headers: getCorsHeaders() }  // ✅ Add CORS headers
        );
      }
    }


    // ========================
    // GET AUCTION SESSION
    // ========================
    if (url.pathname.match(/^\/api\/auction\/\w+\/\d+$/) && req.method === "GET") {
      try {
        const pathParts = url.pathname.split('/');
        const listingType = pathParts[3];
        const listingId = Number(pathParts[4]);

        const db = drizzle(env.DB);

        const [session] = await db
          .select()
          .from(auction_sessions)
          .where(
            and(
              eq(auction_sessions.listing_id, listingId),
              eq(auction_sessions.listing_type, listingType)
            )
          )
          .limit(1);

        if (!session) {
          return new Response(
            JSON.stringify({
              success: true,
              session: null,
              message: "No auction session found"
            }),
            { headers: getCorsHeaders() }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            session: {
              id: session.id,
              listingId: session.listing_id,
              listingType: session.listing_type,
              startTime: session.start_time,
              endTime: session.end_time,
              status: session.status,
              startingPrice: session.starting_price,
              currentBid: session.current_bid,
              winnerUserId: session.winner_user_id,
              winningBid: session.winning_bid,
            },
          }),
          { headers: getCorsHeaders() }
        );
      } catch (e) {
        console.error("GET auction session error:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
          { status: 500, headers: getCorsHeaders() }
        );
      }
    }

    // Helper function for bid time formatting
    function formatBidTime(date: Date | null): string {
      if (!date) return "Unknown";

      const now = new Date();
      const diffMs = now.getTime() - new Date(date).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    }

    // ========================
    // WebSocket connection to auction room
    // ========================
    // Pattern: /api/auction/ws/:listingType/:listingId
    if (url.pathname.match(/^\/api\/auction\/ws\/\w+\/\d+$/)) {
      const pathParts = url.pathname.split("/");
      const listingType = pathParts[4];
      const listingId = pathParts[5];

      // Create unique ID for this auction
      const auctionId = `${listingType}-${listingId}`;
      const id = env.AUCTION_ROOM.idFromName(auctionId);
      const stub = env.AUCTION_ROOM.get(id);

      // Forward the request to Durable Object
      const newUrl = new URL(req.url);
      newUrl.pathname = `/auction/${listingType}/${listingId}`;

      return stub.fetch(new Request(newUrl.toString(), req));
    }

    // HTTP request to get auction state
    // Pattern: /api/auction/state/:listingType/:listingId
    if (url.pathname.match(/^\/api\/auction\/state\/\w+\/\d+$/) && req.method === "GET") {
      const pathParts = url.pathname.split("/");
      const listingType = pathParts[4];
      const listingId = pathParts[5];

      const auctionId = `${listingType}-${listingId}`;
      const id = env.AUCTION_ROOM.idFromName(auctionId);
      const stub = env.AUCTION_ROOM.get(id);

      const response = await stub.fetch(
        new Request(`https://internal/auction/${listingType}/${listingId}`, {
          method: "GET",
        })
      );

      // Add CORS headers to response
      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: {
          ...getCorsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }

    // HTTP request to place bid (fallback for non-WebSocket clients)
    // Pattern: /api/auction/bid/:listingType/:listingId
    if (url.pathname.match(/^\/api\/auction\/bid\/\w+\/\d+$/) && req.method === "POST") {
      const authUser = await authenticateRequest(req, env);
      if (!authUser) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: getCorsHeaders() }
        );
      }

      const pathParts = url.pathname.split("/");
      const listingType = pathParts[4];
      const listingId = pathParts[5];

      const body = await req.json() as { bidAmount: number };

      // Get user details
      const db = drizzle(env.DB);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.userId))
        .limit(1);

      const auctionId = `${listingType}-${listingId}`;
      const id = env.AUCTION_ROOM.idFromName(auctionId);
      const stub = env.AUCTION_ROOM.get(id);

      const response = await stub.fetch(
        new Request(`https://internal/auction/${listingType}/${listingId}/bid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authUser.userId,
            userName: user?.name || authUser.email,
            bidAmount: body.bidAmount,
          }),
        })
      );

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: {
          ...getCorsHeaders(),
          "Content-Type": "application/json",
        },
      });
    }

    return new Response("Not Found", { status: 404, headers: getCorsHeaders() });
  },
};

export default worker;
