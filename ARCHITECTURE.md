# Architecture and SOLID boundaries

- **Domain (`src/domain`)** owns animal types and rules; it has no React, database, or provider dependency.
- **Application/UI (`src/app`)** renders journeys and depends on domain contracts, not storage details.
- **Validation (`src/lib/validation`)** is the single boundary for untrusted request and form input.
- **Infrastructure (`src/db`)** owns PostgreSQL/Drizzle setup behind `getDatabase()`.
- **Identity provider** owns passwords, passkeys, MFA factors, recovery codes, sessions, and brute-force protection.

This applies SOLID pragmatically:

- Single responsibility: validation, persistence, identity, domain data, and presentation are separate.
- Open/closed: a new database or identity provider implements the boundary without changing pet-domain rules.
- Liskov substitution: provider adapters must preserve the same authenticated-user contract.
- Interface segregation: UI consumers receive small domain types rather than database clients or session objects.
- Dependency inversion: application logic depends on contracts; Neon, Drizzle, and Clerk remain infrastructure details.

The original single-page prototype is intentionally being decomposed incrementally to preserve its working interactions. The next extraction targets are map, capture, walking, journal, and admin feature modules.
