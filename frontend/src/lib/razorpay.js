// Loads the Razorpay Checkout script on demand and opens the widget.
// Mirrors the shape the sweet-shop backend's lib/razorpay-checkout.ts
// used, adapted to plain JS since this is a Vite app, not Next.js.

let scriptPromise = null

function loadScript() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment gateway. Check your connection and try again.'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

/**
 * Opens the Razorpay Checkout widget. Resolves with the payment
 * verification payload on success, rejects if the customer dismisses
 * the widget or the payment fails.
 */
export async function openRazorpayCheckout({ keyId, razorpayOrderId, amountPaise, name, email, phone, orderLabel }) {
  await loadScript()

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      order_id: razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      name: 'Sarika Beauty Hub',
      description: orderLabel || 'Jewellery order',
      prefill: { name, email, contact: phone },
      theme: { color: '#B08D57' },
      handler: (response) => {
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled.'))
      }
    })
    rzp.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed. Please try again.'))
    })
    rzp.open()
  })
}
