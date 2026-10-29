create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create sequence public.order_code_seq start 1;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('MCT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_code_seq')::text, 4, '0')),
  business text not null,
  contact text not null,
  phone text not null,
  service text not null check (service in ('taxi_delivery','minivan_delivery')),
  status text not null default 'received' check (status in ('received','verifying','purchasing','staging','on_the_way','delivered','cancelled')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  service_fee numeric not null default 0,
  shipping_fee numeric not null default 0,
  total numeric not null default 0,
  weight_kg numeric not null default 0,
  packages integer not null default 0,
  payment_plan text,
  payment_method text,
  payment_status text not null default 'pending',
  delivery_date date,
  slot text,
  zone text,
  address text,
  taxi jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admins read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Public: create an order (always starts as 'received') and read one by its code
create or replace function public.create_order(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  insert into public.orders (business, contact, phone, service, items, subtotal, service_fee, shipping_fee, total, weight_kg, packages,
    payment_plan, payment_method, delivery_date, slot, zone, address, taxi, history)
  values (p->>'business', p->>'contact', p->>'phone', p->>'service', coalesce(p->'items','[]'::jsonb),
    (p->>'subtotal')::numeric, (p->>'service_fee')::numeric, (p->>'shipping_fee')::numeric, (p->>'total')::numeric,
    (p->>'weight_kg')::numeric, (p->>'packages')::int, p->>'payment_plan', p->>'payment_method',
    nullif(p->>'delivery_date','')::date, p->>'slot', p->>'zone', p->>'address', p->'taxi',
    jsonb_build_array(jsonb_build_object('status','received','at',now())))
  returning code into c;
  return c;
end $$;

create or replace function public.get_order_by_code(_code text)
returns setof public.orders language sql stable security definer set search_path = public as $$
  select * from public.orders where upper(code) = upper(trim(_code)) limit 1
$$;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_by_code(text) to anon, authenticated;

create table public.order_items_photos (
  id uuid primary key default gen_random_uuid(),
  order_code text not null references public.orders(code) on delete cascade,
  item_index integer not null,
  photo_url text,
  real_price numeric,
  status text not null default 'pendiente' check (status in ('pendiente','aprobado','rechazado')),
  client_comment text,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.order_items_photos to authenticated;
grant all on public.order_items_photos to service_role;
alter table public.order_items_photos enable row level security;
create policy "admins manage photos" on public.order_items_photos for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.opinions (
  id uuid primary key default gen_random_uuid(),
  order_code text references public.orders(code) on delete set null,
  name text,
  rating integer,
  comment text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.opinions to authenticated;
grant all on public.opinions to service_role;
alter table public.opinions enable row level security;
create policy "admins manage opinions" on public.opinions for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));