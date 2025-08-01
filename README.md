# next-subrouter

Next.js subdomain-based routing middleware with optional internationalization support.

A simple approach to organizing different feature domains within a single Next.js application.

## Features

- 🌐 **Subdomain-based routing** - Route requests from subdomains to specific paths
- 🌍 **Internationalization support** - Seamless integration with next-intl
- ⚡ **High performance** - Built-in caching for hostname parsing
- 🛡️ **Type-safe** - Full TypeScript support
- 🐛 **Debug mode** - Optional logging for development
- 🔒 **Security** - Prevents direct access to route paths

## Installation

```bash
npm install next-subrouter
```

## Quick Start

### Basic Subdomain Routing

```typescript
// middleware.ts
import { createSubrouterMiddleware } from "next-subrouter";

const subRoutes = [
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
  { path: "/app" }, // default route (no subdomain)
];

export const middleware = createSubrouterMiddleware(subRoutes, {
  debug: process.env.NODE_ENV === "development",
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### With Internationalization (next-intl)

```typescript
// middleware.ts
import { createIntlSubrouterMiddleware } from "next-subrouter";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const subRoutes = [
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
  { path: "/app" },
];

export const middleware = createIntlSubrouterMiddleware(
  subRoutes,
  intlMiddleware,
  {
    debug: process.env.NODE_ENV === "development",
    locales: ["en", "ja"],
    defaultLocale: "en",
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## How It Works

### Subdomain Routing Examples

| URL                       | Routes to        | Description                             |
| ------------------------- | ---------------- | --------------------------------------- |
| `admin.example.com/users` | `/admin/users`   | Admin subdomain routes to `/admin` path |
| `blog.example.com/posts`  | `/blog/posts`    | Blog subdomain routes to `/blog` path   |
| `example.com/dashboard`   | `/app/dashboard` | Default route (no subdomain)            |
| `localhost:3000/test`     | `/app/test`      | Localhost uses default route            |

### With Internationalization

| URL                          | Routes to         | Description                   |
| ---------------------------- | ----------------- | ----------------------------- |
| `admin.example.com/en/users` | `/en/admin/users` | Admin with English locale     |
| `blog.example.com/ja/posts`  | `/ja/blog/posts`  | Blog with Japanese locale     |
| `example.com/users`          | `/en/app/users`   | Default with locale detection |

## API Reference

### `SubdomainLink`

A React component for cross-subdomain navigation.

```typescript
import { SubdomainLink } from "next-subrouter";

<SubdomainLink
  subdomain="admin"
  href="/dashboard"
  className="nav-link"
>
  Admin Dashboard
</SubdomainLink>
```

### `createSubrouterMiddleware(subRoutes, options?)`

Creates a middleware for subdomain-based routing.

#### Parameters

- `subRoutes`: Array of route configurations
  - `path`: The path to rewrite to (e.g., '/dashboard')
  - `subdomain`: The subdomain that triggers this route (optional for default route)
- `options`: Optional configuration
  - `debug`: Enable debug logging (default: false)

#### Example

```typescript
const middleware = createSubrouterMiddleware(
  [
    { path: "/admin", subdomain: "admin" },
    { path: "/blog", subdomain: "blog" },
    { path: "/app" }, // default route
  ],
  {
    debug: true,
  },
);
```

### `createIntlSubrouterMiddleware(subRoutes, intlMiddleware, options)`

Creates a middleware that combines subdomain routing with internationalization.

#### Parameters

- `subRoutes`: Array of route configurations
- `intlMiddleware`: next-intl middleware function
- `options`: Configuration object
  - `debug`: Enable debug logging (default: false)
  - `locales`: Array of supported locales
  - `defaultLocale`: Default locale (optional)

#### Example

```typescript
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "ja"],
  defaultLocale: "en",
});

const middleware = createIntlSubrouterMiddleware(subRoutes, intlMiddleware, {
  debug: process.env.NODE_ENV === "development",
  locales: ["en", "ja"],
  defaultLocale: "en",
});
```

## Configuration

### Environment Variables

```bash
# .env.local or .env
NEXT_PUBLIC_BASE_DOMAIN=your-domain.com  # Optional: Base domain for SubdomainLink
```

### Route Configuration

```typescript
type SubRoute = {
  path: string; // Target path to rewrite to
  subdomain?: string; // Subdomain trigger (omit for default route)
};
```

### Middleware Options

```typescript
type CreateSubrouterMiddlewareOptions = {
  debug?: boolean; // Enable debug logging
};

type CreateIntlSubrouterMiddlewareOptions = {
  debug?: boolean; // Enable debug logging
  defaultLocale?: string; // Default locale fallback
  locales: string[]; // Supported locales
};
```

## Cross-Subdomain Navigation

### SubdomainLink Component

For navigating between different subdomains, use the provided `SubdomainLink` component. Regular Next.js `Link` components only work within the same domain.

```typescript
// Import the component
import { SubdomainLink } from "next-subrouter";

// Navigate to different subdomains
<SubdomainLink subdomain="admin" href="/users">
  Go to Admin
</SubdomainLink>

<SubdomainLink subdomain="blog" href="/posts">
  Go to Blog
</SubdomainLink>

// Navigate to base domain (no subdomain)
<SubdomainLink href="/home">
  Go to Home
</SubdomainLink>
```

#### SubdomainLink Props

```typescript
type SubdomainLinkProps = {
  children: ReactNode;
  className?: string;
  href?: string; // Default: "/"
  subdomain?: string; // Omit for base domain
};
```

#### Base Domain Configuration

The component supports two ways to determine the base domain:

1. **Environment Variable (Recommended)**:

   ```bash
   # .env.local
   NEXT_PUBLIC_BASE_DOMAIN=your-domain.com
   ```

2. **Automatic Detection (Fallback)**:
   - Detects from current hostname
   - Works for localhost and most domain structures

#### Examples with Base Domain

With `NEXT_PUBLIC_BASE_DOMAIN=next-subrouter.kkweb.io`:

- From `https://next-subrouter.kkweb.io/hoge` → `https://piyo.next-subrouter.kkweb.io/hoge`
- From `https://fuga.next-subrouter.kkweb.io/fuga` → `https://piyo.next-subrouter.kkweb.io/fuga`
- From any subdomain → `https://next-subrouter.kkweb.io/current-path` (when no subdomain specified)

The component automatically handles:

- **Development**: `admin.localhost:3001` → `localhost:3001`
- **Production**: `admin.your-domain.com` → `your-domain.com`

## Internationalization Setup

When using `createIntlSubrouterMiddleware`, you need to configure the request handler to work with subdomain routing.

### Request Configuration

```typescript
// src/i18n/request.ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Try to get locale from requestLocale first
  let locale = await requestLocale;

  // If requestLocale is not available, try to get from custom header set by middleware
  if (!hasLocale(routing.locales, locale)) {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const headerLocale = headersList.get("x-locale");

    if (hasLocale(routing.locales, headerLocale)) {
      locale = headerLocale;
    }
  }

  // Fallback to default locale if still not found
  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

This configuration:

1. First tries to use the standard `requestLocale`
2. Falls back to the `x-locale` header set by the middleware
3. Uses the default locale as a final fallback

This ensures proper locale detection when routes are rewritten by the subdomain middleware.

## Advanced Usage

### Local Development Setup

For local development with subdomains, update your `/etc/hosts` file:

```bash
# /etc/hosts
127.0.0.1 localhost
127.0.0.1 admin.localhost
127.0.0.1 blog.localhost
```

Then access your application at:

- `http://localhost:3000` (default route)
- `http://admin.localhost:3000` (admin subdomain)
- `http://blog.localhost:3000` (blog subdomain)

### Custom Domain Setup

For production deployment with custom domains:

```typescript
// Works with any domain structure
const subRoutes = [
  { path: "/admin", subdomain: "admin" }, // admin.yourdomain.com
  { path: "/blog", subdomain: "blog" }, // blog.yourdomain.com
  { path: "/shop", subdomain: "shop" }, // shop.yourdomain.com
  { path: "/app" }, // yourdomain.com (default)
];
```

### Debug Mode

Enable debug logging to see routing decisions:

```typescript
const middleware = createSubrouterMiddleware(subRoutes, {
  debug: process.env.NODE_ENV === "development",
});

// Console output:
// [createMiddleware] { isDefaultRoute: false, pathname: '/users', routePath: '/admin', routeSubdomain: 'admin', subdomain: 'admin' }
// [createSubrouterMiddleware] Rewriting: /users -> /admin/users
```

### Security Features

The middleware automatically prevents direct access to route paths:

- ✅ `admin.example.com/users` → `/admin/users` (allowed)
- ❌ `example.com/admin/users` → blocked (prevents direct access)

### Error Handling

The middleware validates route configurations and throws errors for:

- Duplicate paths
- Duplicate subdomains
- Invalid configurations

```typescript
// This will throw an error
const invalidRoutes = [
  { path: "/admin", subdomain: "admin" },
  { path: "/admin", subdomain: "dashboard" }, // Duplicate path!
];
```

## Requirements

- Next.js 13.0.0 or higher
- Node.js 18.0.0 or higher

## TypeScript Support

This package is written in TypeScript and includes complete type definitions. All functions and options are fully typed for the best development experience.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

[https://github.com/piro0919/next-subrouter](https://github.com/piro0919/next-subrouter)
