-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_username VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_username VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

-- Create index on action for filtering
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create read_all policy
CREATE POLICY "read_all"
ON "public"."audit_logs"
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);
