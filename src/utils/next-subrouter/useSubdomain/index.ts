"use client";
import { useSyncExternalStore } from "react";
import getSubdomain, {
  resolveRootDomain,
  type RootDomain,
} from "../getSubdomain";

export type UseSubdomainOptions = {
  /**
   * The root domain(s) subdomains hang off, e.g. "example.co.uk".
   * Defaults to NEXT_PUBLIC_BASE_DOMAIN, then to auto-detection.
   * Use the same value as the middleware/proxy.
   */
  rootDomain?: RootDomain;
};

// The host never changes without a full page load, so there is nothing to
// subscribe to.
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): null {
  return null;
}

/**
 * Hook to get the current subdomain from the browser URL.
 *
 * @returns The subdomain string, or null if on the root domain or during SSR
 *
 * @example
 * const subdomain = useSubdomain();
 * // subdomain = "admin" on admin.example.com
 * // subdomain = null on example.com
 */
export default function useSubdomain(
  options?: UseSubdomainOptions,
): null | string {
  const rootDomain = resolveRootDomain(options?.rootDomain);

  return useSyncExternalStore(
    subscribe,
    () => getSubdomain(window.location.host, rootDomain),
    getServerSnapshot,
  );
}
