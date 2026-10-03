import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Authenticate user via Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = pathname.startsWith("/login");

  const createRedirect = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // Case 1: Unauthenticated visitors
  if (!user) {
    if (!isPublicRoute) {
      return createRedirect("/login");
    }
    return supabaseResponse;
  }

  // Case 2: Authenticated user - resolve role from database
  const { data: adminRecord } = await supabase
    .from("admin")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = !!adminRecord;

  // Visiting login page or root when already logged in:
  if (isPublicRoute || pathname === "/") {
    return createRedirect(isAdmin ? "/admin" : "/home");
  }

  // Requirement 5: Students must not access /admin
  if (pathname.startsWith("/admin") && !isAdmin) {
    return createRedirect("/home");
  }

  // Requirement 6: Admins must not be treated as students (must not access /home or /book)
  if ((pathname.startsWith("/home") || pathname.startsWith("/book")) && isAdmin) {
    return createRedirect("/admin");
  }

  return supabaseResponse;
}
