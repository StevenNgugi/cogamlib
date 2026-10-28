# Stripe subscription integration — COGAM Digital Library

**Status:** Integration configuration is prepared but not live or connected to billing. Never accept a charge until the completed website and APK are tested against a Stripe sandbox and the deployment backend can verify signed webhook events. The working public app remains unchanged.

## Architecture

- Stripe Billing plus Stripe-hosted Checkout in subscription mode.
- One Stripe product/recurring Price per paid tier: Growth, Faith Plus and Kingdom.
- Keep Free at KES 0 outside Stripe.
- Stripe Customer Portal for cancellation, card/payment-method updates and plan changes.
- Attach Stripe customer IDs to verified member records. Store price-ID mapping on the backend, never trust an amount or plan specified by a browser.
- Server authentication protects /api/billing/checkout and /api/billing/portal.
- Create Checkout Sessions only for an authenticated user's own member record.
- For each session use an explicit server-side plan-to-Price mapping, customer ID, success/cancel URLs and an idempotency key. Never grant premium access based on the return URL.
- Route webhooks to /api/stripe/webhook, preserve the **exact raw body**, and verify the Stripe-Signature header using the backend webhook signing secret.
- Process checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed, and relevant refunds or disputes.
- Use the Stripe subscription's authoritative status and Price ID to determine access. Entitlement writes need idempotent event receipts and correct user ownership.
- Reconcile subscription state through Stripe if a webhook is delayed or delivery is retried.
- Keep data needed for refunds and cancellations while protecting customer identity and minimizing personal data.
- Stripe's API key and webhook secret must live only in the AppDeploy encrypted secret vault, not in GitHub, source code, mobile APK or user messages.
- Use separate test and live account credentials, separate webhook secrets and Price IDs. The connected account appeared in **live mode**; therefore do not create or charge live subscriptions while testing.
- Do not enable Stripe Tax by default; verify tax registration and rules first. Determine international billing and currency support before selecting KES. Payment-method availability is account- and currency-dependent.

## Draft four-tier model (not authorized for live charges)

| Plan | Proposed KES/month | Policy |
| --- | ---: | --- |
| Free | 0 | 3 distinct audio teachings + 2 distinct videos |
| Growth | 299 | Expanded media library |
| Faith Plus | 699 | Larger library access |
| Kingdom | 1299 | Full library plus eligible premium downloads |

These values came from an earlier **proposal**, not a confirmation to take money. Obtain approval of final prices, billing interval, currency, taxes and cancellation/refund terms before enabling checkout.

## Secret entry provisioned through AppDeploy

- STRIPE_TEST_RESTRICTED_KEY
- STRIPE_TEST_WEBHOOK_SECRET
- STRIPE_TEST_PRICE_GROWTH
- STRIPE_TEST_PRICE_FAITH_PLUS
- STRIPE_TEST_PRICE_KINGDOM

The user must supply these in the secure AppDeploy form. Do not paste values in ChatGPT. An expired secret-entry field must be recreated before it can be bound.

## Billing workflow sketch (do not deploy this as-is)

\`\`\`ts
// Backend-only pseudocode; use a recent Stripe SDK with a restricted API key.
// const stripe = new Stripe(await secrets.readSecret('STRIPE_TEST_RESTRICTED_KEY'))
// const session = await stripe.checkout.sessions.create({
//   mode: 'subscription',
//   customer: member.stripeCustomerId,
//   line_items: [{ price: serverMappedPriceId, quantity: 1 }],
//   client_reference_id: authenticatedUser.userId,
//   success_url: 'https://cogam-digital-library-6kql36.v2.appdeploy.ai/#/subscription?result=return',
//   cancel_url: 'https://cogam-digital-library-6kql36.v2.appdeploy.ai/#/subscription',
// });
// return json({ url: session.url });
// IMPORTANT: Never enable plan in this endpoint or based on the return URL.
// Instead, use Stripe's verified webhook, look up subscription/customer, and
// update durable member entitlements on successful payment & active status.
\`\`\`

## AppDeploy blockers to clear

1. AppDeploy's available deployment allowance was below its minimum, so publishing updated source is currently blocked.
2. Existing GitHub member/admin modifications are staged but **not** deployed or end-to-end tested.
3. Stripe sandbox credentials and Price IDs must be supplied through secure AppDeploy secret entry.
4. A customer webhook endpoint must be configured in Stripe, using the deployed HTTPS URL.
5. Admin subscription approval must use **verified Stripe subscription state**, not a user-typed receipt reference or a manual payment verification checkbox for Stripe payments.
6. Once tested, deploy the integrated backend and frontend together, then rebuild the Android APK wrapper if needed.
