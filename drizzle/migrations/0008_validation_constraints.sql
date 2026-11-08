ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_chk CHECK (phone = '' OR phone ~ '^9[0-9]{8}$');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_owner_chk CHECK (owner_name = '' OR (char_length(owner_name) BETWEEN 3 AND 60 AND owner_name ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_business_chk CHECK (business_name = '' OR char_length(business_name) BETWEEN 3 AND 60);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_doc_chk CHECK (doc_number = '' OR (doc_type = 'DNI' AND doc_number ~ '^[0-9]{8}$') OR (doc_type = 'RUC' AND doc_number ~ '^(10|20)[0-9]{9}$'));
ALTER TABLE public.addresses ADD CONSTRAINT addresses_line_chk CHECK (char_length(line) BETWEEN 8 AND 120 AND line ~ '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]' AND line ~ '[0-9]');
ALTER TABLE public.addresses ADD CONSTRAINT addresses_ref_chk CHECK (char_length(ref) BETWEEN 5 AND 120);
ALTER TABLE public.addresses ADD CONSTRAINT addresses_zone_chk CHECK (zone IN ('Lurín Cercado','Lurín - Julio C. Tello','Lurín - Huertos de Lurín','Lurín - Km 40 / Arica','Villa El Salvador (limítrofe)','Pachacámac (zonas bajas)'));
ALTER TABLE public.taxis ADD CONSTRAINT taxis_driver_chk CHECK (driver ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}$');
ALTER TABLE public.taxis ADD CONSTRAINT taxis_plate_chk CHECK (plate ~ '^[A-Z0-9]{3}-[0-9]{3}$');
ALTER TABLE public.taxis ADD CONSTRAINT taxis_phone_chk CHECK (phone = '' OR phone ~ '^9[0-9]{8}$');
ALTER TABLE public.products ADD CONSTRAINT products_price_chk CHECK (price > 0 AND price < 1000);

CREATE OR REPLACE FUNCTION public.create_order(p jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare c text; uid uuid := auth.uid(); d date;
begin
  if uid is null then raise exception 'inicia sesión para hacer tu pedido'; end if;
  if coalesce(p->>'phone','') !~ '^9[0-9]{8}$' then raise exception 'celular inválido'; end if;
  if char_length(coalesce(p->>'business','')) not between 3 and 60 then raise exception 'nombre de bodega inválido'; end if;
  if char_length(coalesce(p->>'contact','')) not between 3 and 60 then raise exception 'nombre de responsable inválido'; end if;
  if coalesce(p->>'service','') not in ('taxi_delivery','minivan_delivery') then raise exception 'tipo de entrega inválido'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) = 0 then raise exception 'pedido vacío'; end if;
  if exists (select 1 from jsonb_array_elements(p->'items') it
             where (it->>'qty')::numeric <> floor((it->>'qty')::numeric)
                or (it->>'qty')::numeric < 1 or (it->>'qty')::numeric > 50) then raise exception 'cantidades inválidas (1 a 50)'; end if;
  d := nullif(p->>'delivery_date','')::date;
  if d is null or d < current_date + 1 or d > current_date + 14 or extract(isodow from d) = 7 then raise exception 'fecha de entrega inválida'; end if;
  if p->>'service' = 'minivan_delivery' then
    if coalesce(p->>'zone','') not in ('Lurín Cercado','Lurín - Julio C. Tello','Lurín - Huertos de Lurín','Lurín - Km 40 / Arica','Villa El Salvador (limítrofe)','Pachacámac (zonas bajas)') then raise exception 'zona inválida'; end if;
    if char_length(coalesce(p->>'address','')) not between 8 and 120 or p->>'address' !~ '[A-Za-z]' or p->>'address' !~ '[0-9]' then raise exception 'dirección inválida'; end if;
  end if;
  if p->>'service' = 'taxi_delivery' then
    if coalesce(p->'taxi'->>'driver','') !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,60}$' then raise exception 'nombre del chofer inválido'; end if;
    if coalesce(p->'taxi'->>'plate','') !~ '^[A-Z0-9]{3}-[0-9]{3}$' then raise exception 'placa inválida'; end if;
    if coalesce(p->'taxi'->>'phone','') !~ '^9[0-9]{8}$' then raise exception 'celular del conductor inválido'; end if;
  end if;
  insert into public.orders (user_id, business, contact, phone, service, items, subtotal, service_fee, shipping_fee, total, weight_kg, packages,
    payment_plan, payment_method, delivery_date, slot, zone, address, taxi, history)
  values (uid, p->>'business', p->>'contact', p->>'phone', p->>'service', coalesce(p->'items','[]'::jsonb),
    (p->>'subtotal')::numeric, (p->>'service_fee')::numeric, (p->>'shipping_fee')::numeric, (p->>'total')::numeric,
    (p->>'weight_kg')::numeric, (p->>'packages')::int, p->>'payment_plan', p->>'payment_method',
    d, p->>'slot', p->>'zone', p->>'address', p->'taxi',
    jsonb_build_array(jsonb_build_object('status','received','at',now())))
  returning code into c;
  return c;
end $function$;
REVOKE EXECUTE ON FUNCTION public.create_order(jsonb) FROM anon;