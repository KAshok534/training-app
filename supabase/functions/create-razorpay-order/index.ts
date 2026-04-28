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

// Supabase JS client automatically sends x-client-info and apikey headers.
// All must be listed here or the browser's CORS preflight will block the request.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { amount } = await req.json() as { amount: number };

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const order = await rzp.orders.create({
      amount,                          // already in paise (₹1 = 100 paise)
      currency: 'INR',
      receipt:  `aiwmr_${Date.now()}`,
    });

    return new Response(JSON.stringify(order), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create order' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
