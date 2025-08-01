import { type ReactNode } from "react";

export type SubdomainLinkProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  subdomain?: string;
};

export default function SubdomainLink({
  children,
  className,
  href = "/",
  subdomain,
}: SubdomainLinkProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault();

    // Get base domain from environment variable or detect from current host
    const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;

    let baseDomain: string;

    if (envBaseDomain) {
      baseDomain = envBaseDomain;
    } else {
      // Fallback: detect from current host
      const currentHost = window.location.host;
      const [hostname, port] = currentHost.split(":");
      const hostParts = hostname.split(".");

      // For localhost or IP addresses, preserve port
      if (hostname === "localhost" || /^[0-9.]+$/.test(hostname)) {
        baseDomain = port ? `${hostname}:${port}` : hostname;
      } else if (hostParts.length > 2) {
        // Assume last two parts are the base domain (e.g., example.com from sub.example.com)
        const baseHostname = hostParts.slice(-2).join(".");

        baseDomain = port ? `${baseHostname}:${port}` : baseHostname;
      } else {
        baseDomain = port ? `${hostname}:${port}` : hostname;
      }
    }

    const newHost = subdomain ? `${subdomain}.${baseDomain}` : baseDomain;

    window.location.href = `${window.location.protocol}//${newHost}${href}`;
  };

  return (
    <a className={className} href="#" onClick={handleClick}>
      {children}
    </a>
  );
}
