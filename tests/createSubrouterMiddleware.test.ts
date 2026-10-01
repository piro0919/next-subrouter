// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import createSubrouterMiddleware from "../src/utils/next-subrouter/createSubrouterMiddleware";
import { isNext, makeRequest, rewrittenPath } from "./helpers";

const routes = [
  { path: "/admin", subdomain: "admin" },
  { path: "/blog", subdomain: "blog" },
  { path: "/app" },
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSubrouterMiddleware", () => {
  it("validates duplicate paths at creation time", () => {
    expect(() =>
      createSubrouterMiddleware([
        { path: "/dashboard", subdomain: "admin" },
        { path: "/dashboard", subdomain: "internal" },
      ]),
    ).toThrow(/Duplicate path/);
  });

  it("validates duplicate subdomains at creation time", () => {
    expect(() =>
      createSubrouterMiddleware([
        { path: "/dashboard", subdomain: "admin" },
        { path: "/admin", subdomain: "admin" },
      ]),
    ).toThrow(/Duplicate subdomain/);
  });

  describe("subdomain rewrite", () => {
    const middleware = createSubrouterMiddleware(routes);

    it("rewrites a subdomain to its path", async () => {
      const response = await middleware(
        makeRequest("admin.example.com", "/users"),
      );

      expect(rewrittenPath(response)).toBe("/admin/users");
    });

    it("keeps the query string", async () => {
      const response = await middleware(
        makeRequest("blog.example.com", "/posts?page=2"),
      );
      const header = response.headers.get("x-middleware-rewrite")!;

      expect(new URL(header).search).toBe("?page=2");
    });

    it("ignores the port", async () => {
      const response = await middleware(
        makeRequest("admin.localhost:3000", "/users"),
      );

      expect(rewrittenPath(response)).toBe("/admin/users");
    });

    it("passes through paths already under the route", async () => {
      const response = await middleware(
        makeRequest("admin.example.com", "/admin/users"),
      );

      expect(isNext(response)).toBe(true);
    });
  });

  describe("root domain", () => {
    const middleware = createSubrouterMiddleware(routes);

    it.each(["example.com", "localhost:3000", "127.0.0.1:3000"])(
      "sends %s to the default route",
      async (host) => {
        const response = await middleware(makeRequest(host, "/dashboard"));

        expect(rewrittenPath(response)).toBe("/app/dashboard");
      },
    );

    it("blocks direct access to the default route path", async () => {
      const response = await middleware(
        makeRequest("example.com", "/app/dashboard"),
      );

      expect(response.status).toBe(404);
    });

    it("passes through when there is no default route", async () => {
      const noDefault = createSubrouterMiddleware([
        { path: "/admin", subdomain: "admin" },
      ]);
      const response = await noDefault(makeRequest("example.com", "/x"));

      expect(isNext(response)).toBe(true);
    });
  });

  describe("unknown subdomain", () => {
    it("falls back to the default route by default", async () => {
      const middleware = createSubrouterMiddleware(routes);
      const response = await middleware(
        makeRequest("www.example.com", "/dashboard"),
      );

      expect(rewrittenPath(response)).toBe("/app/dashboard");
    });

    it("responds 404 with onUnknownSubdomain: notFound", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        onUnknownSubdomain: "notFound",
      });
      const response = await middleware(
        makeRequest("www.example.com", "/dashboard"),
      );

      expect(response.status).toBe(404);
    });

    it("still serves the root domain with onUnknownSubdomain: notFound", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        onUnknownSubdomain: "notFound",
      });
      const response = await middleware(makeRequest("example.com", "/x"));

      expect(rewrittenPath(response)).toBe("/app/x");
    });
  });

  describe("locales", () => {
    it("does not treat a short segment as a locale without locales", async () => {
      const middleware = createSubrouterMiddleware(routes);
      const response = await middleware(
        makeRequest("admin.example.com", "/faq"),
      );

      expect(rewrittenPath(response)).toBe("/admin/faq");
    });

    it("keeps a configured locale in front of the route path", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        locales: ["en", "ja"],
      });

      expect(
        rewrittenPath(
          await middleware(makeRequest("admin.example.com", "/ja/users")),
        ),
      ).toBe("/ja/admin/users");
      expect(
        rewrittenPath(
          await middleware(makeRequest("admin.example.com", "/ja")),
        ),
      ).toBe("/ja/admin");
    });

    it("does not treat an unlisted segment as a locale", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        locales: ["en", "ja"],
      });
      const response = await middleware(
        makeRequest("admin.example.com", "/faq/x"),
      );

      expect(rewrittenPath(response)).toBe("/admin/faq/x");
    });

    it("blocks direct access behind a locale", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        locales: ["en", "ja"],
      });
      const response = await middleware(
        makeRequest("example.com", "/ja/app/dashboard"),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("rootDomain", () => {
    it("handles multi-label suffixes like example.co.uk", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        rootDomain: "example.co.uk",
      });

      expect(
        rewrittenPath(
          await middleware(makeRequest("admin.example.co.uk", "/users")),
        ),
      ).toBe("/admin/users");
      expect(
        rewrittenPath(await middleware(makeRequest("example.co.uk", "/users"))),
      ).toBe("/app/users");
    });

    it("handles a root domain that is itself a subdomain", async () => {
      const middleware = createSubrouterMiddleware(routes, {
        onUnknownSubdomain: "notFound",
        rootDomain: "next-subrouter.example.io",
      });

      expect(
        rewrittenPath(
          await middleware(
            makeRequest("admin.next-subrouter.example.io", "/users"),
          ),
        ),
      ).toBe("/admin/users");
      expect(
        rewrittenPath(
          await middleware(makeRequest("next-subrouter.example.io", "/")),
        ),
      ).toBe("/app");
    });

    it("reads NEXT_PUBLIC_BASE_DOMAIN when rootDomain is not given", async () => {
      vi.stubEnv("NEXT_PUBLIC_BASE_DOMAIN", "example.co.uk");

      const middleware = createSubrouterMiddleware(routes);
      const response = await middleware(
        makeRequest("blog.example.co.uk", "/posts"),
      );

      expect(rewrittenPath(response)).toBe("/blog/posts");
    });
  });
});
