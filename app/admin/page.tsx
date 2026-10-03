"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { approveBookingRequest, rejectBookingRequest } from "@/app/actions/bookings";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Users,
  MapPin,
  Building2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Helper: format "HH:MM:SS" → "H:MM AM/PM"
function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}
function formatSlot(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

interface BookingRow {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participants: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  facilities: { name: string; location: string; type: string } | null;
  student: { name: string; email: string } | null;
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null); // tracks which card is processing
  const [rejectModalReq, setRejectModalReq] = useState<BookingRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
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
          name,
          location,
          type
        ),
        student:student_id (
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError("Failed to load bookings. Please refresh.");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBookings((data as any[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const showFeedback = (msg: string, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleApprove = (id: string) => {
    setActionId(id);
    startTransition(async () => {
      const result = await approveBookingRequest(id);
      if (result.success) {
        showFeedback("Request approved successfully.");
      } else {
        showFeedback(result.error, true);
      }
      await loadBookings();
      setActionId(null);
    });
  };

  const openRejectModal = (req: BookingRow) => {
    setRejectModalReq(req);
    setRejectionReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectModalReq) return;
    const id = rejectModalReq.id;
    const reason = rejectionReason.trim();
    setActionId(id);
    setRejectModalReq(null);
    startTransition(async () => {
      const result = await rejectBookingRequest(id, reason || undefined);
      if (result.success) {
        showFeedback("Request rejected.");
      } else {
        showFeedback(result.error, true);
      }
      await loadBookings();
      setActionId(null);
    });
  };

  const pendingReqs = bookings.filter((b) => b.status === "pending");
  const confirmedReqs = bookings.filter((b) => b.status === "approved");
  const rejectedReqs = bookings.filter((b) => b.status === "rejected");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="rounded-xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Campus Facility Oversight
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif mt-2">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review and act on student booking requests. Conflicts are checked server-side before approval.
          </p>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between shadow-xs ${
              feedback.isError
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <span>{feedback.msg}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 ml-3">
              ✕
            </button>
          </div>
        )}

        {/* KPI cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-amber-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Pending Requests</p>
                <p className="text-3xl font-bold text-amber-950 mt-1">{pendingReqs.length}</p>
                <span className="text-[11px] text-amber-700">Requires review</span>
              </div>
              <div className="h-11 w-11 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Confirmed Bookings</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{confirmedReqs.length}</p>
                <span className="text-[11px] text-slate-500">Active reservations</span>
              </div>
              <div className="h-11 w-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{bookings.length}</p>
                <span className="text-[11px] text-slate-500">All time</span>
              </div>
              <div className="h-11 w-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading booking requests...
          </div>
        )}

        {loadError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {loadError}
          </div>
        )}

        {/* Section 1: Pending */}
        {!loading && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-900" />
                <h2 className="text-lg font-bold text-slate-900 font-serif">
                  Pending Requests ({pendingReqs.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500">Click Approve or Reject</span>
            </div>

            {pendingReqs.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white text-center py-10">
                <CardContent className="space-y-2">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-800">All clear!</h4>
                  <p className="text-xs text-slate-500">No requests awaiting approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingReqs.map((req) => {
                  const isProcessing = isPending && actionId === req.id;
                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs hover:border-amber-300 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {req.facilities && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {req.facilities.type}
                            </span>
                          )}
                          <span className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            {new Date(req.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {req.facilities?.name ?? "Unknown Facility"}
                          </h3>
                          {req.facilities && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {req.facilities.location}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {req.booking_date}
                          </div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatSlot(req.start_time, req.end_time)}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Users className="h-4 w-4 text-slate-400" />
                            {req.participants} participants
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          {req.student && (
                            <div>
                              <strong>Student:</strong> {req.student.name} ({req.student.email})
                            </div>
                          )}
                          <div>
                            <strong>Purpose:</strong>{" "}
                            <span className="italic text-slate-700">&ldquo;{req.purpose}&rdquo;</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 justify-end">
                        <Button
                          onClick={() => handleApprove(req.id)}
                          disabled={isProcessing}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-4 font-semibold shadow-xs flex items-center justify-center gap-1.5"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span>Approve</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => openRejectModal(req)}
                          disabled={isProcessing}
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs h-9 px-4 font-medium flex items-center justify-center gap-1.5"
                        >
                          <X className="h-4 w-4" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Section 2: Confirmed */}
        {!loading && (
          <section className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 font-serif">
                  Confirmed Bookings ({confirmedReqs.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500">Active campus space reservations</span>
            </div>

            {confirmedReqs.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white text-center py-8">
                <CardContent className="text-xs text-slate-500">No confirmed bookings yet.</CardContent>
              </Card>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Facility &amp; Location</th>
                        <th className="py-3 px-4">Reserved By</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {confirmedReqs.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <div>{b.facilities?.name ?? "—"}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {b.facilities?.location}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{b.student?.name ?? "—"}</div>
                            <div className="text-[11px] text-slate-400">{b.student?.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{b.booking_date}</div>
                            <div className="text-[11px] text-slate-500">
                              {formatSlot(b.start_time, b.end_time)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate" title={b.purpose}>
                            {b.purpose}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Section 3: Rejected */}
        {!loading && rejectedReqs.length > 0 && (
          <section className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected Requests ({rejectedReqs.length})
            </h3>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs divide-y divide-slate-100">
              {rejectedReqs.map((r) => (
                <div key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500">
                  <div>
                    <div>
                      <strong>{r.facilities?.name ?? "Facility"}</strong> — {r.booking_date}{" "}
                      {formatSlot(r.start_time, r.end_time)} — {r.student?.name ?? ""}
                    </div>
                    {r.rejection_reason && (
                      <div className="text-[11px] text-red-600/90 mt-0.5">
                        Reason: {r.rejection_reason}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded self-start sm:self-auto shrink-0">
                    Rejected
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rejection Modal */}
        {rejectModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject Booking Request
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are rejecting the request for{" "}
                  <strong>{rejectModalReq.facilities?.name ?? "Facility"}</strong> on{" "}
                  <strong>{rejectModalReq.booking_date}</strong> (
                  {formatSlot(rejectModalReq.start_time, rejectModalReq.end_time)}).
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="rejection-reason"
                  className="text-xs font-medium text-slate-700 block"
                >
                  Rejection Reason (Optional)
                </label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Space under scheduled maintenance, or required for institute conference."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectModalReq(null)}
                  className="text-xs h-9 px-4 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReject}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs h-9 px-4 font-semibold shadow-xs"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
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
