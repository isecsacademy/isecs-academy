-- ============================================================================
-- ISECS Academy Management System — Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- teachers
-- ---------------------------------------------------------------------------
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnic text,
  contact text,
  address text,
  photo_url text,
  date_of_joining date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_teachers_updated on teachers;
create trigger trg_teachers_updated before update on teachers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- programs
-- ---------------------------------------------------------------------------
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  program_name text not null,
  session text,
  year int,
  fee_amount numeric(12,2) not null default 0,
  teacher_id uuid references teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_programs_updated on programs;
create trigger trg_programs_updated before update on programs
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  name text not null,
  father_name text,
  cnic_or_formb text,
  contact text,
  address text,
  photo_url text,
  admission_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_students_updated on students;
create trigger trg_students_updated before update on students
  for each row execute function set_updated_at();

-- fast prefix/substring search on name + reg number (server-side, scales to thousands)
create extension if not exists pg_trgm;
create index if not exists idx_students_name_trgm on students using gin (name gin_trgm_ops);
create index if not exists idx_students_regno_trgm on students using gin (registration_number gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- student_programs (enrollments)
-- ---------------------------------------------------------------------------
create table if not exists student_programs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  program_id uuid not null references programs(id) on delete restrict,
  fee_amount numeric(12,2) not null, -- snapshot of program fee at enrollment time
  admission_date date not null default current_date,
  status text not null default 'active' check (status in ('active','completed','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, program_id)
);
drop trigger if exists trg_student_programs_updated on student_programs;
create trigger trg_student_programs_updated before update on student_programs
  for each row execute function set_updated_at();

-- Block deleting a program if students are currently enrolled in it
create or replace function prevent_program_delete_if_enrolled()
returns trigger as $$
begin
  if exists (select 1 from student_programs where program_id = old.id and status = 'active') then
    raise exception 'Cannot delete program: students are currently enrolled in it';
  end if;
  return old;
end;
$$ language plpgsql;
drop trigger if exists trg_prevent_program_delete on programs;
create trigger trg_prevent_program_delete before delete on programs
  for each row execute function prevent_program_delete_if_enrolled();

-- ---------------------------------------------------------------------------
-- fee_heads
-- ---------------------------------------------------------------------------
create table if not exists fee_heads (
  id uuid primary key default gen_random_uuid(),
  head_name text not null,
  amount numeric(12,2) not null,
  apply_to_all boolean not null default false,
  created_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_fee_heads_updated on fee_heads;
create trigger trg_fee_heads_updated before update on fee_heads
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- student_charges (snapshot amount — editing fee_heads.amount never
-- retroactively changes rows already here)
-- ---------------------------------------------------------------------------
create table if not exists student_charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  head_id uuid not null references fee_heads(id) on delete restrict,
  amount numeric(12,2) not null, -- snapshot
  date_imposed date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_student_charges_student on student_charges(student_id);

-- ---------------------------------------------------------------------------
-- fee_payments
-- ---------------------------------------------------------------------------
create table if not exists fee_payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references student_charges(id) on delete cascade,
  amount_paid numeric(12,2) not null,
  payment_date date not null default current_date,
  receipt_number text not null unique default ('RCPT-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text,1,4)),
  created_at timestamptz not null default now()
);
create index if not exists idx_fee_payments_charge on fee_payments(charge_id);

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text,
  amount numeric(12,2) not null,
  date_received date not null default current_date,
  donation_type text not null check (donation_type in ('Donation','Charity','Grant')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_donations_updated on donations;
create trigger trg_donations_updated before update on donations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- expense_heads
-- ---------------------------------------------------------------------------
create table if not exists expense_heads (
  id uuid primary key default gen_random_uuid(),
  head_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  head_id uuid not null references expense_heads(id) on delete restrict,
  amount numeric(12,2) not null,
  date_incurred date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_expenses_updated on expenses;
create trigger trg_expenses_updated before update on expenses
  for each row execute function set_updated_at();

-- Block deleting an expense head if expenses exist against it
create or replace function prevent_expense_head_delete()
returns trigger as $$
begin
  if exists (select 1 from expenses where head_id = old.id) then
    raise exception 'Cannot delete expense head: expenses are recorded against it';
  end if;
  return old;
end;
$$ language plpgsql;
drop trigger if exists trg_prevent_expense_head_delete on expense_heads;
create trigger trg_prevent_expense_head_delete before delete on expense_heads
  for each row execute function prevent_expense_head_delete();

-- Same guard for fee_heads (block delete if charges exist)
create or replace function prevent_fee_head_delete()
returns trigger as $$
begin
  if exists (select 1 from student_charges where head_id = old.id) then
    raise exception 'Cannot delete fee head: charges have already been created from it';
  end if;
  return old;
end;
$$ language plpgsql;
drop trigger if exists trg_prevent_fee_head_delete on fee_heads;
create trigger trg_prevent_fee_head_delete before delete on fee_heads
  for each row execute function prevent_fee_head_delete();

-- ---------------------------------------------------------------------------
-- strike_offs (create before results/attendance reference it)
-- ---------------------------------------------------------------------------
create table if not exists strike_offs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  reason text not null,
  date_struck_off date not null default current_date,
  date_readmitted date,
  readmitted_program_id uuid references programs(id),
  readmission_fee numeric(12,2),
  readmission_charge_id uuid references student_charges(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_strike_offs_updated on strike_offs;
create trigger trg_strike_offs_updated before update on strike_offs
  for each row execute function set_updated_at();

-- Helper: is a student currently struck off (no readmission date yet)?
create or replace function is_student_struck_off(p_student_id uuid)
returns boolean as $$
  select exists (
    select 1 from strike_offs
    where student_id = p_student_id and date_readmitted is null
  );
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- results
-- ---------------------------------------------------------------------------
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  program_id uuid not null references programs(id) on delete restrict,
  obtained_marks numeric(6,2) not null,
  total_marks numeric(6,2) not null,
  percentage numeric(5,2) generated always as (
    case when total_marks > 0 then round((obtained_marks / total_marks) * 100, 2) else 0 end
  ) stored,
  status text not null check (status in ('Pass','Fail')), -- explicit admin choice, never auto-derived
  result_date date not null default current_date,
  certificate_id text,
  certificate_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_results_updated on results;
create trigger trg_results_updated before update on results
  for each row execute function set_updated_at();

-- Block inserting/updating a result for a currently struck-off student
create or replace function prevent_result_if_struck_off()
returns trigger as $$
begin
  if is_student_struck_off(new.student_id) then
    raise exception 'Student is currently struck off. Readmit them before entering a result.';
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_prevent_result_if_struck_off on results;
create trigger trg_prevent_result_if_struck_off before insert or update on results
  for each row execute function prevent_result_if_struck_off();

-- ---------------------------------------------------------------------------
-- attendance (new module)
-- ---------------------------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  date date not null default current_date,
  status text not null check (status in ('Present','Absent','Leave')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, program_id, date)
);
drop trigger if exists trg_attendance_updated on attendance;
create trigger trg_attendance_updated before update on attendance
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Business-logic functions
-- ---------------------------------------------------------------------------

-- Impose a fee head on all currently-enrolled students, skipping anyone
-- with an open (not-yet-readmitted) strike-off.
create or replace function impose_head_on_all_students(p_head_id uuid)
returns int as $$
declare
  v_amount numeric(12,2);
  v_count int := 0;
begin
  select amount into v_amount from fee_heads where id = p_head_id;
  if v_amount is null then
    raise exception 'Fee head not found';
  end if;

  insert into student_charges (student_id, head_id, amount, date_imposed)
  select s.id, p_head_id, v_amount, current_date
  from students s
  where not is_student_struck_off(s.id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql;

-- Manually add a single charge to one student; refuses if struck off.
create or replace function add_manual_charge(p_student_id uuid, p_head_id uuid, p_amount_override numeric default null)
returns uuid as $$
declare
  v_amount numeric(12,2);
  v_charge_id uuid;
begin
  if is_student_struck_off(p_student_id) then
    raise exception 'Student is currently struck off. Cannot add new charges.';
  end if;

  if p_amount_override is not null then
    v_amount := p_amount_override;
  else
    select amount into v_amount from fee_heads where id = p_head_id;
  end if;

  insert into student_charges (student_id, head_id, amount, date_imposed)
  values (p_student_id, p_head_id, v_amount, current_date)
  returning id into v_charge_id;

  return v_charge_id;
end;
$$ language plpgsql;

-- Student balance summary
create or replace function get_student_balance(p_student_id uuid)
returns numeric as $$
  select coalesce(sum(sc.amount), 0) - coalesce((
    select sum(fp.amount_paid) from fee_payments fp
    join student_charges sc2 on sc2.id = fp.charge_id
    where sc2.student_id = p_student_id
  ), 0)
  from student_charges sc
  where sc.student_id = p_student_id;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- Views for dashboard / arrears / reporting
-- ---------------------------------------------------------------------------

-- Per-charge balance (used by Arrears Management + Fee Collection)
create or replace view v_charge_balances as
select
  sc.id as charge_id,
  sc.student_id,
  s.name as student_name,
  s.registration_number,
  sc.head_id,
  fh.head_name,
  sc.amount as charged_amount,
  coalesce(sum(fp.amount_paid), 0) as paid_amount,
  sc.amount - coalesce(sum(fp.amount_paid), 0) as balance,
  sc.date_imposed
from student_charges sc
join students s on s.id = sc.student_id
join fee_heads fh on fh.id = sc.head_id
left join fee_payments fp on fp.charge_id = sc.id
group by sc.id, s.name, s.registration_number, sc.head_id, fh.head_name, sc.amount, sc.date_imposed;

-- Per-student total balance (used by Dashboard: arrears / no-dues)
create or replace view v_student_balances as
select
  s.id as student_id,
  s.name,
  s.registration_number,
  coalesce(sum(vcb.balance), 0) as total_balance
from students s
left join v_charge_balances vcb on vcb.student_id = s.id
group by s.id, s.name, s.registration_number;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Single "authenticated users can do everything" policy for v1.
-- Structured per-table so a future restricted "cashier" role can be added
-- later by editing individual policies without a schema rewrite.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'teachers','programs','students','student_programs','fee_heads',
      'student_charges','fee_payments','donations','expense_heads',
      'expenses','results','strike_offs','attendance'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "authenticated_full_access" on %I;', t);
    execute format(
      'create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage buckets (run once) — for teacher/student photos and logo
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

drop policy if exists "authenticated_upload_photos" on storage.objects;
create policy "authenticated_upload_photos" on storage.objects
  for all to authenticated
  using (bucket_id in ('photos','branding'))
  with check (bucket_id in ('photos','branding'));

drop policy if exists "public_read_photos" on storage.objects;
create policy "public_read_photos" on storage.objects
  for select to anon
  using (bucket_id in ('photos','branding'));

-- ============================================================================
-- End of schema
-- ============================================================================
