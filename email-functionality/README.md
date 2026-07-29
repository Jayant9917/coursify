# Future Email Functionality

This folder records the planned email architecture for Skillnest. The application does not integrate React Email or Resend yet because the project does not currently own or control a sending domain.

## Current Decision

Do not add email-provider code, API keys, or DNS-dependent configuration yet.

When a domain is available, the application can send branded emails from `support@skillnest.com` and forward incoming support messages to `ranajayant677@gmail.com`.

## Planned Services

### React Email

React Email will provide reusable, responsive templates for welcome, email verification, password reset, course enrollment, Study Vault purchase confirmation, payment, refund, and support notification emails.

React Email creates the email markup. It does not send email by itself.

### Resend

Resend will provide outbound email delivery, delivery and bounce events, webhook processing, and inbound email receiving if Resend Receiving is selected.

## Intended Address Flow

### Outbound mail

```text
Skillnest backend -> React Email template -> Resend API -> support@skillnest.com
```

The visible sender will be something such as:

```text
Skillnest Support <support@skillnest.com>
```

### Inbound support mail

```text
User -> support@skillnest.com -> Resend Receiving or existing mail provider
     -> Backend inbound webhook -> ranajayant677@gmail.com
```

The Gmail address is the forwarding destination. It is not the sender identity that Resend verifies.

## Domain and DNS Requirements

Before implementation:

1. Purchase or otherwise obtain control of `skillnest.com`.
2. Create a Resend account and add the domain.
3. Add the SPF and DKIM records provided by Resend.
4. Add a DMARC policy after SPF and DKIM are working.
5. Decide who currently handles incoming mail for `skillnest.com`.
6. Configure inbound mail without unintentionally replacing an existing Gmail or mailbox provider.

If the root domain already has MX records, prefer a dedicated inbound subdomain such as `inbox.skillnest.com`, or use the existing provider's forwarding feature. Replacing MX records can stop existing mailboxes from receiving mail.

## Backend Implementation Plan

### 1. Email module

Create a backend email module responsible for creating the Resend client, rendering React Email templates, sending messages, normalizing provider errors, and logging message IDs without logging private message content.

Suggested structure:

```text
Backend/
  emails/
    templates/
      WelcomeEmail.jsx
      PasswordResetEmail.jsx
      PurchaseConfirmationEmail.jsx
      SupportNotificationEmail.jsx
    emailService.js
  controllers/
    emailController.js
  routes/
    emailRoutes.js
```

The exact location should follow the existing backend service and route conventions when implementation begins.

### 2. Environment variables

Add these only to local and deployment environment configuration, never to Git:

```env
RESEND_API_KEY=re_...
EMAIL_FROM="Skillnest Support <support@skillnest.com>"
SUPPORT_EMAIL=support@skillnest.com
SUPPORT_FORWARD_TO=ranajayant677@gmail.com
RESEND_WEBHOOK_SECRET=whsec_...
APP_URL=https://skillnest.com
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
- Forward the message to `ranajayant677@gmail.com`.
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

## Frontend Features to Add Later

- Contact/support form.
- Success and failure states.
- Password-reset email flow.
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
- Verify replies to `support@skillnest.com` arrive at the intended mailbox.
- Test attachments and malicious HTML safely.
- Confirm bounce and complaint events are handled.

## Recommended Implementation Order

1. Own and verify the domain.
2. Configure Resend outbound sending.
3. Add React Email templates.
4. Send welcome and password-reset emails.
5. Add delivery and bounce webhooks.
6. Decide whether Resend Receiving or the existing mail provider should handle inbound support mail.
7. Add the inbound forwarding webhook.
8. Add retry, idempotency, monitoring, and tests.
9. Verify the complete flow in staging before production.

## What Is Blocked Until Then

- Sending from `support@skillnest.com` cannot be production-verified.
- Receiving mail at `support@skillnest.com` cannot be configured safely without DNS control.
- SPF, DKIM, DMARC, and MX records cannot be added by application code.
- The real Resend API key must be supplied through deployment secrets.

## Reference Documentation

- [React Email with Resend](https://react.email/docs/integrations/resend)
- [React Email rendering](https://react.email/docs/utilities/render)
- [Resend domain management](https://resend.com/docs/dashboard/domains/introduction)
- [Resend receiving emails](https://resend.com/docs/dashboard/receiving/introduction)
- [Resend inbound forwarding](https://resend.com/docs/knowledge-base/forward-emails-with-resend-inbound)
