# Skillnest Payment and Reliability Handoff - 2026-07-20

This folder records the payment, webhook, coupon, logging, and error-handling work completed on 2026-07-20.

Read these files in order:

1. `01-payment-webhook.md` - how Lemon Squeezy payment confirmation works
2. `02-coupon-lifecycle.md` - coupon reservation, redemption, and reuse rules
3. `03-logs-and-errors.md` - developer diagnostics and safe user-facing errors
4. `04-verification-and-operations.md` - local testing and webhook configuration
5. `05-next-steps.md` - recommended work after payment integration

Current outcome:

- Lemon Squeezy `order_created` webhooks reach the backend endpoint.
- Paid provider orders can update local orders from `pending` to `paid`.
- Paid orders create enrollments automatically.
- Coupon reservations become redemptions only after confirmed payment.
- A student cannot reuse the same coupon code after a paid or refunded order.
- Developers receive structured request, response, webhook, and error logs.
- Users receive readable error messages without internal database or provider details.
