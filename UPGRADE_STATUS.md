# COGAM Digital Library – Membership and Admin Upgrade
Status: source implementation staged in GitHub. Not deployed while AppDeploy deployment credits are exhausted.

## Newly implemented server endpoints
- Authenticated member records, display names, external HTTPS profile picture URL and theme preference
- Watchlist/saved teachings, likes, watch history and comments (comments are pending until approved by an administrator)
- Four plan definitions with indicative KES prices: Free 0; Growth 299; Faith Plus 699; Kingdom 1299
- Server-restricted audio/video URL disclosure; Free opens three distinct audio items and two distinct videos
- Explicit Free/Premium access on uploaded items, optional downloads only on non-Free membership
- Pending subscription requests and independent-payment-verification safeguard
- Master-owner-only approvals for additional administrator emails
- Administrators can view member directory, review subscription requests, approve comments and configure announcements/colours/headings/social destinations.

## Important release blockers
1. This is not deployed and has not passed compile or end-to-end testing.
2. Client app must be updated to use /api/member/media/:id before playing any uploaded media. The old player will not work once these backend changes are deployed without the updated client.
3. The plans are proposed and prices require approval; payment integration is **not** live. No sensitive payment data should be collected or stored.
4. Before taking actual payments, implement payment provider callbacks, verified transaction reconciliation, refund handling, audit logs, and user receipts.
5. Before broad public launch, add privacy policies and data retention/deletion controls; moderate comments, especially in Teenager and Kids sections.
6. Current admin settings cover brand colours, heading, announcement, logo URL and social URLs; full arbitrary drag/drop editing of sections is not yet implemented.
7. Use the AppDeploy secret system for payment provider credentials; never commit secrets.

## Requested frontend navigation
User profile menu: Profile, Send Email, Wallet, Subscription, Watch History, Watchlist, Themes, About CDL, FAQs, Privacy Policy, Logout.
Additional audience hubs: Everyday Solutions, Teenager, Youths, Kids / Sunday School.
Admin: site settings, member directory, verified payment requests, admin approvals, moderated comments, announcements and audience-specific publishing.
