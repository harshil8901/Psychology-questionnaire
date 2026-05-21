import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { isValidAdminSessionValue } from "@/lib/admin-session-token";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const hasAdmin = await isValidAdminSessionValue(
      request.cookies.get(ADMIN_COOKIE)?.value
    );

    if (!hasAdmin && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (hasAdmin && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/responses";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });
  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
