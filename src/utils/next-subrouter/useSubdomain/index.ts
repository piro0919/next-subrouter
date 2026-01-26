"use client";
import { useEffect, useState } from "react";

/**
 * Hook to get the current subdomain from the browser URL.
 *
 * @returns The subdomain string, or null if on the base domain or during SSR
 *
 * @example
 * const subdomain = useSubdomain();
 * // subdomain = "admin" on admin.example.com
 * // subdomain = null on example.com
 */
export default function useSubdomain(): null | string {
  const [subdomain, setSubdomain] = useState<null | string>(null);

  useEffect(() => {
    const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
    const currentHost = window.location.host;
    const [hostname] = currentHost.split(":");
    const hostParts = hostname.split(".");

    if (envBaseDomain) {
      // Extract subdomain by removing base domain
      const baseParts = envBaseDomain.split(":")[0].split(".");

      if (hostParts.length > baseParts.length) {
        setSubdomain(hostParts.slice(0, -baseParts.length).join(".") || null);
      } else {
        setSubdomain(null);
      }

      return;
    }

    // Auto-detect subdomain
    if (hostname === "localhost" || /^[0-9.]+$/.test(hostname)) {
      // No subdomain on plain localhost or IP address
      setSubdomain(null);
    } else if (hostParts[hostParts.length - 1] === "localhost") {
      // admin.localhost -> "admin"
      setSubdomain(hostParts.slice(0, -1).join(".") || null);
    } else if (hostParts.length > 2) {
      // admin.example.com -> "admin"
      setSubdomain(hostParts.slice(0, -2).join(".") || null);
    } else {
      // example.com -> null
      setSubdomain(null);
    }
  }, []);

  return subdomain;
}
