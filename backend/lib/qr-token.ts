import crypto from "crypto";

/** Random, URL-safe verification token stored on Order.qrToken and
 *  encoded into the QR code the customer/receipt shows. Knowing this
 *  token is what authorizes completing the handover — see the
 *  "delivery-agent + QR handover" section of the backend README. */
export function generateQrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
