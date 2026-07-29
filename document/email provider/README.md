# Skillnest Email Provider Freeze

Status: FROZEN
Freeze date: 2026-07-29

This folder is the handoff record for the Skillnest email-provider work. Do not continue implementing email features until the domain and DNS setup is completed from the home PC.

## Why This Work Is Frozen

The original plan used addresses under `skillnest.com`, but that domain is not owned or controlled by the project owner. Resend and Cloudflare require DNS control to verify a sending domain and configure email routing.

The owned domain is `jayrana.in`. The recommended future email domain is:

```text
skillnest.jayrana.in
```

Future addresses:

```text
no-reply@skillnest.jayrana.in
security@skillnest.jayrana.in
notifications@skillnest.jayrana.in
support@skillnest.jayrana.in
```

## Read In This Order

1. `01-current-implementation.md`
2. `02-blocker-and-domain-decision.md`
3. `03-manual-resend-cloudflare-setup.md`
4. `04-resume-checklist.md`
5. `05-environment-template.txt`
6. `06-audit.md`

## Frozen Architecture

```text
Outbound emails
Skillnest backend -> React Email -> Resend -> student inbox

Inbound support emails
Student -> support@skillnest.jayrana.in -> Cloudflare Email Routing -> ranajayant527@gmail.com
```

Cloudflare handles inbound support forwarding. Resend handles outbound application emails.

## Important Freeze Rules

- Do not use `skillnest.com` in production configuration.
- Do not invent SPF, DKIM, or MX records.
- Copy DNS records only from the Resend dashboard.
- Never commit `RESEND_API_KEY`.
- Do not add more email templates or email verification until the domain is verified.
- Do not enable Cloudflare Email Routing until `jayrana.in` is active in the correct Cloudflare account.
