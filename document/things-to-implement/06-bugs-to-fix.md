# Bugs To Fix

This file keeps only the issues that are actually broken, risky, or inconsistent.

## Backend bugs

- No major backend blockers remain in phase 1 or 2.

## Frontend bugs

- The bundle is larger than ideal because the course editor is heavy.
- Some console/debug statements remain in production code.

## Integration bugs

- Coupon redemption must remain tied to successful payment confirmation. Pending orders now hold a reservation instead of increasing `redeemedCount`.
- Auth and refresh behavior depends on token shapes staying stable.

## Product gaps

- Notes marketplace has no backend model or purchase/download endpoints yet.
- No HLS streaming pipeline yet.
- No order detail page in admin.
- No category delete or coupon edit/delete screens.
