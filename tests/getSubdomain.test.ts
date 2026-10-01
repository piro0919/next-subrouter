import { describe, expect, it } from "vitest";
import getSubdomain, {
  splitHost,
} from "../src/utils/next-subrouter/getSubdomain";

describe("getSubdomain", () => {
  it.each([
    ["admin.example.com", "admin"],
    ["Admin.Example.com:443", "admin"],
    ["a.b.example.com", "a.b"],
    ["example.com", null],
    ["localhost:3000", null],
    ["admin.localhost:3000", "admin"],
    ["127.0.0.1:3000", null],
    ["[::1]:3000", null],
  ])("auto-detects %s as %s", (host, expected) => {
    expect(getSubdomain(host)).toBe(expected);
  });

  it("uses rootDomain for multi-label suffixes", () => {
    expect(getSubdomain("admin.example.co.uk")).toBe("admin.example");
    expect(getSubdomain("admin.example.co.uk", "example.co.uk")).toBe("admin");
    expect(getSubdomain("example.co.uk", "example.co.uk")).toBeNull();
  });

  it("ignores the port in rootDomain", () => {
    expect(getSubdomain("admin.localhost:3000", "localhost:3000")).toBe(
      "admin",
    );
  });

  it("prefers the longest matching root", () => {
    expect(
      getSubdomain("admin.app.example.com", ["example.com", "app.example.com"]),
    ).toBe("admin");
  });

  it("falls back to auto-detection for hosts outside rootDomain", () => {
    expect(getSubdomain("admin.localhost", "example.co.uk")).toBe("admin");
    expect(splitHost("preview.vercel.app", "example.com")).toEqual({
      rootHostname: "vercel.app",
      subdomain: "preview",
    });
  });
});
