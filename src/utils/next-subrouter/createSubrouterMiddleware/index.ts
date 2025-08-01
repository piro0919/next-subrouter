/* eslint-disable write-good-comments/write-good-comments */
/* eslint-disable no-console */
/**
 * Next.js Subdomain Router Middleware
 *
 * Provides subdomain-based routing with optional internationalization support.
 * Routes requests from subdomains to specific paths within your Next.js application.
 *
 * @example
 * // Basic usage
 * const middleware = createMiddleware([
 *   { path: '/dashboard', subdomain: 'admin' },
 *   { path: '/blog' } // default route (no subdomain)
 * ]);
 *
 * @example
 * // With debug logging
 * const middleware = createMiddleware(subRoutes, {
 *   debug: true
 * });
 */
import { type NextRequest, NextResponse } from "next/server";

/**
 * Configuration for a single route
 */
type SubRoute = {
  /** The path to rewrite to (e.g., '/dashboard') */
  path: string;
  /** The subdomain that triggers this route (e.g., 'admin'). If undefined, this becomes the default route */
  subdomain?: string;
};

export type SubRoutes = SubRoute[];

/**
 * Options for createMiddleware
 */
export type CreateSubrouterMiddlewareOptions = {
  /** Enable debug logging (recommended for development) */
  debug?: boolean;
};

type ParsedHostname = {
  cleanHostname: string;
  subdomain: string;
};

type RouteResolution = {
  isDefaultRoute: boolean;
  route: null | SubRoute;
};

type RouteResolver = {
  defaultRoute: null | SubRoute;
  hostnameCache: Map<string, ParsedHostname>;
  subdomainToRouteMap: Map<string | undefined, SubRoute>;
};

/**
 * Parse hostname from request with caching for performance
 * Extracts subdomain from host header (e.g., 'admin.example.com' -> 'admin')
 */
function parseHostname(
  request: NextRequest,
  cache: Map<string, ParsedHostname>,
): ParsedHostname {
  const hostname = request.headers.get("host") ?? "";

  if (cache.has(hostname)) {
    return cache.get(hostname)!;
  }

  const cleanHostname = hostname.split(":")[0];
  const [subdomain] = cleanHostname.split(".");
  const result = { cleanHostname, subdomain };

  cache.set(hostname, result);

  return result;
}

/**
 * Check if subdomain should be treated as base domain
 * Used to determine if default route should be applied
 */
function isBaseDomain(
  subdomain: string,
  configuredSubdomains: Set<string>,
): boolean {
  // localhost and IP addresses are always base domains
  if (subdomain === "localhost" || /^[0-9.]+$/.test(subdomain)) {
    return true;
  }

  // If subdomain is not in configuration, treat it as part of base domain
  // This handles cases like next-subrouter.kkweb.io where "next-subrouter" is the base
  return !configuredSubdomains.has(subdomain);
}

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
 * Create route resolver with validation and caching
 * Sets up maps for O(1) route lookups and hostname parsing cache
 */
function createRouteResolver(subRoutes: SubRoutes): RouteResolver {
  validateSubRoutes(subRoutes);

  const subdomainToRouteMap = new Map<string | undefined, SubRoute>();
  const defaultRoute = subRoutes.find((r) => r.subdomain == null) ?? null;
  const hostnameCache = new Map<string, ParsedHostname>();

  for (const route of subRoutes) {
    subdomainToRouteMap.set(route.subdomain, route);
  }

  return { defaultRoute, hostnameCache, subdomainToRouteMap };
}

/**
 * Resolve route based on subdomain
 * Returns the matching route and whether it's the default route
 */
function resolveRoute(
  subdomain: string,
  resolver: RouteResolver,
): RouteResolution {
  const route = resolver.subdomainToRouteMap.get(subdomain);

  if (route) {
    return { isDefaultRoute: false, route };
  }

  // Get configured subdomains (excluding undefined/default route)
  const configuredSubdomains = new Set(
    Array.from(resolver.subdomainToRouteMap.keys()).filter(
      (s) => s !== undefined,
    ),
  );

  // Apply default route only for base domain
  if (resolver.defaultRoute && isBaseDomain(subdomain, configuredSubdomains)) {
    return { isDefaultRoute: true, route: resolver.defaultRoute };
  }

  return { isDefaultRoute: false, route: null };
}

/**
 * Determine if direct access to a route path should be blocked
 * Prevents accessing /dashboard/page directly when it should be admin.example.com/page
 */
function shouldBlockDirectAccess(
  pathname: string,
  route: SubRoute,
  isDefaultRoute: boolean,
): boolean {
  return isDefaultRoute && pathname.startsWith(route.path + "/");
}

/**
 * Check if the pathname has already been rewritten by the middleware
 * Prevents infinite rewrite loops
 */
function isAlreadyRewritten(pathname: string, route: SubRoute): boolean {
  return pathname.startsWith(route.path + "/") && pathname !== route.path;
}

/**
 * Create Next.js middleware for subdomain-based routing
 *
 * @param subRoutes - Array of route configurations
 * @param options - Optional configuration including debug settings
 * @returns Next.js middleware function
 *
 * @example
 * // Basic subdomain routing
 * const middleware = createMiddleware([
 *   { path: '/admin', subdomain: 'admin' },
 *   { path: '/blog', subdomain: 'blog' },
 *   { path: '/app' } // default route
 * ]);
 *
 * @example
 * // With debug logging
 * const middleware = createSubrouterMiddleware(subRoutes, {
 *   debug: process.env.NODE_ENV === 'development'
 * });
 */
export default function createSubrouterMiddleware(
  subRoutes: SubRoutes,
  options?: CreateSubrouterMiddlewareOptions,
) {
  const routeResolver = createRouteResolver(subRoutes);
  const debug = options?.debug ?? false;

  /**
   * The actual middleware function that handles requests
   * Processes subdomain routing and optional internationalization
   */
  return async function middleware(
    request: NextRequest,
  ): Promise<NextResponse> {
    const { pathname } = request.nextUrl;
    const { subdomain } = parseHostname(request, routeResolver.hostnameCache);
    // Standard subrouter processing
    const { isDefaultRoute, route } = resolveRoute(subdomain, routeResolver);

    if (debug) {
      console.log("[createMiddleware]", {
        isDefaultRoute,
        pathname,
        routePath: route?.path,
        routeSubdomain: route?.subdomain,
        subdomain,
      });
    }

    if (!route) {
      if (debug)
        console.log(
          "[createSubrouterMiddleware] No route found - passing through",
        );

      return NextResponse.next();
    }

    if (shouldBlockDirectAccess(pathname, route, isDefaultRoute)) {
      if (debug)
        console.log("[createSubrouterMiddleware] Direct access blocked");

      return NextResponse.next();
    }

    if (isAlreadyRewritten(pathname, route)) {
      if (debug)
        console.log(
          "[createSubrouterMiddleware] Already rewritten - passing through",
        );

      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    // Handle internationalized paths: if pathname starts with /{locale},
    // preserve locale and append route path
    // eslint-disable-next-line security/detect-unsafe-regex
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);

    if (localeMatch && route.path) {
      const [, locale, remainingPath = ""] = localeMatch;

      url.pathname = `/${locale}${route.path}${remainingPath}`;
    } else {
      url.pathname = `${route.path}${pathname}`;
    }

    if (debug)
      console.log(
        "[createSubrouterMiddleware] Rewriting:",
        pathname,
        "->",
        url.pathname,
      );

    return NextResponse.rewrite(url);
  };
}
