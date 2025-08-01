// eslint-disable-next-line filenames/match-regex
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
};
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
