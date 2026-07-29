# API Map

This file gives a practical overview of what the APIs do.

## Auth APIs

- `POST /api/auth/register` creates a user and signs them in
- `POST /api/auth/login` authenticates an existing user
- `POST /api/auth/refresh` rotates refresh tokens
- `POST /api/auth/logout` removes the refresh token
- `POST /api/auth/forgot-password` starts password recovery
- `POST /api/auth/reset-password` changes the password using a reset token

## User APIs

- `GET /api/users/me` returns the current profile
- `PUT /api/users/me` updates profile fields
- `GET /api/users` is admin user listing
- `PATCH /api/users/:id/status` blocks or unblocks a user

## Course APIs

- `GET /api/courses` returns public published courses
- `GET /api/courses/:slug` returns public course detail
- `POST /api/courses` creates a course
- `PUT /api/courses/:id` updates a course
- `DELETE /api/courses/:id` deletes a course
- `PATCH /api/courses/:id/publish` changes publish state

## Section and lesson APIs

- Sections can be created, updated, and deleted under a course
- Lessons can be created, updated, and deleted under sections
- Lesson progress is tracked per student

## Enrollment and orders

- `POST /api/enrollments` creates enrollment for a student
- `GET /api/enrollments/me` lists a student’s enrollments
- `PATCH /api/enrollments/progress` updates watching progress
- `POST /api/orders` creates an order record
- `GET /api/orders/me` lists student orders

## Upload APIs

- `POST /api/uploads/image` uploads authenticated images to Cloudinary
- `POST /api/uploads/public-image` uploads signup avatar images

## Why these APIs matter

- The frontend should treat the backend as the source of truth
- Uploaded files should not be stored in MongoDB, only URLs
- Payment and enrollment logic should stay coordinated on the backend

