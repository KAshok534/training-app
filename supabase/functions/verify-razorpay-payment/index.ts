// Supabase Edge Function — verify-razorpay-payment
// ─────────────────────────────────────────────────────────────────────────────
// Verifies the Razorpay payment signature server-side and creates the
// registration row only if the signature is valid. Uses the service role key
// to bypass RLS, so the registrations.access_granted=true write cannot be
// faked from the browser.
//
// Razorpay signature spec:
//   signature == HMAC-SHA256(`${order_id}|${payment_id}`, key_secret)
//
// Deploy:
//   supabase functions deploy verify-razorpay-payment
//   (keep JWT verification ON — the function uses the caller's auth header
//    to identify which user is registering)
//
// Required secrets (already set for create-razorpay-order — reused):
//   RAZORPAY_KEY_SECRET=<key secret>
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

// HMAC-SHA256 → lowercase hex string (matches Razorpay's signature format)
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuf = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', keyBuf, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // 1. Identify the caller using their auth header
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Invalid session' }, 401);

    // 2. Parse request body
    const body = await req.json() as {
      razorpay_order_id?:   string;
      razorpay_payment_id?: string;
      razorpay_signature?:  string;
      course_id?:           number;
      batch_id?:            number;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id, batch_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !course_id) {
      return json({ error: 'Missing required fields' }, 400);
    }

    // 3. Verify HMAC signature
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return json({ error: 'Server configuration error' }, 500);
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);

    // Timing-safe-ish comparison (constant-time across same-length strings)
    if (expected.length !== razorpay_signature.length) {
      console.warn(`Signature length mismatch for user ${user.id}`);
      return json({ error: 'Invalid payment signature' }, 401);
    }
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ razorpay_signature.charCodeAt(i);
    }
    if (mismatch !== 0) {
      console.warn(`Signature mismatch for user ${user.id}, payment ${razorpay_payment_id}`);
      return json({ error: 'Invalid payment signature' }, 401);
    }

    // 4. Insert registration with service role (bypasses RLS so we can write access_granted=true)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: reg, error: insertErr } = await adminClient
      .from('registrations')
      .insert({
        user_id:            user.id,
        course_id,
        batch_id:           batch_id ?? null,
        payment_status:     'paid',
        payment_id:         razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        access_granted:     true,
      })
      .select('id, registration_id')
      .single();

    if (insertErr || !reg) {
      console.error('Registration insert failed:', insertErr);
      return json({
        error: 'Payment verified but registration write failed. Please contact support with payment ID: ' + razorpay_payment_id,
      }, 500);
    }

    return json({
      id:               reg.id,
      registration_id:  reg.registration_id,
      verified:         true,
    });
  } catch (err) {
    console.error('verify-razorpay-payment error:', err);
    return json({ error: 'Unexpected server error' }, 500);
  }
});
