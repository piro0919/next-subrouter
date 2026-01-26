"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";
import styles from "./page.module.css";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Admin");
  const common = useTranslations("Common");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.description}>{t("description")}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.cardTitle}>{common("currentSubdomain")}: admin</p>
        <div className={styles.links}>
          <Link className={styles.link} href="/users">
            {t("users")}
          </Link>
        </div>
      </div>
      <div className={styles.links}>
        <SubdomainLink className={styles.linkSecondary} href="/">
          {common("goToHome")}
        </SubdomainLink>
        <SubdomainLink
          className={styles.linkSecondary}
          href="/"
          subdomain="blog"
        >
          {common("goToBlog")}
        </SubdomainLink>
      </div>
      <div className={styles.footer}>
        <button
          onClick={() =>
            router.replace(pathname, {
              locale: locale === "en" ? "ja" : "en",
            })
          }
          className={styles.langButton}
          type="button"
        >
          {common("switchLanguage")}
        </button>
        <span className={styles.info}>
          {common("currentLocale")}: {locale}
        </span>
      </div>
    </div>
  );
}
