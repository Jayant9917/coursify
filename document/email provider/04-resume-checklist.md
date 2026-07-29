# Resume Checklist

Do not resume email implementation until these are complete:

- [ ] Confirm `jayrana.in` is owned and accessible.
- [ ] Confirm the correct Cloudflare account.
- [ ] Confirm `jayrana.in` is active in Cloudflare.
- [ ] Add `skillnest.jayrana.in` in Resend.
- [ ] Add Resend DKIM record in Cloudflare.
- [ ] Add Resend SPF record in Cloudflare.
- [ ] Add Resend return-path MX record in Cloudflare.
- [ ] Verify the domain in Resend.
- [ ] Create Cloudflare route for `support@skillnest.jayrana.in`.
- [ ] Confirm forwarding to `ranajayant527@gmail.com`.
- [ ] Create a Resend API key.
- [ ] Add production environment variables.
- [ ] Send a test password reset email to Gmail.
- [ ] Confirm the reset link opens the Skillnest frontend.
- [ ] Confirm the token is not returned in the production API response.
- [ ] Confirm replies to `support@skillnest.jayrana.in` arrive in Gmail.

After these checks, the next implementation should be email verification, not a new unrelated product module.
