"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";
import styles from "./page.module.css";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("App");
  const common = useTranslations("Common");

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <p className={styles.description}>{t("description")}</p>
      </div>
      <div className={styles.features}>
        <div className={styles.feature}>{t("feature1")}</div>
        <div className={styles.feature}>{t("feature2")}</div>
        <div className={styles.feature}>{t("feature3")}</div>
      </div>
      <div className={styles.demo}>
        <p className={styles.demoTitle}>{t("tryDemo")}</p>
        <div className={styles.linkGroup}>
          <span className={styles.linkLabel}>{t("keepLocale")}:</span>
          <div className={styles.links}>
            <SubdomainLink
              className={styles.link}
              href="/"
              locale={locale}
              subdomain="admin"
            >
              {common("goToAdmin")}
            </SubdomainLink>
            <SubdomainLink
              className={styles.link}
              href="/"
              locale={locale}
              subdomain="blog"
            >
              {common("goToBlog")}
            </SubdomainLink>
          </div>
        </div>
        <div className={styles.linkGroup}>
          <span className={styles.linkLabel}>{t("resetLocale")}:</span>
          <div className={styles.links}>
            <SubdomainLink
              className={styles.linkSecondary}
              href="/"
              subdomain="admin"
            >
              {common("goToAdmin")}
            </SubdomainLink>
            <SubdomainLink
              className={styles.linkSecondary}
              href="/"
              subdomain="blog"
            >
              {common("goToBlog")}
            </SubdomainLink>
          </div>
        </div>
        <div className={styles.links}>
          <Link className={styles.link} href="/dashboard">
            Dashboard
          </Link>
        </div>
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
