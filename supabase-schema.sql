-- Core schema for DeepStaq inventory on Supabase Postgres

create table if not exists public.godowns (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.unit_types (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  godown_id uuid not null references public.godowns(id) on delete cascade,
  name text not null,
  has_open_pieces boolean not null default false
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  godown_id uuid not null references public.godowns(id) on delete cascade,
  name text not null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  godown_id uuid not null references public.godowns(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sku text,
  unit_type_id uuid not null references public.unit_types(id),
  opening_stock numeric(18, 3) not null default 0,
  min_stock_threshold numeric(18, 3) not null default 0,
  cost_price numeric(18, 3),
  selling_price numeric(18, 3)
);

create type stock_movement_type as enum ('IN', 'OUT');

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_date date not null,
  type stock_movement_type not null,
  quantity numeric(18, 3) not null check (quantity > 0),
  note text,
  created_at timestamptz not null default now(),
  created_by text not null,
  updated_at timestamptz,
  corrected_movement_id uuid references public.stock_movements(id)
);

-- Current stock per product (opening + all movements up to today)
create or replace view public.product_current_stock as
select
  p.id as product_id,
  p.user_id,
  p.godown_id,
  p.company_id,
  p.name,
  p.min_stock_threshold,
  p.opening_stock
  + coalesce((
    select sum(
      case
        when m.type = 'IN' then m.quantity
        when m.type = 'OUT' then -m.quantity
      end
    )
    from public.stock_movements m
    where m.product_id = p.id
  ), 0) as current_stock
from public.products p;

-- Helper to classify stock alert level
create or replace function public.current_stock_alerts(p_user_id text)
returns table (
  product_id uuid,
  user_id text,
  godown_id uuid,
  company_id uuid,
  product_name text,
  current_stock numeric,
  min_stock_threshold numeric,
  alert_type text
) as $$
begin
  return query
  select
    s.product_id,
    s.user_id,
    s.godown_id,
    s.company_id,
    s.name,
    s.current_stock,
    s.min_stock_threshold,
    case
      when s.current_stock <= 0 then 'EMPTY'
      when s.current_stock <= s.min_stock_threshold then 'LOW'
      else 'OK'
    end as alert_type
  from public.product_current_stock s
  where s.user_id = p_user_id
    and (s.current_stock <= 0 or s.current_stock <= s.min_stock_threshold);
end;
$$ language plpgsql security definer;

