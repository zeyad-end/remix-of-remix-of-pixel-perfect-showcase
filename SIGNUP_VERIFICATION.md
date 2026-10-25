# Account creation and verification

`/register` is the normal Gym Account / Client signup page. Development signup simulates delivery locally and accepts a nonempty code without creating a provider account. Development quick login uses a fresh random sessionStorage identity, clears provider authentication and query caches, and opens a separate in-memory workspace. It never mounts protected account pages or grants admin access. Production `/` performs provider password login by email or international phone and checks persisted account type. Signup never grants gym approval.

## Temporary verifier boundary

`src/lib/signup.functions.ts` checks `temporaryVerificationEnabled(import.meta.env.DEV, process.env['NODE_ENV'])` inside **both** server handlers before loading privileged credentials. Vite production builds replace DEV with false, and a production runtime independently disables it. A hostname, browser flag, query parameter or request body cannot enable it. Thus the published production app does not send temporary challenges or create arbitrary-code accounts. Signup fails closed with a provider-unavailable notice until real verification is installed; password login for existing accounts still works.

The signup screen now uses ten-minute browser-local challenges in development, bound to the selected contact. It does not call the legacy server challenge/account-creation functions. No account, contact, password or challenge is persisted to Cloud by this preview flow. Use fictional contacts only. Preview sessions are not real accounts.

## Replacing the adapter

Replace the temporary send and verify calls with server-only provider adapters. Store the provider challenge/reference with the same exact normalized contact, enforce expiry, retry/rate limits and single consumption. Confirm the provider result before calling account creation. Never enable the temporary adapter in production or make its enable flag client-controlled. Provider credentials belong in Cloud secrets, not frontend code. Email confirmation settings are not globally weakened; only the accounts explicitly verified through this flow are confirmed at creation.

Production setup requires a transactional email provider with a verified sender/domain for email codes and an SMS verification provider with approved sender/number for phone codes (for example Twilio Verify). Configure their private credentials as Cloud secrets, replace both server send and verify adapters, and verify each supplied contact before confirming it. Enable provider phone/password authentication if phone login is offered. Until installed, production signup intentionally remains unavailable; existing password login stays active.

For both supplied email and phone, verify each contact separately before production confirmation; development currently confirms the supplied test contacts after one bound challenge. Native phone/password login must also be enabled by the account provider. Phone-only recovery intentionally fails closed until a real recovery provider is configured; existing email recovery uses the public reset-password page.