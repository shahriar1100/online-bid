// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment completed:', session.id);
      
      const userId = session.metadata?.userId;
      const selectedAds = JSON.parse(session.metadata?.selectedAds || '[]');
      const listingTypes = JSON.parse(session.metadata?.listingTypes || '[]');

      // Update featured status in your database
      // Call your Cloudflare Worker endpoint to update the listings
      try {
        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_WRANGLER_API_URL}/api/payment/update-featured-status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              selectedAds,
              listingTypes,
            }),
          }
        );

        if (!updateResponse.ok) {
          console.error('Failed to update featured status in worker');
        } else {
          console.log('Successfully updated featured status for ads:', selectedAds);
        }
      } catch (error) {
        console.error('Error updating featured status:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing, need raw body for signature verification
export const runtime = 'edge';