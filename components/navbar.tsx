"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, CalendarDays, ShieldCheck, LogOut, UserCheck } from "lucide-react";

interface NavbarProps {
  currentRole?: "student" | "admin";
}

export function Navbar({ currentRole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [role, setRole] = useState<"student" | "admin" | null>(currentRole || null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      // Check admin
      const { data: adminRecord } = await supabase
        .from("admin")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      if (adminRecord) {
        if (isMounted) {
          setRole("admin");
          setUserName(adminRecord.name || "Admin");
          setLoading(false);
        }
        return;
      }

      // Check student
      const { data: studentRecord } = await supabase
        .from("student")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      if (studentRecord) {
        if (isMounted) {
          setRole("student");
          setUserName(studentRecord.name || "Student");
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setRole(null);
        setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isAdmin = role === "admin" || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={isAdmin ? "/admin" : "/home"}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900 text-white font-serif font-bold shadow-xs">
              <span className="text-sm tracking-wider">IIML</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-base tracking-tight">
                  IIML Spaces
                </span>
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200">
                  {isAdmin ? "Admin Portal" : "Student Portal"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Indian Institute of Management Lucknow
              </p>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
            {!isAdmin ? (
              <>
                <Link
                  href="/home"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/home"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Home
                </Link>

                <Link
                  href="/book"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/book"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Book Space
                </Link>
              </>
            ) : (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-amber-50 text-amber-950 font-semibold border border-amber-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-amber-800" />
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Right side user status & actions */}
        <div className="flex items-center gap-3">
          {/* User info pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {isAdmin ? (
                <>
                  <span className="font-semibold text-slate-900">Admin</span>: {loading ? "..." : (userName || "Admin")}
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">Student</span>: {loading ? "..." : (userName || "Student")}
                </>
              )}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-md hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden border-t border-slate-200 bg-slate-50 px-4 py-2 gap-2 text-xs font-medium">
        {!isAdmin ? (
          <>
            <Link
              href="/home"
              className={`flex-1 text-center py-1.5 rounded ${
                pathname === "/home" ? "bg-white font-bold shadow-xs text-slate-900" : "text-slate-600"
              }`}
            >
              Home
            </Link>
            <Link
              href="/book"
              className={`flex-1 text-center py-1.5 rounded ${
                pathname === "/book" ? "bg-white font-bold shadow-xs text-slate-900" : "text-slate-600"
              }`}
            >
              Book Space
            </Link>
          </>
        ) : (
          <Link
            href="/admin"
            className={`flex-1 text-center py-1.5 rounded ${
              pathname === "/admin" ? "bg-white font-bold shadow-xs text-amber-900" : "text-slate-600"
            }`}
          >
            Admin Dashboard
          </Link>
        )}
      </div>
    </header>
  );
}
