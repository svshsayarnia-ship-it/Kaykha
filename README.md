# KAYKHA — Phase 4

Runtime source for the public KAYKHA Phase 4 deployment.

## Current architecture

- `index.js` proxies the original game runtime and preserves authenticated API calls.
- `api/guide.js` serves the Arta in-game guidance layer.
- `vercel.json` is ready for the linked Vercel project.

## Rules

- Keep API request headers, request bodies and authorization forwarding intact.
- Game changes must be committed here before production deployment.
- The master game design document is the source of truth for future mechanics.

## Deploy

Import this repository into the existing Vercel project **kaykha-phase4** and deploy the `main` branch.
