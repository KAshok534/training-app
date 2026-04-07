// Supabase Edge Function — create-razorpay-order
// ─────────────────────────────────────────────────────────────────────────────
// Creates a Razorpay order server-side so the Key Secret is never exposed
// to the browser.
//
// Deploy:
//   supabase functions deploy create-razorpay-order --no-verify-jwt
//
// Set secrets (one-time):
//   supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxx
//   supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
//
// For live payments replace rzp_test_* keys with rzp_live_* keys.
// ─────────────────────────────────────────────────────────────────────────────

import Razorpay from 'npm:razorpay@2.9.2';

const rzp = new Razorpay({
  key_id:     Deno.env.get('RAZORPAY_KEY_ID')!,
  key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
});

Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { amount } = await req.json() as { amount: number };

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const order = await rzp.orders.create({
      amount,                          // already in paise (₹1 = 100 paise)
      currency: 'INR',
      receipt:  `aiwmr_${Date.now()}`,
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
