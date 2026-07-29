# Next Steps

## Immediate: payment status synchronization

- Refetch the order after the student returns from Lemon Squeezy.
- Show a clear `Payment processing` state while the webhook is pending.
- Poll or retry order status for a short period.
- Redirect to the student dashboard after the local order becomes `paid`.
- Show a clear action when the webhook is delayed or fails.

## Next: media access control

- Keep lesson videos and PDFs private.
- Store permanent S3 object keys, not temporary URLs.
- Generate short-lived signed download or playback URLs only after enrollment access checks.
- Verify the flow with real S3 permissions before production use.

## Then: progress reliability

- Confirm only enrolled students can update lesson progress.
- Keep completed lessons and enrollment percentage synchronized.
- Add tests for repeated completion requests and invalid lesson IDs.

## Later: platform polish

- Add coupon edit and delete actions for admins.
- Add category deletion with safe course dependency handling.
- Add an order detail view.
- Review loading, empty, and error states across all pages.
- Reduce the frontend bundle size where needed.

## Production hardening

- Add automated webhook tests to CI.
- Add persistent background cleanup for expired coupon reservations.
- Add monitoring and alerting for repeated webhook failures.
- Review CORS origins before deployment.
- Rotate all development secrets before production.
