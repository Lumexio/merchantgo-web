# MerchantGo Web Agent Guide

## Purpose and structure

This React 19/Vite browser client serves MerchantGo administrators and
managers. `src/App.jsx` currently contains most UI flow, `src/appwrite.js`
owns browser Appwrite sessions, and `src/index.css` owns global styling.

## Commands

```bash
npm ci
npm run dev
npm run lint
npm run build
```

## Rules

- Treat browser role and tenant checks as UX; backend authorization is final.
- Keep Appwrite public configuration separate from server-only API keys.
- Preserve responsive admin workflows and explicit loading/error states.
- Align order, cashout, user, menu, and branch payload changes with the backend
  and relevant desktop/mobile clients.
- Do not add inventory ownership; integrate with StockMachine APIs.

## Maintenance cascade

Route or workflow changes require navigation, responsive states, auth gates,
API calls, backend contracts, tests, and documentation. Environment or domain
changes also require Vite configuration, deployment workflow, VPS gateway, and
public health checks.
