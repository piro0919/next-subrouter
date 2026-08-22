"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";
import styles from "./page.module.css";

const ROUTES = [
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
] as const;

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("App");
  const common = useTranslations("Common");

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <p className={styles.description}>{t("description")}</p>
        <code className={styles.installCmd}>npm install next-subrouter</code>
        {/* 対応表そのものがデモになる。行ごとに実際に飛べる */}
        <h2 className={styles.sectionTitle}>{t("tryDemo")}</h2>
        <div className={styles.map}>
          {ROUTES.map((route) => (
            <div className={styles.row} key={route.subdomain}>
              <span className={styles.from}>
                {route.subdomain}.next-subrouter.kkweb.io
              </span>
              <span className={styles.arrow}>→</span>
              <span className={styles.to}>{route.path}</span>
              <SubdomainLink
                className={styles.link}
                href="/"
                locale={locale}
                subdomain={route.subdomain}
              >
                {t("keepLocale")}
              </SubdomainLink>
              <SubdomainLink
                className={styles.linkSecondary}
                href="/"
                subdomain={route.subdomain}
              >
                {t("resetLocale")}
              </SubdomainLink>
            </div>
          ))}
          <div className={styles.row}>
            <span className={styles.from}>next-subrouter.kkweb.io</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.to}>/dashboard</span>
            <Link className={styles.link} href="/dashboard">
              {t("dashboard")}
            </Link>
          </div>
        </div>
        <p className={styles.note}>
          {common("currentLocale")}: {locale}
        </p>
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className={styles.features}>
          <span className={styles.feature}>{t("feature1")}</span>
          <span className={styles.feature}>{t("feature2")}</span>
          <span className={styles.feature}>{t("feature3")}</span>
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
          <a
            className={styles.repoLink}
            href="https://github.com/piro0919/next-subrouter"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className={styles.repoLink}
            href="https://www.npmjs.com/package/next-subrouter"
            rel="noopener noreferrer"
            target="_blank"
          >
            npm
          </a>
        </div>
      </div>
    </div>
  );
}
