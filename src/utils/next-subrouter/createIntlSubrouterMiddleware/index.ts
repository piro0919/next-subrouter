/* eslint-disable no-console */
import { NextRequest, NextResponse } from "next/server";
import createSubrouterMiddleware, {
  type SubRoutes,
} from "../createSubrouterMiddleware";

/**
 * Intl middleware function type
 */
export type IntlMiddleware = (
  request: NextRequest,
) => NextResponse | Promise<NextResponse>;

/**
 * Options for createIntlSubrouterMiddleware
 */
export type CreateIntlSubrouterMiddlewareOptions = {
  /** Enable debug logging (recommended for development) */
  debug?: boolean;
  /** Default locale to use as fallback */
  defaultLocale?: string;
  /** Array of supported locales */
  locales: string[];
};

/**
 * Extracts locale from URL path segments
 */
function getLocaleFromPath(
  pathname: string,
  locales: string[],
): {
  isValid: boolean;
  locale: null | string;
  pathWithoutLocale: string;
} {
  const pathSegments = pathname.split("/").filter(Boolean);
  const locale = pathSegments[0] || null;
  const isValid = locale ? locales.includes(locale) : false;
  const remainingSegments = isValid ? pathSegments.slice(1) : pathSegments;
  const pathWithoutLocale =
    remainingSegments.length > 0 ? "/" + remainingSegments.join("/") : "/";

  return { isValid, locale, pathWithoutLocale };
}

type SubrouterMiddleware = ReturnType<typeof createSubrouterMiddleware>;

/**
 * Process request through subrouter and combine with locale if rewritten
 */
async function processWithSubrouterAndLocale(
  request: NextRequest,
  pathWithoutLocale: string,
  locale: string,
  subrouterMiddleware: SubrouterMiddleware,
  debug: boolean,
): Promise<NextResponse> {
  const modifiedRequest = new NextRequest(
    new URL(pathWithoutLocale, request.url),
    request,
  );
  const subrouterResponse = await subrouterMiddleware(modifiedRequest);
  const rewriteHeader = subrouterResponse.headers.get("x-middleware-rewrite");

  if (rewriteHeader) {
    const rewriteUrl = new URL(rewriteHeader);
    const subrouterPath = rewriteUrl.pathname;

    rewriteUrl.pathname = `/${locale}${subrouterPath}`;

    if (debug) {
      console.log(
        "[createIntlSubrouterMiddleware] Final rewrite with locale:",
        rewriteUrl.pathname,
      );
    }

    const response = NextResponse.rewrite(rewriteUrl);

    response.headers.set("x-locale", locale);

    return response;
  }

  return subrouterResponse;
}

/**
 * Create Next.js middleware that combines intl middleware with subdomain routing
 *
 * @param subRoutes - Array of route configurations
 * @param intlMiddleware - Intl middleware function (e.g., from next-intl)
 * @param options - Configuration including debug settings and locales
 * @returns Next.js middleware function
 *
 * @example
 * import createIntlSubrouterMiddleware from './utils/next-subrouter/createIntlSubrouterMiddleware';
 * import createIntlMiddleware from 'next-intl/middleware';
 * import { routing } from './i18n/routing';
 *
 * const intlMiddleware = createIntlMiddleware(routing);
 *
 * export const middleware = createIntlSubrouterMiddleware(
 *   subRoutes,
 *   intlMiddleware,
 *   {
 *     debug: process.env.NODE_ENV === 'development',
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en' // optional
 *   }
 * );
 */
export default function createIntlSubrouterMiddleware(
  subRoutes: SubRoutes,
  intlMiddleware: IntlMiddleware,
  options: CreateIntlSubrouterMiddlewareOptions,
) {
  const subrouterMiddleware = createSubrouterMiddleware(subRoutes, {
    debug: options?.debug,
  });
  const debug = options?.debug ?? false;

  /**
   * The actual middleware function that handles both intl and subrouter processing
   */
  return async function middleware(
    request: NextRequest,
  ): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    if (debug) {
      console.log("[createIntlSubrouterMiddleware] Processing:", pathname);
    }

    // Check if path already contains locale
    const {
      isValid: hasValidLocale,
      locale,
      pathWithoutLocale,
    } = getLocaleFromPath(pathname, options.locales);

    if (hasValidLocale && locale) {
      if (debug) {
        console.log(
          "[createIntlSubrouterMiddleware] Path has valid locale:",
          locale,
          "pathWithoutLocale:",
          pathWithoutLocale,
        );
      }

      return processWithSubrouterAndLocale(
        request,
        pathWithoutLocale,
        locale,
        subrouterMiddleware,
        debug,
      );
    }

    if (debug) {
      console.log(
        "[createIntlSubrouterMiddleware] No valid locale, delegating to next-intl",
      );
    }

    // Let next-intl handle locale detection first
    const intlResponse = await intlMiddleware(request);

    // If intl redirected, return that response (e.g. /en/sign-in -> /ja/sign-in)
    if (intlResponse?.headers.get("location")) {
      if (debug) {
        console.log(
          "[createIntlSubrouterMiddleware] next-intl redirected to:",
          intlResponse.headers.get("location"),
        );
      }

      return intlResponse;
    }

    // If next-intl performed a rewrite (locale detection)
    const intlRewriteHeader = intlResponse.headers.get("x-middleware-rewrite");

    if (intlRewriteHeader) {
      const rewriteUrl = new URL(intlRewriteHeader);
      const {
        isValid,
        locale: detectedLocale,
        pathWithoutLocale: cleanPath,
      } = getLocaleFromPath(rewriteUrl.pathname, options.locales);

      if (isValid && detectedLocale) {
        if (debug) {
          console.log(
            "[createIntlSubrouterMiddleware] next-intl detected locale:",
            detectedLocale,
            "cleanPath:",
            cleanPath,
          );
        }

        const response = await processWithSubrouterAndLocale(
          request,
          cleanPath,
          detectedLocale,
          subrouterMiddleware,
          debug,
        );

        // If subrouter didn't rewrite, return original intl response
        if (!response.headers.get("x-middleware-rewrite")) {
          return intlResponse;
        }

        return response;
      }
    }

    // No intl rewrite, continue with subrouter
    if (debug) {
      console.log(
        "[createIntlSubrouterMiddleware] No intl rewrite, continuing with subrouter",
      );
    }

    return subrouterMiddleware(request);
  };
}
