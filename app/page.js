"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid, Users, Gauge, Wallet, Wrench, FileBarChart,
  Plus, X, Check, Clock, Search, Droplet, Zap, Home,
} from "lucide-react";
import * as api from "../lib/api";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel(ym) {
  if (!ym) return "-";
  const [y, m] = ym.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function money(n) {
  return (n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ---------------- shared UI bits ---------------- */

function Pill({ tone, children }) {
  const tones = {
    vacant: { bg: "#E7F1EC", fg: "#2F6650" },
    occupied: { bg: "#EAEDF0", fg: "#4E5C68" },
    overdue: { bg: "#F6E7E2", fg: "#93412C" },
    paid: { bg: "#E7F1EC", fg: "#2F6650" },
    pending: { bg: "#FBEFE1", fg: "#8A5A22" },
    done: { bg: "#E7F1EC", fg: "#2F6650" },
    in_progress: { bg: "#EAEEF6", fg: "#3C577F" },
  };
  const t = tones[tone] || tones.occupied;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: "#FFFFFF", border: "1px solid #D9DCD3", ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: "#4B5A5C" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  border: "1px solid #D9DCD3", borderRadius: "8px", padding: "8px 10px", fontSize: "14px",
  color: "#1F3A3D", outline: "none", fontFamily: "Sarabun, sans-serif", background: "#FCFDFC",
};
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select(props) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(31,58,61,0.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl p-6 max-h-[90vh] overflow-y-auto`} style={{ background: "#FFFFFF" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "Kanit, sans-serif", color: "#1F3A3D" }} className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5"><X size={18} color="#4B5A5C" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", className = "" }) {
  const styles = {
    primary: { background: "#3E7C74", color: "#fff" },
    ghost: { background: "transparent", color: "#3E7C74", border: "1px solid #3E7C74" },
    danger: { background: "transparent", color: "#B5533C", border: "1px solid #E3C4B9" },
  };
  return (
    <button type={type} onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 ${className}`} style={styles[variant]}>
      {children}
    </button>
  );
}

function TabHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 style={{ fontFamily: "Kanit, sans-serif" }} className="text-2xl font-medium">{title}</h1>
        {subtitle && <p style={{ color: "#6B7A78" }} className="text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- data hook (Supabase-backed) ---------------- */

function useDormData() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  async function reload() {
    try {
      const d = await api.fetchAll();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { reload(); }, []);

  return { data, setData, loaded, error, reload };
}

const NAV = [
  { key: "dashboard", label: "ภาพรวม", icon: LayoutGrid },
  { key: "rooms", label: "ห้องพัก", icon: Home },
  { key: "tenants", label: "ผู้เช่า", icon: Users },
  { key: "meters", label: "มิเตอร์ & บิล", icon: Gauge },
  { key: "payments", label: "การชำระเงิน", icon: Wallet },
  { key: "repairs", label: "แจ้งซ่อม", icon: Wrench },
  { key: "reports", label: "รายงาน", icon: FileBarChart },
];

export default function Page() {
  const { data, setData, loaded, error, reload } = useDormData();
  const [tab, setTab] = useState("dashboard");

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8" style={{ background: "#EFF3EF", fontFamily: "Sarabun, sans-serif" }}>
        <Card className="p-6 max-w-md text-sm">
          <p style={{ color: "#B5533C", fontWeight: 500 }} className="mb-2">เชื่อมต่อฐานข้อมูลไม่สำเร็จ</p>
          <p style={{ color: "#4B5A5C" }}>{error}</p>
          <p style={{ color: "#9AA6A4" }} className="mt-2 text-xs">
            ตรวจสอบว่าได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local (หรือใน Environment Variables บน Vercel) และรัน supabase/schema.sql แล้ว
          </p>
        </Card>
      </div>
    );
  }

  if (!loaded || !data) {
    return (
      <div className="min-h-[600px] flex items-center justify-center" style={{ background: "#EFF3EF", fontFamily: "Sarabun, sans-serif" }}>
        <span style={{ color: "#4B5A5C" }}>กำลังโหลดข้อมูลหอพัก...</span>
      </div>
    );
  }

  const roomsById = Object.fromEntries(data.rooms.map((r) => [r.id, r]));
  const tenantByRoom = Object.fromEntries(data.tenants.filter((t) => t.active).map((t) => [t.roomId, t]));

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#EFF3EF", fontFamily: "Sarabun, sans-serif", color: "#1F3A3D" }}>
      <aside className="hidden sm:flex flex-col w-56 shrink-0 p-4 gap-1" style={{ borderRight: "1px solid #D9DCD3" }}>
        <div className="mb-4 px-2">
          <div style={{ fontFamily: "Kanit, sans-serif", fontSize: "17px", fontWeight: 600 }}>ชื่นเย็นแมนชั่น</div>
          <div style={{ fontSize: "12px", color: "#6B7A78" }}>ระบบจัดการหอพัก</div>
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
              style={{ background: active ? "#3E7C74" : "transparent", color: active ? "#fff" : "#3A4A48", fontWeight: active ? 500 : 400 }}>
              <Icon size={17} />{n.label}
            </button>
          );
        })}
      </aside>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around py-2" style={{ background: "#fff", borderTop: "1px solid #D9DCD3" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)} className="flex flex-col items-center gap-0.5 px-1">
              <Icon size={18} color={active ? "#3E7C74" : "#9AA6A4"} />
              <span style={{ fontSize: "10px", color: active ? "#3E7C74" : "#9AA6A4" }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      <main className="flex-1 p-5 sm:p-8 pb-24 sm:pb-8 overflow-y-auto">
        {tab === "dashboard" && <Dashboard data={data} tenantByRoom={tenantByRoom} />}
        {tab === "rooms" && <RoomsTab data={data} setData={setData} tenantByRoom={tenantByRoom} />}
        {tab === "tenants" && <TenantsTab data={data} setData={setData} roomsById={roomsById} />}
        {tab === "meters" && <MetersTab data={data} setData={setData} tenantByRoom={tenantByRoom} />}
        {tab === "payments" && <PaymentsTab data={data} setData={setData} roomsById={roomsById} tenantByRoom={tenantByRoom} />}
        {tab === "repairs" && <RepairsTab data={data} setData={setData} roomsById={roomsById} />}
        {tab === "reports" && <ReportsTab data={data} roomsById={roomsById} />}
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ data, tenantByRoom }) {
  const cm = currentMonth();
  const vacant = data.rooms.filter((r) => r.status === "vacant").length;
  const occupied = data.rooms.length - vacant;
  const thisMonthPayments = data.payments.filter((p) => p.month === cm);
  const income = thisMonthPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.total, 0);
  const unpaidCount = data.payments.filter((p) => p.status === "unpaid").length;
  const pendingRepairs = data.repairs.filter((r) => r.status !== "done").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "Kanit, sans-serif" }} className="text-2xl font-medium">ภาพรวมหอพัก</h1>
        <p style={{ color: "#6B7A78" }} className="text-sm mt-1">{monthLabel(cm)} · ห้องพักทั้งหมด {data.rooms.length} ห้อง</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ห้องว่าง" value={`${vacant} ห้อง`} accent="#4C8C6B" />
        <StatCard label="ห้องไม่ว่าง" value={`${occupied} ห้อง`} accent="#7C8B99" />
        <StatCard label="รายรับเดือนนี้ (ชำระแล้ว)" value={`฿${money(income)}`} accent="#C97A3D" />
        <StatCard label="ค้างชำระ / แจ้งซ่อมค้าง" value={`${unpaidCount} / ${pendingRepairs}`} accent="#B5533C" />
      </div>
      <Card className="p-5">
        <h2 style={{ fontFamily: "Kanit, sans-serif" }} className="text-base font-medium mb-4">ผังสถานะห้องพัก</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.rooms.map((r) => {
            const tenant = tenantByRoom[r.id];
            const isVacant = r.status === "vacant";
            return (
              <div key={r.id} className="rounded-xl p-4 flex flex-col gap-1" style={{ background: isVacant ? "#EFF6F2" : "#F5F6F4", border: `1px solid ${isVacant ? "#BFDCCB" : "#D9DCD3"}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "Kanit, sans-serif", fontWeight: 500 }}>{r.number}</span>
                  <Pill tone={isVacant ? "vacant" : "occupied"}>{isVacant ? "ว่าง" : "ไม่ว่าง"}</Pill>
                </div>
                <span style={{ fontSize: "12px", color: "#6B7A78" }}>{r.type === "air" ? "ห้องแอร์" : "ห้องพัดลม"} · ฿{money(r.rent)}</span>
                {tenant && <span style={{ fontSize: "12px", color: "#3A4A48" }}>{tenant.name}</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <Card className="p-4">
      <div style={{ width: 28, height: 3, background: accent, borderRadius: 2 }} className="mb-3" />
      <div style={{ fontFamily: "Kanit, sans-serif", fontSize: "22px", fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: "12.5px", color: "#6B7A78" }} className="mt-1">{label}</div>
    </Card>
  );
}

/* ---------------- Rooms ---------------- */

function RoomsTab({ data, setData, tenantByRoom }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  async function saveRoom(room) {
    setBusy(true);
    try {
      if (room.id) {
        const updated = await api.updateRoom(room);
        setData((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === updated.id ? updated : r)) }));
      } else {
        const created = await api.createRoom(room);
        setData((d) => ({ ...d, rooms: [...d.rooms, created] }));
      }
      setEditing(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeRoom(id) {
    if (!confirm("ยืนยันการลบห้องพักนี้?")) return;
    try {
      await api.deleteRoom(id);
      setData((d) => ({ ...d, rooms: d.rooms.filter((r) => r.id !== id) }));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="ห้องพัก" subtitle={`${data.rooms.length} ห้อง — เพิ่ม/แก้ไข/ลบข้อมูลห้องพัก`}
        action={<Button onClick={() => setEditing("new")}><Plus size={15} className="inline -mt-0.5 mr-1" />เพิ่มห้อง</Button>} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F6F4", color: "#4B5A5C" }} className="text-left">
              <th className="px-4 py-2.5 font-medium">เลขห้อง</th>
              <th className="px-4 py-2.5 font-medium">ประเภท</th>
              <th className="px-4 py-2.5 font-medium">ค่าเช่า/เดือน</th>
              <th className="px-4 py-2.5 font-medium">สถานะ</th>
              <th className="px-4 py-2.5 font-medium">ผู้เช่าปัจจุบัน</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.rooms.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #EDEFEB" }}>
                <td className="px-4 py-2.5" style={{ fontFamily: "Kanit, sans-serif" }}>{r.number}</td>
                <td className="px-4 py-2.5">{r.type === "air" ? "ห้องแอร์" : "ห้องพัดลม"}</td>
                <td className="px-4 py-2.5">฿{money(r.rent)}</td>
                <td className="px-4 py-2.5"><Pill tone={r.status === "vacant" ? "vacant" : "occupied"}>{r.status === "vacant" ? "ว่าง" : "ไม่ว่าง"}</Pill></td>
                <td className="px-4 py-2.5">{tenantByRoom[r.id]?.name || "-"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => setEditing(r)} className="text-xs mr-3" style={{ color: "#3E7C74" }}>แก้ไข</button>
                  <button onClick={() => removeRoom(r.id)} className="text-xs" style={{ color: "#B5533C" }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {editing && (
        <RoomModal room={editing === "new" ? { number: "", type: "fan", rent: 2200, status: "vacant" } : editing}
          onClose={() => setEditing(null)} onSave={saveRoom} busy={busy} />
      )}
    </div>
  );
}

function RoomModal({ room, onClose, onSave, busy }) {
  const [form, setForm] = useState(room);
  return (
    <Modal title={room.id ? "แก้ไขห้องพัก" : "เพิ่มห้องพัก"} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, rent: Number(form.rent) }); }}>
        <Field label="เลขห้อง"><TextInput required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
        <Field label="ประเภทห้อง">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="air">ห้องแอร์</option><option value="fan">ห้องพัดลม</option>
          </Select>
        </Field>
        <Field label="ค่าเช่าต่อเดือน (บาท)"><TextInput type="number" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} /></Field>
        <Field label="สถานะห้อง">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="vacant">ว่าง</option><option value="occupied">ไม่ว่าง</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit">{busy ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Tenants ---------------- */

function TenantsTab({ data, setData, roomsById }) {
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  async function saveTenant(tenant) {
    try {
      let saved;
      if (tenant.id) {
        saved = await api.updateTenant(tenant);
        setData((d) => ({ ...d, tenants: d.tenants.map((t) => (t.id === saved.id ? saved : t)) }));
      } else {
        saved = await api.createTenant(tenant);
        setData((d) => ({ ...d, tenants: [...d.tenants, saved] }));
      }
      const room = await api.updateRoom({ ...data.rooms.find((r) => r.id === tenant.roomId), status: "occupied" });
      setData((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === room.id ? room : r)) }));
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeTenant(t) {
    if (!confirm("ยืนยันการย้ายผู้เช่าออก/ลบข้อมูล?")) return;
    try {
      await api.deleteTenant(t.id);
      const stillHasOther = data.tenants.some((x) => x.id !== t.id && x.roomId === t.roomId && x.active);
      let rooms = data.rooms;
      if (!stillHasOther) {
        const updatedRoom = await api.updateRoom({ ...data.rooms.find((r) => r.id === t.roomId), status: "vacant" });
        rooms = data.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
      }
      setData((d) => ({ ...d, tenants: d.tenants.filter((x) => x.id !== t.id), rooms }));
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = data.tenants.filter((t) => (t.name + (roomsById[t.roomId]?.number || "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="ทะเบียนผู้เช่า" subtitle={`${data.tenants.length} รายชื่อ — ข้อมูลผู้เช่าและห้องพัก`}
        action={<Button onClick={() => setEditing("new")}><Plus size={15} className="inline -mt-0.5 mr-1" />เพิ่มผู้เช่า</Button>} />
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9AA6A4" />
        <TextInput placeholder="ค้นหาชื่อหรือเลขห้อง" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: "32px", width: "100%" }} />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F6F4", color: "#4B5A5C" }} className="text-left">
              <th className="px-4 py-2.5 font-medium">ชื่อ-สกุล</th>
              <th className="px-4 py-2.5 font-medium">ห้อง</th>
              <th className="px-4 py-2.5 font-medium">เบอร์โทร</th>
              <th className="px-4 py-2.5 font-medium">วันที่เข้าพัก</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid #EDEFEB" }}>
                <td className="px-4 py-2.5">{t.name}</td>
                <td className="px-4 py-2.5" style={{ fontFamily: "Kanit, sans-serif" }}>{roomsById[t.roomId]?.number || "-"}</td>
                <td className="px-4 py-2.5">{t.phone}</td>
                <td className="px-4 py-2.5">{t.moveInDate}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => setEditing(t)} className="text-xs mr-3" style={{ color: "#3E7C74" }}>แก้ไข</button>
                  <button onClick={() => removeTenant(t)} className="text-xs" style={{ color: "#B5533C" }}>ย้ายออก/ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {editing && (
        <TenantModal
          tenant={editing === "new" ? { name: "", phone: "", idCard: "", roomId: data.rooms[0]?.id || "", moveInDate: currentMonth() + "-01", active: true } : editing}
          rooms={data.rooms} onClose={() => setEditing(null)} onSave={saveTenant}
        />
      )}
    </div>
  );
}

function TenantModal({ tenant, rooms, onClose, onSave }) {
  const [form, setForm] = useState(tenant);
  return (
    <Modal title={tenant.id ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label="ชื่อ-สกุล"><TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="เบอร์โทรศัพท์"><TextInput required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="เลขบัตรประชาชน (ย่อ)"><TextInput value={form.idCard} onChange={(e) => setForm({ ...form, idCard: e.target.value })} /></Field>
        <Field label="ห้องพัก">
          <Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.number} — {r.type === "air" ? "แอร์" : "พัดลม"}</option>)}
          </Select>
        </Field>
        <Field label="วันที่เข้าพัก"><TextInput type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit">บันทึก</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Meters & Billing ---------------- */

function MetersTab({ data, setData, tenantByRoom }) {
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState(null);

  const readingsThisMonth = data.meterReadings.filter((m) => m.month === month);
  const readingByRoom = Object.fromEntries(readingsThisMonth.map((m) => [m.roomId, m]));

  async function saveReading(reading) {
    try {
      const saved = await api.upsertMeterReading(reading);
      setData((d) => {
        const exists = d.meterReadings.some((m) => m.id === saved.id);
        return { ...d, meterReadings: exists ? d.meterReadings.map((m) => (m.id === saved.id ? saved : m)) : [...d.meterReadings, saved] };
      });
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  async function issueInvoice(room, reading) {
    const already = data.payments.some((p) => p.roomId === room.id && p.month === month);
    if (already) return;
    const waterUnits = Math.max(0, reading.waterCurr - reading.waterPrev);
    const electricUnits = Math.max(0, reading.electricCurr - reading.electricPrev);
    const water = waterUnits * data.settings.waterRate;
    const electric = electricUnits * data.settings.electricRate;
    const total = room.rent + water + electric;
    try {
      const created = await api.createPayment({ roomId: room.id, month, rent: room.rent, water, electric, total, status: "unpaid", paidDate: null, lateFee: 0 });
      setData((d) => ({ ...d, payments: [...d.payments, created] }));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="มิเตอร์น้ำ-ไฟฟ้า & ออกบิล" subtitle="บันทึกเลขมิเตอร์รายเดือน ระบบคำนวณค่าน้ำ-ไฟให้อัตโนมัติ"
        action={<TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} />} />
      <p style={{ fontSize: "12.5px", color: "#6B7A78" }}>
        อัตราปัจจุบัน — ค่าน้ำ ฿{data.settings.waterRate}/หน่วย, ค่าไฟ ฿{data.settings.electricRate}/หน่วย
      </p>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F6F4", color: "#4B5A5C" }} className="text-left">
              <th className="px-4 py-2.5 font-medium">ห้อง</th>
              <th className="px-4 py-2.5 font-medium">ผู้เช่า</th>
              <th className="px-4 py-2.5 font-medium"><Droplet size={13} className="inline mr-1 -mt-0.5" />น้ำ (หน่วย)</th>
              <th className="px-4 py-2.5 font-medium"><Zap size={13} className="inline mr-1 -mt-0.5" />ไฟ (หน่วย)</th>
              <th className="px-4 py-2.5 font-medium">ยอดรวมประมาณ</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.rooms.filter((r) => r.status === "occupied").map((r) => {
              const reading = readingByRoom[r.id];
              const waterUnits = reading ? Math.max(0, reading.waterCurr - reading.waterPrev) : null;
              const electricUnits = reading ? Math.max(0, reading.electricCurr - reading.electricPrev) : null;
              const total = reading ? r.rent + waterUnits * data.settings.waterRate + electricUnits * data.settings.electricRate : null;
              const invoiced = data.payments.some((p) => p.roomId === r.id && p.month === month);
              const lastReading = data.meterReadings.filter((m) => m.roomId === r.id && m.month < month).sort((a, b) => (a.month < b.month ? 1 : -1))[0];
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #EDEFEB" }}>
                  <td className="px-4 py-2.5" style={{ fontFamily: "Kanit, sans-serif" }}>{r.number}</td>
                  <td className="px-4 py-2.5">{tenantByRoom[r.id]?.name || "-"}</td>
                  <td className="px-4 py-2.5">{reading ? waterUnits : <span style={{ color: "#9AA6A4" }}>ยังไม่บันทึก</span>}</td>
                  <td className="px-4 py-2.5">{reading ? electricUnits : <span style={{ color: "#9AA6A4" }}>ยังไม่บันทึก</span>}</td>
                  <td className="px-4 py-2.5">{total !== null ? `฿${money(total)}` : "-"}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditing(reading || {
                        roomId: r.id, month,
                        waterPrev: lastReading?.waterCurr ?? 0, waterCurr: 0,
                        electricPrev: lastReading?.electricCurr ?? 0, electricCurr: 0,
                      })}
                      className="text-xs mr-3" style={{ color: "#3E7C74" }}
                    >
                      {reading ? "แก้ไขมิเตอร์" : "บันทึกมิเตอร์"}
                    </button>
                    {reading && !invoiced && <button onClick={() => issueInvoice(r, reading)} className="text-xs" style={{ color: "#C97A3D" }}>ออกใบแจ้งหนี้</button>}
                    {invoiced && <Pill tone="paid">ออกบิลแล้ว</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {editing && <MeterModal reading={editing} onClose={() => setEditing(null)} onSave={saveReading} />}
    </div>
  );
}

function MeterModal({ reading, onClose, onSave }) {
  const [form, setForm] = useState(reading);
  return (
    <Modal title="บันทึกเลขมิเตอร์" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, waterPrev: Number(form.waterPrev), waterCurr: Number(form.waterCurr), electricPrev: Number(form.electricPrev), electricCurr: Number(form.electricCurr) });
      }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="มิเตอร์น้ำเดือนก่อน"><TextInput type="number" value={form.waterPrev} onChange={(e) => setForm({ ...form, waterPrev: e.target.value })} /></Field>
          <Field label="มิเตอร์น้ำเดือนนี้"><TextInput type="number" required value={form.waterCurr} onChange={(e) => setForm({ ...form, waterCurr: e.target.value })} /></Field>
          <Field label="มิเตอร์ไฟเดือนก่อน"><TextInput type="number" value={form.electricPrev} onChange={(e) => setForm({ ...form, electricPrev: e.target.value })} /></Field>
          <Field label="มิเตอร์ไฟเดือนนี้"><TextInput type="number" required value={form.electricCurr} onChange={(e) => setForm({ ...form, electricCurr: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit">บันทึก</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Payments ---------------- */

function PaymentsTab({ data, setData, roomsById, tenantByRoom }) {
  async function markPaid(p) {
    try {
      const updated = await api.updatePayment({ ...p, status: "paid", paidDate: new Date().toISOString().slice(0, 10) });
      setData((d) => ({ ...d, payments: d.payments.map((x) => (x.id === updated.id ? updated : x)) }));
    } catch (e) {
      alert(e.message);
    }
  }

  const sorted = [...data.payments].sort((a, b) => (a.month < b.month ? 1 : -1));

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="การชำระเงิน" subtitle="รายการบิลและสถานะการชำระของผู้เช่าแต่ละราย" />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F5F6F4", color: "#4B5A5C" }} className="text-left">
              <th className="px-4 py-2.5 font-medium">เดือน</th>
              <th className="px-4 py-2.5 font-medium">ห้อง</th>
              <th className="px-4 py-2.5 font-medium">ผู้เช่า</th>
              <th className="px-4 py-2.5 font-medium">ค่าเช่า</th>
              <th className="px-4 py-2.5 font-medium">น้ำ/ไฟ</th>
              <th className="px-4 py-2.5 font-medium">รวม</th>
              <th className="px-4 py-2.5 font-medium">สถานะ</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #EDEFEB" }}>
                <td className="px-4 py-2.5">{monthLabel(p.month)}</td>
                <td className="px-4 py-2.5" style={{ fontFamily: "Kanit, sans-serif" }}>{roomsById[p.roomId]?.number || "-"}</td>
                <td className="px-4 py-2.5">{tenantByRoom[p.roomId]?.name || "-"}</td>
                <td className="px-4 py-2.5">฿{money(p.rent)}</td>
                <td className="px-4 py-2.5">฿{money(p.water + p.electric)}</td>
                <td className="px-4 py-2.5" style={{ fontWeight: 500 }}>฿{money(p.total + (p.lateFee || 0))}</td>
                <td className="px-4 py-2.5"><Pill tone={p.status === "paid" ? "paid" : "overdue"}>{p.status === "paid" ? `ชำระแล้ว (${p.paidDate})` : "ค้างชำระ"}</Pill></td>
                <td className="px-4 py-2.5 text-right">
                  {p.status !== "paid" && <button onClick={() => markPaid(p)} className="text-xs" style={{ color: "#3E7C74" }}><Check size={12} className="inline mr-0.5 -mt-0.5" />บันทึกว่าชำระแล้ว</button>}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center" style={{ color: "#9AA6A4" }}>ยังไม่มีรายการบิล — ไปที่แท็บ "มิเตอร์ & บิล" เพื่อออกใบแจ้งหนี้</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------------- Repairs ---------------- */

function RepairsTab({ data, setData, roomsById }) {
  const [editing, setEditing] = useState(null);
  const statusLabel = { pending: "รอดำเนินการ", in_progress: "กำลังซ่อม", done: "เสร็จสิ้น" };

  async function saveRepair(repair) {
    try {
      let saved;
      if (repair.id) {
        saved = await api.updateRepair(repair);
        setData((d) => ({ ...d, repairs: d.repairs.map((r) => (r.id === saved.id ? saved : r)) }));
      } else {
        saved = await api.createRepair(repair);
        setData((d) => ({ ...d, repairs: [...d.repairs, saved] }));
      }
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="แจ้งซ่อม" subtitle="บันทึกรายการแจ้งซ่อมและติดตามสถานะดำเนินการ"
        action={<Button onClick={() => setEditing("new")}><Plus size={15} className="inline -mt-0.5 mr-1" />แจ้งซ่อมใหม่</Button>} />
      <div className="flex flex-col gap-3">
        {data.repairs.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
          <Card key={r.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: "Kanit, sans-serif", fontWeight: 500 }}>ห้อง {roomsById[r.roomId]?.number} — {r.item}</span>
              <span style={{ fontSize: "12px", color: "#6B7A78" }}><Clock size={11} className="inline mr-1 -mt-0.5" />แจ้งเมื่อ {r.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <Select value={r.status} onChange={(e) => saveRepair({ ...r, status: e.target.value })} style={{ padding: "5px 8px", fontSize: "12.5px" }}>
                <option value="pending">รอดำเนินการ</option><option value="in_progress">กำลังซ่อม</option><option value="done">เสร็จสิ้น</option>
              </Select>
              <Pill tone={r.status}>{statusLabel[r.status]}</Pill>
            </div>
          </Card>
        ))}
        {data.repairs.length === 0 && <Card className="p-6 text-center" style={{ color: "#9AA6A4" }}>ยังไม่มีรายการแจ้งซ่อม</Card>}
      </div>
      {editing && (
        <RepairModal repair={editing === "new" ? { roomId: data.rooms[0]?.id, date: new Date().toISOString().slice(0, 10), item: "", status: "pending" } : editing}
          rooms={data.rooms} onClose={() => setEditing(null)} onSave={saveRepair} />
      )}
    </div>
  );
}

function RepairModal({ repair, rooms, onClose, onSave }) {
  const [form, setForm] = useState(repair);
  return (
    <Modal title="แจ้งซ่อม" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label="ห้องพัก">
          <Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
          </Select>
        </Field>
        <Field label="วันที่แจ้ง"><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="รายการที่ชำรุด"><TextInput required value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit">บันทึก</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Reports ---------------- */

function ReportsTab({ data, roomsById }) {
  const cm = currentMonth();
  const occupied = data.rooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = data.rooms.length ? ((occupied / data.rooms.length) * 100).toFixed(0) : 0;
  const monthPayments = data.payments.filter((p) => p.month === cm);
  const totalIncome = monthPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.total, 0);
  const totalOutstanding = data.payments.filter((p) => p.status === "unpaid").reduce((s, p) => s + p.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <TabHeader title="รายงาน" subtitle="รายงานระดับปฏิบัติการ (TPS) และรายงานสรุปผู้บริหาร (MIS)" />
      <div>
        <h2 style={{ fontFamily: "Kanit, sans-serif" }} className="text-sm font-medium mb-3">รายงานสรุปผู้บริหาร (MIS)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div style={{ fontSize: "12.5px", color: "#6B7A78" }}>อัตราการเข้าพัก</div>
            <div style={{ fontFamily: "Kanit, sans-serif", fontSize: "24px", fontWeight: 500 }} className="mt-1">{occupancyRate}%</div>
            <div style={{ fontSize: "12px", color: "#9AA6A4" }}>{occupied} / {data.rooms.length} ห้อง</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: "12.5px", color: "#6B7A78" }}>รายรับรวมเดือนนี้</div>
            <div style={{ fontFamily: "Kanit, sans-serif", fontSize: "24px", fontWeight: 500 }} className="mt-1">฿{money(totalIncome)}</div>
            <div style={{ fontSize: "12px", color: "#9AA6A4" }}>{monthLabel(cm)}</div>
          </Card>
          <Card className="p-4">
            <div style={{ fontSize: "12.5px", color: "#6B7A78" }}>ยอดค้างชำระสะสม</div>
            <div style={{ fontFamily: "Kanit, sans-serif", fontSize: "24px", fontWeight: 500, color: "#B5533C" }} className="mt-1">฿{money(totalOutstanding)}</div>
            <div style={{ fontSize: "12px", color: "#9AA6A4" }}>{data.payments.filter((p) => p.status === "unpaid").length} รายการ</div>
          </Card>
        </div>
      </div>
      <div>
        <h2 style={{ fontFamily: "Kanit, sans-serif" }} className="text-sm font-medium mb-3">รายงานระดับปฏิบัติการ (TPS)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="mb-2" style={{ fontWeight: 500, fontSize: "13.5px" }}>รายงานห้องว่าง–ไม่ว่าง</div>
            <div className="flex flex-col gap-1.5">
              {data.rooms.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span>ห้อง {r.number}</span>
                  <Pill tone={r.status === "vacant" ? "vacant" : "occupied"}>{r.status === "vacant" ? "ว่าง" : "ไม่ว่าง"}</Pill>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2" style={{ fontWeight: 500, fontSize: "13.5px" }}>รายงานทะเบียนผู้เช่า</div>
            <div className="flex flex-col gap-1.5">
              {data.tenants.filter((t) => t.active).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.name}</span><span style={{ color: "#6B7A78" }}>ห้อง {roomsById[t.roomId]?.number}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2" style={{ fontWeight: 500, fontSize: "13.5px" }}>รายการค้างชำระ</div>
            <div className="flex flex-col gap-1.5">
              {data.payments.filter((p) => p.status === "unpaid").map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>ห้อง {roomsById[p.roomId]?.number} · {monthLabel(p.month)}</span>
                  <span style={{ color: "#B5533C" }}>฿{money(p.total)}</span>
                </div>
              ))}
              {data.payments.filter((p) => p.status === "unpaid").length === 0 && <span style={{ color: "#9AA6A4", fontSize: "13px" }}>ไม่มีรายการค้างชำระ</span>}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2" style={{ fontWeight: 500, fontSize: "13.5px" }}>ใบแจ้งค่าเช่า/น้ำ-ไฟรายเดือน (ล่าสุด)</div>
            <div className="flex flex-col gap-1.5">
              {data.payments.slice(-5).reverse().map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>ห้อง {roomsById[p.roomId]?.number} · {monthLabel(p.month)}</span><span>฿{money(p.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
