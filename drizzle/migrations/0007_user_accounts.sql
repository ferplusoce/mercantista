CREATE TABLE public.profiles (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, business_name text NOT NULL DEFAULT '', owner_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', doc_type text NOT NULL DEFAULT 'DNI', doc_number text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.addresses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, zone text NOT NULL, line text NOT NULL, ref text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.taxis (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, driver text NOT NULL, plate text NOT NULL, phone text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX addresses_user_idx ON public.addresses(user_id);
CREATE INDEX taxis_user_idx ON public.taxis(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.addresses, public.taxis TO authenticated;
GRANT ALL ON public.profiles, public.addresses, public.taxis TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own taxis" ON public.taxis FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone, business_name, owner_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'phone', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'business_name', ''), COALESCE(NEW.raw_user_meta_data->>'owner_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.orders ADD COLUMN user_id uuid;
ALTER TABLE public.requests ADD COLUMN user_id uuid;
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX requests_user_idx ON public.requests(user_id);

CREATE POLICY "own orders readable" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own requests readable" ON public.requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "requests owner matches" ON public.requests AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_order(p jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare c text; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'inicia sesión para hacer tu pedido'; end if;
  insert into public.orders (user_id, business, contact, phone, service, items, subtotal, service_fee, shipping_fee, total, weight_kg, packages,
    payment_plan, payment_method, delivery_date, slot, zone, address, taxi, history)
  values (uid, p->>'business', p->>'contact', p->>'phone', p->>'service', coalesce(p->'items','[]'::jsonb),
    (p->>'subtotal')::numeric, (p->>'service_fee')::numeric, (p->>'shipping_fee')::numeric, (p->>'total')::numeric,
    (p->>'weight_kg')::numeric, (p->>'packages')::int, p->>'payment_plan', p->>'payment_method',
    nullif(p->>'delivery_date','')::date, p->>'slot', p->>'zone', p->>'address', p->'taxi',
    jsonb_build_array(jsonb_build_object('status','received','at',now())))
  returning code into c;
  return c;
end $function$;
REVOKE EXECUTE ON FUNCTION public.create_order(jsonb) FROM anon;