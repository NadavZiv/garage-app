import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0a0c12",
  surface: "#13161f",
  card: "#1a1e2e",
  border: "#252a3d",
  accent: "#f59e0b",
  accentDim: "#f59e0b33",
  green: "#22c55e",
  greenDim: "#22c55e22",
  red: "#ef4444",
  redDim: "#ef444422",
  orange: "#f97316",
  orangeDim: "#f9731622",
  blue: "#3b82f6",
  blueDim: "#3b82f622",
  muted: "#4b5568",
  text: "#e2e8f0",
  soft: "#94a3b8",
};

const equipment = [
  { id: 1, name: "קטרפילר 320D", number: "TZ-001", type: "מחפר", status: "active", hours: 4820, nextService: 5000, manufacturer: "Caterpillar", model: "320D", year: 2019, icon: "🚜" },
  { id: 2, name: "קוממטסו WA380", number: "TZ-002", type: "טרקטור גלגלים", status: "maintenance", hours: 3210, nextService: 3250, manufacturer: "Komatsu", model: "WA380", year: 2020, icon: "🚛" },
  { id: 3, name: "וולבו EC300", number: "TZ-003", type: "מחפר", status: "active", hours: 6100, nextService: 6500, manufacturer: "Volvo", model: "EC300", year: 2018, icon: "🚜" },
  { id: 4, name: "ג'ון דיר 644K", number: "TZ-004", type: "מעמיס", status: "disabled", hours: 9800, nextService: 10000, manufacturer: "John Deere", model: "644K", year: 2017, icon: "🏗️" },
  { id: 5, name: "היטאצ'י ZX200", number: "TZ-005", type: "מחפר", status: "active", hours: 2340, nextService: 2500, manufacturer: "Hitachi", model: "ZX200", year: 2022, icon: "🚜" },
];

const maintenanceRecords = [
  { id: 1, equipmentId: 1, date: "2025-04-28", type: "periodic", description: "החלפת שמן מנוע ופילטרים", worker: "אבי לוי", cost: 1850, status: "closed", parts: ["שמן מנוע 10W-40", "פילטר שמן", "פילטר דלק"] },
  { id: 2, equipmentId: 2, date: "2025-05-03", type: "fault", description: "תיקון הידראוליקה - נזילת שמן", worker: "מוטי כהן", cost: 4200, status: "open", parts: ["אטם הידראוליקה", "צינור לחץ"] },
  { id: 3, equipmentId: 3, date: "2025-04-15", type: "inspection", description: "בדיקה תקופתית 500 שעות", worker: "אבי לוי", cost: 650, status: "closed", parts: ["פילטר אוויר"] },
  { id: 4, equipmentId: 5, date: "2025-05-01", type: "emergency", description: "תקלת מנוע דחופה בשטח", worker: "דוד בן-דוד", cost: 8500, status: "open", parts: ["חיישן טמפרטורה", "בלם מנוע"] },
];

const inventoryItems = [
  { id: 1, name: "שמן מנוע 10W-40", category: "שמן", stock: 45, minStock: 20, price: 85, unit: "ליטר" },
  { id: 2, name: "פילטר שמן קטרפילר", category: "פילטר", stock: 3, minStock: 5, price: 320, unit: "יח'" },
  { id: 3, name: "פילטר דלק", category: "פילטר", stock: 8, minStock: 5, price: 180, unit: "יח'" },
  { id: 4, name: "אטם הידראוליקה 50mm", category: "חלק חילוף", stock: 2, minStock: 4, price: 560, unit: "יח'" },
  { id: 5, name: "גלגל צמיג 23.5", category: "צמיג", stock: 0, minStock: 2, price: 4200, unit: "יח'" },
  { id: 6, name: "גריז מנגנונים", category: "שמן", stock: 12, minStock: 6, price: 95, unit: "ק\"ג" },
];

const initMessages = [
  { id: 1, equipmentId: 2, user: "מוטי כהן", avatar: "מכ", text: "נזילת שמן חמורה מצנרת הידראוליקה. צריך להזמין אטמים בדחיפות!", time: "09:14" },
  { id: 2, equipmentId: 2, user: "יוסי מנהל", avatar: "ימ", text: "קיבלתי. הזמנתי מ-HydroTech משלוח מהיר. יגיע מחר בבוקר.", time: "09:32" },
  { id: 3, equipmentId: 4, user: "דוד בן-דוד", avatar: "דב", text: "TZ-005 נעצר בשטח ליד כביש 6. מנוע לא עולה. שלחתם גרר?", time: "11:20" },
];

const statusCfg = {
  active: { label: "פעיל", color: C.green, dim: C.greenDim },
  maintenance: { label: "בטיפול", color: C.orange, dim: C.orangeDim },
  disabled: { label: "מושבת", color: C.red, dim: C.redDim },
};
const typeCfg = {
  periodic: { label: "תקופתי", color: C.blue },
  fault: { label: "תקלה", color: C.orange },
  emergency: { label: "חירום", color: C.red },
  inspection: { label: "בדיקה", color: C.soft },
};

// ─── Shared tiny components ───────────────────────────────────────────────────

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

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("home");
  const [detailEq, setDetailEq] = useState(null);
  const [detailTab, setDetailTab] = useState("history");
  const [showNewMaint, setShowNewMaint] = useState(false);
  const [maintStep, setMaintStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [messages, setMessages] = useState(initMessages);
  const [msgInput, setMsgInput] = useState("");
  const [chatEq, setChatEq] = useState(null);
  const chatEnd = useRef(null);

  const isMobile = window.innerWidth < 768;

  const lowStock = inventoryItems.filter(i => i.stock <= i.minStock);
  const openMaint = maintenanceRecords.filter(r => r.status === "open");

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function sendMsg() {
    if (!msgInput.trim()) return;
    setMessages(p => [...p, { id: Date.now(), equipmentId: chatEq?.id, user: "יוסי מנהל", avatar: "ימ", text: msgInput, time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) }]);
    setMsgInput("");
  }

  // ── Layout shell ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Heebo','Segoe UI',sans-serif", direction: "rtl", display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-family: inherit; color: ${C.text}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @media (min-width: 768px) { .desktop-layout { display: flex !important; } .mobile-bottom-nav { display: none !important; } .desktop-sidebar { display: flex !important; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* ── Top bar ── */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 16 }}>צ</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>מוסך צמ"ה</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {lowStock.length > 0 && <Badge color={C.orange} small>⚠ {lowStock.length}</Badge>}
          {openMaint.length > 0 && <Badge color={C.red} small>🔧 {openMaint.length}</Badge>}
          <Avatar text="ימ" size={32} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="desktop-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Desktop sidebar */}
        <nav className="desktop-sidebar" style={{ display: "none", flexDirection: "column", width: 200, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "12px 0", flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "none", border: "none", borderRight: tab === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === n.id ? C.accent : C.soft, fontWeight: tab === n.id ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: 80 }}>
          {detailEq
            ? <EqDetail eq={detailEq} back={() => setDetailEq(null)} records={maintenanceRecords} messages={messages} detailTab={detailTab} setDetailTab={setDetailTab} msgInput={msgInput} setMsgInput={setMsgInput} sendMsg={sendMsg} chatEnd={chatEnd} openNew={() => setShowNewMaint(true)} notify={notify} />
            : tab === "home" ? <Home setTab={setTab} setDetailEq={setDetailEq} openMaint={openMaint} lowStock={lowStock} notify={notify} openNew={() => setShowNewMaint(true)} />
            : tab === "equipment" ? <EqList setDetailEq={setDetailEq} />
            : tab === "maintenance" ? <MaintList openNew={() => setShowNewMaint(true)} notify={notify} />
            : tab === "inventory" ? <Inventory lowStock={lowStock} notify={notify} />
            : tab === "chat" ? <Chat messages={messages} setDetailEq={setDetailEq} setChatEq={setChatEq} setTab={setTab} setDetailTab={setDetailTab} />
            : tab === "reports" ? <Reports notify={notify} />
            : null
          }
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: tab === n.id ? C.accent : C.muted, transition: "color .15s" }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 700 : 400, fontFamily: "inherit" }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* FAB — פתח טיפול */}
      {!detailEq && (tab === "home" || tab === "equipment" || tab === "maintenance") && (
        <button onClick={() => setShowNewMaint(true)} style={{ position: "fixed", bottom: 76, left: 16, width: 56, height: 56, borderRadius: "50%", background: C.accent, color: "#000", border: "none", fontSize: 26, cursor: "pointer", boxShadow: `0 4px 20px ${C.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 49, fontWeight: 900, transition: "transform .15s", fontFamily: "inherit" }}
          onTouchStart={e => e.currentTarget.style.transform = "scale(.93)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
        >+</button>
      )}

      {/* Modal */}
      {showNewMaint && <NewMaintModal step={maintStep} setStep={setMaintStep} close={() => { setShowNewMaint(false); setMaintStep(1); }} notify={notify} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", fontWeight: 600, fontSize: 14, zIndex: 200, boxShadow: "0 4px 24px #0008", animation: "slideUp .25s ease", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const NAV = [
  { id: "home", icon: "🏠", label: "ראשי" },
  { id: "equipment", icon: "🚜", label: "כלים" },
  { id: "maintenance", icon: "🔧", label: "טיפולים" },
  { id: "inventory", icon: "📦", label: "מלאי" },
  { id: "chat", icon: "💬", label: "דיונים" },
];

// ─── Screens ──────────────────────────────────────────────────────────────────

function Home({ setTab, setDetailEq, openMaint, lowStock, notify, openNew }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .3s" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>דשבורד</h1>
        <p style={{ color: C.soft, margin: 0, fontSize: 13 }}>יום ב׳, 4 במאי 2026 · מוסך מרכזי</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "כלים פעילים", val: equipment.filter(e => e.status === "active").length, color: C.green, icon: "✅" },
          { label: "בטיפול", val: equipment.filter(e => e.status === "maintenance").length, color: C.orange, icon: "🔧" },
          { label: "מושבתים", val: equipment.filter(e => e.status === "disabled").length, color: C.red, icon: "🔴" },
          { label: "טיפולים פתוחים", val: openMaint.length, color: C.blue, icon: "📋" },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: C.soft, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(openMaint.length > 0 || lowStock.length > 0) && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>⚡ התראות</div>
          {openMaint.map(r => {
            const eq = equipment.find(e => e.id === r.equipmentId);
            return (
              <div key={r.id} onClick={() => { setDetailEq(eq); setTab("equipment"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", active: { background: C.surface } }}>
                <div style={{ width: 40, height: 40, background: C.orangeDim, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{eq?.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{eq?.name}</div>
                  <div style={{ color: C.soft, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.description}</div>
                </div>
                <Badge color={typeCfg[r.type].color} small>{typeCfg[r.type].label}</Badge>
              </div>
            );
          })}
          {lowStock.map(i => (
            <div key={i.id} onClick={() => setTab("inventory")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, background: C.redDim, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{i.stock === 0 ? "🚫" : "📉"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div>
                <div style={{ color: C.soft, fontSize: 12 }}>מלאי: {i.stock} {i.unit}</div>
              </div>
              <Badge color={i.stock === 0 ? C.red : C.orange} small>{i.stock === 0 ? "אזל" : "נמוך"}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={openNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 14, padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          ➕ פתח טיפול
        </button>
        <button onClick={() => setTab("equipment")} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🚜 כלי צמ"ה
        </button>
      </div>

      {/* Equipment status scroll */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>שעות לטיפול הבא</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {equipment.map(eq => {
            const cfg = statusCfg[eq.status];
            const pct = (eq.hours / eq.nextService) * 100;
            return (
              <div key={eq.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{eq.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{eq.name}</div>
                    <div style={{ color: C.soft, fontSize: 12 }}>{eq.number}</div>
                  </div>
                  <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.soft, marginBottom: 6 }}>
                  <span>{eq.hours.toLocaleString()} שעות</span>
                  <span>הבא: {eq.nextService.toLocaleString()}</span>
                </div>
                <Bar value={eq.hours} max={eq.nextService} />
                {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 5 }}>⚠ נותרו {eq.nextService - eq.hours} שעות</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EqList({ setDetailEq }) {
  const [filter, setFilter] = useState("all");
  const filtered = equipment.filter(e => filter === "all" || e.status === filter);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 14px" }}>כלי צמ"ה</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[["all", "הכל"], ["active", "פעיל"], ["maintenance", "בטיפול"], ["disabled", "מושבת"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.accent : C.card, color: filter === v ? "#000" : C.soft, border: `1px solid ${filter === v ? C.accent : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(eq => {
          const cfg = statusCfg[eq.status];
          const pct = (eq.hours / eq.nextService) * 100;
          const open = maintenanceRecords.filter(r => r.equipmentId === eq.id && r.status === "open").length;
          return (
            <div key={eq.id} onClick={() => setDetailEq(eq)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", cursor: "pointer", transition: "border-color .2s", active: {} }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{eq.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{eq.name}</div>
                  <div style={{ color: C.soft, fontSize: 12 }}>{eq.number} · {eq.manufacturer} {eq.model}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{eq.type} · {eq.year}</div>
                </div>
                <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.soft, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>⏱ {eq.hours.toLocaleString()} שעות</span>
                <span>טיפול הבא: {eq.nextService.toLocaleString()}</span>
              </div>
              <Bar value={eq.hours} max={eq.nextService} />
              {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 5 }}>⚠ {eq.nextService - eq.hours} שעות לטיפול הבא</div>}
              {open > 0 && <div style={{ marginTop: 10, background: C.orangeDim, border: `1px solid ${C.orange}44`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: C.orange, fontWeight: 600 }}>🔧 {open} טיפול פתוח</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EqDetail({ eq, back, records, messages, detailTab, setDetailTab, msgInput, setMsgInput, sendMsg, chatEnd, openNew, notify }) {
  const cfg = statusCfg[eq.status];
  const eqRecs = records.filter(r => r.equipmentId === eq.id);
  const eqMsgs = messages.filter(m => m.equipmentId === eq.id);
  const totalCost = eqRecs.reduce((s, r) => s + r.cost, 0);

  return (
    <div style={{ animation: "fadeIn .25s" }}>
      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "8px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{eq.name}</div>
          <div style={{ color: C.soft, fontSize: 12 }}>{eq.number} · {eq.manufacturer} {eq.model}</div>
        </div>
        <Badge color={cfg.color} dim={cfg.dim}>{cfg.label}</Badge>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "שעות", val: eq.hours.toLocaleString(), icon: "⏱" },
          { label: "טיפול הבא", val: `${eq.nextService.toLocaleString()}ש'`, icon: "🔔" },
          { label: "סה\"כ טיפולים", val: eqRecs.length, icon: "📋" },
          { label: "עלות כוללת", val: `₪${totalCost.toLocaleString()}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.accent }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action button */}
      <button onClick={openNew} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 14, padding: "14px", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
        ➕ פתח טיפול חדש
      </button>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {[["history", "📋 היסטוריה"], ["chat", "💬 דיון"], ["docs", "📎 מסמכים"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setDetailTab(id)} style={{ flex: 1, background: "none", border: "none", borderBottom: detailTab === id ? `2px solid ${C.accent}` : "2px solid transparent", color: detailTab === id ? C.accent : C.soft, fontWeight: 700, fontSize: 14, padding: "10px 4px", cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}>{lbl}</button>
        ))}
      </div>

      {detailTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {eqRecs.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין טיפולים מתועדים</div>}
          {eqRecs.map(rec => {
            const tc = typeCfg[rec.type];
            return (
              <div key={rec.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{rec.description}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge color={tc.color} small>{tc.label}</Badge>
                      <Badge color={rec.status === "open" ? C.orange : C.green} small>{rec.status === "open" ? "פתוח" : "סגור"}</Badge>
                    </div>
                  </div>
                  <div style={{ color: C.accent, fontWeight: 900, fontSize: 17 }}>₪{rec.cost.toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12, color: C.soft, marginBottom: 8 }}>📅 {rec.date} · 👤 {rec.worker}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {rec.parts.map(p => <span key={p} style={{ background: C.blueDim, color: C.blue, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>🔩 {p}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailTab === "chat" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ maxHeight: 320, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {eqMsgs.length === 0 && <div style={{ color: C.soft, textAlign: "center", padding: 24, fontSize: 14 }}>אין הודעות עדיין</div>}
            {eqMsgs.map(msg => (
              <div key={msg.id} style={{ display: "flex", gap: 10 }}>
                <Avatar text={msg.avatar} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700 }}>{msg.user}</span>
                    <span style={{ color: C.muted, marginRight: 8 }}>{msg.time}</span>
                  </div>
                  <div style={{ background: C.surface, borderRadius: "4px 12px 12px 12px", padding: "9px 13px", fontSize: 14, lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.border}` }}>
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="כתוב הודעה..." style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }} />
            <button onClick={sendMsg} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>שלח</button>
          </div>
        </div>
      )}

      {detailTab === "docs" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["חשבונית_042025.pdf", "תמונה_תקלה.jpg", "רשיון_כלי.pdf"].map(doc => (
            <div key={doc} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{doc.includes(".pdf") ? "📄" : "🖼"}</div>
              <div style={{ fontSize: 11, color: C.soft, wordBreak: "break-all" }}>{doc}</div>
            </div>
          ))}
          <div onClick={() => notify("📷 העלאת קובץ בפיתוח")} style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: 12, padding: 14, textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
            <div style={{ fontSize: 24, color: C.muted }}>+</div>
            <div style={{ fontSize: 12, color: C.muted }}>העלה קובץ</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintList({ openNew, notify }) {
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>טיפולים</h1>
        <button onClick={openNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {maintenanceRecords.map(rec => {
          const eq = equipment.find(e => e.id === rec.equipmentId);
          const tc = typeCfg[rec.type];
          return (
            <div key={rec.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, background: C.surface, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{eq?.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{eq?.name}</div>
                  <div style={{ color: C.soft, fontSize: 13, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.description}</div>
                </div>
                <div style={{ color: C.accent, fontWeight: 900, fontSize: 16, flexShrink: 0 }}>₪{rec.cost.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <Badge color={tc.color} small>{tc.label}</Badge>
                <Badge color={rec.status === "open" ? C.orange : C.green} small>{rec.status === "open" ? "פתוח" : "סגור"}</Badge>
                <span style={{ fontSize: 12, color: C.soft, marginRight: "auto" }}>📅 {rec.date} · {rec.worker}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Inventory({ lowStock, notify }) {
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>מלאי</h1>
        <button onClick={() => notify("הוספת פריט (בפיתוח)")} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 6, fontSize: 14 }}>⚠ {lowStock.length} פריטים דורשים הזמנה</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lowStock.map(i => <Badge key={i.id} color={i.stock === 0 ? C.red : C.orange} small>{i.name}</Badge>)}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {inventoryItems.map(item => {
          const isLow = item.stock <= item.minStock;
          const isEmpty = item.stock === 0;
          const statusColor = isEmpty ? C.red : isLow ? C.orange : C.green;
          return (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ color: C.soft, fontSize: 12, marginTop: 2 }}>{item.category} · ₪{item.price}/{item.unit}</div>
                </div>
                <Badge color={statusColor} small>{isEmpty ? "אזל" : isLow ? "נמוך" : "תקין"}</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: statusColor, fontWeight: 700 }}>{item.stock}</span>
                  <span style={{ color: C.soft }}> / {item.minStock} {item.unit}</span>
                </div>
                {isLow && (
                  <button onClick={() => notify(`מזמין ${item.name}...`)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>הזמן</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chat({ messages, setDetailEq, setChatEq, setTab, setDetailTab }) {
  const grouped = equipment.map(eq => ({ eq, msgs: messages.filter(m => m.equipmentId === eq.id) })).filter(g => g.msgs.length > 0);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>💬 דיוני צוות</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {grouped.map(({ eq, msgs }) => {
          const last = msgs[msgs.length - 1];
          return (
            <div key={eq.id} onClick={() => { setDetailEq(eq); setChatEq(eq); setTab("equipment"); setDetailTab("chat"); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 46, height: 46, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{eq.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{eq.name}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{last.time}</span>
                  </div>
                  <div style={{ color: C.soft, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ fontWeight: 600 }}>{last.user}: </span>{last.text}
                  </div>
                </div>
                <Badge color={C.blue} small>{msgs.length}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Reports({ notify }) {
  const total = maintenanceRecords.reduce((s, r) => s + r.cost, 0);
  const maxCost = Math.max(...equipment.map(eq => maintenanceRecords.filter(r => r.equipmentId === eq.id).reduce((s, r) => s + r.cost, 0)));
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>📊 דוחות</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "סה\"כ עלויות", val: `₪${total.toLocaleString()}`, color: C.accent, icon: "💰" },
          { label: "ממוצע לטיפול", val: `₪${Math.round(total / maintenanceRecords.length).toLocaleString()}`, color: C.blue, icon: "📈" },
          { label: "טיפולים", val: maintenanceRecords.length, color: C.green, icon: "🔧" },
          { label: "ימי השבתה", val: "14", color: C.red, icon: "⏸" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${s.color}33`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: C.soft }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>עלויות לפי כלי</div>
        {equipment.map(eq => {
          const cost = maintenanceRecords.filter(r => r.equipmentId === eq.id).reduce((s, r) => s + r.cost, 0);
          return (
            <div key={eq.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                <span>{eq.icon} {eq.name}</span>
                <span style={{ fontWeight: 700, color: C.accent }}>₪{cost.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cost / maxCost) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.accent})`, borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["ייצוא לאקסל 📊", "ייצוא לוורד 📝", "דוח PDF 📄"].map(btn => (
          <button key={btn} onClick={() => notify(`${btn} — בפיתוח`)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>{btn}</button>
        ))}
      </div>
    </div>
  );
}

function NewMaintModal({ step, setStep, close, notify }) {
  const [form, setForm] = useState({ equipment: "", type: "periodic", description: "", worker: "", cost: "" });
  const eq = equipment.find(e => e.id === parseInt(form.equipment));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "90vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>פתיחת טיפול חדש</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: 28, height: 28, borderRadius: "50%", background: step >= n ? C.accent : C.border, color: step >= n ? "#000" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{n}</div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>כלי צמ"ה</label>
              <select value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none", cursor: "pointer" }}>
                <option value="">בחר כלי...</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.icon} {eq.name} ({eq.number})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>סוג טיפול</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(typeCfg).map(([key, val]) => (
                  <button key={key} onClick={() => setForm({ ...form, type: key })} style={{ background: form.type === key ? `${val.color}22` : C.surface, border: `2px solid ${form.type === key ? val.color : C.border}`, borderRadius: 10, padding: "11px", color: form.type === key ? val.color : C.soft, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{val.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>תיאור העבודה</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="תאר את העבודה שנדרשת..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.text, height: 100, resize: "none", outline: "none" }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>מבצע העבודה</label>
              <input value={form.worker} onChange={e => setForm({ ...form, worker: e.target.value })} placeholder="שם מכונאי / ספק" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>חלקי חילוף</label>
              {inventoryItems.slice(0, 4).map(item => (
                <label key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: C.surface, borderRadius: 10, marginBottom: 8, cursor: "pointer" }}>
                  <input type="checkbox" style={{ width: 18, height: 18, accentColor: C.accent, cursor: "pointer" }} />
                  <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                  <Badge color={item.stock > item.minStock ? C.green : C.orange} small>{item.stock} {item.unit}</Badge>
                </label>
              ))}
            </div>
            <div>
              <label style={{ fontSize: 13, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>עלות משוערת (₪)</label>
              <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} type="number" placeholder="0" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none" }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: "16px" }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📋 סיכום הטיפול</div>
              {[
                ["כלי", eq ? `${eq.icon} ${eq.name}` : "—"],
                ["סוג", typeCfg[form.type]?.label],
                ["תיאור", form.description || "—"],
                ["מבצע", form.worker || "—"],
                ["עלות", form.cost ? `₪${form.cost}` : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: C.soft, width: 55, flexShrink: 0 }}>{k}:</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div onClick={() => notify("📷 מצלמה נפתחת (בפיתוח native)")} style={{ border: `2px dashed ${C.border}`, borderRadius: 14, padding: 28, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>צלם תמונה</div>
              <div style={{ color: C.soft, fontSize: 13, marginTop: 4 }}>צרף תמונות מהשטח</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={close} style={{ background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", flex: 1, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", flex: 1, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>}
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", flex: 2, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>הבא ←</button>
            : <button onClick={() => { close(); notify("✅ טיפול נפתח בהצלחה!"); }} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 12, padding: "14px", flex: 2, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>שמור טיפול ✓</button>
          }
        </div>
      </div>
    </div>
  );
}
