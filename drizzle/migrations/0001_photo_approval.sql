alter table public.order_items_photos add column if not exists uploaded_at timestamptz not null default now();
alter table public.order_items_photos add column if not exists responded_at timestamptz;
alter table public.order_items_photos add constraint order_items_photos_code_item_key unique (order_code, item_index);
grant select, insert, update, delete on public.order_items_photos to authenticated;
grant all on public.order_items_photos to service_role;

create policy "admins upload order photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'order-photos' and public.has_role(auth.uid(), 'admin'));
create policy "admins update order photos" on storage.objects for update to authenticated
  using (bucket_id = 'order-photos' and public.has_role(auth.uid(), 'admin'));

create or replace function public.get_order_photos(_code text)
returns setof public.order_items_photos language sql stable security definer set search_path = public as $$
  select * from public.order_items_photos where upper(order_code) = upper(trim(_code)) order by item_index
$$;

create or replace function public.respond_photo(_code text, _item_index int, _approve boolean, _comment text default null)
returns text language plpgsql security definer set search_path = public as $$
declare o public.orders; new_items jsonb; sub numeric; n_items int; n_ok int; st text;
begin
  select * into o from public.orders where upper(code) = upper(trim(_code));
  if o.id is null then raise exception 'pedido no encontrado'; end if;
  if o.status <> 'purchasing' then raise exception 'el pedido ya no está en compra'; end if;
  update public.order_items_photos set status = case when _approve then 'aprobado' else 'cambiar' end,
    client_comment = case when _approve then null else left(coalesce(_comment, ''), 200) end,
    responded_at = now(), updated_at = now()
  where order_code = o.code and item_index = _item_index and status = 'pendiente';
  if not found then raise exception 'foto no disponible'; end if;

  select coalesce(jsonb_agg(case when p.status = 'aprobado' and p.real_price is not null
      then e.v || jsonb_build_object('unitPrice', p.real_price) else e.v end order by e.i), '[]'::jsonb)
    into new_items
  from jsonb_array_elements(o.items) with ordinality as e(v, i)
  left join public.order_items_photos p on p.order_code = o.code and p.item_index = e.i - 1;

  select coalesce(sum((v->>'qty')::numeric * (v->>'unitPrice')::numeric), 0) into sub from jsonb_array_elements(new_items) v;
  n_items := jsonb_array_length(o.items);
  select count(*) into n_ok from public.order_items_photos where order_code = o.code and status = 'aprobado';
  st := case when n_ok >= n_items then 'staging' else o.status end;

  update public.orders set items = new_items, subtotal = sub, total = sub + service_fee + shipping_fee, status = st,
    history = case when st <> o.status then history || jsonb_build_array(jsonb_build_object('status', st, 'at', now())) else history end
  where id = o.id;
  return st;
end $$;
grant execute on function public.get_order_photos(text) to anon, authenticated;
grant execute on function public.respond_photo(text, int, boolean, text) to anon, authenticated;