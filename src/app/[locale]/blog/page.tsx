"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";
import styles from "./page.module.css";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Blog");
  const tc = useTranslations("Common");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.description}>{t("description")}</p>
      </header>
      <section className={styles.posts}>
        <h2 className={styles.sectionTitle}>{t("posts")}</h2>
        <div className={styles.postList}>
          <article className={styles.post}>
            <span className={styles.postDate}>
              {new Date("2024-01-15").toLocaleDateString(locale)}
            </span>
            <h3 className={styles.postTitle}>{t("post1Title")}</h3>
            <p className={styles.postExcerpt}>{t("post1Excerpt")}</p>
          </article>
          <article className={styles.post}>
            <span className={styles.postDate}>
              {new Date("2024-01-10").toLocaleDateString(locale)}
            </span>
            <h3 className={styles.postTitle}>{t("post2Title")}</h3>
            <p className={styles.postExcerpt}>{t("post2Excerpt")}</p>
          </article>
          <article className={styles.post}>
            <span className={styles.postDate}>
              {new Date("2024-01-05").toLocaleDateString(locale)}
            </span>
            <h3 className={styles.postTitle}>{t("post3Title")}</h3>
            <p className={styles.postExcerpt}>{t("post3Excerpt")}</p>
          </article>
        </div>
        <Link className={styles.viewAll} href="/posts">
          {t("viewAll")}
        </Link>
      </section>
      <nav className={styles.nav}>
        <SubdomainLink className={styles.navLink} href="/">
          {tc("goToHome")}
        </SubdomainLink>
        <SubdomainLink className={styles.navLink} href="/" subdomain="admin">
          {tc("goToAdmin")}
        </SubdomainLink>
      </nav>
      <footer className={styles.footer}>
        <span className={styles.info}>
          {tc("currentSubdomain")}: blog | {tc("currentLocale")}: {locale}
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
