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

    const currentHost = window.location.host;
    const hostParts = currentHost.split(".");
    // Remove first part (potential subdomain) to get base domain
    // Works for both localhost:3001 and production domains
    const baseDomain =
      hostParts.length > 1 ? hostParts.slice(1).join(".") : currentHost;
    const newHost = subdomain ? `${subdomain}.${baseDomain}` : baseDomain;

    window.location.href = `${window.location.protocol}//${newHost}${href}`;
  };

  return (
    <a className={className} href="#" onClick={handleClick}>
      {children}
    </a>
  );
}
