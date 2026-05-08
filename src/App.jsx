import { useState, useEffect, useRef } from "react";
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

const NAV = [
  { id: "home", icon: "🏠", label: "ראשי" },
  { id: "equipment", icon: "🚜", label: "כלים" },
  { id: "maintenance", icon: "🔧", label: "טיפולים" },
  { id: "inventory", icon: "📦", label: "מלאי" },
  { id: "chat", icon: "💬", label: "דיונים" },
];

function Badge({ color, dim, children, small }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: small ? "2px 8px" : "4px 12px", borderRadius: 20, fontSize: small ? 11 : 12, fontWeight: 700, color, background: dim || `${color}22`, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Bar({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: pct > 85 ? C.orange : C.blue, borderRadius: 3, transition: "width .6s" }} />
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

function EditEquipmentModal({ eq, onSave, onClose }) {
  const [form, setForm] = useState({
    Name: eq?.Name || "",
    number: eq?.number || "",
    type: eq?.type || "",
    status: eq?.status || "active",
    hours: eq?.hours || 0,
    next_service: eq?.next_service || 0,
    manufacturer: eq?.manufacturer || "",
    Year: eq?.Year || new Date().getFullYear(),
    Icon: eq?.Icon || "🚜",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.Name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const iconOptions = ["🚜", "🚛", "🏗️", "🚧", "⛏️", "🔧"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>{eq ? "✏️ עריכת כלי" : "➕ כלי חדש"}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>אייקון</label>
            <div style={{ display: "flex", gap: 8 }}>
              {iconOptions.map(ic => (
                <button key={ic} onClick={() => setForm({ ...form, Icon: ic })} style={{ width: 44, height: 44, fontSize: 22, background: form.Icon === ic ? C.accentDim : C.surface, border: `2px solid ${form.Icon === ic ? C.accent : C.border}`, borderRadius: 10, cursor: "pointer" }}>{ic}</button>
              ))}
            </div>
          </div>

          {[
            { key: "Name", label: "שם הכלי *", placeholder: "קטרפילר 320D" },
            { key: "number", label: "מספר כלי", placeholder: "TZ-001" },
            { key: "type", label: "סוג", placeholder: "מחפר" },
            { key: "manufacturer", label: "יצרן", placeholder: "Caterpillar" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>שעות נוכחיות</label>
              <input type="number" value={form.hours} onChange={e => setForm({ ...form, hours: parseInt(e.target.value) || 0 })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>טיפול הבא (שעות)</label>
              <input type="number" value={form.next_service} onChange={e => setForm({ ...form, next_service: parseInt(e.target.value) || 0 })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>סטטוס</label>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(statusCfg).map(([key, val]) => (
                <button key={key} onClick={() => setForm({ ...form, status: key })} style={{ flex: 1, background: form.status === key ? val.dim : C.surface, border: `2px solid ${form.status === key ? val.color : C.border}`, borderRadius: 10, padding: "10px 4px", color: form.status === key ? val.color : C.soft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{val.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "שומר..." : "💾 שמור"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEq, setDetailEq] = useState(null);
  const [editEq, setEditEq] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewEq, setShowNewEq] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  async function loadEquipment() {
    setLoading(true);
    const { data, error } = await supabase.from("equipment").select("*").order("id");
    if (error) { notify("❌ שגיאה בטעינת נתונים"); console.error(error); }
    else setEquipment(data || []);
    setLoading(false);
  }

  useEffect(() => { loadEquipment(); }, []);

  async function saveEquipment(form) {
    if (editEq) {
      const { error } = await supabase.from("equipment").update(form).eq("id", editEq.id);
      if (error) { notify("❌ שגיאה בשמירה: " + error.message); return; }
      notify("✅ הכלי עודכן בהצלחה!");
    } else {
      const { error } = await supabase.from("equipment").insert([form]);
      if (error) { notify("❌ שגיאה ביצירה: " + error.message); return; }
      notify("✅ כלי חדש נוצר!");
    }
    setShowEditModal(false);
    setShowNewEq(false);
    setEditEq(null);
    setDetailEq(null);
    await loadEquipment();
  }

  async function deleteEquipment(id) {
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) { notify("❌ שגיאה במחיקה"); return; }
    notify("🗑️ הכלי נמחק");
    setDeleteConfirm(null);
    setDetailEq(null);
    await loadEquipment();
  }

  const openMaint = equipment.filter(e => e.status === "maintenance").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Heebo','Segoe UI',sans-serif", direction: "rtl", display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-family: inherit; color: #e2e8f0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #252a3d; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
          .fab { bottom: 24px !important; }
        }
      `}</style>

      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 16 }}>צ</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>מוסך צמ"ה</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {openMaint > 0 && <Badge color={C.orange} small>🔧 {openMaint} בטיפול</Badge>}
          <Avatar text="ימ" size={32} />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <nav className="desktop-sidebar" style={{ display: "none", flexDirection: "column", width: 200, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "12px 0", flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "none", border: "none", borderRight: tab === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === n.id ? C.accent : C.soft, fontWeight: tab === n.id ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: 90 }}>
          {loading ? <Spinner /> :
            detailEq ? <EqDetail eq={detailEq} back={() => setDetailEq(null)} onEdit={() => { setEditEq(detailEq); setShowEditModal(true); }} onDelete={() => setDeleteConfirm(detailEq.id)} /> :
            tab === "home" ? <Home equipment={equipment} setTab={setTab} setDetailEq={setDetailEq} onNew={() => { setEditEq(null); setShowNewEq(true); }} /> :
            tab === "equipment" ? <EqList equipment={equipment} setDetailEq={setDetailEq} onNew={() => { setEditEq(null); setShowNewEq(true); }} /> :
            <Placeholder tab={tab} notify={notify} />
          }
        </main>
      </div>

      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: tab === n.id ? C.accent : C.muted, fontFamily: "inherit" }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {!detailEq && tab === "equipment" && (
        <button className="fab" onClick={() => { setEditEq(null); setShowNewEq(true); }} style={{ position: "fixed", bottom: 76, left: 16, width: 56, height: 56, borderRadius: "50%", background: C.accent, color: "#000", border: "none", fontSize: 26, cursor: "pointer", boxShadow: `0 4px 20px ${C.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 49, fontWeight: 900, fontFamily: "inherit" }}>+</button>
      )}

      {(showEditModal || showNewEq) && (
        <EditEquipmentModal eq={editEq} onSave={saveEquipment} onClose={() => { setShowEditModal(false); setShowNewEq(false); setEditEq(null); }} />
      )}

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

function Home({ equipment, setTab, setDetailEq, onNew }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .3s" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>דשבורד</h1>
        <p style={{ color: C.soft, margin: 0, fontSize: 13 }}>מוסך צמ"ה מרכזי · {equipment.length} כלים רשומים</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "כלים פעילים", val: equipment.filter(e => e.status === "active").length, color: C.green, icon: "✅" },
          { label: "בטיפול", val: equipment.filter(e => e.status === "maintenance").length, color: C.orange, icon: "🔧" },
          { label: "מושבתים", val: equipment.filter(e => e.status === "disabled").length, color: C.red, icon: "🔴" },
          { label: "סה\"כ כלים", val: equipment.length, color: C.blue, icon: "🚜" },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 14, padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>➕ כלי חדש</button>
        <button onClick={() => setTab("equipment")} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>🚜 כל הכלים</button>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>סטטוס כלים</div>
      {equipment.map(eq => {
        const cfg = statusCfg[eq.status] || statusCfg.active;
        const pct = eq.next_service ? (eq.hours / eq.next_service) * 100 : 0;
        return (
          <div key={eq.id} onClick={() => setDetailEq(eq)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{eq.Icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{eq.Name}</div>
                <div style={{ color: C.soft, fontSize: 12 }}>{eq.equipment_number}</div>
              </div>
              <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.soft, marginBottom: 6 }}>
              <span>{eq.hours?.toLocaleString()} שעות</span>
              <span>הבא: {eq.next_service?.toLocaleString()}</span>
            </div>
            <Bar value={eq.hours || 0} max={eq.next_service || 1} />
            {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 5 }}>⚠ נותרו {(eq.next_service - eq.hours).toLocaleString()} שעות</div>}
          </div>
        );
      })}
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
        {filtered.map(eq => {
          const cfg = statusCfg[eq.status] || statusCfg.active;
          const pct = eq.next_service ? (eq.hours / eq.next_service) * 100 : 0;
          return (
            <div key={eq.id} onClick={() => setDetailEq(eq)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{eq.Icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{eq.Name}</div>
                  <div style={{ color: C.soft, fontSize: 12 }}>{eq.equipment_number} · {eq.manufacturer}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{eq.type} · {eq.Year}</div>
                </div>
                <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.soft, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>⏱ {eq.hours?.toLocaleString()} שעות</span>
                <span>טיפול הבא: {eq.next_service?.toLocaleString()}</span>
              </div>
              <Bar value={eq.hours || 0} max={eq.next_service || 1} />
              {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 5 }}>⚠ {(eq.next_service - eq.hours).toLocaleString()} שעות לטיפול הבא</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין כלים להצגה</div>}
      </div>
    </div>
  );
}

function EqDetail({ eq, back, onEdit, onDelete }) {
  const cfg = statusCfg[eq.status] || statusCfg.active;
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
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{eq.Icon}</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{eq.Name}</div>
        <div style={{ color: C.soft, fontSize: 13, marginTop: 4 }}>{eq.type} · {eq.manufacturer} · {eq.Year}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "שעות עבודה", val: eq.hours?.toLocaleString(), icon: "⏱" },
          { label: "טיפול הבא", val: `${eq.next_service?.toLocaleString()}ש'`, icon: "🔔" },
          { label: "יצרן", val: eq.manufacturer, icon: "🏭" },
          { label: "שנת ייצור", val: eq.Year, icon: "📅" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.accent }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.soft, marginBottom: 6 }}>
          <span>התקדמות לטיפול הבא</span>
          <span>{eq.hours} / {eq.next_service} שעות</span>
        </div>
        <Bar value={eq.hours || 0} max={eq.next_service || 1} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onEdit} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>✏️ ערוך פרטים</button>
        <button onClick={onDelete} style={{ flex: 1, background: C.redDim, color: C.red, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>🗑️</button>
      </div>
    </div>
  );
}

function Placeholder({ tab, notify }) {
  const info = {
    maintenance: { icon: "🔧", label: "טיפולים", desc: "מודול טיפולים — יתחבר ל-Supabase עם טבלת maintenance_records" },
    inventory: { icon: "📦", label: "מלאי", desc: "מודול מלאי — יתחבר ל-Supabase עם טבלת inventory_items" },
    chat: { icon: "💬", label: "דיונים", desc: "מודול דיונים — יתחבר ל-Supabase Realtime עם טבלת messages" },
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
