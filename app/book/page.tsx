"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { getSlotAvailability, submitBookingRequest } from "@/app/actions/bookings";
import { TIME_SLOTS } from "@/lib/constants";
import type { SlotInfo } from "@/app/actions/bookings";
import type { DbFacility } from "@/lib/types";
import {
  Building2,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Send,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type FacilityWithType = DbFacility;

export default function BookPage() {
  const router = useRouter();
  // Stable supabase client (useMemo prevents re-creation on every render)
  const supabase = useMemo(() => createClient(), []);

  // ── Facilities list ──────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<FacilityWithType[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [facilityError, setFacilityError] = useState("");

  // ── Selected facility ────────────────────────────────────────────────────
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // ── Slots ────────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Booking form ─────────────────────────────────────────────────────────
  const [todayStr, setTodayStr] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [participants, setParticipants] = useState(2);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // ── Fetch active facilities on mount ─────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    setBookingDate(today);
  }, []);

  useEffect(() => {
    async function loadFacilities() {
      setLoadingFacilities(true);
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) {
        setFacilityError("Failed to load facilities. Please refresh.");
      } else {
        setFacilities(data ?? []);
      }
      setLoadingFacilities(false);
    }
    loadFacilities();
  }, [supabase]);

  // ── Load slots whenever facility or date changes ──────────────────────────
  useEffect(() => {
    if (!selectedFacility) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlotId("");
      const result = await getSlotAvailability(selectedFacility!.id, bookingDate);
      setSlots(result);
      setLoadingSlots(false);
    }
    loadSlots();
  }, [selectedFacility, bookingDate]);

  // ── Categories ────────────────────────────────────────────────────────────
  const allTypes = Array.from(new Set(facilities.map((f) => f.type)));
  const categories = ["All", ...allTypes];

  const filteredFacilities =
    selectedCategory === "All"
      ? facilities
      : facilities.filter((f) => f.type === selectedCategory);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFacilitySelect = (facility: FacilityWithType) => {
    setSelectedFacility(facility);
    setSelectedSlotId("");
    setFormError("");
    setSuccessMsg("");
    setParticipants(Math.min(4, facility.capacity));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSelectedFacility(null);
    setSelectedSlotId("");
    setFormError("");
    setSuccessMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedFacility) return;
    if (!selectedSlotId) {
      setFormError("Please select a time slot.");
      return;
    }
    if (!purpose.trim()) {
      setFormError("Please enter the purpose for the reservation.");
      return;
    }
    if (participants < 1 || participants > selectedFacility.capacity) {
      setFormError(
        `Participants must be between 1 and ${selectedFacility.capacity}.`
      );
      return;
    }

    const fd = new FormData();
    fd.set("facility_id", selectedFacility.id);
    fd.set("booking_date", bookingDate);
    fd.set("slot_id", selectedSlotId);
    fd.set("purpose", purpose.trim());
    fd.set("participants", String(participants));

    startTransition(async () => {
      const result = await submitBookingRequest(fd);
      if (result.success) {
        setSuccessMsg(
          `Your booking request for ${selectedFacility.name} on ${bookingDate} has been submitted and is pending approval.`
        );
        // Force a full re-fetch of /home so the new pending request appears
        router.refresh();
        setTimeout(() => router.push("/home"), 100);
      } else {
        setFormError(result.error);
        // Refresh slots in case availability changed
        const updated = await getSlotAvailability(selectedFacility.id, bookingDate);
        setSlots(updated);
        setSelectedSlotId("");
      }
    });
  };

  // ── Render: Facility List ─────────────────────────────────────────────────
  if (!selectedFacility) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Campus Facilities
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
                Book a Space at IIM Lucknow
              </h1>
              <p className="text-sm text-slate-600">
                Select a facility to view availability and submit a reservation request.
              </p>
            </div>

            {/* Category filter */}
            {!loadingFacilities && facilities.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-amber-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading */}
          {loadingFacilities && (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading campus facilities...
            </div>
          )}

          {/* Error */}
          {facilityError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {facilityError}
            </div>
          )}

          {/* Facility grid */}
          {!loadingFacilities && !facilityError && (
            <>
              {filteredFacilities.length === 0 ? (
                <Card className="border-dashed border-slate-300 bg-white text-center py-10">
                  <CardContent className="space-y-2">
                    <Building2 className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-700">No facilities in this category</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFacilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {facility.type}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {facility.capacity} seats
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {facility.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{facility.location}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {facility.description}
                        </p>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-100">
                        <Button
                          onClick={() => handleFacilitySelect(facility)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-medium shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>View &amp; Book</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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

  // ── Render: Facility Detail + Booking Form ────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back nav */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Facilities
        </button>

        {/* Success banner */}
        {successMsg && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Request Submitted!</h3>
                <p className="text-xs text-emerald-800 mt-0.5">{successMsg}</p>
                <p className="text-xs text-emerald-700 mt-1">Redirecting to Home...</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Facility details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedFacility.type}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2 font-serif">
                  {selectedFacility.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{selectedFacility.location}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Max Capacity</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  {selectedFacility.capacity} persons
                </span>
              </div>

              {selectedFacility.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    About this Facility
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedFacility.description}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-3 text-[11px] text-amber-900 flex gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-800" />
                <span>
                  Booking requests are reviewed by the Estate Office. Please allow up to 2 hours
                  for slot confirmation.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Slots + Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Slot picker */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Date &amp; Time Slot</h3>
                  <p className="text-xs text-slate-500">Live availability from the database</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-select" className="text-xs font-medium text-slate-700 shrink-0">
                    Date:
                  </Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={bookingDate}
                    min={todayStr}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setSelectedSlotId("");
                    }}
                    className="text-xs w-36 h-8 border-slate-300"
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Available</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Pending</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-600">Booked</span>
                </span>
              </div>

              {/* Slots */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {slots.map((slot) => {
                    const isAvailable = slot.status === "available";
                    const isPending = slot.status === "pending";
                    const isBooked = slot.status === "booked";
                    const isSelected = selectedSlotId === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => {
                          if (isAvailable) setSelectedSlotId(slot.id);
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border text-left text-xs transition-all ${
                          isSelected
                            ? "border-amber-900 bg-amber-50/80 ring-2 ring-amber-900/20 text-slate-900 font-semibold"
                            : isAvailable
                            ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 cursor-pointer"
                            : isPending
                            ? "border-amber-200 bg-amber-50/40 text-slate-600 cursor-not-allowed opacity-80"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`h-3.5 w-3.5 ${
                              isSelected
                                ? "text-amber-900"
                                : isAvailable
                                ? "text-emerald-700"
                                : isPending
                                ? "text-amber-700"
                                : "text-slate-400"
                            }`}
                          />
                          <span>{slot.label}</span>
                        </div>
                        <div>
                          {isAvailable && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              {isSelected ? "Selected ✓" : "Available"}
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-medium text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                          {isBooked && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                              Booked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Booking Request</h3>
                <p className="text-xs text-slate-500">Fill in reservation details</p>
              </div>

              {formError && (
                <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date + slot summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Date</Label>
                    <Input
                      type="date"
                      value={bookingDate}
                      min={todayStr}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setSelectedSlotId("");
                      }}
                      className="text-xs h-9 bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Time Slot</Label>
                    <div className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-xs text-slate-700">
                      {selectedSlotId
                        ? TIME_SLOTS.find((s) => s.id === selectedSlotId)?.label ?? "—"
                        : (
                          <span className="text-slate-400">
                            — click a slot above to select —
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="participants" className="text-xs font-medium text-slate-700">
                    Number of Participants (Max: {selectedFacility.capacity})
                  </Label>
                  <Input
                    id="participants"
                    type="number"
                    min={1}
                    max={selectedFacility.capacity}
                    value={participants}
                    onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
                    className="text-xs h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purpose" className="text-xs font-medium text-slate-700">
                    Purpose of Reservation
                  </Label>
                  <textarea
                    id="purpose"
                    rows={3}
                    placeholder="e.g., Committee Orientation, Case Analysis Syndicate, Section Badminton Session..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-800 bg-white"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isPending || !selectedSlotId || !!successMsg}
                    className="w-full bg-amber-900 hover:bg-amber-800 text-white font-medium text-xs h-10 shadow-xs flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Submit Booking Request
                      </>
                    )}
                  </Button>
                  {!selectedSlotId && (
                    <p className="text-[11px] text-slate-400 text-center mt-1.5">
                      * Please select an available time slot above to enable submission
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Indian Institute of Management Lucknow • Prabandh Nagar, IIM Road, Lucknow - 226013
        </div>
      </footer>
    </div>
  );
}
