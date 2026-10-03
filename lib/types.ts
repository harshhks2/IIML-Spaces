export type FacilityCategory =
  | "Auditorium & Halls"
  | "Discussion Rooms"
  | "Sports & Recreation"
  | "Labs & Classrooms";

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  location: string;
  capacity: number;
  description: string;
  amenities: string[];
  imageUrl?: string;
  isActive: boolean;
}

export type SlotStatus = "available" | "pending" | "booked";

export interface TimeSlot {
  id: string;
  time: string; // e.g. "09:00 AM - 10:30 AM"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  status: SlotStatus;
  bookedBy?: string;
  purpose?: string;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface BookingRequest {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityLocation: string;
  category: FacilityCategory;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string;
  startTime: string;
  endTime: string;
  purpose: string;
  participants: number;
  status: BookingStatus;
  adminNotes?: string;
  submittedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  rollNumber?: string;
  department?: string;
}

// ============================================================================
// Supabase Database Row Interfaces (matching supabase/schema.sql)
// ============================================================================
export interface DbAdmin {
  id: string; // references auth.users(id)
  name: string;
  email: string;
}

export interface DbStudent {
  id: string; // references auth.users(id)
  name: string;
  email: string;
}

export interface DbFacility {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  description: string | null;
  active: boolean;
}

export type DbBookingStatus = "pending" | "approved" | "rejected";

export interface DbBookingRequest {
  id: string;
  student_id: string;
  facility_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  purpose: string;
  participants: number;
  status: DbBookingStatus;
  rejection_reason: string | null;
  created_at: string;
}
