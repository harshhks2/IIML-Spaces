"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const executeSignIn = async (userEmail: string, userPass: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail.trim(),
        password: userPass,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Login failed. No authenticated user returned.");
      }

      // 2. Check if user's auth ID exists in admin
      const { data: adminRecord, error: adminErr } = await supabase
        .from("admin")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (adminErr) {
        console.error("Admin lookup error:", adminErr);
      }

      if (adminRecord) {
        router.push("/admin");
        router.refresh();
        return;
      }

      // 3. Check if user's auth ID exists in student
      const { data: studentRecord, error: studentErr } = await supabase
        .from("student")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (studentErr) {
        console.error("Student lookup error:", studentErr);
      }

      if (studentRecord) {
        router.push("/home");
        router.refresh();
        return;
      }

      // Authenticated but not mapped to student or admin
      setErrorMessage("Account authenticated, but not registered in student or admin tables.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSignIn(email, password);
  };

  const handleQuickStudentLogin = () => {
    setEmail("student@iiml.ac.in");
    setPassword("password123");
    executeSignIn("student@iiml.ac.in", "password123");
  };

  const handleQuickAdminLogin = () => {
    setEmail("admin@iiml.ac.in");
    setPassword("password123");
    executeSignIn("admin@iiml.ac.in", "password123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top minimal header */}
      <header className="w-full border-b border-slate-200 bg-white py-4 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900 text-white font-serif font-bold shadow-xs">
            <span className="text-xs tracking-wider">IIML</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight block">
              IIML Spaces
            </span>
            <span className="text-[11px] text-slate-500 block">
              Indian Institute of Management Lucknow
            </span>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          Supabase Auth
        </span>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
              Campus Space Reservation
            </h1>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Sign in with your institute email and password to access campus space bookings.
            </p>
          </div>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Sign In to Your Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Enter your institute credentials below
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Institute Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@iiml.ac.in"
                      className="pl-9 text-sm bg-white border-slate-300 focus-visible:ring-amber-800"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      className="pl-9 text-sm bg-white border-slate-300 focus-visible:ring-amber-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-900 hover:bg-amber-800 text-white font-medium text-sm h-10 shadow-xs transition-colors"
                >
                  {loading ? (
                    "Signing in..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In with Supabase <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Quick Supabase Auth Test Accounts */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">
                    Quick test credentials
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleQuickStudentLogin}
                  className="flex flex-col items-center justify-center h-auto py-3 px-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                >
                  <GraduationCap className="h-4 w-4 text-amber-900 mb-1" />
                  <span className="text-xs font-semibold">Student Account</span>
                  <span className="text-[10px] text-slate-400">student@iiml.ac.in</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleQuickAdminLogin}
                  className="flex flex-col items-center justify-center h-auto py-3 px-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-900 mb-1" />
                  <span className="text-xs font-semibold">Admin Account</span>
                  <span className="text-[10px] text-slate-400">admin@iiml.ac.in</span>
                </Button>
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Protected by Supabase Auth with Role-Based Access</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Indian Institute of Management Lucknow — Campus Facility Management</p>
      </footer>
    </div>
  );
}
