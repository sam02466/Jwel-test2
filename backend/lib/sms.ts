// TODO: wire up a real provider here — MSG91, Twilio, or Fast2SMS are common
// choices for an India-based shop. Until then this is a no-op so call sites
// don't need to change when a provider is added. See
// 03_IMPLEMENTATION_PLAN.md Phase 7.

export async function sendSms(to: string, message: string): Promise<void> {
  console.log(`[SMS STUB] Would send to ${to}: ${message}`);
  // Example shape once wired up (MSG91):
  // await fetch('https://api.msg91.com/api/v5/flow/', {
  //   method: 'POST',
  //   headers: { authkey: process.env.SMS_API_KEY!, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ mobiles: to, /* ...template payload */ }),
  // });
}
