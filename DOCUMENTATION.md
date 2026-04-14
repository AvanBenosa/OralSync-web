# OralSync Documentation

Updated: April 14, 2026

The documentation has now been split into focused files under `docs/`.

## Documents

- [System Manual](docs/system-manual.md)
For clinic users, front desk staff, dentists, branch admins, and platform admins.
- [Development Architecture](docs/development-architecture.md)
For developers working across the frontend repo (`OralSync`) and the sibling backend repo (`../OralSync-API`).
- [API Reference](docs/api-reference.md)
High-level reference for the current API controller groups and route patterns.
- [Deployment Guide](docs/deployment.md)
Local setup, runtime hosts, configuration, and deployment-oriented notes.

## Scope

This documentation set is based on the current codebase:

- Frontend repo: `OralSync`
- Backend repo: `../OralSync-API`

## Existing Related Docs

- [PWA Setup](docs/PWA-SETUP.md)

## Notes

- `docs/system-manual.md` is the user-facing source of truth.
- `docs/development-architecture.md` is the developer-facing source of truth for structure and runtime behavior.
- `docs/api-reference.md` summarizes the route surface without duplicating every implementation detail from the controllers.
- `docs/deployment.md` covers local development, environment configuration, and deployment-oriented notes.
