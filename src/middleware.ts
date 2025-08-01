import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  createIntlSubrouterMiddleware,
  type SubRoutes,
} from "./utils/next-subrouter";

const subRoutes: SubRoutes = [
  {
    path: "/hoge",
  },
  {
    path: "/fuga",
    subdomain: "fuga",
  },
  {
    path: "/piyo",
    subdomain: "piyo",
  },
];
const intlMiddleware = createIntlMiddleware(routing);

export const middleware = createIntlSubrouterMiddleware(
  subRoutes,
  intlMiddleware,
  {
    debug: process.env.NODE_ENV === "development",
    defaultLocale: routing.defaultLocale,
    locales: [...routing.locales],
  },
);

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
