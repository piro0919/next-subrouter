"use client";
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useSyncExternalStore,
} from "react";
import { resolveRootDomain, type RootDomain, splitHost } from "../getSubdomain";

export type SubdomainLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href?: string;
  /**
   * Locale to include in the URL path.
   * If provided, the URL will be like: https://admin.example.com/ja/...
   * If not provided, the URL will be: https://admin.example.com/...
   */
  locale?: string;
  /**
   * The root domain(s) subdomains hang off, e.g. "example.co.uk".
   * Defaults to NEXT_PUBLIC_BASE_DOMAIN, then to auto-detection.
   * Use the same value as the middleware/proxy.
   */
  rootDomain?: RootDomain;
  /** Target subdomain. Omit it to link to the root domain. */
  subdomain?: string;
};

function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): null {
  return null;
}

/**
 * Build the full URL for a subdomain link
 */
function buildSubdomainUrl(
  subdomain: string | undefined,
  href: string,
  locale: string | undefined,
  rootDomain: RootDomain | undefined,
): string {
  const { port, protocol } = window.location;
  const { rootHostname } = splitHost(window.location.host, rootDomain);
  const hostname = subdomain ? `${subdomain}.${rootHostname}` : rootHostname;
  const newHost = port ? `${hostname}:${port}` : hostname;

  // Build path with optional locale prefix
  let path = href;

  if (locale) {
    if (href === "/") {
      path = `/${locale}`;
    } else if (href.startsWith("/")) {
      path = `/${locale}${href}`;
    } else {
      path = `/${locale}/${href}`;
    }
  }

  return `${protocol}//${newHost}${path}`;
}

/**
 * Whether the browser should handle the click itself (new tab, download, ...)
 */
function isBrowserHandledClick(
  event: MouseEvent<HTMLAnchorElement>,
  target: string | undefined,
  download: unknown,
): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (target !== undefined && target !== "" && target !== "_self") ||
    (download !== undefined && download !== false)
  );
}

/**
 * A link to another subdomain of the same site. Regular `<Link>` can't
 * cross subdomains.
 */
export default function SubdomainLink({
  href = "/",
  locale,
  onClick,
  rootDomain: rootDomainOption,
  subdomain,
  ...anchorProps
}: SubdomainLinkProps): React.JSX.Element {
  const rootDomain = resolveRootDomain(rootDomainOption);
  const fullUrl = useSyncExternalStore(
    subscribe,
    () => buildSubdomainUrl(subdomain, href, locale, rootDomain),
    getServerSnapshot,
  );
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);

    if (
      isBrowserHandledClick(event, anchorProps.target, anchorProps.download)
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(
      buildSubdomainUrl(subdomain, href, locale, rootDomain),
    );
  };

  return <a {...anchorProps} href={fullUrl ?? href} onClick={handleClick} />;
}
