"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Piyo");

  return (
    <div>
      <h1>{t("piyo")}</h1>
      <div>
        <Link href="/piyora">Go to piyora</Link>
      </div>
      <div>
        <SubdomainLink href="/">Go to hoge</SubdomainLink>
      </div>
      <div>
        <SubdomainLink href="/" subdomain="fuga">
          Go to fuga
        </SubdomainLink>
      </div>
      <button
        onClick={() =>
          router.replace(pathname, {
            locale: locale === "en" ? "ja" : "en",
          })
        }
      >
        {locale === "en" ? "Change to Japanese" : "Change to English"}
      </button>
    </div>
  );
}
