"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import SubdomainLink from "@/utils/next-subrouter/SubdomainLink";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Fuga");

  return (
    <div>
      <h1>{t("fuga")}</h1>
      <div>
        <Link href="/fugara">Go to fugara</Link>
      </div>
      <div>
        <SubdomainLink href="/">Go to hoge</SubdomainLink>
      </div>
      <div>
        <SubdomainLink href="/" subdomain="piyo">
          Go to piyo
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
