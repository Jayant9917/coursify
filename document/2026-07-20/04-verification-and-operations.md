# Verification and Operations

## Start the backend

```powershell
cd Backend
npm run dev
```

For the current local setup, ngrok must forward to the same backend port:

```powershell
ngrok http 3002
```

## Configure Lemon Squeezy

Set the callback URL to:

```text
https://YOUR-NGROK-DOMAIN/api/orders/webhook/lemon-squeezy
```

Enable `order_created` and `order_refunded`.

The Lemon Squeezy signing secret must match `LEMONSQUEEZY_WEBHOOK_SECRET` in `Backend/.env`.

If the ngrok domain changes, update the Lemon Squeezy callback URL again.

## Manual test checklist

1. Sign in with a student account that has not used `SKILLNEST20`.
2. Add a course to checkout.
3. Apply `SKILLNEST20`.
4. Confirm the discount and total shown in the checkout UI.
5. Complete the Lemon Squeezy test payment.
6. Confirm the webhook uses `/api/orders/webhook/lemon-squeezy`, not `/`.
7. Confirm the webhook response status is `200`.
8. Confirm the local order becomes `paid`.
9. Confirm the student is enrolled in the purchased course.
10. Confirm the coupon cannot be applied again by the same student.
11. Redeliver the same webhook and confirm no duplicate enrollment is created.

## Diagnostic interpretation

| Status | Meaning |
| --- | --- |
| `200` | Webhook accepted or already processed |
| `400` | Invalid payload, missing signature, or missing order metadata |
| `401` | Signing secret or signature mismatch |
| `404` | Callback path is wrong or local order ID was not found |
| `500` | Backend or database failure |

If ngrok shows `POST / 404`, the Lemon Squeezy URL is missing `/api/orders/webhook/lemon-squeezy`.

## Security note

If a webhook signing secret is exposed in a screenshot, chat, terminal recording, or repository, rotate it in Lemon Squeezy and update the backend environment variable immediately.
