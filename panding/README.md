# Pending: Database-Dependent Payment Work

This folder records work intentionally paused until MongoDB replica-set support is available.

## Completed Before Freeze

- Payment order creation uses a MongoDB transaction.
- Coupon reservations are created inside the order transaction.
- Order items are written inside the same transaction as the order.
- Failed checkout cleanup releases coupon reservations and marks the order as failed.
- Successful payment webhooks update the order, redeem the coupon, and create enrollments in one transaction.
- Refund webhooks release coupon reservations, mark the order as refunded, and revoke enrollments in one transaction.
- Repeated paid webhooks are handled idempotently and can restore missing enrollments.
- Webhook reconciliation validates the provider order ID, store, product or variant, currency, and amount.
- Frontend payment status polling is implemented for a limited period after checkout.

## Frozen Until Later

The following database-specific tests are not currently executed because the local MongoDB instance is standalone:

- Paid-course enrollment bypass prevention.
- Refunded enrollment lesson-access prevention.
- Cross-course progress prevention.
- Coupon redemption rollback.
- Duplicate webhook handling against persisted orders.
- Payment webhook amount mismatch against persisted orders.
- Transaction rollback behavior across order, coupon, and enrollment writes.

The existing application code remains in place. This freeze only pauses the database-backed test execution and migration execution.

## Required MongoDB Setup

MongoDB transactions require replica-set support. Use one of these options:

1. MongoDB Atlas, which provides replica-set support automatically.
2. A local single-node replica set for development and testing.

Example local connection string:

```text
mongodb://127.0.0.1:27017/coursify?replicaSet=rs0
```

The MongoDB server must also be started with replica-set name `rs0`, and the replica set must be initialized once. Do not point the test suite at production data.

## Resume Checklist

- Start or provision a dedicated test MongoDB replica set.
- Set `TEST_MONGODB_URL` to the dedicated test database.
- Run the database integration test suite.
- Review transaction rollback and duplicate webhook results.
- Run the refunded-enrollment migration in preview mode first.
- Apply the migration only after the preview counts are correct.

## Available Commands

Run the current safe test suite:

```powershell
npm test
```

Preview the old refunded-enrollment cleanup:

```powershell
npm run db:migrate:refunded-enrollments -- --dry-run
```

Apply the cleanup after verification:

```powershell
npm run db:migrate:refunded-enrollments
```
