-- Migration: Create payments table for admin-managed submission payments
-- Requirements: Supabase/Postgres with pgcrypto for gen_random_uuid()

-- Enable UUID generation if not already available
create extension if not exists "pgcrypto";

-- Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  paid_at timestamptz not null,
  amount_rupiah bigint not null check (amount_rupiah >= 0),
  payment_for text not null,
  proof_url text not null,
  proof_storage_key text not null,
  -- Audit: store as UUIDs, add FKs conditionally below if admins table exists
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_payments_submission_id on public.payments(submission_id);
create index if not exists idx_payments_paid_at on public.payments(paid_at);
create index if not exists idx_payments_created_at on public.payments(created_at);

-- Conditionally add foreign keys to public.admins if table exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admins'
  ) then
    -- created_by FK
    if not exists (
      select 1 from pg_constraint where conname = 'payments_created_by_fkey'
    ) then
      alter table public.payments
        add constraint payments_created_by_fkey
        foreign key (created_by)
        references public.admins(id)
        on delete set null on update cascade;
    end if;
    -- updated_by FK
    if not exists (
      select 1 from pg_constraint where conname = 'payments_updated_by_fkey'
    ) then
      alter table public.payments
        add constraint payments_updated_by_fkey
        foreign key (updated_by)
        references public.admins(id)
        on delete set null on update cascade;
    end if;
  end if;
end $$;
