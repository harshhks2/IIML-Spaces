-- ==============================================================================
-- IIML SPACES: SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Exactly four application tables:
-- 1. admin
-- 2. student
-- 3. facilities
-- 4. booking_requests
--
-- Authentication is managed directly via Supabase Auth (auth.users).
-- Passwords are NOT stored in admin or student tables.
-- ==============================================================================

-- 0. Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ADMIN TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- ==============================================================================
-- 2. STUDENT TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- ==============================================================================
-- 3. FACILITIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true
);

-- ==============================================================================
-- 4. BOOKING_REQUESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    participants INTEGER NOT NULL CHECK (participants > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_time_window CHECK (start_time < end_time)
);

-- Useful indexes for querying availability & dashboards
CREATE INDEX IF NOT EXISTS idx_booking_requests_facility_date 
    ON public.booking_requests (facility_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_booking_requests_student 
    ON public.booking_requests (student_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status 
    ON public.booking_requests (status);

-- ==============================================================================
-- HELPER FUNCTION: Check if the current user is an Admin
-- (SECURITY DEFINER bypasses RLS on public.admin to avoid recursion)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin WHERE id = auth.uid()
    );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 4 application tables
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: admin table
-- ------------------------------------------------------------------------------
-- Admins can read admin records
CREATE POLICY "Admins can read admin records"
    ON public.admin
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: student table
-- ------------------------------------------------------------------------------
-- Students can read their own profile (and Admins can read all student profiles)
CREATE POLICY "Students can read own profile"
    ON public.student
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

-- Students can insert their own student profile upon account registration
CREATE POLICY "Students can insert own profile"
    ON public.student
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Students can update their own student profile
CREATE POLICY "Students can update own profile"
    ON public.student
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS: facilities table
-- ------------------------------------------------------------------------------
-- Both students and admins can view active facilities
CREATE POLICY "Authenticated users can view facilities"
    ON public.facilities
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can add or update facilities
CREATE POLICY "Admins can manage facilities"
    ON public.facilities
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: booking_requests table
-- ------------------------------------------------------------------------------
-- Students can read their own requests; Admins can read all requests
CREATE POLICY "Read booking requests"
    ON public.booking_requests
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

-- Students can create booking requests for themselves with status 'pending'
CREATE POLICY "Students can create own booking requests"
    ON public.booking_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid() 
        AND status = 'pending'
    );

-- Admins can approve or reject booking requests
CREATE POLICY "Admins can update booking requests"
    ON public.booking_requests
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- SEED / DEMO DATA: CAMPUS FACILITIES
-- ==============================================================================
INSERT INTO public.facilities (id, name, type, location, capacity, description, active)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Manthan Auditorium',
        'Auditorium',
        'Management Development Center (MDC)',
        350,
        'Premier amphitheater auditorium equipped with acoustic treatment, dual-projection display, stage lighting, and VIP dais for conferences.',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Bodhi Tree Discussion Pod 4',
        'Discussion Room',
        'Academic Block - Wing B, Level 1',
        8,
        'Acoustically insulated collaborative room designed for group project meetings, case study syndicate discussions, and club meetings.',
        true
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Chintan Executive Syndicate Room',
        'Discussion Room',
        'Library Complex, Ground Floor',
        14,
        'Spacious conference room featuring executive swivel chairs, teleconference soundbar, and glass frontage facing the central lawns.',
        true
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Badminton Court 1 (Indoor)',
        'Sports',
        'Indoor Sports Complex',
        4,
        'International regulation synthetic wooden-cushioned court with high-lux tournament LED lighting and spectator gallery.',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Computer Center Lab 2',
        'Lab',
        'Computer Center, 2nd Floor',
        60,
        'High-performance computing laboratory equipped with dual-monitor developer terminals and statistical packages (R, Python, SPSS).',
        true
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'SAC Multi-Purpose Hall',
        'Hall',
        'Student Activity Center (SAC)',
        120,
        'Spacious modular hall for student committee orientations, cultural workshops, guest speaker interactions, and open rehearsals.',
        true
    ),
    (
        '71111111-1111-1111-1111-111111111111',
        'CR-12',
        'Academic',
        'Academic Block, Level 1',
        60,
        'Tiered air-conditioned lecture classroom equipped with dual projection and smart podium.',
        true
    ),
    (
        '72222222-2222-2222-2222-222222222222',
        'CR-14',
        'Academic',
        'Academic Block, Level 2',
        60,
        'Tiered lecture theater with interactive whiteboard and lapel audio microphone system.',
        true
    ),
    (
        '73333333-3333-3333-3333-333333333333',
        'Classroom A',
        'Academic',
        'Chanakya Block, Ground Floor',
        75,
        'Spacious tiered case discussion hall with central projection and horseshoe syndicate seating.',
        true
    ),
    (
        '74444444-4444-4444-4444-444444444444',
        'Classroom B',
        'Academic',
        'Chanakya Block, 1st Floor',
        75,
        'Multi-media equipped lecture hall optimized for case study analysis and committee presentations.',
        true
    ),
    (
        '81111111-1111-1111-1111-111111111111',
        'Meeting Room 1',
        'Meeting',
        'Administration Block, 1st Floor',
        16,
        'Executive conference room with teleconference video bar and high-speed campus Wi-Fi.',
        true
    ),
    (
        '82222222-2222-2222-2222-222222222222',
        'Discussion Room 1',
        'Meeting',
        'Library Complex, Level 1',
        8,
        'Acoustic syndicate room for student group work, prep sessions, and committee discussions.',
        true
    ),
    (
        '83333333-3333-3333-3333-333333333333',
        'Discussion Room 2',
        'Meeting',
        'Library Complex, Level 1',
        10,
        'Comfortable discussion pod with dry-erase boards and presentation monitor.',
        true
    ),
    (
        '91111111-1111-1111-1111-111111111111',
        'Badminton Court 2',
        'Sports',
        'Indoor Sports Complex',
        4,
        'Synthetic wooden court with tournament LED fixtures and spectator gallery.',
        true
    ),
    (
        '92222222-2222-2222-2222-222222222222',
        'Cricket Ground',
        'Sports',
        'Campus Sports Pavilion',
        30,
        'Full-size natural turf cricket oval with practice nets and pavilion facilities.',
        true
    )
ON CONFLICT (id) DO NOTHING;
