# Coursify Current State

This file records what the project already does today and what is still incomplete.

## Working now

- REST API is implemented across auth, courses, enrollments, orders, reviews, wishlist, categories, coupons, notifications, and dashboards.
- JWT access and refresh token auth is implemented.
- Public frontend pages exist for home, course list, course detail, login, register, and checkout.
- Student pages exist for dashboard, courses, lesson player, orders, wishlist, and profile.
- Instructor pages exist for dashboard, course list, course editor, and stats.
- Admin pages exist for dashboard, users, courses, categories, coupons, and orders.
- Checkout flow exists on the frontend and redirects to Lemon Squeezy.
- Successful Lemon Squeezy `order_created` webhooks mark orders paid and auto-enroll students.
- Loading states, error states, and empty states are implemented across most screens.

## Partially working

- Pending orders do not enroll students until payment is confirmed by the backend webhook.
- Coupon slots are reserved for pending orders and redeemed only after payment confirmation.
- Admin management pages are more list-and-action screens than full CRUD screens.
- Some pages are still basic list/detail layouts instead of full management tools.

## Missing or weak areas

- Finalized media access strategy for HLS video delivery and long-term PDF delivery.
- Chunked upload for large files.
- HLS video processing and signed playback URLs.
- Better caching and scale strategy for larger traffic.

## Added in this phase

- Cloudinary image uploads for avatars and course thumbnails.
- Backend upload endpoint that stores only file URLs in MongoDB.
- Frontend upload controls for profile avatars and course thumbnails.
- Presigned S3 uploads for lesson PDFs and videos.
- Frontend lesson upload controls for videos and PDFs.
- Limited payment-status polling after Lemon Squeezy redirects, with readable processing and confirmation states.
- A one-time migration for older refunded orders whose enrollments still have an active or completed status.
- Node unit tests for webhook reconciliation and central error responses, plus HTTP integration tests for health and 404 handling.
- Background cleanup now releases expired coupon reservations on a scheduled interval.
- Notes marketplace foundation now includes PDF note records, instructor/admin publishing APIs, free-note purchases, and protected S3 downloads.
- Webhook delivery monitoring stores recent delivery status, attempts, response status, and safe error details for admin inspection.

## Verification commands

- `npm test` runs the backend unit and HTTP integration tests.
- `npm run frontend:build` verifies the production frontend bundle.
- `npm run db:migrate:refunded-enrollments -- --dry-run` previews the one-time refunded-enrollment cleanup.
- `npm run db:migrate:refunded-enrollments` applies that cleanup after confirming the database connection.

Database transaction tests must run against MongoDB replica-set support. The current local standalone MongoDB setup cannot execute transactions safely; use a local single-node replica set or MongoDB Atlas before running transaction-specific integration tests.

## Important risk notes

- Coupon cleanup runs in-process after the backend connects; a distributed job runner is still a future scale improvement for multiple backend instances.
- The frontend bundle is larger than ideal because the course editor and public features are loaded together.
- The current setup is functional for demo and development, but not yet production-hard.
