/* eslint-disable write-good-comments/write-good-comments */
/**
 * The domain (or domains) your subdomains hang off, e.g. "example.com" or
 * "example.co.uk". A port is ignored. Hosts that end with none of them fall
 * back to auto-detection (see `splitHost`).
 */
export type RootDomain = readonly string[] | string;

export type SplitHost = {
  /** The root part of the hostname, without a port (e.g. "example.co.uk") */
  rootHostname: string;
  /** Everything left of the root (e.g. "admin"), or null on the root itself */
  subdomain: null | string;
};

const IPV4_PATTERN = /^[\d.]+$/;

/**
 * Lower-cases a host and drops the port. Keeps IPv6 literals intact.
 */
function toHostname(host: string): string {
  const trimmed = host.trim().toLowerCase();

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");

    return end === -1 ? trimmed : trimmed.slice(0, end + 1);
  }

  const [hostname] = trimmed.split(":");

  return hostname.replace(/\.$/, "");
}

function toRootList(rootDomain: RootDomain | undefined): string[] {
  if (rootDomain === undefined) {
    return [];
  }

  const list = typeof rootDomain === "string" ? [rootDomain] : [...rootDomain];

  return (
    list
      .map((root) => toHostname(root).replace(/^\./, ""))
      .filter((root) => root.length > 0)
      // Longest first so "app.example.com" wins over "example.com"
      .sort((a, b) => b.length - a.length)
  );
}

/**
 * Splits a host into its subdomain and root part.
 *
 * With `rootDomain`, a host that equals or ends with one of the roots is split
 * there: "admin.example.co.uk" with "example.co.uk" gives "admin".
 *
 * Otherwise the root is guessed:
 * - "localhost" and IP addresses have no subdomain
 * - "admin.localhost" gives "admin"
 * - anything else keeps its last two labels as the root, so
 *   "a.b.example.com" gives "a.b". This guess is wrong for multi-label public
 *   suffixes such as "example.co.uk"; pass `rootDomain` for those.
 */
export function splitHost(host: string, rootDomain?: RootDomain): SplitHost {
  const hostname = toHostname(host);

  for (const root of toRootList(rootDomain)) {
    if (hostname === root) {
      return { rootHostname: root, subdomain: null };
    }

    if (hostname.endsWith(`.${root}`)) {
      return {
        rootHostname: root,
        subdomain: hostname.slice(0, -(root.length + 1)) || null,
      };
    }
  }

  if (
    hostname === "localhost" ||
    hostname.startsWith("[") ||
    IPV4_PATTERN.test(hostname)
  ) {
    return { rootHostname: hostname, subdomain: null };
  }

  if (hostname.endsWith(".localhost")) {
    return {
      rootHostname: "localhost",
      subdomain: hostname.slice(0, -".localhost".length) || null,
    };
  }

  const labels = hostname.split(".");

  if (labels.length > 2) {
    return {
      rootHostname: labels.slice(-2).join("."),
      subdomain: labels.slice(0, -2).join("."),
    };
  }

  return { rootHostname: hostname, subdomain: null };
}

/**
 * Returns the subdomain of a host, or null when the host is the root domain.
 * The server (`createSubrouterMiddleware`) and the client (`useSubdomain`,
 * `SubdomainLink`) both use this, so they always agree.
 *
 * @example
 * getSubdomain("admin.example.com"); // "admin"
 * getSubdomain("example.com"); // null
 * getSubdomain("admin.example.co.uk", "example.co.uk"); // "admin"
 */
export default function getSubdomain(
  host: string,
  rootDomain?: RootDomain,
): null | string {
  return splitHost(host, rootDomain).subdomain;
}

/**
 * Picks the configured root domain, falling back to the
 * NEXT_PUBLIC_BASE_DOMAIN environment variable.
 */
export function resolveRootDomain(
  rootDomain: RootDomain | undefined,
): RootDomain | undefined {
  if (rootDomain !== undefined) {
    return rootDomain;
  }

  const fromEnv =
    typeof process === "undefined"
      ? undefined
      : process.env.NEXT_PUBLIC_BASE_DOMAIN;

  return fromEnv || undefined;
}
