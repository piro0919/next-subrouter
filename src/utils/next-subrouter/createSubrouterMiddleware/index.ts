/* eslint-disable write-good-comments/write-good-comments */
/* eslint-disable no-console */
/**
 * Next.js Subdomain Router
 *
 * Routes requests from subdomains to paths within your Next.js application.
 * Works as `middleware.ts` (Next.js 13–15) and as `proxy.ts` (Next.js 16+).
 *
 * @example
 * // proxy.ts (Next.js 16+) or middleware.ts (Next.js 13–15)
 * export default createSubrouterMiddleware([
 *   { path: "/admin", subdomain: "admin" },
 *   { path: "/app" }, // default route (no subdomain)
 * ]);
 */
import { type NextRequest, NextResponse } from "next/server.js";
import getSubdomain, {
  resolveRootDomain,
  type RootDomain,
} from "../getSubdomain";

/**
 * Configuration for a single route
 */
export type SubRoute = {
  /** The path to rewrite to (e.g., '/dashboard') */
  path: string;
  /** The subdomain that triggers this route (e.g., 'admin'). If undefined, this becomes the default route */
  subdomain?: string;
};

export type SubRoutes = SubRoute[];

/**
 * What to do with a subdomain that matches no route.
 * - "default": serve the default route, as if it were the root domain
 * - "notFound": respond with 404
 */
export type UnknownSubdomainBehavior = "default" | "notFound";

/**
 * Options for createSubrouterMiddleware
 */
export type CreateSubrouterMiddlewareOptions = {
  /** Enable debug logging (recommended for development) */
  debug?: boolean;
  /**
   * Locales that may prefix the path (e.g. ["en", "ja"]). Only these are
   * kept in front of the route path: "/ja/users" on admin becomes
   * "/ja/admin/users". Without this option no segment is treated as a locale.
   */
  locales?: readonly string[];
  /**
   * What to do with a subdomain that matches no route. Defaults to "default".
   */
  onUnknownSubdomain?: UnknownSubdomainBehavior;
  /**
   * The root domain(s) subdomains hang off, e.g. "example.co.uk".
   * Defaults to the NEXT_PUBLIC_BASE_DOMAIN environment variable, then to
   * auto-detection (last two labels, or "localhost").
   */
  rootDomain?: RootDomain;
};

type RouteResolution =
  | { isDefaultRoute: boolean; kind: "route"; route: SubRoute }
  | { kind: "none" }
  | { kind: "notFound" };

/**
 * Validate subRoutes configuration for duplicates
 * Throws error if duplicate paths or subdomains are found
 */
function validateSubRoutes(subRoutes: SubRoutes): void {
  const seenPaths = new Set<string>();
  const seenSubdomains = new Set<string | undefined>();

  for (const route of subRoutes) {
    if (seenPaths.has(route.path)) {
      throw new Error(`Duplicate path found: ${route.path}`);
    }

    seenPaths.add(route.path);

    const subdomainKey = route.subdomain ?? undefined;

    if (seenSubdomains.has(subdomainKey)) {
      throw new Error(
        `Duplicate subdomain found: ${subdomainKey ?? "default"}`,
      );
    }

    seenSubdomains.add(subdomainKey);
  }
}

/**
 * Split a leading locale segment off the path, but only for configured locales
 */
function splitLocale(
  pathname: string,
  locales: readonly string[] | undefined,
): { locale: null | string; rest: string } {
  if (!locales || locales.length === 0) {
    return { locale: null, rest: pathname };
  }

  const [, first = ""] = pathname.split("/");

  if (!locales.includes(first)) {
    return { locale: null, rest: pathname };
  }

  return { locale: first, rest: pathname.slice(first.length + 1) };
}

/**
 * Create Next.js middleware (or proxy) for subdomain-based routing
 *
 * @param subRoutes - Array of route configurations
 * @param options - Optional configuration
 * @returns A function to export from `proxy.ts` or `middleware.ts`
 */
export default function createSubrouterMiddleware(
  subRoutes: SubRoutes,
  options?: CreateSubrouterMiddlewareOptions,
): (request: NextRequest) => Promise<NextResponse> {
  validateSubRoutes(subRoutes);

  const routesBySubdomain = new Map<string, SubRoute>();
  const defaultRoute = subRoutes.find((r) => r.subdomain == null) ?? null;
  const debug = options?.debug ?? false;
  const onUnknownSubdomain = options?.onUnknownSubdomain ?? "default";
  const rootDomain = resolveRootDomain(options?.rootDomain);

  for (const route of subRoutes) {
    if (route.subdomain != null) {
      routesBySubdomain.set(route.subdomain.toLowerCase(), route);
    }
  }

  function resolveRoute(subdomain: null | string): RouteResolution {
    if (subdomain !== null) {
      const route = routesBySubdomain.get(subdomain);

      if (route) {
        return { isDefaultRoute: false, kind: "route", route };
      }

      if (onUnknownSubdomain === "notFound") {
        return { kind: "notFound" };
      }
    }

    return defaultRoute
      ? { isDefaultRoute: true, kind: "route", route: defaultRoute }
      : { kind: "none" };
  }

  return async function middleware(
    request: NextRequest,
  ): Promise<NextResponse> {
    const { pathname } = request.nextUrl;
    const host = request.headers.get("host") ?? request.nextUrl.host;
    const subdomain = getSubdomain(host, rootDomain);
    const resolution = resolveRoute(subdomain);

    if (debug) {
      console.log("[next-subrouter]", {
        host,
        pathname,
        resolution,
        subdomain,
      });
    }

    if (resolution.kind === "notFound") {
      return new NextResponse(null, { status: 404 });
    }

    if (resolution.kind === "none") {
      return NextResponse.next();
    }

    const { isDefaultRoute, route } = resolution;
    const { locale, rest } = splitLocale(pathname, options?.locales);

    // Block example.com/app/page when /app is the default route
    if (isDefaultRoute && rest.startsWith(route.path + "/")) {
      if (debug) console.log("[next-subrouter] Direct access blocked - 404");

      return new NextResponse(null, { status: 404 });
    }

    // Already under the route path; prevents rewrite loops
    if (rest.startsWith(route.path + "/") && rest !== route.path) {
      if (debug) console.log("[next-subrouter] Already rewritten - next()");

      return NextResponse.next();
    }

    const url = request.nextUrl.clone();

    url.pathname = `${locale === null ? "" : `/${locale}`}${route.path}${rest}`;

    if (debug) {
      console.log("[next-subrouter] Rewriting:", pathname, "->", url.pathname);
    }

    return NextResponse.rewrite(url);
  };
}
