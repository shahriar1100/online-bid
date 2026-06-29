// export const runtime = 'edge';
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-29.clover',
});

interface CheckoutRequestBody {
  userId: number;
  selectedAds: number[];
  listingTypes: string[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as CheckoutRequestBody;
    const { userId, selectedAds, listingTypes } = body;

    // Validate request
    if (!userId || !selectedAds || selectedAds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Get auth token to verify user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    console.log(`Creating checkout session for user ${userId} with ${selectedAds.length} ads`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Feature Your Listings',
              description: `Feature ${selectedAds.length} listing(s) for 30 days`,
            },
            unit_amount: 500, // $5.00 per ad
          },
          quantity: selectedAds.length,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/sucessPay?payment=success&session_id={CHECKOUT_SESSION_ID}&selectedAds=${selectedAds.join(',')}&returnPath=/seller/listing`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/unsucessPay?payment=cancelled&selectedAds=${selectedAds.join(',')}&returnPath=/seller/listing`,
      metadata: {
        userId: userId.toString(),
        selectedAds: JSON.stringify(selectedAds),
        listingTypes: JSON.stringify(listingTypes || []),
      },
    });

    console.log('Stripe session created:', session.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}