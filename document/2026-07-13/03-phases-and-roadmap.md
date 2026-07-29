# Phases and Roadmap

## Phase 1 - Foundation

Completed or mostly completed:

- Auth system
- Role-based access
- Persistent refresh tokens
- Rate limiting and security headers
- Core course CRUD
- Sections and lessons
- Checkout / orders base flow
- Coupon logic

## Phase 2 - Frontend/Product polish

Completed or mostly completed:

- Public pages
- Student dashboard pages
- Instructor dashboard pages
- Admin dashboard pages
- Query hooks and API wrapper
- Error, loading, and empty states

Still to improve:

- Better UX in admin screens
- Better mobile polish in a few places
- Smaller frontend bundles

## Phase 3 - Media uploads

Completed:

- Cloudinary image uploads
- Presigned S3 upload flow for lesson PDFs and videos
- Lesson editor upload UI for videos and PDFs
- Lesson player support for uploaded PDF links

Still left:

- Safer media access and streaming strategy
- Signed playback or protected file access if needed

## Phase 4 - Payments

Still left:

- Lemon Squeezy checkout integration
- Payment webhook handling
- Order status update after payment
- Auto-enrollment after successful payment
- Checkout and enrollment flow alignment

## Phase 5 - Scale and production hardening

Still left:

- Email provider integration
- Video streaming / HLS
- Signed URLs or protected media delivery
- Caching strategy
- Performance split for large frontend chunks
- More audit logging and operational safeguards
