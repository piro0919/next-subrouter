# Changelog

## 2.0.0 - 2026-10-01

- **BREAKING:** `SubdomainLink` and `useSubdomain` moved to a new `next-subrouter/client` entry, which carries the `"use client"` directive. The main `next-subrouter` entry no longer exports them, so it is safe to import from `proxy.ts`, `middleware.ts` and server components.
- **BREAKING:** `createSubrouterMiddleware` only treats the first path segment as a locale when it is listed in the new `locales` option. Before, any 2–3 lowercase letter segment counted, so `admin.example.com/faq` was rewritten to `/faq/admin`. `createIntlSubrouterMiddleware` had the same bug after stripping the locale (`/ja/faq` → `/ja/faq/admin`); it is fixed too.
- **BREAKING:** The server reads the subdomain as everything left of the root domain, the same way the client did, instead of only the first label. `admin.app.example.com` now gives `admin.app` unless `rootDomain: "app.example.com"` is set.
- **BREAKING:** Peer range of `next` is now `>=13.5.11 <17`, and `react` `^18.0.0 || ^19.0.0` is a new peer.
- Added `rootDomain` option (string or array; defaults to `NEXT_PUBLIC_BASE_DOMAIN`) to both middleware factories, `useSubdomain` and `SubdomainLink`, so hosts like `example.co.uk` work. Hosts outside it fall back to auto-detection.
- Added `onUnknownSubdomain: "default" | "notFound"`. The default `"default"` keeps the old fallback to the default route; `"notFound"` answers 404.
- Added `getSubdomain(host, rootDomain?)`, the shared function the server and client now both use.
- Added `createSubrouterProxy` and `createIntlSubrouterProxy` aliases for Next.js 16 `proxy.ts`, and documented `export default` / `export function proxy` usage.
- `SubdomainLink` no longer swallows modified clicks (Cmd/Ctrl/Shift/Alt), non-left buttons, `target` other than `_self`, `download`, or clicks whose `onClick` called `preventDefault()`. It now accepts any `<a>` prop.
- `useSubdomain` and `SubdomainLink` read the host through `useSyncExternalStore` instead of an effect.
- Deprecated `defaultLocale` in `createIntlSubrouterMiddleware`. It was never used; next-intl's `routing.defaultLocale` decides. It will be removed in the next major.
- ESM output imports `next/server.js`, so the package also loads in plain Node ESM.
- `engines.node` is now `>=18`.
