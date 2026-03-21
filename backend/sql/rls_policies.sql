-- ChronoMaria RLS policies
--
-- Run this in Supabase SQL Editor.
-- This script enables RLS and keeps only the user_functionality policy
--

BEGIN;

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS faculty_select_all ON public.faculty;
DROP POLICY IF EXISTS faculty_insert_all ON public.faculty;
DROP POLICY IF EXISTS faculty_update_all ON public.faculty;
DROP POLICY IF EXISTS faculty_delete_all ON public.faculty;

DROP POLICY IF EXISTS subjects_select_all ON public.subjects;
DROP POLICY IF EXISTS subjects_insert_all ON public.subjects;
DROP POLICY IF EXISTS subjects_update_all ON public.subjects;
DROP POLICY IF EXISTS subjects_delete_all ON public.subjects;

DROP POLICY IF EXISTS rooms_select_all ON public.rooms;
DROP POLICY IF EXISTS rooms_insert_all ON public.rooms;
DROP POLICY IF EXISTS rooms_update_all ON public.rooms;
DROP POLICY IF EXISTS rooms_delete_all ON public.rooms;

-- Users table - only user_functionality policy
DROP POLICY IF EXISTS user_functionality ON public.users;

CREATE POLICY "user_functionality"
ON "public"."users"
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Faculty, Subjects, Rooms - Allow all operations
CREATE POLICY faculty_all
ON public.faculty
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY subjects_all
ON public.subjects
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY rooms_all
ON public.rooms
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

COMMIT;
FOR DELETE
TO anon, authenticated
USING (true);

COMMIT;
