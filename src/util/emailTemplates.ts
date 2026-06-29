/**
 * Centralized email templates for IBIDS 365.
 * All templates share the same design language as the verification email:
 * - Purple gradient header
 * - White card with #f9fafb background
 * - Field boxes with label/value pairs
 * - IBIDS 365 branded footer
 */

// ─── Shared base styles ──────────────────────────────────────────────────────

const BASE_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
  }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 20px;
    text-align: center;
  }
  .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
  .badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 13px;
    margin-top: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .content { padding: 36px 32px; background-color: #f9fafb; }
  .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 6px; font-size: 18px; }
  .content .subtitle { color: #6b7280; font-size: 14px; margin-top: 0; margin-bottom: 24px; }
  .fields-grid { display: block; }
  .field {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 10px 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; }
  .value { font-size: 15px; color: #111827; margin-top: 3px; font-weight: 500; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  .info-box {
    background: #eff6ff;
    border-left: 4px solid #667eea;
    padding: 12px 16px;
    margin: 20px 0;
    border-radius: 4px;
    font-size: 14px;
    color: #1e40af;
  }
  .footer {
    text-align: center;
    padding: 28px 20px;
    color: #9ca3af;
    font-size: 13px;
    border-top: 1px solid #e5e7eb;
    background: white;
  }
  .footer strong { color: #374151; }
`;

// ─── Template 1: New User Registration — Admin Notification ──────────────────

export interface NewUserDetails {
  name: string;
  email: string;
  phone?: string;
  registrationType: "Buyer" | "Seller";
}

/**
 * Email sent to the admin when a new user registers.
 */
export function newUserRegistrationAdminEmail(user: NewUserDetails): string {
  const registrationTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const roleColor = user.registrationType === "Seller" ? "#7c3aed" : "#2563eb";
  const roleBg = user.registrationType === "Seller" ? "#f5f3ff" : "#eff6ff";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New User Registration</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New User Registration</h1>
        <p>A new user has joined IBIDS 365</p>
        <span class="badge">&#128100; ${user.registrationType}</span>
      </div>
      <div class="content">
        <h2>Hello Admin,</h2>
        <p class="subtitle">A new user has successfully registered on the platform. Here are their details:</p>

        <div class="fields-grid">
          <div class="field">
            <div class="label">Full Name</div>
            <div class="value">${user.name}</div>
          </div>
          <div class="field">
            <div class="label">Email Address</div>
            <div class="value">${user.email}</div>
          </div>
          <div class="field">
            <div class="label">Phone Number</div>
            <div class="value">${user.phone || "Not provided"}</div>
          </div>
          <div class="field">
            <div class="label">Registration Type</div>
            <div class="value">
              <span style="display:inline-block; background:${roleBg}; color:${roleColor}; border-radius:12px; padding:2px 12px; font-size:13px; font-weight:600;">
                ${user.registrationType}
              </span>
            </div>
          </div>
          <div class="field">
            <div class="label">Registered At</div>
            <div class="value">${registrationTime}</div>
          </div>
        </div>

        <hr class="divider" />

        <div class="info-box">
          The user's email is pending verification. They will be able to log in after verifying their account.
        </div>
      </div>
      <div class="footer">
        <p><strong>IBIDS 365</strong> &mdash; Admin Notification</p>
        <p>&copy; ${new Date().getFullYear()} IBIDS 365. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
}

// ─── Template 2: New Listing Created — Seller & Admin Notification ───────────

export interface ListingDetails {
  title: string;
  category: string;
  subcategory?: string;
  listingType: "Real Estate" | "Automobile" | "Business";
  auctionType?: string;
  duration?: string;
  price?: string;
  location?: string;
  listingId?: number;
}

/**
 * Email sent to the seller (who created the ad) AND to the admin
 * when a new auction listing is created.
 *
 * @param recipientName - "Admin" or the seller's name
 * @param listing       - Listing details
 * @param isSeller      - If true, uses seller-friendly copy; if false, admin copy
 */
export function newListingNotificationEmail(
  recipientName: string,
  listing: ListingDetails,
  isSeller = false
): string {
  const createdAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const typeColors: Record<string, { color: string; bg: string }> = {
    "Real Estate": { color: "#065f46", bg: "#ecfdf5" },
    "Automobile":  { color: "#92400e", bg: "#fffbeb" },
    "Business":    { color: "#1e40af", bg: "#eff6ff" },
  };
  const tc = typeColors[listing.listingType] ?? { color: "#374151", bg: "#f3f4f6" };

  const headingLine = isSeller
    ? "Your auction listing has been successfully created on IBIDS 365."
    : `A new <strong>${listing.listingType}</strong> listing has been created on the platform.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Listing Created</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${isSeller ? "Listing Created Successfully" : "New Listing Created"}</h1>
        <p>${isSeller ? "Your ad is now live on IBIDS 365" : "A new auction ad has been submitted"}</p>
        <span class="badge">&#127981; ${listing.listingType}</span>
      </div>
      <div class="content">
        <h2>Hi ${recipientName},</h2>
        <p class="subtitle">${headingLine}</p>

        <div class="fields-grid">
          <div class="field">
            <div class="label">Listing Title</div>
            <div class="value">${listing.title}</div>
          </div>
          <div class="field">
            <div class="label">Listing Type</div>
            <div class="value">
              <span style="display:inline-block; background:${tc.bg}; color:${tc.color}; border-radius:12px; padding:2px 12px; font-size:13px; font-weight:600;">
                ${listing.listingType}
              </span>
            </div>
          </div>
          <div class="field">
            <div class="label">Category</div>
            <div class="value">${listing.category}${listing.subcategory ? ` &rsaquo; ${listing.subcategory}` : ""}</div>
          </div>
          ${listing.auctionType ? `
          <div class="field">
            <div class="label">Auction Type</div>
            <div class="value">${listing.auctionType}</div>
          </div>` : ""}
          ${listing.duration ? `
          <div class="field">
            <div class="label">Auction Duration</div>
            <div class="value">${listing.duration}</div>
          </div>` : ""}
          ${listing.price ? `
          <div class="field">
            <div class="label">Starting / Asking Price</div>
            <div class="value">${listing.price}</div>
          </div>` : ""}
          ${listing.location ? `
          <div class="field">
            <div class="label">Location</div>
            <div class="value">${listing.location}</div>
          </div>` : ""}
          <div class="field">
            <div class="label">Created At</div>
            <div class="value">${createdAt}</div>
          </div>
        </div>

        <hr class="divider" />

        <div class="info-box">
          ${isSeller
            ? "Your listing is now visible to potential buyers. You will be notified when bids are placed."
            : "Please review the listing details in the admin dashboard to ensure it meets platform guidelines."}
        </div>
      </div>
      <div class="footer">
        <p><strong>IBIDS 365</strong> &mdash; ${isSeller ? "Seller Notification" : "Admin Notification"}</p>
        <p>&copy; ${new Date().getFullYear()} IBIDS 365. All rights reserved.</p>
        <p style="font-size:12px; margin-top:8px;">This email was sent to ${recipientName}</p>
      </div>
    </div>
  </body>
</html>`;
}
