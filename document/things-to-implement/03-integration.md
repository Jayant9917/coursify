# Integration Tasks

This file is for problems that touch both frontend and backend.

## 1. Auth contract

- [x] Login returns `user`, `accessToken`, and `refreshToken`.
- [x] The frontend stores the refresh token and sends it to the backend refresh route.
- [x] `Authorization: Bearer <token>` is the standard access-token header.
- [x] Axios refresh logic is aligned with the backend auth routes.

## 2. Checkout contract

- [x] Coupon validation returns a computed discount result.
- [x] Checkout computes fixed and percent discounts consistently with the backend.
- [x] Auto-enrollment is owned by the backend after a paid Lemon Squeezy webhook.
- [x] The order response includes a checkout URL for safe redirection.

## 3. Course contract

- [ ] Keep public list pagination shape consistent.
- [ ] Keep course detail shape consistent with course, sections, and lessons.
- [ ] Keep review response shape consistent with the review UI.

## 4. Dashboard contract

- [ ] Keep instructor stats field names stable.
- [ ] Keep admin stats field names stable.
- [ ] Keep admin list endpoints paginated and predictable.

## 5. Security contract

- [ ] Align CORS origins with the frontend dev server.
- [ ] Sanitize any HTML sent to the browser.
- [ ] Keep upload URLs and signed URLs short-lived and server-controlled.

## 6. High-risk integration files

- [Backend/index.js](../Backend/index.js)
- [Backend/routes/auth.js](../Backend/routes/auth.js)
- [Backend/routes/courses.js](../Backend/routes/courses.js)
- [Backend/routes/orders.js](../Backend/routes/orders.js)
- [Frontend/src/services/api.js](../Frontend/src/services/api.js)
- [Frontend/src/hooks/useCheckout.js](../Frontend/src/hooks/useCheckout.js)
- [Frontend/src/pages/public/CourseDetail.jsx](../Frontend/src/pages/public/CourseDetail.jsx)
- [Frontend/src/pages/public/Checkout.jsx](../Frontend/src/pages/public/Checkout.jsx)
