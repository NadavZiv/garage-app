git add .
git commit -m "add maintenance module"
git push
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#0a0c12", surface: "#13161f", card: "#1a1e2e", border: "#252a3d",
  accent: "#f59e0b", accentDim: "#f59e0b33", green: "#22c55e", greenDim: "#22c55e22",
  red: "#ef4444", redDim: "#ef444422", orange: "#f97316", orangeDim: "#f9731622",
  blue: "#3b82f6", blueDim: "#3b82f622", muted: "#4b5568", text: "#e2e8f0", soft: "#94a3b8",
};

const statusCfg = {
  active: { label: "פעיל", color: C.green, dim: C.greenDim },
  maintenance: { label: "בטיפול", color: C.orange, dim: C.orangeDim },
  disabled: { label: "מושבת", color: C.red, dim: C.redDim },
};

const maintTypeCfg = {
  periodic: { label: "תקופתי", color: C.blue },
  fault: { label: "תקלה", color: C.orange },
  emergency: { label: "חירום", color: C.red },
  inspection: { label: "בדיקה", color: C.soft },
};

const NAV = [
  { id: "home", icon: "🏠", label: "ראשי" },
  { id: "equipment", icon: "🚜", label: "כלים" },
  { id: "maintenance", icon: "🔧", label: "טיפולים" },
  { id: "inventory", icon: "📦", label: "מלאי" },
  { id: "chat", icon: "💬", label: "דיונים" },
];

const ICON_OPTIONS = ["🚜", "🚛", "🏗️", "🚧", "⛏️", "🔧"];

function Badge({ color, dim, children, small }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: small ? "2px 8px" : "4px 12px", borderRadius: 20, fontSize: small ? 11 : 12, fontWeight: 700, color, background: dim || `${color}22`, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Bar({ value, max }) {
  const pct = Math.min(100, ((value || 0) / (max || 1)) * 100);
  return (
    <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: pct > 85 ? C.orange : C.blue, borderRadius: 3 }} />
    </div>
  );
}

function Avatar({ text, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: size * 0.33, flexShrink: 0 }}>
      {text}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ── Equipment Edit Modal ──────────────────────────────────────────────────────
function EditEqModal({ eq, onSave, onClose }) {
  const [form, setForm] = useState(eq ? {
    Name: eq.Name || "", equipment_number: eq.equipment_number || "",
    type: eq.type || "", status: eq.status || "active",
    hours: eq.hours || 0, next_service: eq.next_service || 0,
    manufacturer: eq.manufacturer || "", Year: eq.Year || new Date().getFullYear(), Icon: eq.Icon || "🚜",
  } : { Name: "", equipment_number: "", type: "", status: "active", hours: 0, next_service: 0, manufacturer: "", Year: new Date().getFullYear(), Icon: "🚜" });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.Name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>{eq ? "✏️ עריכת כלי" : "➕ כלי חדש"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>אייקון</label>
            <div style={{ display: "flex", gap: 8 }}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => f("Icon", ic)} style={{ width: 44, height: 44, fontSize: 22, background: form.Icon === ic ? C.accentDim : C.surface, border: `2px solid ${form.Icon === ic ? C.accent : C.border}`, borderRadius: 10, cursor: "pointer" }}>{ic}</button>
              ))}
            </div>
          </div>
          {[{ key: "Name", label: "שם הכלי *", ph: "קטרפילר 320D" }, { key: "equipment_number", label: "מספר כלי", ph: "TZ-001" }, { key: "type", label: "סוג", ph: "מחפר" }, { key: "manufacturer", label: "יצרן", ph: "Caterpillar" }].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>{field.label}</label>
              <input value={form[field.key]} onChange={e => f(field.key, e.target.value)} placeholder={field.ph} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[{ key: "hours", label: "שעות" }, { key: "next_service", label: "טיפול הבא" }, { key: "Year", label: "שנת ייצור" }].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>{field.label}</label>
                <input type="number" value={form[field.key]} onChange={e => f(field.key, parseInt(e.target.value) || 0)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 10px", fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit" }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>סטטוס</label>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(statusCfg).map(([key, val]) => (
                <button key={key} onClick={() => f("status", key)} style={{ flex: 1, background: form.status === key ? val.dim : C.surface, border: `2px solid ${form.status === key ? val.color : C.border}`, borderRadius: 10, padding: "10px 4px", color: form.status === key ? val.color : C.soft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{val.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "שומר..." : "💾 שמור"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Maintenance Modal ─────────────────────────────────────────────────────────
function NewMaintModal({ equipment, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    equipment_name: equipment[0]?.Name || "",
    date: new Date().toISOString().split("T")[0],
    type: "periodic",
    description: "",
    worker: "",
    labor_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    status: "open",
    notes: "",
    next_service_date: "",
  });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const total = (parseInt(form.labor_cost) || 0) + (parseInt(form.parts_cost) || 0);
    setForm(p => ({ ...p, total_cost: total }));
  }, [form.labor_cost, form.parts_cost]);

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>פתיחת טיפול חדש</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: 28, height: 28, borderRadius: "50%", background: step >= n ? C.accent : C.border, color: step >= n ? "#000" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{n}</div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>כלי צמ"ה</label>
              <select value={form.equipment_name} onChange={e => f("equipment_name", e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", cursor: "pointer" }}>
                {equipment.map(eq => <option key={eq.Name} value={eq.Name}>{eq.Icon || "🚜"} {eq.Name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>תאריך</label>
              <input type="date" value={form.date} onChange={e => f("date", e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>סוג טיפול</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(maintTypeCfg).map(([key, val]) => (
                  <button key={key} onClick={() => f("type", key)} style={{ background: form.type === key ? `${val.color}22` : C.surface, border: `2px solid ${form.type === key ? val.color : C.border}`, borderRadius: 10, padding: "11px", color: form.type === key ? val.color : C.soft, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{val.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>תיאור העבודה</label>
              <textarea value={form.description} onChange={e => f("description", e.target.value)} placeholder="תאר את העבודה שבוצעה..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.text, height: 90, resize: "none", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>מבצע העבודה</label>
              <input value={form.worker} onChange={e => f("worker", e.target.value)} placeholder="שם מכונאי / ספק חיצוני" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>עלות עבודה (₪)</label>
                <input type="number" value={form.labor_cost} onChange={e => f("labor_cost", e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>עלות חלקים (₪)</label>
                <input type="number" value={form.parts_cost} onChange={e => f("parts_cost", e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
              </div>
            </div>
            <div style={{ background: C.surface, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>עלות כוללת</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: C.accent }}>₪{form.total_cost.toLocaleString()}</span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>מועד טיפול הבא</label>
              <input type="date" value={form.next_service_date} onChange={e => f("next_service_date", e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📋 סיכום הטיפול</div>
              {[
                ["כלי", `${equipment.find(e => e.Name === form.equipment_name)?.Icon || "🚜"} ${form.equipment_name}`],
                ["סוג", maintTypeCfg[form.type]?.label],
                ["תאריך", form.date],
                ["תיאור", form.description || "—"],
                ["מבצע", form.worker || "—"],
                ["עלות עבודה", `₪${parseInt(form.labor_cost || 0).toLocaleString()}`],
                ["עלות חלקים", `₪${parseInt(form.parts_cost || 0).toLocaleString()}`],
                ["סה\"כ", `₪${form.total_cost.toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: C.soft, width: 80, flexShrink: 0 }}>{k}:</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>הערות</label>
              <textarea value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="הערות נוספות..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.text, height: 80, resize: "none", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>סטטוס</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["open", "פתוח", C.orange], ["closed", "סגור", C.green]].map(([key, label, color]) => (
                  <button key={key} onClick={() => f("status", key)} style={{ flex: 1, background: form.status === key ? `${color}22` : C.surface, border: `2px solid ${form.status === key ? color : C.border}`, borderRadius: 10, padding: "11px", color: form.status === key ? color : C.soft, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>}
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>הבא ←</button>
            : <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "שומר..." : "✅ שמור טיפול"}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [equipment, setEquipment] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEq, setDetailEq] = useState(null);
  const [editEq, setEditEq] = useState(null);
  const [showEqModal, setShowEqModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function loadData() {
    setLoading(true);
    const [eqRes, maintRes] = await Promise.all([
      supabase.from("equipment").select("Name, Year, type, status, hours, next_service, manufacturer, Icon, equipment_number").order("Name"),
      supabase.from("maintenance").select("*").order("date", { ascending: false }),
    ]);
    if (eqRes.error) notify("❌ שגיאה בטעינת כלים: " + eqRes.error.message);
    else setEquipment(eqRes.data || []);
    if (maintRes.error) notify("❌ שגיאה בטעינת טיפולים: " + maintRes.error.message);
    else setMaintenance(maintRes.data || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function saveEquipment(form) {
    const payload = { Name: form.Name, equipment_number: form.equipment_number, type: form.type, status: form.status, hours: form.hours, next_service: form.next_service, manufacturer: form.manufacturer, Year: form.Year, Icon: form.Icon };
    if (editEq) {
      const { error } = await supabase.from("equipment").update(payload).eq("Name", editEq.Name);
      if (error) { notify("❌ שגיאה: " + error.message); return; }
      notify("✅ הכלי עודכן!");
    } else {
      const { error } = await supabase.from("equipment").insert([payload]);
      if (error) { notify("❌ שגיאה: " + error.message); return; }
      notify("✅ כלי חדש נוצר!");
    }
    setShowEqModal(false); setEditEq(null); setDetailEq(null);
    await loadData();
  }

  async function deleteEquipment(name) {
    const { error } = await supabase.from("equipment").delete().eq("Name", name);
    if (error) { notify("❌ שגיאה: " + error.message); return; }
    notify("🗑️ הכלי נמחק");
    setDeleteConfirm(null); setDetailEq(null);
    await loadData();
  }

  async function saveMaintenance(form) {
    const { error } = await supabase.from("maintenance").insert([form]);
    if (error) { notify("❌ שגיאה: " + error.message); return; }
    notify("✅ טיפול נשמר בהצלחה!");
    setShowMaintModal(false);
    await loadData();
  }

  async function closeMaintenance(id) {
    const { error } = await supabase.from("maintenance").update({ status: "closed" }).eq("id", id);
    if (error) { notify("❌ שגיאה: " + error.message); return; }
    notify("✅ טיפול נסגר");
    await loadData();
  }

  const inMaintenance = equipment.filter(e => e.status === "maintenance").length;
  const openMaint = maintenance.filter(m => m.status === "open").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Heebo','Segoe UI',sans-serif", direction: "rtl", display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-family: inherit; color: #e2e8f0; }
        option { background: #1a1e2e; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #252a3d; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @media (min-width: 768px) { .sidebar { display: flex !important; } .bottomnav { display: none !important; } .fab { bottom: 24px !important; } }
      `}</style>

      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 16 }}>צ</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>מוסך צמ"ה</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {openMaint > 0 && <Badge color={C.orange} small>🔧 {openMaint} פתוחים</Badge>}
          <Avatar text="ימ" size={32} />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <nav className="sidebar" style={{ display: "none", flexDirection: "column", width: 200, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "12px 0", flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "none", border: "none", borderRight: tab === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === n.id ? C.accent : C.soft, fontWeight: tab === n.id ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: 90 }}>
          {loading ? <Spinner /> :
            detailEq ? <EqDetail eq={detailEq} maintenance={maintenance} back={() => setDetailEq(null)} onEdit={() => { setEditEq(detailEq); setShowEqModal(true); }} onDelete={() => setDeleteConfirm(detailEq.Name)} onNewMaint={() => setShowMaintModal(true)} onCloseMaint={closeMaintenance} /> :
            tab === "home" ? <Home equipment={equipment} maintenance={maintenance} setTab={setTab} setDetailEq={setDetailEq} onNewMaint={() => setShowMaintModal(true)} onNewEq={() => { setEditEq(null); setShowEqModal(true); }} /> :
            tab === "equipment" ? <EqList equipment={equipment} setDetailEq={setDetailEq} onNew={() => { setEditEq(null); setShowEqModal(true); }} /> :
            tab === "maintenance" ? <MaintList maintenance={maintenance} equipment={equipment} onNew={() => setShowMaintModal(true)} onClose={closeMaintenance} /> :
            <Placeholder tab={tab} />
          }
        </main>
      </div>

      <nav className="bottomnav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: tab === n.id ? C.accent : C.muted, fontFamily: "inherit" }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {!detailEq && (tab === "equipment" || tab === "maintenance" || tab === "home") && (
        <button className="fab" onClick={() => setShowMaintModal(true)} style={{ position: "fixed", bottom: 76, left: 16, width: 56, height: 56, borderRadius: "50%", background: C.accent, color: "#000", border: "none", fontSize: 26, cursor: "pointer", boxShadow: `0 4px 20px ${C.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 49, fontFamily: "inherit" }}>+</button>
      )}

      {showEqModal && <EditEqModal eq={editEq} onSave={saveEquipment} onClose={() => { setShowEqModal(false); setEditEq(null); }} />}
      {showMaintModal && <NewMaintModal equipment={equipment} onSave={saveMaintenance} onClose={() => setShowMaintModal(false)} />}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 320 }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 16, textAlign: "center", marginBottom: 8 }}>מחיקת כלי</div>
            <div style={{ color: C.soft, fontSize: 14, textAlign: "center", marginBottom: 20 }}>האם אתה בטוח? פעולה זו לא ניתנת לביטול.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
              <button onClick={() => deleteEquipment(deleteConfirm)} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>מחק</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", fontWeight: 600, fontSize: 14, zIndex: 200, boxShadow: "0 4px 24px #0008", animation: "slideUp .25s ease", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function EqCard({ eq, onClick }) {
  const cfg = statusCfg[eq.status] || statusCfg.active;
  const pct = eq.next_service ? (eq.hours / eq.next_service) * 100 : 0;
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 50, height: 50, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{eq.Icon || "🚜"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{eq.Name}</div>
          <div style={{ color: C.soft, fontSize: 12 }}>{eq.equipment_number} · {eq.manufacturer}</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{eq.type} · {eq.Year}</div>
        </div>
        <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.soft, marginBottom: 6 }}>
        <span>⏱ {eq.hours?.toLocaleString() || 0} שעות</span>
        <span>טיפול הבא: {eq.next_service?.toLocaleString() || "—"}</span>
      </div>
      <Bar value={eq.hours || 0} max={eq.next_service || 1} />
      {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 5 }}>⚠ {(eq.next_service - eq.hours).toLocaleString()} שעות לטיפול הבא</div>}
    </div>
  );
}

function MaintCard({ rec, equipment, onClose }) {
  const eq = equipment.find(e => e.Name === rec.equipment_name);
  const tc = maintTypeCfg[rec.type] || maintTypeCfg.periodic;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, background: C.surface, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{eq?.Icon || "🚜"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{rec.equipment_name}</div>
          <div style={{ color: C.soft, fontSize: 13, marginTop: 2 }}>{rec.description}</div>
        </div>
        <div style={{ color: C.accent, fontWeight: 900, fontSize: 16, flexShrink: 0 }}>₪{rec.total_cost?.toLocaleString() || 0}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: rec.status === "open" ? 10 : 0 }}>
        <Badge color={tc.color} small>{tc.label}</Badge>
        <Badge color={rec.status === "open" ? C.orange : C.green} small>{rec.status === "open" ? "פתוח" : "סגור"}</Badge>
        <span style={{ fontSize: 12, color: C.soft, marginRight: "auto" }}>📅 {rec.date} {rec.worker && `· ${rec.worker}`}</span>
      </div>
      {rec.status === "open" && (
        <button onClick={() => onClose(rec.id)} style={{ width: "100%", background: C.greenDim, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>✅ סגור טיפול</button>
      )}
    </div>
  );
}

function Home({ equipment, maintenance, setTab, setDetailEq, onNewMaint, onNewEq }) {
  const openMaint = maintenance.filter(m => m.status === "open");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .3s" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>דשבורד</h1>
        <p style={{ color: C.soft, margin: 0, fontSize: 13 }}>מוסך צמ"ה · {equipment.length} כלים רשומים</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "כלים פעילים", val: equipment.filter(e => e.status === "active").length, color: C.green, icon: "✅" },
          { label: "בטיפול", val: equipment.filter(e => e.status === "maintenance").length, color: C.orange, icon: "🔧" },
          { label: "טיפולים פתוחים", val: openMaint.length, color: C.red, icon: "📋" },
          { label: "סה\"כ טיפולים", val: maintenance.length, color: C.blue, icon: "🔩" },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={onNewMaint} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 14, padding: 16, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>🔧 פתח טיפול</button>
        <button onClick={onNewEq} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>➕ כלי חדש</button>
      </div>
      {openMaint.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>⚡ טיפולים פתוחים</div>
          {openMaint.slice(0, 3).map(rec => {
            const eq = equipment.find(e => e.Name === rec.equipment_name);
            const tc = maintTypeCfg[rec.type] || maintTypeCfg.periodic;
            return (
              <div key={rec.id} onClick={() => setTab("maintenance")} style={{ background: C.card, border: `1px solid ${C.orange}44`, borderRadius: 14, padding: "12px 16px", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{eq?.Icon || "🚜"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{rec.equipment_name}</div>
                    <div style={{ color: C.soft, fontSize: 12 }}>{rec.description}</div>
                  </div>
                  <Badge color={tc.color} small>{tc.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 15 }}>סטטוס כלים</div>
      {equipment.map(eq => <EqCard key={eq.Name} eq={eq} onClick={() => setDetailEq(eq)} />)}
    </div>
  );
}

function EqList({ equipment, setDetailEq, onNew }) {
  const [filter, setFilter] = useState("all");
  const filtered = equipment.filter(e => filter === "all" || e.status === filter);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>כלי צמ"ה</h1>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[["all", "הכל"], ["active", "פעיל"], ["maintenance", "בטיפול"], ["disabled", "מושבת"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.accent : C.card, color: filter === v ? "#000" : C.soft, border: `1px solid ${filter === v ? C.accent : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(eq => <EqCard key={eq.Name} eq={eq} onClick={() => setDetailEq(eq)} />)}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין כלים להצגה</div>}
      </div>
    </div>
  );
}

function EqDetail({ eq, maintenance, back, onEdit, onDelete, onNewMaint, onCloseMaint }) {
  const cfg = statusCfg[eq.status] || statusCfg.active;
  const eqMaint = maintenance.filter(m => m.equipment_name === eq.Name);
  const totalCost = eqMaint.reduce((s, m) => s + (m.total_cost || 0), 0);
  const [activeTab, setActiveTab] = useState("history");
  return (
    <div style={{ animation: "fadeIn .25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "8px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{eq.Name}</div>
          <div style={{ color: C.soft, fontSize: 12 }}>{eq.equipment_number} · {eq.manufacturer}</div>
        </div>
        <Badge color={cfg.color} dim={cfg.dim}>{cfg.label}</Badge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "שעות", val: eq.hours?.toLocaleString() || "0", icon: "⏱" },
          { label: "טיפול הבא", val: eq.next_service ? `${eq.next_service.toLocaleString()}ש'` : "—", icon: "🔔" },
          { label: "סה\"כ טיפולים", val: eqMaint.length, icon: "📋" },
          { label: "עלות כוללת", val: `₪${totalCost.toLocaleString()}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.accent }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onNewMaint} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>🔧 פתח טיפול חדש</button>

      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {[["history", "📋 היסטוריה"], ["info", "ℹ️ פרטים"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, background: "none", border: "none", borderBottom: activeTab === id ? `2px solid ${C.accent}` : "2px solid transparent", color: activeTab === id ? C.accent : C.soft, fontWeight: 700, fontSize: 14, padding: "10px 4px", cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}>{lbl}</button>
        ))}
      </div>

      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {eqMaint.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין טיפולים מתועדים</div>}
          {eqMaint.map(rec => <MaintCard key={rec.id} rec={rec} equipment={[eq]} onClose={onCloseMaint} />)}
        </div>
      )}
      {activeTab === "info" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          {[["שם", eq.Name], ["מספר כלי", eq.equipment_number || "—"], ["סוג", eq.type || "—"], ["יצרן", eq.manufacturer || "—"], ["שנת ייצור", eq.Year || "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.soft }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onEdit} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: 14, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>✏️ ערוך</button>
            <button onClick={onDelete} style={{ flex: 1, background: C.redDim, color: C.red, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>🗑️</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintList({ maintenance, equipment, onNew, onClose }) {
  const [filter, setFilter] = useState("all");
  const filtered = maintenance.filter(m => filter === "all" || m.status === filter);
  const totalCost = maintenance.reduce((s, m) => s + (m.total_cost || 0), 0);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🔧 טיפולים</h1>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "סה\"כ טיפולים", val: maintenance.length, color: C.blue },
          { label: "פתוחים", val: maintenance.filter(m => m.status === "open").length, color: C.orange },
          { label: "עלות כוללת", val: `₪${totalCost.toLocaleString()}`, color: C.accent },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "הכל"], ["open", "פתוח"], ["closed", "סגור"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.accent : C.card, color: filter === v ? "#000" : C.soft, border: `1px solid ${filter === v ? C.accent : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(rec => <MaintCard key={rec.id} rec={rec} equipment={equipment} onClose={onClose} />)}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין טיפולים להצגה</div>}
      </div>
    </div>
  );
}

function Placeholder({ tab }) {
  const info = {
    inventory: { icon: "📦", label: "מלאי", desc: "מודול מלאי — יתחבר ל-Supabase עם טבלת inventory_items" },
    chat: { icon: "💬", label: "דיונים", desc: "מודול דיונים — יתחבר ל-Supabase Realtime" },
  };
  const i = info[tab] || { icon: "🔧", label: "", desc: "" };
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>{i.icon} {i.label}</h1>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{i.icon}</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>בפיתוח</div>
        <div style={{ color: C.soft, fontSize: 14 }}>{i.desc}</div>
      </div>
    </div>
  );
}
