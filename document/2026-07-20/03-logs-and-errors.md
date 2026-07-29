# Logs and Central Error Handling

## Structured request logging

Relevant files:

- `Backend/utils/logger.js` - sanitizes and writes structured log records
- `Backend/middlewares/requestLogger.js` - assigns request IDs and logs request/response data
- `Backend/middlewares/error.js` - logs unexpected failures and creates safe API responses
- `Backend/index.js` - installs the logger before JSON parsing and route handling

Each request receives an `X-Request-Id` response header. The same ID appears in related log records so one browser request can be traced from start to finish.

## Log events

### `api.request`

Contains the request ID, method, URL, IP, user agent, and sanitized query, params, and body.

### `api.response`

Contains the request ID, matched route, authenticated user ID and role, HTTP status, duration, and response length when available.

Webhook responses additionally include `eventName`, `orderId`, `providerStatus`, and `webhookResponseStatus`.

### `api.error`

Contains the request ID, route, status, safe response message, internal error name and message, stack trace when available, and sanitized error details.

## Redaction rules

The logger does not print passwords, password hashes, access tokens, refresh tokens, cookies, authorization headers, webhook signatures, secrets, raw bodies, or image data URLs.

## User-facing errors

Users receive readable messages such as:

- `This coupon has already been used on your account`
- `Coupon has expired`
- `Invalid Lemon Squeezy webhook signature`
- `The requested endpoint was not found`
- `Something went wrong while processing your request`

Internal database errors, stack traces, provider payloads, and secrets remain server-side only.
