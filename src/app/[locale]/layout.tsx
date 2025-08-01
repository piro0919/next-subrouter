// eslint-disable-next-line filenames/match-exported
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

const notoSans = Noto_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  description: "Next Subrouter",
  title: "Next Subrouter",
};

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
      </body>
    </html>
  );
}
