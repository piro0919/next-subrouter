import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  createIntlSubrouterMiddleware,
  type SubRoutes,
} from "./utils/next-subrouter";

const subRoutes: SubRoutes = [
  {
    path: "/app",
  },
  {
    path: "/admin",
    subdomain: "admin",
  },
  {
    path: "/blog",
    subdomain: "blog",
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
  // - … Next が生成する metadata のルート（末尾が opengraph-image など）
  // - … the ones containing a dot (e.g. `favicon.ico`)
  //
  // metadata のルートはドットを含まず、ロケール接頭辞が付くと先頭一致でも
  // 除外できない。末尾で判定しないとここで飲まれて 404 になり、
  // og:image が 404 を指したまま公開されてしまう。
  matcher:
    "/((?!api|trpc|_next|_vercel|.*\\..*)(?!.*/(?:opengraph-image|twitter-image|icon|apple-icon)$).*)",
};
