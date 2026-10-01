import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SubdomainLink from "../src/utils/next-subrouter/SubdomainLink";
import useSubdomain from "../src/utils/next-subrouter/useSubdomain";

const assign = vi.fn();

function setLocation(url: string): void {
  const parsed = new URL(url);

  vi.stubGlobal("location", {
    assign,
    host: parsed.host,
    hostname: parsed.hostname,
    href: parsed.href,
    port: parsed.port,
    protocol: parsed.protocol,
  });
}

beforeEach(() => {
  assign.mockReset();
  setLocation("https://example.com/");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("useSubdomain", () => {
  it("reads the subdomain from the current host", () => {
    setLocation("https://admin.example.com/");

    const { result } = renderHook(() => useSubdomain());

    expect(result.current).toBe("admin");
  });

  it("agrees with the server for example.co.uk", () => {
    setLocation("https://admin.example.co.uk/");

    const { result } = renderHook(() =>
      useSubdomain({ rootDomain: "example.co.uk" }),
    );

    expect(result.current).toBe("admin");
  });

  it("returns null on the root domain", () => {
    const { result } = renderHook(() => useSubdomain());

    expect(result.current).toBeNull();
  });
});

describe("SubdomainLink", () => {
  it("builds the cross-subdomain URL", () => {
    render(
      <SubdomainLink href="/users" locale="ja" subdomain="admin">
        Admin
      </SubdomainLink>,
    );

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "https://admin.example.com/ja/users",
    );
  });

  it("renders the plain href on the server", () => {
    expect(
      renderToString(
        <SubdomainLink href="/users" subdomain="admin">
          Admin
        </SubdomainLink>,
      ),
    ).toMatch(/href="\/users"/);
  });

  it("uses rootDomain and keeps the port", () => {
    setLocation("http://blog.example.co.uk:3000/");
    render(
      <SubdomainLink href="/" rootDomain="example.co.uk" subdomain="admin">
        Admin
      </SubdomainLink>,
    );

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "http://admin.example.co.uk:3000/",
    );
  });

  it("reads NEXT_PUBLIC_BASE_DOMAIN", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_DOMAIN", "example.co.uk");
    setLocation("https://blog.example.co.uk/");
    render(<SubdomainLink href="/">Home</SubdomainLink>);

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "https://example.co.uk/",
    );
  });

  it("navigates on a plain left click", () => {
    render(<SubdomainLink subdomain="admin">Admin</SubdomainLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link"));

    expect(notCancelled).toBe(false);
    expect(assign).toHaveBeenCalledWith("https://admin.example.com/");
  });

  it.each([
    ["metaKey", { metaKey: true }],
    ["ctrlKey", { ctrlKey: true }],
    ["shiftKey", { shiftKey: true }],
    ["altKey", { altKey: true }],
    ["middle button", { button: 1 }],
  ])("leaves %s clicks to the browser", (_, init) => {
    render(<SubdomainLink subdomain="admin">Admin</SubdomainLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link"), init);

    expect(notCancelled).toBe(true);
    expect(assign).not.toHaveBeenCalled();
  });

  it("leaves target=_blank to the browser", () => {
    render(
      <SubdomainLink subdomain="admin" target="_blank">
        Admin
      </SubdomainLink>,
    );

    expect(fireEvent.click(screen.getByRole("link"))).toBe(true);
    expect(assign).not.toHaveBeenCalled();
  });

  it("leaves download links to the browser", () => {
    render(
      <SubdomainLink download={true} subdomain="admin">
        Admin
      </SubdomainLink>,
    );

    expect(fireEvent.click(screen.getByRole("link"))).toBe(true);
    expect(assign).not.toHaveBeenCalled();
  });

  it("respects preventDefault from the user's onClick", () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });

    render(
      <SubdomainLink onClick={onClick} subdomain="admin">
        Admin
      </SubdomainLink>,
    );
    fireEvent.click(screen.getByRole("link"));

    expect(onClick).toHaveBeenCalledOnce();
    expect(assign).not.toHaveBeenCalled();
  });
});
