# Current Implementation

## Backend Email Code

The current code contains a small email adapter:

```text
Backend/utils/email.js
Backend/utils/emailTemplates.js
```

### `Backend/utils/email.js`

- Creates a Resend client from `RESEND_API_KEY`.
- Renders React Email components into HTML.
- Sends messages through the Resend Node SDK.
- Uses `EMAIL_REPLY_TO` for replies.
- Logs only a safe development preview when `EMAIL_PROVIDER=console`.
- Does not log password-reset tokens or email body content.

### `Backend/utils/emailTemplates.js`

Currently contains:

- Password reset email template.
- Skillnest security branding.
- Reset button.
- Fifteen-minute expiry message.
- Safe support contact footer.

## Password Reset Flow

```text
User submits forgot-password form
        |
        v
POST /api/auth/forgot-password
        |
        v
Backend finds active user
        |
        v
Backend stores hashed reset token in MongoDB
        |
        +--> EMAIL_PROVIDER=resend
        |       |
        |       v
        |   React Email -> Resend -> security@skillnest.jayrana.in
        |
        +--> EMAIL_PROVIDER=console
                |
                v
            Development token returned for local testing only
```

## Security Behavior

- Unknown email addresses receive the same generic response.
- Reset tokens expire after 15 minutes.
- Tokens are stored hashed.
- Tokens can only be used once.
- If Resend delivery fails, the reset token is removed and the API returns a safe 503 response.
- Production refuses to start with `EMAIL_PROVIDER=console`.

## Frontend Behavior

`Frontend/src/pages/public/ForgotPassword.jsx`:

- Sends the email to the backend.
- Does not call Resend directly.
- In local console mode, navigates to the reset page with the development token.
- In Resend mode, shows a generic sent message and does not receive the token.

## Current Dependencies

Backend dependencies added for this feature:

- `resend`
- `@react-email/components`
- `@react-email/render`

## What Is Not Implemented Yet

- Email verification after registration.
- Resend verification action.
- Welcome email.
- Purchase confirmation email.
- Refund email.
- Security alert email.
- Resend delivery/bounce webhook handling.
- Email delivery history in the admin panel.
- Inbound support processing inside the backend.

These items are intentionally frozen.
