-- ChronoMaria RLS policies
--
-- Run this in Supabase SQL Editor.
-- This script enables RLS and allows anon/authenticated roles
-- to read and edit data for development/team use.
--
-- WARNING: These policies are permissive. Use stricter policies before production.

BEGIN;

ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY faculty_select_all
ON public.faculty
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY faculty_insert_all
ON public.faculty
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY faculty_update_all
ON public.faculty
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY faculty_delete_all
ON public.faculty
FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY subjects_select_all
ON public.subjects
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY subjects_insert_all
ON public.subjects
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY subjects_update_all
ON public.subjects
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY subjects_delete_all
ON public.subjects
FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY rooms_select_all
ON public.rooms
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY rooms_insert_all
ON public.rooms
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY rooms_update_all
ON public.rooms
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY rooms_delete_all
ON public.rooms
FOR DELETE
TO anon, authenticated
USING (true);

COMMIT;
