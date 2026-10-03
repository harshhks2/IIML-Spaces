import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  PlusCircle,
  Building2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// In Next.js 16 with cacheComponents, instant = false allows blocking SSR route reading cookies()
export const instant = false;

// Helper: format "HH:MM:SS" → "H:MM AM/PM"
function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

function formatSlot(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

interface FacilityInfo {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface RequestRow {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participants: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  facilities: FacilityInfo | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  // Must be authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Must be a student
  const { data: student } = await supabase
    .from("student")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!student) redirect("/login");

  // Fetch this student's booking requests, joined with facility info
  const { data: requests, error } = await supabase
    .from("booking_requests")
    .select(
      `
      id,
      booking_date,
      start_time,
      end_time,
      purpose,
      participants,
      status,
      rejection_reason,
      created_at,
      facilities (
        id,
        name,
        location,
        type
      )
    `
    )
    .eq("student_id", user.id)
    .order("booking_date", { ascending: false });

  if (error) {
    console.error("Failed to load booking requests:", error.message);
  }

  const allRequests = (requests ?? []) as unknown as RequestRow[];

  const confirmed = allRequests.filter((r) => r.status === "approved");
  const pending = allRequests.filter((r) => r.status === "pending");
  const rejected = allRequests.filter((r) => r.status === "rejected");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>IIM Lucknow Student Space Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
              Welcome back, {student.name}
            </h1>
            <p className="text-sm text-slate-600">{student.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/book">
              <Button className="bg-amber-900 hover:bg-amber-800 text-white font-medium shadow-xs px-5 h-11 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Book a Space</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Confirmed Bookings
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{confirmed.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{pending.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{allRequests.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">Confirmed Bookings</h2>
            </div>
            <span className="text-xs text-slate-500">
              {confirmed.length} active reservation{confirmed.length === 1 ? "" : "s"}
            </span>
          </div>

          {confirmed.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white text-center py-8">
              <CardContent className="space-y-2">
                <CalendarDays className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-700">No confirmed bookings</p>
                <p className="text-xs text-slate-500">
                  Book a discussion pod, sports court, or auditorium to get started.
                </p>
                <div className="pt-2">
                  <Link href="/book">
                    <Button variant="outline" size="sm" className="text-xs">
                      Explore Campus Spaces
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {confirmed.map((b) => {
                const fac = b.facilities;
                return (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-colors space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {fac && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {fac.type}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {fac?.name ?? "Unknown Facility"}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirmed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/70 p-3 rounded border border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">Date</span>
                          <span className="font-medium text-slate-800">{b.booking_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">Time</span>
                          <span className="font-medium text-slate-800">
                            {formatSlot(b.start_time, b.end_time)}
                          </span>
                        </div>
                      </div>

                      {fac && (
                        <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-slate-200/60">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-500 font-medium">Purpose:</div>
                      <div className="text-slate-700 bg-white rounded p-2 border border-slate-100">
                        {b.purpose}
                      </div>
                    </div>

                    <div className="flex items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {b.participants} participants
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-800" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">Pending Requests</h2>
            </div>
            <span className="text-xs text-slate-500">
              {pending.length} request{pending.length === 1 ? "" : "s"} under review
            </span>
          </div>

          {pending.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white text-center py-8">
              <CardContent className="space-y-2">
                <Clock className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-700">No pending requests</p>
                <p className="text-xs text-slate-500">
                  All your booking requests have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((b) => {
                const fac = b.facilities as { name: string; location: string; type: string } | null;
                return (
                  <div
                    key={b.id}
                    className="bg-white border border-amber-200/80 rounded-lg p-5 shadow-xs hover:border-amber-300 transition-colors space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {fac && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {fac.type}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {fac?.name ?? "Unknown Facility"}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                        <Clock className="h-3.5 w-3.5 animate-pulse" />
                        Pending Approval
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-amber-50/30 p-3 rounded border border-amber-100/60">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">Date</span>
                          <span className="font-medium text-slate-800">{b.booking_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase">Time</span>
                          <span className="font-medium text-slate-800">
                            {formatSlot(b.start_time, b.end_time)}
                          </span>
                        </div>
                      </div>

                      {fac && (
                        <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-amber-100">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-500 font-medium">Purpose:</div>
                      <div className="text-slate-700 bg-slate-50 rounded p-2">{b.purpose}</div>
                    </div>

                    <div className="flex items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {b.participants} participants
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Rejected Requests */}
        {rejected.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected Requests ({rejected.length})
            </h3>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs divide-y divide-slate-100">
              {rejected.map((r) => {
                const fac = r.facilities as { name: string } | null;
                return (
                  <div key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                    <div>
                      <div>
                        <strong>{fac?.name ?? "Facility"}</strong> — {r.booking_date}{" "}
                        {formatSlot(r.start_time, r.end_time)}
                      </div>
                      {r.rejection_reason && (
                        <div className="text-[11px] text-red-600/90 mt-0.5">
                          Reason: {r.rejection_reason}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded self-start sm:self-auto shrink-0">
                      Rejected
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Indian Institute of Management Lucknow • Prabandh Nagar, IIM Road, Lucknow - 226013
        </div>
      </footer>
    </div>
  );
}
