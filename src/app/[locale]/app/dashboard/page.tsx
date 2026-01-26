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
  const tc = useTranslations("Common");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("dashboard")}</h1>
        <p className={styles.description}>{t("dashboardDescription")}</p>
      </header>
      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>12</span>
          <span className={styles.statLabel}>{t("statProjects")}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>48</span>
          <span className={styles.statLabel}>{t("statTasks")}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>99.9%</span>
          <span className={styles.statLabel}>{t("statUptime")}</span>
        </div>
      </section>
      <nav className={styles.nav}>
        <Link className={styles.navLink} href="/">
          {tc("backToHome")}
        </Link>
        <SubdomainLink className={styles.navLink} href="/" subdomain="admin">
          {tc("goToAdmin")}
        </SubdomainLink>
        <SubdomainLink className={styles.navLink} href="/" subdomain="blog">
          {tc("goToBlog")}
        </SubdomainLink>
      </nav>
      <footer className={styles.footer}>
        <span className={styles.info}>
          {tc("currentLocale")}: {locale}
        </span>
        <button
          onClick={() =>
            router.replace(pathname, {
              locale: locale === "en" ? "ja" : "en",
            })
          }
          className={styles.langButton}
          type="button"
        >
          {tc("switchLanguage")}
        </button>
      </footer>
    </div>
  );
}
