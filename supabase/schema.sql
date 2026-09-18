-- ระบบสารสนเทศเพื่อการจัดการหอพัก — โครงสร้างฐานข้อมูล (Supabase / PostgreSQL)
-- วิธีใช้: เปิดโปรเจกต์ Supabase ของคุณ -> เมนู SQL Editor -> วางไฟล์นี้ทั้งหมด -> กด Run

create extension if not exists "pgcrypto";

-- 1) ห้องพัก
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  type text not null check (type in ('air', 'fan')),
  rent numeric not null default 0,
  status text not null default 'vacant' check (status in ('vacant', 'occupied')),
  created_at timestamptz default now()
);

-- 2) ผู้เช่า
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  name text not null,
  phone text,
  id_card text,
  move_in_date date,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 3) มิเตอร์น้ำ-ไฟฟ้ารายเดือน
create table if not exists meter_readings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month text not null, -- รูปแบบ 'YYYY-MM'
  water_prev numeric not null default 0,
  water_curr numeric not null default 0,
  electric_prev numeric not null default 0,
  electric_curr numeric not null default 0,
  created_at timestamptz default now(),
  unique (room_id, month)
);

-- 4) การชำระเงิน / ใบแจ้งหนี้รายเดือน
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month text not null,
  rent numeric not null default 0,
  water numeric not null default 0,
  electric numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_date date,
  late_fee numeric not null default 0,
  created_at timestamptz default now(),
  unique (room_id, month)
);

-- 5) แจ้งซ่อม
create table if not exists repairs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  date date not null default current_date,
  item text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  created_at timestamptz default now()
);

-- 6) ตั้งค่าอัตราค่าน้ำ-ค่าไฟ (มีแถวเดียว id = 1)
create table if not exists settings (
  id int primary key default 1,
  water_rate numeric not null default 18,
  electric_rate numeric not null default 8,
  late_fee_per_day numeric not null default 20,
  due_day int not null default 5
);
insert into settings (id, water_rate, electric_rate, late_fee_per_day, due_day)
  values (1, 18, 8, 20, 5)
  on conflict (id) do nothing;

-- ข้อมูลตัวอย่างเริ่มต้น (8 ห้องตามเอกสารโครงการ) — ลบทิ้งได้ถ้าไม่ต้องการ
insert into rooms (number, type, rent, status)
select * from (values
  ('101', 'air', 3500, 'vacant'),
  ('102', 'air', 3500, 'vacant'),
  ('103', 'fan', 2200, 'vacant'),
  ('104', 'fan', 2200, 'vacant'),
  ('105', 'fan', 2200, 'vacant'),
  ('106', 'fan', 2200, 'vacant'),
  ('107', 'fan', 2200, 'vacant'),
  ('108', 'fan', 2200, 'vacant')
) as v(number, type, rent, status)
where not exists (select 1 from rooms);

-- ---------------------------------------------------------------
-- Row Level Security
-- โปรเจกต์นี้ทำเพื่อการเรียน/สาธิต จึงเปิดให้ anon key อ่าน-เขียนได้ทุกตาราง
-- (ไม่มีระบบ login) หากจะนำไปใช้งานจริงกับหอพักจริง ควรเพิ่ม Supabase Auth
-- แล้วเปลี่ยน policy ให้ตรวจสอบผู้ใช้ที่ login แล้วเท่านั้น
-- ---------------------------------------------------------------
alter table rooms enable row level security;
alter table tenants enable row level security;
alter table meter_readings enable row level security;
alter table payments enable row level security;
alter table repairs enable row level security;
alter table settings enable row level security;

create policy "public read/write rooms" on rooms for all using (true) with check (true);
create policy "public read/write tenants" on tenants for all using (true) with check (true);
create policy "public read/write meter_readings" on meter_readings for all using (true) with check (true);
create policy "public read/write payments" on payments for all using (true) with check (true);
create policy "public read/write repairs" on repairs for all using (true) with check (true);
create policy "public read/write settings" on settings for all using (true) with check (true);
