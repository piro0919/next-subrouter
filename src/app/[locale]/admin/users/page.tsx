"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { SubdomainLink } from "@/utils/next-subrouter";
import styles from "./page.module.css";

export default function Page(): React.JSX.Element {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Users");
  const tc = useTranslations("Common");
  const users = [
    { id: 1, name: "Alice", role: "Admin", status: "active" },
    { id: 2, name: "Bob", role: "Editor", status: "active" },
    { id: 3, name: "Charlie", role: "Viewer", status: "inactive" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.description}>{t("description")}</p>
      </header>
      <section className={styles.users}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("role")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>
                  <span
                    className={
                      user.status === "active"
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {user.status === "active"
                      ? t("statusActive")
                      : t("statusInactive")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <nav className={styles.nav}>
        <Link className={styles.navLink} href="/">
          {tc("backToHome")}
        </Link>
        <SubdomainLink className={styles.navLink} href="/">
          {tc("goToHome")}
        </SubdomainLink>
        <SubdomainLink className={styles.navLink} href="/" subdomain="blog">
          {tc("goToBlog")}
        </SubdomainLink>
      </nav>
      <footer className={styles.footer}>
        <span className={styles.info}>
          {tc("currentSubdomain")}: admin | {tc("currentLocale")}: {locale}
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
