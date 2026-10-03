"use server";

import { createClient } from "@/lib/supabase/server";
import { TIME_SLOTS } from "@/lib/constants";

export type SlotStatus = "available" | "pending" | "booked";

export interface SlotInfo {
  id: string;
  label: string;
  start: string;
  end: string;
  status: SlotStatus;
}

/**
 * Server-side slot availability check for a facility + date.
 * Returns the status of each fixed slot.
 */
export async function getSlotAvailability(
  facilityId: string,
  date: string
): Promise<SlotInfo[]> {
  const supabase = await createClient();

  const { data: existingRequests } = await supabase
    .from("booking_requests")
    .select("start_time, end_time, status")
    .eq("facility_id", facilityId)
    .eq("booking_date", date)
    .in("status", ["pending", "approved"]);

  return TIME_SLOTS.map((slot) => {
    const slotStart = slot.start;
    const slotEnd = slot.end;

    const conflict = (existingRequests ?? []).find((r) => {
      const rStart = r.start_time.substring(0, 5); // "HH:MM"
      const rEnd = r.end_time.substring(0, 5);
      // Overlaps if: rStart < slotEnd AND rEnd > slotStart
      return rStart < slotEnd && rEnd > slotStart;
    });

    let status: SlotStatus = "available";
    if (conflict) {
      status = conflict.status === "approved" ? "booked" : "pending";
    }

    return { ...slot, status };
  });
}

export type SubmitBookingResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: submit a booking request.
 * Validates, checks conflicts server-side, then inserts.
 */
export async function submitBookingRequest(
  formData: FormData
): Promise<SubmitBookingResult> {
  const supabase = await createClient();

  // Resolve authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to book a space." };
  }

  // Confirm the user is a student
  const { data: studentRecord } = await supabase
    .from("student")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!studentRecord) {
    return { success: false, error: "Only students can submit booking requests." };
  }

  const facilityId = formData.get("facility_id") as string;
  const bookingDate = formData.get("booking_date") as string;
  const slotId = formData.get("slot_id") as string;
  const purpose = (formData.get("purpose") as string)?.trim();
  const participantsRaw = formData.get("participants") as string;
  const participants = parseInt(participantsRaw, 10);

  // --- Basic validation ---
  if (!facilityId || !bookingDate || !slotId || !purpose || isNaN(participants)) {
    return { success: false, error: "All fields are required." };
  }

  const today = new Date().toISOString().split("T")[0];
  if (bookingDate < today) {
    return { success: false, error: "Booking date must be today or in the future." };
  }

  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  if (!slot) {
    return { success: false, error: "Invalid time slot selected." };
  }

  if (participants < 1) {
    return { success: false, error: "Participants must be at least 1." };
  }

  // Fetch facility to validate capacity
  const { data: facility } = await supabase
    .from("facilities")
    .select("capacity, active")
    .eq("id", facilityId)
    .single();

  if (!facility || !facility.active) {
    return { success: false, error: "Facility not found or inactive." };
  }

  if (participants > facility.capacity) {
    return {
      success: false,
      error: `Participants (${participants}) cannot exceed the facility capacity (${facility.capacity}).`,
    };
  }

  // --- Server-side conflict check ---
  const { data: conflicts } = await supabase
    .from("booking_requests")
    .select("id, status")
    .eq("facility_id", facilityId)
    .eq("booking_date", bookingDate)
    .in("status", ["pending", "approved"])
    .lt("start_time", slot.end)  // conflict if existing starts before our slot ends
    .gt("end_time", slot.start); // conflict if existing ends after our slot starts

  if (conflicts && conflicts.length > 0) {
    const hasApproved = conflicts.some((c) => c.status === "approved");
    if (hasApproved) {
      return {
        success: false,
        error: "This slot is no longer available. Please choose another slot.",
      };
    }
    return {
      success: false,
      error: "This slot already has a pending request. Please choose another slot.",
    };
  }

  // --- Insert booking request ---
  const { error: insertError } = await supabase.from("booking_requests").insert({
    student_id: user.id,
    facility_id: facilityId,
    booking_date: bookingDate,
    start_time: slot.start,
    end_time: slot.end,
    purpose,
    participants,
    status: "pending",
  });

  if (insertError) {
    console.error("Insert error:", insertError);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  return { success: true };
}

export type ApproveResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Admin approves a booking request.
 * Re-checks conflict server-side before approving.
 */
export async function approveBookingRequest(
  bookingId: string
): Promise<ApproveResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized." };

  const { data: adminRecord } = await supabase
    .from("admin")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRecord) return { success: false, error: "Unauthorized. Admins only." };

  // Fetch the booking being approved
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("facility_id, booking_date, start_time, end_time, status")
    .eq("id", bookingId)
    .single();

  if (!booking) return { success: false, error: "Booking not found." };

  if (booking.status !== "pending") {
    return { success: false, error: "Only pending requests can be approved." };
  }

  // Server-side conflict check: is there already an APPROVED booking that overlaps?
  const { data: conflicts } = await supabase
    .from("booking_requests")
    .select("id")
    .eq("facility_id", booking.facility_id)
    .eq("booking_date", booking.booking_date)
    .eq("status", "approved")
    .neq("id", bookingId)
    .lt("start_time", booking.end_time)
    .gt("end_time", booking.start_time);

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error:
        "Cannot approve: another booking has already been confirmed for this slot. Please reject this request.",
    };
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ status: "approved" })
    .eq("id", bookingId);

  if (error) return { success: false, error: "Failed to approve request." };

  return { success: true };
}

export type RejectResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Admin rejects a booking request.
 */
export async function rejectBookingRequest(
  bookingId: string,
  reason?: string
): Promise<RejectResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized." };

  const { data: adminRecord } = await supabase
    .from("admin")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRecord) return { success: false, error: "Unauthorized. Admins only." };

  const { error } = await supabase
    .from("booking_requests")
    .update({
      status: "rejected",
      rejection_reason: reason ?? "Administrative rejection",
    })
    .eq("id", bookingId)
    .eq("status", "pending"); // only reject pending

  if (error) return { success: false, error: "Failed to reject request." };

  return { success: true };
}
