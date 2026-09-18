import { supabase } from "./supabaseClient";

/* ---------- mapping helpers: DB (snake_case) <-> App (camelCase) ---------- */

const roomFromDb = (r) => ({ id: r.id, number: r.number, type: r.type, rent: Number(r.rent), status: r.status });
const roomToDb = (r) => ({ number: r.number, type: r.type, rent: r.rent, status: r.status });

const tenantFromDb = (t) => ({
  id: t.id, roomId: t.room_id, name: t.name, phone: t.phone, idCard: t.id_card,
  moveInDate: t.move_in_date, active: t.active,
});
const tenantToDb = (t) => ({
  room_id: t.roomId, name: t.name, phone: t.phone, id_card: t.idCard,
  move_in_date: t.moveInDate || null, active: t.active,
});

const meterFromDb = (m) => ({
  id: m.id, roomId: m.room_id, month: m.month,
  waterPrev: Number(m.water_prev), waterCurr: Number(m.water_curr),
  electricPrev: Number(m.electric_prev), electricCurr: Number(m.electric_curr),
});
const meterToDb = (m) => ({
  room_id: m.roomId, month: m.month,
  water_prev: m.waterPrev, water_curr: m.waterCurr,
  electric_prev: m.electricPrev, electric_curr: m.electricCurr,
});

const paymentFromDb = (p) => ({
  id: p.id, roomId: p.room_id, month: p.month, rent: Number(p.rent),
  water: Number(p.water), electric: Number(p.electric), total: Number(p.total),
  status: p.status, paidDate: p.paid_date, lateFee: Number(p.late_fee || 0),
});
const paymentToDb = (p) => ({
  room_id: p.roomId, month: p.month, rent: p.rent, water: p.water,
  electric: p.electric, total: p.total, status: p.status,
  paid_date: p.paidDate || null, late_fee: p.lateFee || 0,
});

const repairFromDb = (r) => ({ id: r.id, roomId: r.room_id, date: r.date, item: r.item, status: r.status });
const repairToDb = (r) => ({ room_id: r.roomId, date: r.date, item: r.item, status: r.status });

const settingsFromDb = (s) => ({
  waterRate: Number(s.water_rate), electricRate: Number(s.electric_rate),
  lateFeePerDay: Number(s.late_fee_per_day), dueDay: s.due_day,
});

function check(label, error) {
  if (error) {
    console.error(label, error);
    throw new Error(`${label}: ${error.message}`);
  }
}

/* ---------- fetch everything ---------- */

export async function fetchAll() {
  const [rooms, tenants, meterReadings, payments, repairs, settings] = await Promise.all([
    supabase.from("rooms").select("*").order("number"),
    supabase.from("tenants").select("*"),
    supabase.from("meter_readings").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("repairs").select("*"),
    supabase.from("settings").select("*").eq("id", 1).single(),
  ]);
  check("โหลดข้อมูลห้องพัก", rooms.error);
  check("โหลดข้อมูลผู้เช่า", tenants.error);
  check("โหลดข้อมูลมิเตอร์", meterReadings.error);
  check("โหลดข้อมูลการชำระเงิน", payments.error);
  check("โหลดข้อมูลแจ้งซ่อม", repairs.error);
  check("โหลดข้อมูลการตั้งค่า", settings.error);

  return {
    rooms: rooms.data.map(roomFromDb),
    tenants: tenants.data.map(tenantFromDb),
    meterReadings: meterReadings.data.map(meterFromDb),
    payments: payments.data.map(paymentFromDb),
    repairs: repairs.data.map(repairFromDb),
    settings: settingsFromDb(settings.data),
  };
}

/* ---------- rooms ---------- */

export async function createRoom(room) {
  const { data, error } = await supabase.from("rooms").insert(roomToDb(room)).select().single();
  check("เพิ่มห้องพัก", error);
  return roomFromDb(data);
}
export async function updateRoom(room) {
  const { data, error } = await supabase.from("rooms").update(roomToDb(room)).eq("id", room.id).select().single();
  check("แก้ไขห้องพัก", error);
  return roomFromDb(data);
}
export async function deleteRoom(id) {
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  check("ลบห้องพัก", error);
}

/* ---------- tenants ---------- */

export async function createTenant(tenant) {
  const { data, error } = await supabase.from("tenants").insert(tenantToDb(tenant)).select().single();
  check("เพิ่มผู้เช่า", error);
  return tenantFromDb(data);
}
export async function updateTenant(tenant) {
  const { data, error } = await supabase.from("tenants").update(tenantToDb(tenant)).eq("id", tenant.id).select().single();
  check("แก้ไขผู้เช่า", error);
  return tenantFromDb(data);
}
export async function deleteTenant(id) {
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  check("ลบผู้เช่า", error);
}

/* ---------- meter readings ---------- */

export async function upsertMeterReading(reading) {
  const payload = meterToDb(reading);
  if (reading.id) {
    const { data, error } = await supabase.from("meter_readings").update(payload).eq("id", reading.id).select().single();
    check("บันทึกมิเตอร์", error);
    return meterFromDb(data);
  }
  const { data, error } = await supabase.from("meter_readings").insert(payload).select().single();
  check("บันทึกมิเตอร์", error);
  return meterFromDb(data);
}

/* ---------- payments ---------- */

export async function createPayment(payment) {
  const { data, error } = await supabase.from("payments").insert(paymentToDb(payment)).select().single();
  check("ออกใบแจ้งหนี้", error);
  return paymentFromDb(data);
}
export async function updatePayment(payment) {
  const { data, error } = await supabase.from("payments").update(paymentToDb(payment)).eq("id", payment.id).select().single();
  check("อัปเดตการชำระเงิน", error);
  return paymentFromDb(data);
}

/* ---------- repairs ---------- */

export async function createRepair(repair) {
  const { data, error } = await supabase.from("repairs").insert(repairToDb(repair)).select().single();
  check("เพิ่มรายการแจ้งซ่อม", error);
  return repairFromDb(data);
}
export async function updateRepair(repair) {
  const { data, error } = await supabase.from("repairs").update(repairToDb(repair)).eq("id", repair.id).select().single();
  check("แก้ไขรายการแจ้งซ่อม", error);
  return repairFromDb(data);
}
