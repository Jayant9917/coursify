# Current State

This is the current product state as of 2026-07-13.

## What already exists

- Public pages: home, course list, course detail, login, register, checkout
- Student pages: dashboard, courses, lesson player, orders, wishlist, profile
- Instructor pages: dashboard, courses, course editor, stats
- Admin pages: dashboard, users, courses, categories, coupons, orders
- REST API for auth, courses, enrollments, orders, reviews, wishlist, categories, coupons, notifications, and dashboards
- JWT access and refresh token auth
- Persistent refresh tokens stored in MongoDB
- Cloudinary image uploads for avatars and course thumbnails
- Presigned S3 upload flow for lesson PDFs and videos
- Forgot password and reset password flow
- Rate limiting and security headers
- Coupon validation and redemption tracking
- Basic course builder with sections and lessons

## What is the current stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Zod, bcryptjs
- Frontend: React, Vite, React Router, React Hook Form, Zod, Zustand, TanStack Query, Axios, Tailwind CSS
- Media uploads: Cloudinary for images right now

## What is not complete yet

- Final lesson media UX and access strategy
- Proper email provider for password reset emails
- Payment integration for Lemon Squeezy
- Auto-enrollment flow after payment
- Admin CRUD polish
- Video streaming / HLS / signed playback
- Better large-file handling for production media

## Main product direction

We are building Coursify into a larger course platform for a client.
The future direction is:

- MongoDB as the main data store
- React + Vite frontend
- Cloudinary for images
- S3 for lesson PDFs and videos
- Lemon Squeezy for payments later
