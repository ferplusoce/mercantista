REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.requests FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.requests FROM authenticated;
GRANT INSERT ON public.requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;