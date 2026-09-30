# Security model

## Implemented

- Security headers and restrictive CSP; HTTPS HSTS in production.
- Server-side Zod validation with bounded JSON bodies.
- Strong-password enrollment UI and MFA/passkey expectation.
- Non-root, read-only container with all Linux capabilities dropped.
- PostgreSQL application schema stores identity-provider IDs, not passwords.
- Append-only audit event schema for moderator/admin actions.
- Dependency audit in CI and Dependabot patch updates.
- WAF staging script uses log-only rate limits first.

## Activation requirements

Authentication is delegated to Clerk so Pawprint never stores password hashes, TOTP secrets, or recovery codes. Provision Clerk, require MFA for moderator/admin roles in the Clerk dashboard, add the environment variables from `.env.example`, then integrate the Clerk webhook to synchronize `users`.

WAF rules require an authenticated and linked Vercel project. Run `scripts/stage-vercel-waf.ps1`, inspect with `vercel firewall diff`, monitor log-only rules, and publish only after false-positive review.

## Policy

- Admin and moderation require MFA.
- Prefer passkeys or authenticator apps; SMS is recovery-only where supported.
- Public animal coordinates are spatially blurred; exact coordinates are restricted.
- Never log credentials, tokens, exact private locations, or raw recovery codes.
- Rotate secrets, revoke compromised sessions, and retain auditable reversible moderation.
