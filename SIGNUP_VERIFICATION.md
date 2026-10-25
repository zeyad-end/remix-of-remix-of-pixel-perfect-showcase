# Account creation and verification

`/register` is the normal Gym Account / Client signup page. Development signup simulates delivery locally and accepts a nonempty code without creating a provider account. Development quick login uses a fresh random sessionStorage identity, clears provider authentication and query caches, and opens a separate in-memory workspace. It never mounts protected account pages or grants admin access. Production `/` performs provider password login by email or international phone and checks persisted account type. Signup never grants gym approval.

## Temporary verifier boundary

Mock login and signup are gated by Vite's build-time `import.meta.env.DEV`; production builds replace this with false. A hostname, browser flag, query parameter or request body cannot enable them. Both server signup handlers reject requests in every environment until real provider adapters are installed; neither loads privileged credentials nor creates arbitrary-code accounts. Thus direct RPC calls cannot use preview codes to create real accounts. Production signup fails closed with provider-setup guidance; password login for existing accounts still works.

The signup screen now uses ten-minute browser-local challenges in development, bound to the selected contact. It does not call the legacy server challenge/account-creation functions. No account, contact, password or challenge is persisted to Cloud by this preview flow. Use fictional contacts only. Preview sessions are not real accounts.

## Replacing the adapter

Replace the temporary send and verify calls with server-only provider adapters. Store the provider challenge/reference with the same exact normalized contact, enforce expiry, retry/rate limits and single consumption. Confirm the provider result before calling account creation. Never enable the temporary adapter in production or make its enable flag client-controlled. Provider credentials belong in Cloud secrets, not frontend code. Email confirmation settings are not globally weakened; only the accounts explicitly verified through this flow are confirmed at creation.

Production setup requires a transactional email provider with a verified sender/domain for email codes and an SMS verification provider with approved sender/number for phone codes (for example Twilio Verify). Configure their private credentials as Cloud secrets, replace both server send and verify adapters, and verify each supplied contact before confirming it. Enable provider phone/password authentication if phone login is offered. Until installed, production signup intentionally remains unavailable; existing password login stays active.

For both supplied email and phone, verify each contact separately before production confirmation; development never confirms contacts. Native phone/password login must also be enabled by the account provider. Phone-only recovery intentionally fails closed until a real recovery provider is configured; existing email recovery uses the public reset-password page.