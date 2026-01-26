# next-subrouter

Subdomain-based routing middleware for Next.js.

Route `admin.example.com` to `/admin`, `blog.example.com` to `/blog` — without splitting your app into multiple projects.

## Why?

Next.js doesn't natively support subdomain routing. You could use Vercel's `rewrites` config, but it gets messy with i18n or dynamic logic. This package gives you a clean, declarative API that works in middleware.

## Install

```bash
npm install next-subrouter
```

## Quick Start

```typescript
// middleware.ts
import { createSubrouterMiddleware } from "next-subrouter";

export const middleware = createSubrouterMiddleware([
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
  { path: "/app" }, // default (no subdomain)
]);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## How It Works

| Request                    | Routed to        | Notes                 |
| -------------------------- | ---------------- | --------------------- |
| `admin.example.com/users`  | `/admin/users`   | Subdomain match       |
| `blog.example.com/posts`   | `/blog/posts`    | Subdomain match       |
| `example.com/dashboard`    | `/app/dashboard` | Default route         |
| `example.com/admin/users`  | 404              | Direct access blocked |

## API

### `createSubrouterMiddleware(routes, options?)`

Basic subdomain routing.

```typescript
createSubrouterMiddleware(
  [
    { path: "/admin", subdomain: "admin" },
    { path: "/app" }, // default
  ],
  { debug: true }
);
```

### `createIntlSubrouterMiddleware(routes, intlMiddleware, options)`

Subdomain routing + [next-intl](https://next-intl-docs.vercel.app/) integration.

```typescript
import { createIntlSubrouterMiddleware } from "next-subrouter";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const middleware = createIntlSubrouterMiddleware(
  [
    { path: "/admin", subdomain: "admin" },
    { path: "/app" },
  ],
  createIntlMiddleware(routing),
  { locales: ["en", "ja"], defaultLocale: "en" }
);
```

| Request                      | Routed to           |
| ---------------------------- | ------------------- |
| `admin.example.com/en/users` | `/en/admin/users`   |
| `example.com/dashboard`      | `/en/app/dashboard` |

### `SubdomainLink`

Navigate between subdomains. Regular `<Link>` won't work across subdomains.

```tsx
import { SubdomainLink } from "next-subrouter";

<SubdomainLink subdomain="admin" href="/users">Go to Admin</SubdomainLink>
<SubdomainLink href="/home">Go to Home</SubdomainLink>  // base domain
```

#### Preserving Locale

Pass the `locale` prop to maintain the current locale when navigating:

```tsx
<SubdomainLink subdomain="admin" href="/users" locale="ja">
  Go to Admin (keeps Japanese)
</SubdomainLink>
// Result: https://admin.example.com/ja/users
```

Without `locale`, the target subdomain uses its default locale.

Set `NEXT_PUBLIC_BASE_DOMAIN=example.com` in production, or it auto-detects from the current host.

## Local Development

Add to `/etc/hosts`:

```text
127.0.0.1 admin.localhost
127.0.0.1 blog.localhost
```

Then visit `http://admin.localhost:3000`.

## i18n Setup

When using `createIntlSubrouterMiddleware`, update your `src/i18n/request.ts` to read the `x-locale` header set by the middleware:

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

- Next.js >= 13.0.0
- Node.js >= 18.0.0

## License

MIT
