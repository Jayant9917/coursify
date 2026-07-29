# Coursify Remaining Implementation Roadmap

Status date: 2026-07-21

This document is the consolidated list of work remaining before Coursify should be treated as a production-ready learning platform. It explains what is incomplete, why it matters, and the expected implementation direction.

This is a roadmap, not a claim that every item below is currently broken. Some items are working in development but still need production configuration, stronger tests, or operational hardening.

## Current Baseline

The repository already contains:

- JWT registration, login, refresh-token rotation, logout, password reset, and role guards.
- Student, instructor, and admin application areas.
- Course, section, lesson, enrollment, wishlist, review, notification, category, coupon, and order flows.
- Course creation and editing with image uploads through Cloudinary.
- Basic lesson PDF and video presigned-upload flow through S3.
- Lemon Squeezy course checkout and webhook reconciliation foundations.
- Refund-aware enrollment access checks.
- Study Vault note metadata, free-note access, protected PDF downloads, instructor publishing, and student vault pages.
- Focus playlist import and YouTube playback foundations.
- Route-level frontend code splitting with React lazy loading.
- Backend unit and database integration test foundations.

## Priority Legend

- **P0 - Release blocker:** required before real users or real money are allowed on the platform.
- **P1 - Production hardening:** required for reliability, scale, security, or maintainability.
- **P2 - Product improvement:** valuable after the core platform is safe and stable.

## P0: Required Before Production

### 1. Environment and Provider Configuration

**Current state:** The code supports MongoDB, Cloudinary, S3, Lemon Squeezy, and YouTube configuration, but local and production environments are not all configured.

**Why it matters:** A feature can appear implemented while returning configuration errors in the real deployment. Missing or incorrectly scoped credentials can also expose data or stop payments.

**Remaining work:**

- Create separate development, staging, and production environment files.
- Configure MongoDB, JWT secrets, Cloudinary, AWS S3, Lemon Squeezy, YouTube, email, and frontend origin values.
- Keep secrets out of Git and rotate all demo credentials before deployment.
- Validate required environment variables at startup with clear failures.
- Document which variables are required for each optional feature.

**Done when:** Each deployment fails fast on missing required secrets, and no real secret is committed to the repository.

### 2. Production S3 Media Pipeline

**Current state:** Lesson and note files use a custom presigned single-request PUT flow. The browser uploads directly to S3, but the flow is not multipart or resumable.

**Why it matters:** Large videos can fail during a single request. Private media also needs controlled access, verification, cleanup, and delivery optimization.

**Remaining work:**

- Replace the custom signer with AWS SDK v3.
- Configure a private bucket with Block Public Access and encryption enabled.
- Add least-privilege IAM permissions for the backend.
- Add multipart upload initiation, presigned part URLs, completion, and abort endpoints.
- Upload in chunks with progress, retry, cancel, and resume behavior.
- Enforce file-size limits and validate both declared content type and file signature.
- Persist file key, size, content type, upload status, checksum, and completion time.
- Verify the completed S3 object before publishing a lesson or note.
- Delete replaced files and abandoned uploads.
- Add lifecycle rules for incomplete multipart uploads.

**Done when:** A large video can be uploaded reliably, resumed after a network failure, verified by the backend, and removed without leaving orphaned objects.

### 3. Secure Media Delivery and Video Playback

**Current state:** Students use signed S3 URLs or direct media URLs. Videos are currently delivered as ordinary browser video files.

**Why it matters:** Direct S3 playback is slower and less efficient at scale. A production course platform needs fast seeking, adaptive quality, and access control.

**Remaining work:**

- Put CloudFront or an equivalent CDN in front of private media.
- Generate short-lived playback URLs only after enrollment or preview checks.
- Transcode uploaded videos into HLS or DASH renditions.
- Generate posters, thumbnails, and duration metadata.
- Use a media-processing status such as `uploading`, `processing`, `ready`, and `failed`.
- Keep the lesson player from rendering or downloading unselected lesson media.
- Add playback error, retry, and processing-state UI.

**Done when:** An enrolled learner can stream the appropriate quality, seek quickly, and cannot access a private lesson after enrollment access is removed.

### 4. Course Payment and Enrollment Verification

**Current state:** Course order creation, Lemon Squeezy checkout creation, webhook verification, idempotency, coupons, and refund-aware access logic exist.

**Why it matters:** Payment state is asynchronous. A learner must not be enrolled based only on returning from checkout, and a duplicate webhook must not create duplicate enrollment or revenue records.

**Remaining work:**

- Configure real Lemon Squeezy store, product, variant, and webhook secrets.
- Refetch order status after the learner returns from checkout.
- Show a `Payment processing` state while the webhook is pending.
- Poll or retry order status for a bounded period.
- Redirect to the student dashboard only after the local order is paid.
- Verify amount, currency, store, product, variant, and order ownership in webhook payloads.
- Run the refunded-enrollment migration against a production-like database.
- Test paid, failed, delayed, duplicated, and refunded payment scenarios.

**Done when:** Every successful enrollment is backed by a verified paid order, and every refund removes access according to the product policy.

### 5. Paid Study Vault Checkout

**Current state:** Free notes can be saved to the vault. Paid note purchase intentionally returns `Paid note checkout is not configured yet`.

**Why it matters:** The marketplace displays prices, but paid notes cannot yet complete the transaction and entitlement flow.

**Remaining work:**

- Create a Lemon Squeezy product or variant strategy for paid notes.
- Include note ID, user ID, and internal order ID in checkout metadata.
- Add a note-payment order model or extend the existing order model safely.
- Reconcile paid note webhooks idempotently.
- Create a completed `NotePurchase` only after verified payment.
- Add refund handling that revokes access or marks the purchase refunded.
- Keep free-note access separate from paid-note financial records where appropriate.

**Done when:** A student can buy a paid PDF, access is granted only after payment reconciliation, and refunds are handled consistently.

## P1: Production Hardening

### 6. Cloudinary Image Pipeline

**Current state:** Avatars and course thumbnails are uploaded through Cloudinary using base64 data URLs.

**Why it matters:** Base64 increases request size and memory usage. Images need validation, resizing, transformations, and cleanup.

**Remaining work:**

- Add browser-side file-size and dimension checks.
- Prefer direct signed browser uploads for larger images.
- Configure transformations for avatars, cards, and hero images.
- Store public ID and asset metadata so replaced images can be deleted.
- Add fallback images and stable dimensions to prevent layout shifts.

### 7. Data Integrity and Access Control

**Current state:** Most services check roles, ownership, enrollment, and refund status.

**Why it matters:** Authorization must be enforced by the backend, not only hidden in the frontend.

**Remaining work:**

- Add explicit Mongoose references for all populated ownership fields.
- Validate ObjectId parameters before service calls.
- Verify instructor ownership for every course, lesson, note, and upload operation.
- Verify that uploaded file keys belong to the requesting course or note.
- Prevent deleted, unpublished, refunded, or blocked resources from being downloaded.
- Add database-level uniqueness and state-transition checks where missing.
- Add cleanup for orphaned NotePurchase and media records.

### 8. Authentication and Email Delivery

**Current state:** Password reset works in development and can return a raw reset token outside production.

**Why it matters:** Returning reset tokens is not safe for a real user-facing environment, and email delivery is required for recovery.

**Remaining work:**

- Integrate a transactional email provider.
- Send password reset links instead of exposing tokens.
- Add email verification if required by the product.
- Decide whether refresh tokens should remain in the current client storage or move to secure HTTP-only cookies.
- Add session revocation and device/session visibility if needed.
- Add brute-force protection and account recovery rate limits.

### 9. Admin CRUD Completion

**Current state:** Admin dashboards exist for users, courses, categories, coupons, and orders, but several screens are list-and-action views.

**Why it matters:** Operators need safe tools to correct content, payments, categories, users, and reports without direct database access.

**Remaining work:**

- Add category edit and delete flows with course dependency protection.
- Add coupon edit, deactivate, and delete flows.
- Add order detail view with timeline and payment references.
- Add course moderation and publication controls.
- Add note moderation and file cleanup controls.
- Add pagination, filtering, and bulk actions where data grows.
- Add audit log entries for destructive or financial admin actions.

### 10. Background Jobs and Distributed Work

**Current state:** Some cleanup runs in-process after the backend connects.

**Why it matters:** In-process jobs run multiple times when multiple backend instances exist and stop when a process restarts.

**Remaining work:**

- Move coupon reservation cleanup to a durable scheduler or worker.
- Add jobs for abandoned S3 multipart uploads.
- Add video processing jobs and retry policies.
- Add email jobs and webhook retry processing.
- Use a shared queue such as Redis-backed BullMQ when multiple instances are deployed.
- Make every job idempotent and observable.

### 11. Database Performance and Scaling

**Current state:** Core indexes exist for users, courses, notes, purchases, coupons, and webhook deliveries.

**Why it matters:** Indexes and bounded queries determine whether the application remains responsive as users and content increase.

**Remaining work:**

- Review slow queries with MongoDB explain plans.
- Add indexes based on real query patterns.
- Enforce pagination on every growing list endpoint.
- Configure connection pool sizes for the deployment size.
- Add caching for public course, category, and note lists where appropriate.
- Avoid returning unnecessary fields from admin and marketplace endpoints.
- Add database backups, restore drills, and retention policies.

### 12. API Security and Abuse Protection

**Current state:** CORS, security headers, validation, request logging, and rate-limit middleware exist.

**Why it matters:** Public APIs and upload endpoints are common abuse targets.

**Remaining work:**

- Apply stricter per-route limits to login, reset, checkout, downloads, and upload initialization.
- Add request size and file-size limits independent of frontend validation.
- Validate file magic bytes and scan uploads for malware.
- Prevent signed URL replay where the threat model requires it.
- Review CORS origins before deployment.
- Add webhook replay protection and timestamp tolerance.
- Sanitize logs so tokens, secrets, and personal data are never logged.
- Add dependency and secret scanning in CI.

### 13. Observability and Operations

**Current state:** Request and webhook logs exist, and errors are returned through shared handlers.

**Why it matters:** Production issues need diagnosis without reproducing them locally.

**Remaining work:**

- Add structured JSON logs with request IDs.
- Add health and readiness endpoints for API, MongoDB, and required providers.
- Add error tracking such as Sentry or an equivalent service.
- Monitor webhook failures, upload failures, queue depth, API latency, and payment reconciliation lag.
- Add alerts for database, storage, payment, and authentication failures.
- Define retention and redaction rules for logs.

### 14. Deployment and Infrastructure

**Current state:** The repository runs locally with separate backend and frontend applications.

**Why it matters:** Local development does not validate production routing, environment variables, CDN behavior, or process recovery.

**Remaining work:**

- Define staging and production deployment targets.
- Add CI for install, lint, tests, build, and security checks.
- Add frontend deployment with SPA fallback routing.
- Add backend process management and graceful shutdown.
- Configure HTTPS, custom domains, CORS, and webhook URLs.
- Add deployment-time database migration steps.
- Add rollback and incident recovery procedures.

## P2: Product and Experience Improvements

### 15. Frontend Performance

**Current state:** Route-level lazy loading is already present. Some below-the-fold images are lazy-loaded. Vite still reports a large shared chunk warning.

**Remaining work:**

- Audit remaining below-the-fold images and add stable dimensions.
- Lazy-load secondary API sections when they approach the viewport.
- Add pagination or load-more behavior to every large list.
- Use video `preload="metadata"` and mount only the active lesson player.
- Investigate shared chunk composition and vendor chunking.
- Measure Core Web Vitals on mobile and desktop.

### 16. Study Vault Completion

**Current state:** Study Vault has marketplace cards, search, subject filtering, free-note vault access, instructor publishing, protected downloads, a student vault page, recent resources, workflow explanation, and creator CTA.

**Remaining work:**

- Connect paid note checkout.
- Upload real PDFs for seeded notes and validate the full S3 download flow.
- Add note thumbnails and optional richer previews.
- Delete S3 objects when notes are deleted or replaced.
- Add pagination for marketplace and instructor note lists.
- Add tests for free access, paid access, refunds, deleted notes, and signed URL expiry.

### 17. Focus Playlists

**Current state:** Playlist import, storage, detail, watch, progress, and YouTube player foundations exist.

**Remaining work:**

- Configure YouTube API credentials and quotas.
- Cache imports and avoid duplicate provider requests.
- Handle unavailable, private, deleted, or region-restricted videos.
- Add provider rate-limit and quota error states.
- Add playlist ownership and deletion cleanup tests.

### 18. Accessibility and Responsive QA

**Current state:** The UI has responsive layouts, shared buttons, forms, loading states, and error states.

**Remaining work:**

- Run keyboard-only navigation across public, student, instructor, and admin paths.
- Verify focus visibility and logical focus after menus, dialogs, and route changes.
- Add accessible labels and live regions for upload, payment, and download states.
- Test contrast in both light and dark themes.
- Test mobile breakpoints on real narrow viewport widths.
- Add automated accessibility checks where practical.

### 19. Product Analytics and Reporting

**Current state:** Basic counters exist for enrollments, purchases, downloads, and course progress.

**Remaining work:**

- Define event names and privacy rules.
- Track course discovery, checkout starts, payment completion, lesson progress, note downloads, and upload failures.
- Add instructor analytics for course and note performance.
- Add admin reporting with date filters and export only if required.
- Avoid collecting unnecessary personal data.

## Test Coverage Still Needed

The repository has backend unit and integration test foundations, but database tests are skipped when `TEST_MONGODB_URL` is absent. Add and run the following with a real test database:

- Auth refresh rotation and logout revocation.
- Password reset expiry and reuse protection.
- Role and ownership checks for courses, lessons, notes, and uploads.
- S3 multipart initialization, completion, abort, and ownership checks.
- Cloudinary upload validation and replacement cleanup.
- Paid course checkout, duplicate webhook, delayed webhook, and refund behavior.
- Paid note checkout, free note saving, duplicate purchase, refund, and signed URL expiry.
- Refunded enrollment lesson access.
- Coupon reservation, expiration, rollback, and concurrent redemption.
- Pagination limits and invalid query parameters.
- Admin destructive actions and audit logging.
- Frontend route access and critical Study Vault flows.

## Recommended Delivery Order

1. Configure staging providers and rotate development secrets.
2. Finish private S3 multipart uploads and media verification.
3. Finish CloudFront or equivalent private media delivery.
4. Verify Lemon Squeezy course payment and enrollment synchronization.
5. Implement paid Study Vault checkout and refunds.
6. Add production email delivery and secure password recovery.
7. Complete admin CRUD and audit logs.
8. Move cleanup and processing into durable background jobs.
9. Add integration tests with MongoDB and provider mocks.
10. Add CI, monitoring, backups, deployment, and rollback procedures.
11. Complete performance, accessibility, responsive, and analytics work.

## Definition of Production Ready

The project should not be called production-ready until:

- Real payments, refunds, and entitlements are verified end to end.
- Private media uploads and playback work for large files.
- Every protected resource has a backend authorization check.
- Uploads, payments, webhooks, and background jobs are observable and retryable.
- Database backups and restore procedures have been tested.
- CI runs tests and production builds on every change.
- No development secret or reset token can leak to users.
- The application has been tested on mobile, desktop, slow networks, and concurrent users.

