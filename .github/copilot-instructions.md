# Copilot instructions

- Use the existing React 19/Vite and CSS patterns; avoid speculative abstractions.
- Keep Appwrite browser sessions in `src/appwrite.js`; never place server keys in
  the client bundle.
- Backend authorization is authoritative for roles, tenants, and branches.
- Keep admin, POS reporting, and cashout contracts aligned with the backend and
  other MerchantGo clients.
- Run `npm run lint` and `npm run build`.

## Maintenance matrix

| When changing | Also update or verify |
| --- | --- |
| Backend route or payload | Appwrite/API caller, loading/error UI, backend contract, affected clients, and tests |
| Auth, role, tenant, or branch flow | `src/appwrite.js`, `src/App.jsx`, session/logout behavior, backend authorization, and mobile/desktop parity |
| Menu, order, payment, or cashout UI | Validation, totals/currency, API contract, permissions, reporting, and mobile/desktop workflows |
| Route or navigation | App shell links, auth redirects, browser history, responsive layout, metadata, and deployment fallback |
| Styling or responsive behavior | `src/index.css`, component states, keyboard/accessibility behavior, mobile widths, and screenshots |
| Environment or domain | Vite variables, Appwrite public IDs/endpoints, deploy workflow, VPS gateway, and public checks |
| Dependency or Node version | Manifest, lockfile, Copilot setup, deployment workflow, lint, and build |
