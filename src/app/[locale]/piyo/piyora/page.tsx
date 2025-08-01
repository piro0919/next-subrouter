"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Piyo");

  return (
    <div>
      <h1>{t("piyora")}</h1>
      <div>
        <Link href="/">Go to piyo</Link>
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
