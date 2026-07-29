# Coupon Lifecycle

## Why the lifecycle changed

Coupon usage must not be counted when a student merely starts checkout. A checkout can fail or be abandoned. The coupon is therefore reserved first and redeemed only after Lemon Squeezy confirms payment.

Relevant files:

- `Backend/models/index.js` - stores `maxRedemptions`, `redeemedCount`, and `reservedCount`
- `Backend/services/index.js` - reserves, releases, and finalizes coupon usage
- `Backend/controllers/index.js` - passes the authenticated student ID to validation
- `Backend/validators/index.js` - validates coupon code and subtotal input
- `Frontend/src/hooks/useCheckout.js` - sends subtotal and displays coupon errors
- `Frontend/src/services/api.js` - exposes coupon validation and order APIs

## States

### Reserved

When an order is created with a coupon:

- `reservedCount` increases by one.
- The order stays `pending`.
- A reservation expiry timestamp is stored.

### Redeemed

When a paid webhook is accepted:

- `redeemedCount` increases by one.
- `reservedCount` decreases by one.
- The order receives `couponRedeemedAt`.

### Released

When checkout creation fails or a pending reservation expires:

- The reservation is released.
- `reservedCount` decreases by one.
- The coupon remains available.

## Per-student reuse rule

The same authenticated student cannot use the same coupon code again after an order with that code is `paid` or `refunded`.

The user-facing message is:

```text
This coupon has already been used on your account
```

This rule is checked during coupon validation and again during order creation.

## Test coupon

The following coupon was created for testing:

```text
Code: SKILLNEST20
Discount: 20 percent
Maximum redemptions: 100
Status: active
Expiry: none
Initial redeemed count: 0
Initial reserved count: 0
```

The global limit is 100, but each student account can use this code only once.

## Lemon Squeezy discount value

Lemon Squeezy may show `discount_total: 0`. This is expected because Skillnest calculates the discount locally and sends the already-discounted checkout amount to the provider. Local order and coupon records are the source of truth for coupon usage.
