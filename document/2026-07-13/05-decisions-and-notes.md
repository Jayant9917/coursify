# Decisions and Notes

These were important design decisions from our discussions.

## Stack decisions

- MongoDB will be the main database
- React + Vite will be the frontend stack
- Cloudinary is used for images
- AWS S3 is planned for PDFs and videos

## Auth decisions

- Refresh tokens are stored in MongoDB
- Forgot password works without an email provider in development
- Production should later send a real email reset link

## Upload decisions

- Store only file URLs in MongoDB
- Do not store raw file contents in the database
- Use separate upload paths for public signup avatars and authenticated uploads

## Payment decisions

- Lemon Squeezy will be used later for payments
- Backend should be the source of truth for order and enrollment state
- Payment success should trigger enrollment on the backend

## Engineering decisions

- Avoid mass assignment on update endpoints
- Keep security headers and rate limits in place
- Document the APIs so the project can be resumed quickly

