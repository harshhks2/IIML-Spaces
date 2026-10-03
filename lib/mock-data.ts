import { Facility, BookingRequest, TimeSlot, UserProfile } from "./types";
export type { Facility, BookingRequest, TimeSlot, UserProfile };

export const MOCK_STUDENT: UserProfile = {
  id: "std-001",
  name: "Aarav Sharma",
  email: "aarav.pgp38@iiml.ac.in",
  role: "student",
  rollNumber: "PGP38-042",
  department: "PGP 2025-27",
};

export const MOCK_ADMIN: UserProfile = {
  id: "adm-001",
  name: "Prof. V. K. Verma",
  email: "estate.admin@iiml.ac.in",
  role: "admin",
  department: "Estate & Campus Facilities Office",
};

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: "fac-1",
    name: "Manthan Auditorium",
    category: "Auditorium & Halls",
    location: "Management Development Center (MDC)",
    capacity: 350,
    description:
      "Premier amphitheater auditorium equipped with acoustic treatment, dual-projection display, stage lighting, and VIP dais for symposia and conclaves.",
    amenities: [
      "Dual HD Projectors",
      "Surround Sound System",
      "Podium Microphone",
      "Central HVAC",
      "Green Rooms",
    ],
    isActive: true,
  },
  {
    id: "fac-2",
    name: "Bodhi Tree Discussion Pod 4",
    category: "Discussion Rooms",
    location: "Academic Block - Wing B, Level 1",
    capacity: 8,
    description:
      "Acoustically insulated collaborative room designed for group project meetings, case study syndicate discussions, and club meetings.",
    amenities: [
      "Magnetic Whiteboard",
      "55\" Smart Display (HDMI / AirPlay)",
      "High-speed Campus Wi-Fi",
      "Power Sockets at Table",
    ],
    isActive: true,
  },
  {
    id: "fac-3",
    name: "Chintan Executive Syndicate Room",
    category: "Discussion Rooms",
    location: "Library Complex, Ground Floor",
    capacity: 14,
    description:
      "Spacious conference room featuring executive swivel chairs, teleconference soundbar, and panoramic glass frontage facing the central lawns.",
    amenities: [
      "4K Video Conferencing Bar",
      "Dual Whiteboards",
      "Executive Seating",
      "LAN Ethernet Ports",
    ],
    isActive: true,
  },
  {
    id: "fac-4",
    name: "Badminton Court 1 (Indoor)",
    category: "Sports & Recreation",
    location: "Indoor Sports Complex",
    capacity: 4,
    description:
      "International regulation synthetic wooden-cushioned court with high-lux non-glare LED tournament lighting and spectator gallery.",
    amenities: [
      "Synthetic Court Mat",
      "Tournament LED Lighting",
      "Yonex Netting",
      "Locker Room Access",
    ],
    isActive: true,
  },
  {
    id: "fac-5",
    name: "Computer Center Lab 2",
    category: "Labs & Classrooms",
    location: "Computer Center, 2nd Floor",
    capacity: 60,
    description:
      "High-performance computing laboratory equipped with dual-monitor developer terminals, statistical packages (R, Python, SPSS), and central projector.",
    amenities: [
      "60 Workstations",
      "Dual Ceiling Projectors",
      "Centralized UPS Backup",
      "Laser Printing Station",
    ],
    isActive: true,
  },
  {
    id: "fac-6",
    name: "SAC Multi-Purpose Hall",
    category: "Auditorium & Halls",
    location: "Student Activity Center (SAC)",
    capacity: 120,
    description:
      "Spacious modular hall for student committee orientations, cultural workshops, guest speaker interactions, and open rehearsals.",
    amenities: [
      "Modular Seating",
      "Portable PA Audio Setup",
      "Elevated Stage",
      "Acoustic Wall Paneling",
    ],
    isActive: true,
  },
];

export const STANDARD_TIME_SLOTS = [
  { id: "s1", time: "08:30 AM - 10:00 AM", startTime: "08:30", endTime: "10:00" },
  { id: "s2", time: "10:15 AM - 11:45 AM", startTime: "10:15", endTime: "11:45" },
  { id: "s3", time: "12:00 PM - 01:30 PM", startTime: "12:00", endTime: "13:30" },
  { id: "s4", time: "02:00 PM - 03:30 PM", startTime: "14:00", endTime: "15:30" },
  { id: "s5", time: "03:45 PM - 05:15 PM", startTime: "15:45", endTime: "17:15" },
  { id: "s6", time: "05:30 PM - 07:00 PM", startTime: "17:30", endTime: "19:00" },
  { id: "s7", time: "07:15 PM - 08:45 PM", startTime: "19:15", endTime: "20:45" },
  { id: "s8", time: "09:00 PM - 10:30 PM", startTime: "21:00", endTime: "22:30" },
];

// Helper to format date offset from today (e.g. today, tomorrow)
function getOffsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const INITIAL_BOOKINGS: BookingRequest[] = [
  {
    id: "req-101",
    facilityId: "fac-1",
    facilityName: "Manthan Auditorium",
    facilityLocation: "Management Development Center (MDC)",
    category: "Auditorium & Halls",
    studentId: "std-001",
    studentName: "Aarav Sharma",
    studentRoll: "PGP38-042",
    studentEmail: "aarav.pgp38@iiml.ac.in",
    bookingDate: getOffsetDate(1),
    timeSlot: "02:00 PM - 03:30 PM",
    startTime: "14:00",
    endTime: "15:30",
    purpose: "Consulting Club - Annual Case Workshop & Partner Keynote",
    participants: 180,
    status: "CONFIRMED",
    submittedAt: "Yesterday at 04:30 PM",
  },
  {
    id: "req-102",
    facilityId: "fac-4",
    facilityName: "Badminton Court 1 (Indoor)",
    facilityLocation: "Indoor Sports Complex",
    category: "Sports & Recreation",
    studentId: "std-001",
    studentName: "Aarav Sharma",
    studentRoll: "PGP38-042",
    studentEmail: "aarav.pgp38@iiml.ac.in",
    bookingDate: getOffsetDate(0),
    timeSlot: "05:30 PM - 07:00 PM",
    startTime: "17:30",
    endTime: "19:00",
    purpose: "Inter-Section Badminton Championship Practice",
    participants: 4,
    status: "CONFIRMED",
    submittedAt: "Today at 09:15 AM",
  },
  {
    id: "req-103",
    facilityId: "fac-2",
    facilityName: "Bodhi Tree Discussion Pod 4",
    facilityLocation: "Academic Block - Wing B, Level 1",
    category: "Discussion Rooms",
    studentId: "std-001",
    studentName: "Aarav Sharma",
    studentRoll: "PGP38-042",
    studentEmail: "aarav.pgp38@iiml.ac.in",
    bookingDate: getOffsetDate(2),
    timeSlot: "03:45 PM - 05:15 PM",
    startTime: "15:45",
    endTime: "17:15",
    purpose: "Term IV Marketing Strategy Group Case Submission Prep",
    participants: 6,
    status: "PENDING",
    submittedAt: "Today at 11:20 AM",
  },
  {
    id: "req-104",
    facilityId: "fac-5",
    facilityName: "Computer Center Lab 2",
    facilityLocation: "Computer Center, 2nd Floor",
    category: "Labs & Classrooms",
    studentId: "std-002",
    studentName: "Priya Nair",
    studentRoll: "PGP38-115",
    studentEmail: "priya.pgp38@iiml.ac.in",
    bookingDate: getOffsetDate(1),
    timeSlot: "10:15 AM - 11:45 AM",
    startTime: "10:15",
    endTime: "11:45",
    purpose: "Analytics Club Python Hands-on Data Engineering Session",
    participants: 45,
    status: "PENDING",
    submittedAt: "Today at 10:05 AM",
  },
  {
    id: "req-105",
    facilityId: "fac-3",
    facilityName: "Chintan Executive Syndicate Room",
    facilityLocation: "Library Complex, Ground Floor",
    category: "Discussion Rooms",
    studentId: "std-003",
    studentName: "Rohan Gupta",
    studentRoll: "FPM24-008",
    studentEmail: "rohan.fpm24@iiml.ac.in",
    bookingDate: getOffsetDate(0),
    timeSlot: "12:00 PM - 01:30 PM",
    startTime: "12:00",
    endTime: "13:30",
    purpose: "Doctoral Research Advisory Committee Colloquium",
    participants: 8,
    status: "CONFIRMED",
    submittedAt: "2 days ago",
  },
];

const STORAGE_KEY = "iiml_spaces_bookings_v1";

export function getStoredBookings(): BookingRequest[] {
  if (typeof window === "undefined") {
    return INITIAL_BOOKINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveNewBooking(booking: Omit<BookingRequest, "id" | "submittedAt">): BookingRequest {
  const current = getStoredBookings();
  const newBooking: BookingRequest = {
    ...booking,
    id: `req-${Date.now().toString().slice(-4)}`,
    submittedAt: "Just now",
  };
  const updated = [newBooking, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("iiml_storage_update"));
  }
  return newBooking;
}

export function updateBookingStatus(
  bookingId: string,
  newStatus: "CONFIRMED" | "REJECTED",
  adminNotes?: string
): BookingRequest[] {
  const current = getStoredBookings();
  const updated = current.map((item) =>
    item.id === bookingId ? { ...item, status: newStatus, adminNotes } : item
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("iiml_storage_update"));
  }
  return updated;
}

export function resetMockData(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
    window.dispatchEvent(new Event("iiml_storage_update"));
  }
}

/**
 * Calculates slot statuses for a given facility on a given date
 * based on all existing bookings.
 */
export function getSlotsForFacilityDate(
  facilityId: string,
  dateStr: string,
  bookings: BookingRequest[]
): TimeSlot[] {
  // Find bookings for this facility on this date
  const relevantBookings = bookings.filter(
    (b) => b.facilityId === facilityId && b.bookingDate === dateStr
  );

  return STANDARD_TIME_SLOTS.map((slot) => {
    const match = relevantBookings.find((b) => b.timeSlot === slot.time);

    let status: "available" | "pending" | "booked" = "available";
    let bookedBy: string | undefined = undefined;
    let purpose: string | undefined = undefined;

    if (match) {
      if (match.status === "CONFIRMED") {
        status = "booked";
        bookedBy = match.studentName;
        purpose = match.purpose;
      } else if (match.status === "PENDING") {
        status = "pending";
        bookedBy = match.studentName;
        purpose = match.purpose;
      }
    }

    return {
      id: `${facilityId}-${dateStr}-${slot.id}`,
      time: slot.time,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status,
      bookedBy,
      purpose,
    };
  });
}
