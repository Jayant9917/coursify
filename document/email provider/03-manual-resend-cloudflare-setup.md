# Manual Resend And Cloudflare Setup

Perform these steps from the home PC after confirming DNS access.

## 1. Activate `jayrana.in` in Cloudflare

If `jayrana.in` is not already active in Cloudflare:

1. Open Cloudflare.
2. Add `jayrana.in`.
3. Cloudflare will provide two nameservers.
4. Open the registrar where `jayrana.in` was purchased.
5. Replace the registrar nameservers with the Cloudflare nameservers.
6. Wait until Cloudflare reports the domain as active.

Do not add the domain again if it already exists in another Cloudflare account. Use the existing account or deliberately migrate it.

## 2. Add The Resend Domain

In Resend, add:

```text
skillnest.jayrana.in
```

Choose manual setup if automatic setup fails. Keep the Resend DNS records page open.

## 3. Add Resend Records In Cloudflare

Open:

```text
Cloudflare -> jayrana.in -> DNS -> Records -> Add record
```

Copy the exact values Resend provides.

Resend commonly provides records similar to these, but the actual values must come from Resend:

```text
TXT  resend._domainkey.skillnest  [full DKIM value]
MX   send.skillnest              [full Resend mail server]  priority 10
TXT  send.skillnest              [full SPF value]
```

For Cloudflare:

- TXT records use `Content` for the value.
- MX records use `Mail server` for the value.
- Use TTL `Auto`.
- Use the exact priority shown by Resend.
- Do not add random SPF or DKIM values.
- Do not add an extra root SPF record unless Resend explicitly requests it.
- Mail records must remain DNS-only; never proxy mail records.

If Resend displays the full name `resend._domainkey.skillnest.jayrana.in`, Cloudflare may accept only `resend._domainkey.skillnest` in the Name field. Follow Cloudflare's zone formatting and do not duplicate the domain suffix.

## 4. Verify Resend

After saving every record:

1. Return to Resend.
2. Click the manual verification button.
3. Wait for DKIM, SPF, and return-path MX verification.
4. Continue only when the domain is marked verified.

DNS propagation may take time. Never copy shortened values containing `[...]` from screenshots.

## 5. Configure Cloudflare Email Routing

Create this rule:

```text
support@skillnest.jayrana.in -> ranajayant527@gmail.com
```

Confirm the Gmail destination if Cloudflare requests confirmation.

Keep receiving support mail in Cloudflare. Do not add backend inbound email code during this frozen phase.

## 6. Create The Resend API Key

Only after the domain is verified:

1. Create a Resend API key.
2. Restrict it to the required sending scope if available.
3. Add it only to the backend deployment environment.
4. Never add it to the frontend or Git.
