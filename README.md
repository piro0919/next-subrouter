# next-subrouter

Subdomain-based routing for Next.js `proxy.ts` (Next.js 16) and `middleware.ts` (Next.js 13–15).

Route `admin.example.com` to `/admin`, `blog.example.com` to `/blog` — without splitting your app into multiple projects.

## Why?

Next.js doesn't natively support subdomain routing. You could use Vercel's `rewrites` config, but it gets messy with i18n or dynamic logic. This package gives you a clean, declarative API that works in proxy/middleware.

## Install

```bash
npm install next-subrouter
```

## Quick Start

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The function this package returns works in either file.

```typescript
// proxy.ts (Next.js 16+)
import { createSubrouterProxy } from "next-subrouter";

export default createSubrouterProxy([
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
  { path: "/app" }, // default (no subdomain)
]);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

`export function proxy` works too, if you prefer a named export:

```typescript
const subrouter = createSubrouterProxy(routes);

export function proxy(request: NextRequest) {
  return subrouter(request);
}
```

On Next.js 13–15, use `middleware.ts` and a named `middleware` export:

```typescript
// middleware.ts (Next.js 13–15)
import { createSubrouterMiddleware } from "next-subrouter";

export const middleware = createSubrouterMiddleware([
  { path: "/admin", subdomain: "admin" },
  { path: "/app" },
]);
```

`createSubrouterProxy` and `createSubrouterMiddleware` are the same function under two names; so are `createIntlSubrouterProxy` and `createIntlSubrouterMiddleware`.

## How It Works

| Request                   | Routed to        | Notes                                        |
| ------------------------- | ---------------- | -------------------------------------------- |
| `admin.example.com/users` | `/admin/users`   | Subdomain match                              |
| `blog.example.com/posts`  | `/blog/posts`    | Subdomain match                              |
| `example.com/dashboard`   | `/app/dashboard` | Default route                                |
| `example.com/app/x`       | 404              | Direct access blocked                        |
| `www.example.com/x`       | `/app/x`         | Unknown subdomain (see `onUnknownSubdomain`) |

### Finding the subdomain

The subdomain is everything left of the root domain. The server and the client helpers use the same rules, so they always agree:

1. If `rootDomain` is set (or the `NEXT_PUBLIC_BASE_DOMAIN` environment variable), a host that equals or ends with it is split there: `admin.example.co.uk` with `rootDomain: "example.co.uk"` gives `admin`.
2. Any other host is guessed: `localhost` and IP addresses have no subdomain, `admin.localhost` gives `admin`, and otherwise the last two labels are the root, so `a.b.example.com` gives `a.b`.

The guess is wrong when the root has more than two labels — `example.co.uk`, or a site that itself lives on a subdomain such as `app.example.com`. Set `rootDomain` for those. Hosts outside `rootDomain` (localhost, preview deployments) still fall back to the guess, so one setting covers production and local development.

### Unknown subdomains

A subdomain that matches no route (e.g. `www`, or a typo) gets the default route by default, as if it were the root domain. Set `onUnknownSubdomain: "notFound"` to answer those with 404 instead. Without a default route, unknown subdomains pass through untouched in `"default"` mode.

## API

### `createSubrouterMiddleware(routes, options?)` / `createSubrouterProxy`

```typescript
createSubrouterProxy(
  [
    { path: "/admin", subdomain: "admin" },
    { path: "/app" }, // default
  ],
  {
    rootDomain: "example.co.uk",
    onUnknownSubdomain: "notFound",
    locales: ["en", "ja"],
    debug: process.env.NODE_ENV === "development",
  },
);
```

| Option               | Type                      | Default                               | Description                                                                                                                              |
| -------------------- | ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `rootDomain`         | `string \| string[]`      | `process.env.NEXT_PUBLIC_BASE_DOMAIN` | Domain(s) the subdomains hang off. A port is ignored. See [Finding the subdomain](#finding-the-subdomain).                               |
| `onUnknownSubdomain` | `"default" \| "notFound"` | `"default"`                           | What to do with a subdomain that matches no route.                                                                                       |
| `locales`            | `string[]`                | none                                  | Locales that may prefix the path. `admin.example.com/ja/users` becomes `/ja/admin/users`. Without it, no segment is treated as a locale. |
| `debug`              | `boolean`                 | `false`                               | Log routing decisions.                                                                                                                   |

You don't need `locales` with `createIntlSubrouterMiddleware`; it handles the locale itself.

### `createIntlSubrouterMiddleware(routes, intlMiddleware, options)` / `createIntlSubrouterProxy`

Subdomain routing + [next-intl](https://next-intl.dev/) integration. next-intl is not a dependency of this package; you pass its middleware in.

```typescript
// proxy.ts
import { createIntlSubrouterProxy } from "next-subrouter";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createIntlSubrouterProxy(
  [{ path: "/admin", subdomain: "admin" }, { path: "/app" }],
  createIntlMiddleware(routing),
  { locales: routing.locales },
);
```

| Request                      | Routed to           |
| ---------------------------- | ------------------- |
| `admin.example.com/en/users` | `/en/admin/users`   |
| `example.com/dashboard`      | `/en/app/dashboard` |

Options: `locales` (required) plus `rootDomain`, `onUnknownSubdomain` and `debug` as above. `defaultLocale` is deprecated and ignored — the default locale comes from next-intl's `routing.defaultLocale`.

### `getSubdomain(host, rootDomain?)`

The pure function behind all of the above, usable anywhere (server components, route handlers):

```typescript
import { getSubdomain } from "next-subrouter";
import { headers } from "next/headers";

const subdomain = getSubdomain(
  (await headers()).get("host") ?? "",
  "example.co.uk",
);
```

## Client components: `next-subrouter/client`

The hook and the link live in a separate entry marked `"use client"`, so the main entry stays safe to import from `proxy.ts`/`middleware.ts` and server components.

```tsx
import { SubdomainLink, useSubdomain } from "next-subrouter/client";
```

### `SubdomainLink`

Navigate between subdomains. Regular `<Link>` won't work across subdomains.

```tsx
<SubdomainLink subdomain="admin" href="/users">Go to Admin</SubdomainLink>
<SubdomainLink href="/home">Go to Home</SubdomainLink>  // root domain
```

It renders a plain `<a>` and accepts its props (`className`, `target`, `rel`, `onClick`, ...). A plain left click navigates; clicks with a modifier key (Cmd/Ctrl/Shift/Alt), a non-left button, `target` other than `_self`, `download`, or an `onClick` that calls `preventDefault()` are left to the browser, so "open in new tab" works.

Props of its own: `subdomain`, `href` (default `"/"`), `locale`, and `rootDomain` (defaults to `NEXT_PUBLIC_BASE_DOMAIN`; use the same value as the proxy). The current port is kept.

#### Preserving Locale

Pass the `locale` prop to maintain the current locale when navigating:

```tsx
<SubdomainLink subdomain="admin" href="/users" locale="ja">
  Go to Admin (keeps Japanese)
</SubdomainLink>
// Result: https://admin.example.com/ja/users
```

Without `locale`, the target subdomain uses its default locale.

### `useSubdomain(options?)`

Get the current subdomain in client components. Returns `null` on the root domain and during server rendering.

```tsx
"use client";
import { useSubdomain } from "next-subrouter/client";

function Header() {
  const subdomain = useSubdomain({ rootDomain: "example.co.uk" });
  // "admin" on admin.example.co.uk, null on example.co.uk

  return <nav>{subdomain === "admin" && <AdminMenu />}</nav>;
}
```

`rootDomain` defaults to `NEXT_PUBLIC_BASE_DOMAIN`. Setting that variable once is the simplest way to keep the proxy, the hook and the link in agreement.

## Local Development

Add to `/etc/hosts`:

```text
127.0.0.1 admin.localhost
127.0.0.1 blog.localhost
```

Then visit `http://admin.localhost:3000`.

## i18n Setup

When using `createIntlSubrouterMiddleware`, update your `src/i18n/request.ts` to read the `x-locale` header set by the proxy/middleware:

```typescript
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!routing.locales.includes(locale as any)) {
    const headersList = await headers();
    locale = headersList.get("x-locale") ?? routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

## Requirements

- Next.js 13.5 – 16 (`middleware.ts` on 13–15, `proxy.ts` on 16)
- React 18 or 19 (for `next-subrouter/client`)
- Node.js >= 18

## Upgrading from 1.x

- Import `SubdomainLink` and `useSubdomain` from `next-subrouter/client` instead of `next-subrouter`.
- `createSubrouterMiddleware` no longer guesses that any 2–3 letter first segment is a locale. Pass `locales` if you relied on it, or use `createIntlSubrouterMiddleware`.
- The server now reads the subdomain the way the client always did: everything left of the root domain, not just the first label. If your site lives on a subdomain itself (`admin.app.example.com`), set `rootDomain`.

## License

MIT
