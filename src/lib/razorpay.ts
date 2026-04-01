// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONNECT RAZORPAY HERE
//
// 1. Go to https://razorpay.com → Sign up (free test account)
// 2. Dashboard → Settings → API Keys → Generate Key ID
// 3. Add to .env:
//
//    VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
//
// 4. Add Razorpay script to index.html (already done):
//    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
//
// 5. For production: Set up a Supabase Edge Function to create orders server-side
//    (never expose your Razorpay Key Secret in frontend code)
// ─────────────────────────────────────────────────────────────────────────────

export interface RazorpayOptions {
  key: string;
  amount: number;          // in paise (₹1 = 100 paise)
  currency: string;
  name: string;
  description: string;
  order_id: string;        // from your backend / Supabase Edge Function
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss: () => void };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

export const isRazorpayConfigured = !!RAZORPAY_KEY;

/**
 * Open the Razorpay payment modal.
 * Call this after creating an order via your backend.
 *
 * Usage:
 *   const orderId = await createOrderOnBackend(amountInPaise);
 *   openRazorpay({ orderId, amount, name, email, phone,
 *     onSuccess: (response) => { // save payment to Supabase },
 *     onDismiss: () => { // user cancelled },
 *   });
 */
export const openRazorpay = ({
  orderId,
  amount,
  courseName,
  name,
  email,
  phone,
  onSuccess,
  onDismiss,
}: {
  orderId: string;
  amount: number;
  courseName: string;
  name: string;
  email: string;
  phone: string;
  onSuccess: (response: RazorpayResponse) => void;
  onDismiss?: () => void;
}) => {
  if (!RAZORPAY_KEY) {
    console.warn('Razorpay not configured. Add VITE_RAZORPAY_KEY_ID to .env');
    return;
  }

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY,
    amount,                    // already in paise
    currency: 'INR',
    name: 'AIWMR Training Academy',
    description: courseName,
    order_id: orderId,
    prefill: { name, email, contact: phone },
    theme: { color: '#1a3a2a' },
    handler: onSuccess,
    modal: { ondismiss: onDismiss ?? (() => {}) },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
