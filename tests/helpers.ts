import { NextRequest, type NextResponse } from "next/server.js";

export function makeRequest(
  host: string,
  pathname: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`https://${host}${pathname}`, {
    headers: { host, ...headers },
  });
}

/** The rewritten pathname, or null when the response is not a rewrite */
export function rewrittenPath(response: NextResponse): null | string {
  const header = response.headers.get("x-middleware-rewrite");

  return header === null ? null : new URL(header).pathname;
}

export function isNext(response: NextResponse): boolean {
  return response.headers.get("x-middleware-next") === "1";
}
