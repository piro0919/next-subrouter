// eslint-disable-next-line filenames/match-regex
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.localhost"],
  // SubdomainLink reads this to build cross-subdomain URLs. Hosts outside it
  // (localhost, Vercel previews) fall back to auto-detection.
  env: {
    NEXT_PUBLIC_BASE_DOMAIN:
      process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "next-subrouter.kkweb.io",
  },
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
