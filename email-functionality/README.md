# Future Email Functionality

This folder records the email architecture for Skillnest. The backend now has a Resend delivery adapter and React Email password-reset template. Domain verification and Cloudflare routing remain deployment-level configuration.

## Current Decision

Keep provider keys server-side and configure them through deployment secrets. DNS-dependent settings must be completed in Resend and Cloudflare.

The application sends branded emails through Resend and forwards incoming `support@skillnest.jayrana.in` messages through Cloudflare Email Routing to `ranajayant527@gmail.com`.

## Planned Services

### React Email

React Email will provide reusable, responsive templates for welcome, email verification, password reset, course enrollment, Study Vault purchase confirmation, payment, refund, and support notification emails.

React Email creates the email markup. It does not send email by itself.

### Resend

Resend provides outbound email delivery. The current backend uses it for password-reset messages and is structured for future course, payment, and security notifications.

## Intended Address Flow

### Outbound mail

```text
Skillnest backend -> React Email template -> Resend API -> user inbox
```

The visible sender will be something such as:

```text
Skillnest Security <security@skillnest.jayrana.in>
```

### Inbound support mail

```text
User -> support@skillnest.jayrana.in -> Cloudflare Email Routing
     -> ranajayant527@gmail.com
```

The Gmail address is the forwarding destination. It is not the sender identity that Resend verifies.

## Domain and DNS Requirements

Before implementation:

1. Confirm control of `jayrana.in` and use `skillnest.jayrana.in`.
2. Create a Resend account and add the domain.
3. Add the SPF and DKIM records provided by Resend.
4. Add a DMARC policy after SPF and DKIM are working.
5. Decide who currently handles incoming mail for `skillnest.jayrana.in`.
6. Configure inbound mail without unintentionally replacing an existing Gmail or mailbox provider.

If the root domain already has MX records, use the dedicated `skillnest.jayrana.in` subdomain. Replacing MX records can stop existing mailboxes from receiving mail.

## Backend Implementation Plan

### 1. Email module

Implemented in `Backend/utils/email.js` and `Backend/utils/emailTemplates.js`. The module creates the Resend client, renders React Email templates, sends messages, and avoids logging private message content.

```text
Backend/
  utils/email.js
  utils/emailTemplates.js
```

The exact location should follow the existing backend service and route conventions when implementation begins.

### 2. Environment variables

Add these only to local and deployment environment configuration, never to Git:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM_NO_REPLY="Skillnest <no-reply@skillnest.jayrana.in>"
EMAIL_FROM_SECURITY="Skillnest Security <security@skillnest.jayrana.in>"
EMAIL_FROM_NOTIFICATIONS="Skillnest <notifications@skillnest.jayrana.in>"
EMAIL_REPLY_TO=support@skillnest.jayrana.in
EMAIL_LOGO_URL=https://skillnest.jayrana.in/logo.png
FRONTEND_URL=https://skillnest.jayrana.in
```

The real API key must remain server-side and must not be placed in the frontend or committed to `.env.example`.

### 3. Inbound webhook

Add a public HTTPS endpoint such as `POST /api/webhooks/resend/inbound`.

The endpoint must:

- Verify the Resend webhook signature.
- Reject replayed or invalid requests.
- Accept only the expected receiving address.
- Retrieve full message content using the received email ID.
- Sanitize HTML before displaying or forwarding it.
- Enforce attachment size and type limits.
- Forward the message to `ranajayant527@gmail.com`.
- Return quickly and move heavier processing to the background queue.
- Store a provider event ID for idempotency.

### 4. Outbound events

Add event handling for `email.sent`, `email.delivered`, `email.bounced`, and `email.complained`. These events should be logged and optionally stored for support diagnostics. A bounced address should not be repeatedly emailed.

## Security Rules

- Keep `RESEND_API_KEY` server-side only.
- Never trust an inbound `from` address as proof of identity.
- Validate all webhook signatures.
- Rate-limit public contact and support forms.
- Sanitize inbound HTML and attachment names.
- Do not expose private support messages in public API responses.
- Avoid putting password-reset tokens or payment secrets in email logs.
- Use a background job for forwarding and retries.
- Make webhook handling idempotent.

## Current frontend behavior

- Contact/support form.
- Success and failure states.
- Password-reset form calls the backend. In Resend mode, the token is never returned to the browser.
- In local `EMAIL_PROVIDER=console` mode, the development token remains available for testing.

## Frontend Features to Add Later
- Email verification screen and resend action.
- Purchase confirmation messaging.
- Admin email delivery status, if needed.

The frontend should call the backend API. It must never call Resend directly.

## Testing Plan

### Unit tests

- Templates render the expected subject and links.
- Invalid recipient addresses are rejected.
- Invalid webhook signatures are rejected.
- Duplicate webhook events are ignored.
- Inbound HTML is sanitized.

### Integration tests

- The backend sends a message using a mocked Resend client.
- Password reset creates and sends the correct template.
- The inbound webhook retrieves and forwards a received message.
- Retry behavior works when Resend temporarily fails.

### Production verification

- Send to Gmail, Outlook, and another provider.
- Check SPF, DKIM, and DMARC alignment.
- Verify replies to `support@skillnest.jayrana.in` arrive at the intended mailbox.
- Test attachments and malicious HTML safely.
- Confirm bounce and complaint events are handled.

## Recommended Implementation Order

1. Own and verify the domain.
2. Configure Resend outbound sending.
3. Configure Cloudflare Email Routing for `support@skillnest.jayrana.in`.
4. Send password-reset emails through the implemented adapter.
5. Add delivery and bounce webhooks.
6. Add email verification and resend action.
7. Add purchase, refund, and security notification templates.
8. Add retry, idempotency, monitoring, and tests.
9. Verify the complete flow in staging before production.

## What Is Blocked Until Then

- Sending from `support@skillnest.jayrana.in` cannot be production-verified until `jayrana.in` is active in Cloudflare.
- Receiving mail at `support@skillnest.jayrana.in` cannot be configured safely without DNS control.
- SPF, DKIM, DMARC, and MX records cannot be added by application code.
- The real Resend API key must be supplied through deployment secrets.

## Reference Documentation

- [React Email with Resend](https://react.email/docs/integrations/resend)
- [React Email rendering](https://react.email/docs/utilities/render)
- [Resend domain management](https://resend.com/docs/dashboard/domains/introduction)
- [Resend receiving emails](https://resend.com/docs/dashboard/receiving/introduction)
- [Resend inbound forwarding](https://resend.com/docs/knowledge-base/forward-emails-with-resend-inbound)
