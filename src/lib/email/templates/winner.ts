interface WinnerEmailProps {
  name: string;
  amount: number;
  auctionUrl: string;
}

export function winnerEmailTemplate({
  name,
  amount,
  auctionUrl,
}: WinnerEmailProps) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:8px;">

          <h2 style="color:#16a34a;">
            🏆 Congratulations!
          </h2>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            You have won the auction with a winning bid of
            <strong>$${amount.toLocaleString()}</strong>.
          </p>

          <p>
            You can now continue with the next steps from your auction page.
          </p>

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
              View Auction
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