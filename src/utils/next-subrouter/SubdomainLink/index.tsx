"use client";
import { type ReactNode, useEffect, useState } from "react";

export type SubdomainLinkProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  /**
   * Locale to include in the URL path.
   * If provided, the URL will be like: https://admin.example.com/ja/...
   * If not provided, the URL will be: https://admin.example.com/...
   */
  locale?: string;
  subdomain?: string;
};

/**
 * Build the full URL for a subdomain link
 */
function buildSubdomainUrl(
  subdomain: string | undefined,
  href: string,
  locale?: string,
): null | string {
  if (typeof window === "undefined") {
    return null;
  }

  const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;

  let baseDomain: string;

  if (envBaseDomain) {
    baseDomain = envBaseDomain;
  } else {
    const currentHost = window.location.host;
    const [hostname, port] = currentHost.split(":");
    const hostParts = hostname.split(".");
    const lastPart = hostParts[hostParts.length - 1];

    if (hostname === "localhost" || /^[0-9.]+$/.test(hostname)) {
      // Plain localhost or IP address
      baseDomain = port ? `${hostname}:${port}` : hostname;
    } else if (lastPart === "localhost") {
      // *.localhost (e.g., fuga.localhost) -> use localhost as base
      baseDomain = port ? `localhost:${port}` : "localhost";
    } else if (hostParts.length > 2) {
      // sub.example.com -> example.com
      const baseHostname = hostParts.slice(-2).join(".");

      baseDomain = port ? `${baseHostname}:${port}` : baseHostname;
    } else {
      // example.com -> example.com
      baseDomain = port ? `${hostname}:${port}` : hostname;
    }
  }

  const newHost = subdomain ? `${subdomain}.${baseDomain}` : baseDomain;

  // Build path with optional locale prefix
  let path = href;

  if (locale) {
    // Ensure path starts with locale
    if (href === "/") {
      path = `/${locale}`;
    } else if (href.startsWith("/")) {
      path = `/${locale}${href}`;
    } else {
      path = `/${locale}/${href}`;
    }
  }

  return `${window.location.protocol}//${newHost}${path}`;
}

export default function SubdomainLink({
  children,
  className,
  href = "/",
  locale,
  subdomain,
}: SubdomainLinkProps): React.JSX.Element {
  const [fullUrl, setFullUrl] = useState<null | string>(null);

  useEffect(() => {
    setFullUrl(buildSubdomainUrl(subdomain, href, locale));
  }, [subdomain, href, locale]);

  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault();

    const url = buildSubdomainUrl(subdomain, href, locale);

    if (url) {
      window.location.href = url;
    }
  };

  return (
    <a className={className} href={fullUrl ?? href} onClick={handleClick}>
      {children}
    </a>
  );
}
