import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Try to get locale from requestLocale first
  let locale = await requestLocale;

  // If requestLocale is not available, try to get from custom header set by middleware
  if (!hasLocale(routing.locales, locale)) {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const headerLocale = headersList.get("x-locale");

    if (hasLocale(routing.locales, headerLocale)) {
      locale = headerLocale;
    }
  }

  // Fallback to default locale if still not found
  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // eslint-disable-next-line no-unsanitized/method
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
