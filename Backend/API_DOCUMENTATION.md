# Coursify API Documentation

This document describes the current backend API for Coursify.

## Base URL

- Local: `http://localhost:3002`
- API prefix: `/api`

Example:

```text
http://localhost:3002/api/auth/login
```

## Conventions

### Authentication

Protected endpoints expect an access token in one of these headers:

- `Authorization: Bearer <access_token>`
- `token: <access_token>`
- `x-access-token: <access_token>`

### Roles

The system uses a single `User` collection with roles:

- `student`
- `instructor`
- `admin`

### Standard Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

### Pagination

List endpoints accept:

- `page` default `1`
- `limit` default `20`

Pagination response:

```json
{
  "success": true,
  "data": {
    "data": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0
    }
  }
}
```

## Auth API

### POST `/api/auth/register`

Registers a new user.

Allowed public roles:

- `student`
- `instructor`

Request body may contain either `courseIds` or `noteIds`, but not both.

Business logic:

- validates the payload with Zod
- prevents duplicate email registration
- hashes password with bcrypt
- creates access and refresh tokens
- stores refresh token in MongoDB for persistent refresh sessions

Request body:

```json
{
  "name": "Aman Sharma",
  "email": "aman@example.com",
  "password": "StrongPassword123!",
  "role": "student",
  "avatar": "https://example.com/avatar.png",
  "bio": "Frontend developer"
}
```

### POST `/api/auth/login`

Logs in a user and returns tokens.

Business logic:

- validates credentials
- rejects blocked users
- issues new access and refresh tokens

Request body:

```json
{
  "email": "aman@example.com",
  "password": "StrongPassword123!"
}
```

### POST `/api/auth/forgot-password`

Starts the password recovery flow.

Business logic:

- looks up the user by email
- generates a one-time reset token
- stores only the token hash in MongoDB with a TTL
- in non-production, returns the raw reset token so the flow can be tested without email delivery

Request body:

```json
{
  "email": "aman@example.com"
}
```

### POST `/api/auth/reset-password`

Resets the password using a valid reset token.

Business logic:

- validates the reset token
- checks token expiry and reuse
- hashes the new password
- clears the user’s existing refresh tokens

Request body:

```json
{
  "token": "reset-token-from-email-or-dev-response",
  "password": "NewStrongPassword123!"
}
```

### POST `/api/auth/refresh`

Rotates the refresh token and returns a new token pair.

Business logic:

- verifies refresh token signature
- verifies refresh token exists in server token store
- invalidates the old refresh token
- issues a new access and refresh token pair

Request body:

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### POST `/api/auth/logout`

Logs out the user.

Business logic:

- removes the refresh token from the token store

Request body:

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

## Users API

### GET `/api/users/me`

Returns the authenticated user profile.

Role:

- any authenticated user

### PUT `/api/users/me`

Updates the authenticated user profile.

Business logic:

- updates name, email, avatar, bio
- hashes password if updated

Request body:

```json
{
  "name": "Updated Name",
  "email": "newmail@example.com",
  "password": "NewStrongPassword123!",
  "avatar": "",
  "bio": "Updated bio"
}
```

### GET `/api/users`

Returns paginated users.

Role:

- `admin`

### GET `/api/users/:id`

Returns a single user by id.

Role:

- `admin`

### PATCH `/api/users/:id/status`

Blocks or unblocks a user.

Role:

- `admin`

Request body:

```json
{
  "status": "blocked"
}
```

## Uploads API

### POST `/api/uploads/image`

Uploads an image to Cloudinary and returns the hosted URL.

Role:

- any authenticated user

Business logic:

- accepts a base64 image data URL
- uploads the image to Cloudinary
- returns the hosted URL and metadata
- does not store binary file data in MongoDB

Request body:

```json
{
  "dataUrl": "data:image/png;base64,...",
  "folder": "avatars",
  "publicId": "avatar-123"
}
```

Allowed folders:

- `avatars`
- `courseThumbnails`

### POST `/api/uploads/lesson-file`

Creates a presigned S3 upload URL for a PDF or video file.

Role:

- `instructor`
- `admin`

Business logic:

- validates that the file type matches the target folder
- creates a presigned PUT URL for S3
- returns the final file URL that should be stored in MongoDB after upload
- does not store the file binary in MongoDB

Request body:

```json
{
  "fileName": "lesson-1.mp4",
  "contentType": "video/mp4",
  "folder": "lessonVideos"
}
```

Allowed folders:

- `lessonVideos`
- `lessonPdfs`

## Courses API

### GET `/api/courses`

Returns public published courses.

Query params:

- `page`
- `limit`
- `categoryId`
- `level`
- `instructorId`
- `minPrice`
- `maxPrice`
- `search`
- `isFeatured`

Business logic:

- filters only published courses
- supports featured-course filtering
- supports pagination and search

### GET `/api/courses/:slug`

Returns public course detail by slug.

Business logic:

- fetches the course
- loads sections
- loads lessons

### POST `/api/courses`

Creates a new course.

Role:

- `instructor`
- `admin`

Business logic:

- generates a unique slug
- assigns instructor ownership
- saves course metadata

Request body:

```json
{
  "title": "React Mastery",
  "description": "Full React course",
  "shortDescription": "Learn React fast",
  "thumbnailUrl": "",
  "previewVideoUrl": "",
  "price": 4999,
  "discountPrice": 2999,
  "level": "beginner",
  "language": "en",
  "categoryId": "665f...",
  "tags": ["react", "frontend"],
  "isPublished": false,
  "isFeatured": true
}
```

### PUT `/api/courses/:id`

Updates a course.

Role:

- course owner instructor
- `admin`

Business logic:

- verifies ownership
- updates the course
- regenerates slug if title changes

### DELETE `/api/courses/:id`

Deletes a course.

Role:

- `admin`

Business logic:

- removes the course
- cascades related sections, lessons, enrollments, reviews, wishlist items, progress records, and order items

### PATCH `/api/courses/:id/publish`

Publishes or unpublishes a course.

Role:

- course owner instructor
- `admin`

Request body:

```json
{
  "isPublished": true
}
```

### GET `/api/courses/admin/all`

Returns all courses for admin review.

Role:

- `admin`

### GET `/api/courses/instructor/me`

Returns the authenticated instructor’s own courses.

Role:

- `instructor`
- `admin`

## Sections API

### POST `/api/courses/:id/sections`

Creates a section for a course.

Role:

- course owner instructor
- `admin`

Request body:

```json
{
  "title": "Introduction",
  "order": 1
}
```

### PUT `/api/courses/sections/:id`

Updates a section.

Role:

- course owner instructor
- `admin`

### DELETE `/api/courses/sections/:id`

Deletes a section.

Business logic:

- deletes lessons inside the section too

Role:

- course owner instructor
- `admin`

## Lessons API

### POST `/api/courses/sections/:id/lessons`

Creates a lesson inside a section.

Role:

- course owner instructor
- `admin`

Request body:

```json
{
  "title": "Welcome",
  "type": "video",
  "content": "",
  "videoUrl": "",
  "fileUrl": "",
  "duration": 120,
  "isPreview": true,
  "order": 1
}
```

### PUT `/api/courses/lessons/:id`

Updates a lesson.

Role:

- course owner instructor
- `admin`

### DELETE `/api/courses/lessons/:id`

Deletes a lesson.

Business logic:

- also removes related progress records

Role:

- course owner instructor
- `admin`

## Enrollment API

### POST `/api/enrollments`

Enrols the student in a published course.

Role:

- `student`

Business logic:

- ensures the course exists and is published
- creates the enrollment if it does not already exist

Request body:

```json
{
  "courseId": "665f..."
}
```

### GET `/api/enrollments/me`

Returns the logged-in student’s enrollments.

Role:

- `student`

### PATCH `/api/enrollments/progress`

Updates progress for a lesson in a course.

Role:

- `student`

Business logic:

- updates watched seconds
- marks lesson complete if requested
- recalculates course progress percent
- marks enrollment completed at 100%

Request body:

```json
{
  "courseId": "665f...",
  "lessonId": "665f...",
  "watchedSeconds": 90,
  "isCompleted": true
}
```

### GET `/api/courses/:id/progress`

Returns progress records for the authenticated student in the given course.

Role:

- `student`

## Orders API

### POST `/api/orders`

Creates a new order in pending state and returns a Lemon Squeezy checkout URL.

Role:

- `student`

Business logic:

- validates the course or Study Vault note list
- calculates subtotal using discount price if available
- validates the coupon if provided
- applies the computed coupon discount if valid
- reserves a coupon slot while the order is pending
- creates order and order items
- creates a Lemon Squeezy checkout session
- stores the checkout reference on the order
- leaves order in `pending` status until the Lemon Squeezy `order_created` webhook confirms a paid order
- converts the pending coupon reservation into `redeemedCount` only after payment confirmation
- releases the reservation when checkout creation fails or the pending reservation expires
- allows each authenticated student account to redeem a coupon code only once
- wraps local order, order-item, and coupon reservation writes in a MongoDB transaction

Request body:

```json
{
  "courseIds": ["665f...", "665f..."],
  "couponCode": "WELCOME10"
}
```

Paid Study Vault example:

```json
{
  "noteIds": ["665f..."]
}
```

Response:

```json
{
  "_id": "66ab...",
  "status": "pending",
  "paymentProvider": "lemon_squeezy",
  "paymentIntentId": "checkout_123",
  "checkoutUrl": "https://checkout.lemonsqueezy.com/..."
}
```

### POST `/api/orders/webhook/lemon-squeezy`

Public webhook endpoint used by Lemon Squeezy to confirm payment.

Business logic:

- verifies the `X-Signature` header against the raw request body
- finds the matching order from webhook custom data
- accepts the `order_created` event only when the provider status is `paid`
- reconciles the provider store, product or variant, currency, provider order ID, and paid amount before accepting payment
- marks the order as `paid`
- finalizes the coupon redemption reservation, if present
- enrolls the student into all purchased courses
- is idempotent on repeated webhook deliveries and reconciles missing enrollments
- commits order status, coupon redemption, and enrollment changes in one MongoDB transaction
- completes `NotePurchase` records for paid Study Vault orders and preserves the provider order ID
- revokes course enrollments and note access when an `order_refunded` event is received

Webhook diagnostics are logged server-side without logging the signature or full
payload. Each webhook log includes `eventName`, `orderId`, `providerStatus`, and
`webhookResponseStatus`.

All API requests also receive an `X-Request-Id` response header. The backend
console prints matching structured records for `api.request`, `api.response`,
and `api.error`, including method, URL, route, status, duration, user role,
sanitized query/params/body, and the real server error stack when available.
Passwords, tokens, cookies, signatures, raw bodies, and image data URLs are
automatically redacted.

Example error log shape:

```json
{
  "event": "api.error",
  "requestId": "request-id-from-response-header",
  "method": "PUT",
  "url": "/api/users/me",
  "statusCode": 400,
  "response": { "message": "Password must be at least 8 characters." },
  "error": {
    "name": "ApiError",
    "message": "Validation failed",
    "details": [{ "path": ["password"], "code": "too_small" }]
  }
}
```

Webhook response meanings:

- `200`: webhook accepted, skipped, or already processed
- `400`: missing order metadata, missing signature, or invalid payload
- `401`: webhook secret/signature mismatch
- `404`: the referenced local order does not exist
- `500`: an unexpected backend or database error; the client receives a safe generic message

The shared error handler also converts validation, authentication, authorization,
rate-limit, provider, and unknown server errors into readable API messages. Raw
database errors, stack traces, provider payloads, and secrets are kept in server
logs only.

### GET `/api/orders/webhook-monitoring`

Returns recent Lemon Squeezy webhook delivery records for troubleshooting.

Role:

- `admin`

Optional query:

- `limit`: number of records to return, capped at 200

Each record includes the event name, provider and local order IDs when available,
delivery status, attempt count, response status, timestamps, and a safe error
summary. Signature values and full provider payloads are never stored.

The backend also runs a maintenance worker after MongoDB connects. It checks for
expired pending coupon reservations on a configurable interval and releases them
so reserved coupon capacity becomes available again. Configure the interval with
`COUPON_CLEANUP_INTERVAL_MS` (default: 60000 milliseconds).

## Notes Marketplace API

### GET `/api/notes`

Lists published PDF notes. Supports optional `search`, `subject`, and `limit` query parameters.

### GET `/api/notes/:slug`

Returns public metadata for one published note. The storage key is never included in this response.

### POST `/api/notes`

Creates a note for an instructor or admin. The PDF must already be uploaded through
`POST /api/uploads/lesson-file` with `folder: "notes"`; only keys beginning with
`notes/` are accepted.

### POST `/api/notes/:id/purchase`

Creates a completed purchase record for a published free note. Paid notes use
`POST /api/orders` with `noteIds`, then complete through the signed Lemon Squeezy webhook.
This endpoint continues to reject paid notes so paid access cannot bypass checkout.

### GET `/api/notes/:id/download`

Returns a short-lived S3 download URL only when the authenticated student owns the
note, or when the requester is the note seller/admin. Download counters are updated
server-side.

### GET `/api/notes/purchases/me`

Returns the authenticated student’s completed note purchases.

### GET `/api/orders/me`

Returns the authenticated student’s order history.

Role:

- `student`

### GET `/api/orders`

Returns paginated orders.

Role:

- `admin`

## Reviews API

### POST `/api/courses/:id/reviews`

Creates or updates a review for a course.

Role:

- `student`
- `instructor`
- `admin`

Business logic:

- stores rating and comment
- marks whether the user verified purchase/enrollment
- recalculates course rating average and count

Request body:

```json
{
  "rating": 5,
  "title": "Great course",
  "comment": "Very clear explanation"
}
```

### GET `/api/courses/:id/reviews`

Returns paginated reviews for a course.

Business logic:

- public read endpoint

### DELETE `/api/reviews/:id`

Deletes a review.

Business logic:

- owner can delete
- admin can delete

## Wishlist API

### POST `/api/wishlist/:courseId`

Adds a course to the student wishlist.

Role:

- `student`

### DELETE `/api/wishlist/:courseId`

Removes a course from the student wishlist.

Role:

- `student`

### GET `/api/wishlist`

Returns the student wishlist.

Role:

- `student`

## Categories API

### GET `/api/categories`

Returns active categories.

Business logic:

- public read

### POST `/api/categories`

Creates a category.

Role:

- `admin`

### PUT `/api/categories/:id`

Updates a category.

Role:

- `admin`

## Coupons API

### POST `/api/coupons`

Creates a coupon.

Role:

- `admin`

### GET `/api/coupons`

Lists coupons.

Role:

- `admin`

### POST `/api/coupons/validate`

Validates a coupon for a student.

Role:

- `student`

Business logic:

- checks coupon exists
- checks active flag
- checks expiry
- checks redemption limit
- returns the computed discount amount for the provided subtotal

Request body:

```json
{
  "code": "WELCOME10",
  "subtotal": 4999
}
```

Response:

```json
{
  "coupon": {
    "_id": "665f...",
    "code": "WELCOME10",
    "type": "percent",
    "value": 10
  },
  "subtotal": 4999,
  "discountAmount": 500,
  "total": 4499
}
```

## Notifications API

### GET `/api/notifications`

Returns notifications for the current user.

### PATCH `/api/notifications/:id/read`

Marks one notification as read.

### PATCH `/api/notifications/read-all`

Marks all user notifications as read.

## Instructor Dashboard API

### GET `/api/instructor/courses`

Returns the instructor’s own courses.

Role:

- `instructor`
- `admin`

### GET `/api/instructor/stats`

Returns instructor stats.

Business logic:

- total courses
- total students
- revenue
- rating average
- rating count

Role:

- `instructor`
- `admin`

## Admin Dashboard API

### GET `/api/admin/stats`

Returns platform-wide stats.

Business logic:

- total users
- total courses
- revenue

Role:

- `admin`

### GET `/api/admin/users`

Returns paginated users for admin management.

Role:

- `admin`

### GET `/api/admin/courses`

Returns paginated courses for admin management.

Role:

- `admin`

## Data Model Summary

The backend currently uses these collections:

- `users`
- `categories`
- `courses`
- `coursesections`
- `lessons`
- `enrollments`
- `orders`
- `orderitems`
- `reviews`
- `wishlists`
- `courseprogress`
- `coupons`
- `notifications`
- `refreshtokens`
- `passwordresettokens`

## Environment Variables

Required:

```env
MONGODB_URL=mongodb://localhost:27017/coursify
JWT_ACCESS_SECRET=your-long-secret
JWT_REFRESH_SECRET=your-long-secret
PORT=3002
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-coursify-bucket
FRONTEND_URL=http://localhost:5173
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_PRODUCT_ID=your_product_id
LEMONSQUEEZY_VARIANT_ID=your_variant_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_AMOUNT_TOLERANCE_MINOR=100
```

## Notes

- Payment transactions require MongoDB replica-set support. MongoDB Atlas provides this by default; local MongoDB must be started as a single-node replica set.
- Refresh tokens are stored in MongoDB and rotated on refresh.
- Image uploads now go through Cloudinary.
- Lesson PDFs and videos use presigned S3 uploads.
- The backend is designed to be extended into a more complete LMS with payments, media upload, and analytics later.
- Legacy MVP route files exist in `Backend/routers`, but they are not used by the current app bootstrap.
