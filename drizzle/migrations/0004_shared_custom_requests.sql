CREATE TABLE public.requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE,
 business text NOT NULL,
 contact text NOT NULL,
 phone text NOT NULL,
 address text NOT NULL,
 zone text NOT NULL,
 delivery_date text NOT NULL,
 items jsonb NOT NULL DEFAULT '[]'::jsonb,
 attachment_path text,
 attachment_name text,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','quoted','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT requests_items_array CHECK (jsonb_typeof(items) = 'array')
);
GRANT INSERT ON public.requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitors submit bounded requests" ON public.requests FOR INSERT TO anon, authenticated WITH CHECK (
 status = 'pending' AND code ~ '^SOL-[0-9a-f-]{36}$' AND length(business) BETWEEN 1 AND 200 AND length(contact) BETWEEN 1 AND 200 AND phone ~ '^9[0-9]{8}$' AND length(address) BETWEEN 1 AND 500 AND length(zone) BETWEEN 1 AND 100 AND length(delivery_date) BETWEEN 1 AND 40 AND jsonb_array_length(items) <= 100 AND octet_length(items::text) <= 100000 AND (jsonb_array_length(items) > 0 OR attachment_path IS NOT NULL) AND (attachment_path IS NULL OR attachment_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf|txt|doc|docx)$') AND coalesce(length(attachment_name),0) <= 255
);
CREATE POLICY "admins read requests" ON public.requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update requests" ON public.requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "visitors upload request attachments" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'request-attachments' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf|txt|doc|docx)$');
CREATE POLICY "admins read request attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'request-attachments' AND public.has_role(auth.uid(), 'admin'));