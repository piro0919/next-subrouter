"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import SubdomainLink from "@/utils/next-subrouter/SubdomainLink";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Hoge");

  return (
    <div>
      <h1>{t("hogera")}</h1>
      <div>
        <Link href="/">Go to hoge</Link>
      </div>
      <div>
        <SubdomainLink href="/fugara" subdomain="fuga">
          Go to fugara
        </SubdomainLink>
      </div>
      <div>
        <SubdomainLink href="/piyora" subdomain="piyo">
          Go to piyora
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
