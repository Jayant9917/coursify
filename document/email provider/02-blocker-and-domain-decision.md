# Blocker And Domain Decision

## Problem

The initial plan used:

```text
skillnest.com
```

However, the project does not own or control this domain. Without DNS access, it is impossible to safely add the Resend verification records or Cloudflare email-routing records.

## Correct Decision

Use the domain that is owned by the project owner:

```text
jayrana.in
```

Use a Skillnest subdomain:

```text
skillnest.jayrana.in
```

This supports:

```text
Skillnest Security <security@skillnest.jayrana.in>
Skillnest <no-reply@skillnest.jayrana.in>
Skillnest <notifications@skillnest.jayrana.in>
support@skillnest.jayrana.in
```

## Why This Works

The owner controls `jayrana.in`, so the owner can:

- Add the domain to Cloudflare.
- Point the registrar nameservers to Cloudflare.
- Add Resend SPF and DKIM records.
- Add Resend return-path MX/TXT records.
- Create Cloudflare Email Routing rules.

## Gmail Destination

Cloudflare should forward:

```text
support@skillnest.jayrana.in
```

to:

```text
ranajayant527@gmail.com
```

This Gmail address is the receiving destination only. It is not the outbound sender identity.

## Future Migration

If `skillnest.com` is purchased later, the email architecture can move from `skillnest.jayrana.in` to `skillnest.com` by changing the verified domain and environment variables.
