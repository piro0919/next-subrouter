export {
  default as createIntlSubrouterMiddleware,
  default as createIntlSubrouterProxy,
  type CreateIntlSubrouterMiddlewareOptions,
  type CreateIntlSubrouterMiddlewareOptions as CreateIntlSubrouterProxyOptions,
  type IntlMiddleware,
} from "./createIntlSubrouterMiddleware";

export {
  default as createSubrouterMiddleware,
  default as createSubrouterProxy,
  type CreateSubrouterMiddlewareOptions,
  type CreateSubrouterMiddlewareOptions as CreateSubrouterProxyOptions,
  type SubRoute,
  type SubRoutes,
  type UnknownSubdomainBehavior,
} from "./createSubrouterMiddleware";

export { default as getSubdomain, type RootDomain } from "./getSubdomain";
