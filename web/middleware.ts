import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "./lib/i18n";

/** `/` and unprefixed paths go to the default language; pages other than login need the session cookie. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, first, second] = pathname.split("/");
  if (!isLocale(first)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  if (second !== "login" && !req.cookies.get("codflow_token")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${first}/login`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
