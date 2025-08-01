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

      // Path already has locale, create new request without locale for subrouter
      const modifiedRequest = new NextRequest(
        new URL(pathWithoutLocale, request.url),
        request,
      );
      // Process with subrouter
      const subrouterResponse = await subrouterMiddleware(modifiedRequest);

      // If subrouter rewrote, combine locale with subrouter path
      if (subrouterResponse.headers.get("x-middleware-rewrite")) {
        const rewriteUrl = new URL(
          subrouterResponse.headers.get("x-middleware-rewrite")!,
        );
        // Extract subrouter path and combine with locale
        // Example: /fuga/some/path -> /ja/fuga/some/path
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
    } else {
      if (debug) {
        console.log(
          "[createIntlSubrouterMiddleware] No valid locale, delegating to next-intl",
        );
      }

      // Let next-intl handle locale detection first
      const intlResponse = await intlMiddleware(request);

      // If intl redirected, return that response (e.g. /en/sign-in -> /ja/sign-in)
      if (intlResponse && intlResponse.headers.get("location")) {
        if (debug) {
          console.log(
            "[createIntlSubrouterMiddleware] next-intl redirected to:",
            intlResponse.headers.get("location"),
          );
        }

        return intlResponse;
      }

      // If next-intl performed a rewrite (locale detection)
      if (
        intlResponse instanceof NextResponse &&
        intlResponse.headers.get("x-middleware-rewrite")
      ) {
        const rewriteUrl = new URL(
          intlResponse.headers.get("x-middleware-rewrite")!,
        );
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

          // Create request without locale for subrouter
          const modifiedRequest = new NextRequest(
            new URL(cleanPath, request.url),
            request,
          );
          // Process with subrouter
          const subrouterResponse = await subrouterMiddleware(modifiedRequest);

          // If subrouter rewrote, combine locale with subrouter path
          if (subrouterResponse.headers.get("x-middleware-rewrite")) {
            const finalRewriteUrl = new URL(
              subrouterResponse.headers.get("x-middleware-rewrite")!,
            );
            // Extract subrouter path and combine with detected locale
            const subrouterPath = finalRewriteUrl.pathname;

            finalRewriteUrl.pathname = `/${detectedLocale}${subrouterPath}`;

            if (debug) {
              console.log(
                "[createIntlSubrouterMiddleware] Final rewrite after intl detection:",
                finalRewriteUrl.pathname,
              );
            }

            const response = NextResponse.rewrite(finalRewriteUrl);

            response.headers.set("x-locale", detectedLocale);

            return response;
          }

          // No subrouter rewrite needed, return intl response
          return intlResponse;
        }
      }

      // No intl rewrite, continue with subrouter
      if (debug) {
        console.log(
          "[createIntlSubrouterMiddleware] No intl rewrite, continuing with subrouter",
        );
      }

      return subrouterMiddleware(request);
    }
  };
}
