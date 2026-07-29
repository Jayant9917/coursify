# Payment and Webhook Flow

## Provider

Skillnest uses Lemon Squeezy for checkout and payment processing.

Relevant files:

- `Backend/utils/lemonSqueezy.js` - creates checkout payloads and verifies webhook signatures
- `Backend/routes/orders.js` - exposes the webhook route
- `Backend/services/index.js` - owns order state, coupon finalization, and enrollment creation
- `Backend/controllers/index.js` - receives the webhook request and calls the service
- `Backend/index.js` - mounts the order routes and preserves the raw request body for signature verification

## Webhook URL

The callback URL must include the complete backend route:

```text
https://YOUR-NGROK-DOMAIN/api/orders/webhook/lemon-squeezy
```

The hostname alone is incorrect because it sends `POST /`, which returns `404`.

The route is:

```text
POST /api/orders/webhook/lemon-squeezy
```

## Successful flow

1. The student applies a coupon, if desired.
2. The backend calculates the course subtotal and discount.
3. The backend creates a local order with `status: pending`.
4. The backend reserves a coupon slot.
5. The backend creates a Lemon Squeezy checkout and includes local `order_id`, `user_id`, `course_ids`, and `coupon_code` in custom data.
6. The student completes payment on Lemon Squeezy.
7. Lemon Squeezy sends a signed `order_created` webhook.
8. The backend verifies the signature and reads the local order ID from webhook custom data.
9. The backend accepts the event only when the provider status is `paid`.
10. The local order changes from `pending` to `paid`.
11. The coupon reservation becomes a redemption.
12. Enrollments are created for each purchased course.

## Expected outcomes

| Event | Local result |
| --- | --- |
| Successful `order_created` | Order becomes `paid`, coupon is redeemed, enrollment is created |
| Duplicate `order_created` | Returns success without duplicating the enrollment or redemption |
| `order_refunded` | Order becomes `refunded` |
| Invalid signature | Returns `401` |
| Missing order metadata | Returns `400` |
| Local order not found | Returns `404` |
| Database or unexpected error | Returns `500` with a safe message |

## Important behavior

Payment confirmation is asynchronous. The provider can show a successful payment before the webhook updates the local database. The local order remains `pending` until the verified webhook is received.
