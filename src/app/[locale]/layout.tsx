// eslint-disable-next-line filenames/match-exported
import { Analytics } from "@vercel/analytics/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

const notoSans = Noto_Sans({
  subsets: ["latin"],
});
const SITE_URL = "https://next-subrouter.kkweb.io";

// localePrefix が as-needed なので、既定ロケールだけ接頭辞が付かない。
// canonical と hreflang が無いと en と ja が重複ページ扱いになる。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    alternates: {
      canonical: path,
      languages: Object.fromEntries(
        routing.locales.map((one) => [
          one,
          one === routing.defaultLocale ? "/" : `/${one}`,
        ]),
      ),
    },
    description: "Next Subrouter",
    metadataBase: new URL(SITE_URL),
    openGraph: { url: path },
    title: "Next Subrouter",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>): Promise<React.JSX.Element> {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${notoSans.className}`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
