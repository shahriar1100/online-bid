interface OutbidEmailProps {
  name: string;
  previousBid: number;
  currentBid: number;
  auctionUrl: string;
}

export function outbidEmailTemplate({
  name,
  previousBid,
  currentBid,
  auctionUrl,
}: OutbidEmailProps) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">

          <h2 style="color:#dc2626;">
            🔔 You have been outbid!
          </h2>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Another bidder has placed a higher bid on an auction you were participating in.
          </p>

          <p><strong>Your Bid:</strong> $${previousBid.toLocaleString()}</p>

          <p><strong>Current Highest Bid:</strong> $${currentBid.toLocaleString()}</p>

          <p style="margin:35px 0;">
            <a
              href="${auctionUrl}"
              style="
                background:#2563eb;
                color:#fff;
                padding:14px 24px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
              ">
              Place Another Bid
            </a>
          </p>

          <hr>

          <p style="color:#666;font-size:13px;">
            © ${new Date().getFullYear()} IBIDS 365
          </p>

        </div>
      </body>
    </html>
  `;
}