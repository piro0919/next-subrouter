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
  const formatDate = (dateStr: string): string =>
    new Date(dateStr).toLocaleDateString(locale);
  const posts = [
    {
      date: formatDate("2024-01-15"),
      excerpt: t("post1Excerpt"),
      id: 1,
      title: t("post1Title"),
    },
    {
      date: formatDate("2024-01-10"),
      excerpt: t("post2Excerpt"),
      id: 2,
      title: t("post2Title"),
    },
    {
      date: formatDate("2024-01-05"),
      excerpt: t("post3Excerpt"),
      id: 3,
      title: t("post3Title"),
    },
    {
      date: formatDate("2024-01-01"),
      excerpt: t("post4Excerpt"),
      id: 4,
      title: t("post4Title"),
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("allPosts")}</h1>
        <p className={styles.description}>{t("allPostsDescription")}</p>
      </header>
      <section className={styles.posts}>
        {posts.map((post) => (
          <article className={styles.post} key={post.id}>
            <span className={styles.postDate}>{post.date}</span>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <p className={styles.postExcerpt}>{post.excerpt}</p>
          </article>
        ))}
      </section>
      <nav className={styles.nav}>
        <Link className={styles.navLink} href="/">
          {tc("backToHome")}
        </Link>
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
