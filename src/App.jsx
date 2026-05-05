import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0f1117",
  surface: "#181c27",
  card: "#1e2335",
  border: "#2a3050",
  accent: "#f59e0b",
  accentLight: "#fbbf24",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  blue: "#3b82f6",
  muted: "#6b7280",
  text: "#e2e8f0",
  textSoft: "#94a3b8",
};

const equipment = [
  { id: 1, name: "קטרפילר 320D", number: "TZ-001", type: "מחפר", status: "active", hours: 4820, nextService: 5000, manufacturer: "Caterpillar", model: "320D", year: 2019, image: "🚜" },
  { id: 2, name: "קוממטסו WA380", number: "TZ-002", type: "טרקטור גלגלים", status: "maintenance", hours: 3210, nextService: 3250, manufacturer: "Komatsu", model: "WA380", year: 2020, image: "🚛" },
  { id: 3, name: "וולבו EC300", number: "TZ-003", type: "מחפר", status: "active", hours: 6100, nextService: 6500, manufacturer: "Volvo", model: "EC300", year: 2018, image: "🚜" },
  { id: 4, name: "ג'ון דיר 644K", number: "TZ-004", type: "מעמיס", status: "disabled", hours: 9800, nextService: 10000, manufacturer: "John Deere", model: "644K", year: 2017, image: "🏗️" },
  { id: 5, name: "היטאצ'י ZX200", number: "TZ-005", type: "מחפר", status: "active", hours: 2340, nextService: 2500, manufacturer: "Hitachi", model: "ZX200", year: 2022, image: "🚜" },
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
  { id: 5, name: "גרמ צמיג 23.5", category: "צמיג", stock: 0, minStock: 2, price: 4200, unit: "יח'" },
  { id: 6, name: "גריז מנגנונים", category: "שמן", stock: 12, minStock: 6, price: 95, unit: "ק\"ג" },
];

const messages = [
  { id: 1, equipmentId: 2, user: "מוטי כהן", avatar: "מכ", text: "נזילת שמן חמורה מצנרת הידראוליקה. צריך להזמין אטמים בדחיפות!", time: "09:14", tagged: ["@מנהל"] },
  { id: 2, equipmentId: 2, user: "יוסי מנהל", avatar: "ימ", text: "קיבלתי. הזמנתי מ-HydroTech משלוח מהיר. יגיע מחר בבוקר.", time: "09:32", tagged: [] },
  { id: 3, equipmentId: 2, user: "מוטי כהן", avatar: "מכ", text: "תודה. בינתיים עצרתי את הכלי ושמתי שלט אזהרה.", time: "09:45", tagged: [] },
  { id: 4, equipmentId: 4, user: "דוד בן-דוד", avatar: "דב", text: "TZ-005 נעצר בשטח ליד כביש 6. מנוע לא עולה. שלחתם גרר?", time: "11:20", tagged: ["@מנהל", "@רכב"] },
];

const statusConfig = {
  active: { label: "פעיל", color: COLORS.green, bg: "#14532d22" },
  maintenance: { label: "בטיפול", color: COLORS.orange, bg: "#7c2d1222" },
  disabled: { label: "מושבת", color: COLORS.red, bg: "#7f1d1d22" },
};

const typeConfig = {
  periodic: { label: "תקופתי", color: COLORS.blue },
  fault: { label: "תקלה", color: COLORS.orange },
  emergency: { label: "חירום", color: COLORS.red },
  inspection: { label: "בדיקה", color: COLORS.textSoft },
};

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState("history");
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(messages);
  const [showNewMaintenance, setShowNewMaintenance] = useState(false);
  const [newMaintStep, setNewMaintStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const chatEndRef = useRef(null);

  const stats = {
    active: equipment.filter(e => e.status === "active").length,
    maintenance: equipment.filter(e => e.status === "maintenance").length,
    disabled: equipment.filter(e => e.status === "disabled").length,
    openMaint: maintenanceRecords.filter(r => r.status === "open").length,
  };

  const lowStock = inventoryItems.filter(i => i.stock <= i.minStock);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function showNotif(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  function sendMessage() {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(), equipmentId: selectedEquipment?.id,
      user: "יוסי מנהל", avatar: "ימ", text: newMessage, time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }), tagged: []
    }]);
    setNewMessage("");
    showNotif("הודעה נשלחה ✓");
  }

  const s = {
    app: { minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Heebo', 'Segoe UI', sans-serif", direction: "rtl" },
    topbar: { background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logo: { fontWeight: 800, fontSize: 18, color: COLORS.accent, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 },
    mainLayout: { display: "flex", minHeight: "calc(100vh - 60px)" },
    sidebar: { width: 220, background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, padding: "16px 0", flexShrink: 0 },
    sideItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? COLORS.accent : COLORS.textSoft, background: active ? `${COLORS.accent}11` : "transparent", borderRight: active ? `3px solid ${COLORS.accent}` : "3px solid transparent", transition: "all 0.15s" }),
    content: { flex: 1, padding: "24px 28px", overflowY: "auto" },
    card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 },
    statCard: (color) => ({ background: COLORS.card, border: `1px solid ${color}33`, borderRadius: 12, padding: "18px 20px", flex: 1 }),
    badge: (color, bg) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || `${color}22` }),
    btn: (color = COLORS.accent) => ({ background: color, color: color === COLORS.accent ? "#000" : "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }),
    btnOutline: { background: "transparent", color: COLORS.textSoft, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    input: { background: "#0f1117", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none" },
    progressBar: (pct, color) => ({ height: 6, borderRadius: 3, background: COLORS.border, position: "relative", overflow: "hidden", "::after": {} }),
    h2: { fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.text },
    h3: { fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: COLORS.text },
    tag: (color) => ({ fontSize: 11, background: `${color}22`, color, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }),
  };

  const navItems = [
    { id: "dashboard", icon: "⬛", label: "דשבורד" },
    { id: "equipment", icon: "🚜", label: "כלי צמ\"ה" },
    { id: "maintenance", icon: "🔧", label: "טיפולים" },
    { id: "inventory", icon: "📦", label: "מלאי" },
    { id: "chat", icon: "💬", label: "דיונים" },
    { id: "reports", icon: "📊", label: "דוחות" },
  ];

  function Progress({ value, max, color }) {
    const pct = Math.min(100, (value / max) * 100);
    const isNear = pct > 85;
    return (
      <div style={{ height: 6, borderRadius: 3, background: COLORS.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: isNear ? COLORS.orange : (color || COLORS.blue), borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    );
  }

  // --- SCREENS ---

  function Dashboard() {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h2 style={s.h2}>דשבורד ראשי</h2>
          <p style={{ color: COLORS.textSoft, margin: 0, fontSize: 14 }}>יום ב׳, 4 במאי 2026 · מוסך צמ"ה מרכזי</p>
        </div>

        {/* KPI Row */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "כלים פעילים", value: stats.active, color: COLORS.green, icon: "✅" },
            { label: "בטיפול", value: stats.maintenance, color: COLORS.orange, icon: "🔧" },
            { label: "מושבתים", value: stats.disabled, color: COLORS.red, icon: "🔴" },
            { label: "טיפולים פתוחים", value: stats.openMaint, color: COLORS.blue, icon: "📋" },
          ].map(kpi => (
            <div key={kpi.label} style={s.statCard(kpi.color)}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{kpi.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, color: COLORS.textSoft, marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Recent maintenance */}
          <div style={s.card}>
            <h3 style={s.h3}>🔧 טיפולים פתוחים</h3>
            {maintenanceRecords.filter(r => r.status === "open").map(rec => {
              const eq = equipment.find(e => e.id === rec.equipmentId);
              return (
                <div key={rec.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 24 }}>{eq?.image}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{eq?.name}</div>
                    <div style={{ color: COLORS.textSoft, fontSize: 12 }}>{rec.description}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={s.tag(typeConfig[rec.type].color)}>{typeConfig[rec.type].label}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.accent }}>₪{rec.cost.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: COLORS.textSoft }}>{rec.worker}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low inventory */}
          <div style={s.card}>
            <h3 style={s.h3}>⚠️ מלאי נמוך / חסר</h3>
            {lowStock.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: item.stock === 0 ? `${COLORS.red}22` : `${COLORS.orange}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {item.stock === 0 ? "🚫" : "📉"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                  <div style={{ color: COLORS.textSoft, fontSize: 12 }}>{item.category}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <span style={s.badge(item.stock === 0 ? COLORS.red : COLORS.orange)}>
                    {item.stock === 0 ? "אזל" : `${item.stock} ${item.unit}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment status */}
          <div style={{ ...s.card, gridColumn: "1 / -1" }}>
            <h3 style={s.h3}>🚜 סטטוס כלים — שעות לטיפול הבא</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {equipment.map(eq => {
                const pct = (eq.hours / eq.nextService) * 100;
                const cfg = statusConfig[eq.status];
                return (
                  <div key={eq.id} onClick={() => { setSelectedEquipment(eq); setScreen("equipmentDetail"); }} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, cursor: "pointer", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 22 }}>{eq.image}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{eq.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSoft }}>{eq.number}</div>
                      </div>
                      <span style={{ ...s.badge(cfg.color, cfg.bg), marginRight: "auto", fontSize: 10 }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 6 }}>
                      שעות: <b style={{ color: COLORS.text }}>{eq.hours.toLocaleString()}</b> / {eq.nextService.toLocaleString()}
                    </div>
                    <Progress value={eq.hours} max={eq.nextService} />
                    {pct > 85 && <div style={{ fontSize: 11, color: COLORS.orange, marginTop: 5 }}>⚠ טיפול קרוב</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function EquipmentList() {
    const [filter, setFilter] = useState("all");
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={s.h2}>כלי צמ"ה</h2>
            <p style={{ color: COLORS.textSoft, margin: 0, fontSize: 14 }}>{equipment.length} כלים רשומים</p>
          </div>
          <button style={s.btn()} onClick={() => showNotif("פתיחת טופס כלי חדש (בפיתוח)")}>+ כלי חדש</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all", "active", "maintenance", "disabled"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...s.btnOutline, borderColor: filter === f ? COLORS.accent : COLORS.border, color: filter === f ? COLORS.accent : COLORS.textSoft, fontFamily: "inherit" }}>
              {f === "all" ? "הכל" : statusConfig[f]?.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {equipment.filter(e => filter === "all" || e.status === filter).map(eq => {
            const cfg = statusConfig[eq.status];
            const openRecs = maintenanceRecords.filter(r => r.equipmentId === eq.id && r.status === "open");
            return (
              <div key={eq.id} onClick={() => { setSelectedEquipment(eq); setScreen("equipmentDetail"); }} style={{ ...s.card, cursor: "pointer", transition: "border-color 0.2s", borderColor: COLORS.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, background: COLORS.surface, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{eq.image}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{eq.name}</div>
                      <div style={{ color: COLORS.textSoft, fontSize: 12 }}>{eq.number} · {eq.type}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted }}>{eq.manufacturer} {eq.model} · {eq.year}</div>
                    </div>
                  </div>
                  <span style={s.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
                </div>

                <div style={{ background: COLORS.surface, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: COLORS.textSoft }}>שעות עבודה</span>
                    <span style={{ fontWeight: 600 }}>{eq.hours.toLocaleString()} / {eq.nextService.toLocaleString()}</span>
                  </div>
                  <Progress value={eq.hours} max={eq.nextService} />
                  {(eq.hours / eq.nextService) > 0.85 && <div style={{ color: COLORS.orange, fontSize: 11, marginTop: 6 }}>⚠ נותרו {eq.nextService - eq.hours} שעות לטיפול הבא</div>}
                </div>

                {openRecs.length > 0 && (
                  <div style={{ background: `${COLORS.orange}15`, border: `1px solid ${COLORS.orange}44`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    🔧 {openRecs.length} טיפול פתוח
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function EquipmentDetail({ eq }) {
    const records = maintenanceRecords.filter(r => r.equipmentId === eq.id);
    const eqMessages = chatMessages.filter(m => m.equipmentId === eq.id);
    const cfg = statusConfig[eq.status];

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setScreen("equipment")} style={{ ...s.btnOutline, padding: "7px 14px" }}>← חזרה</button>
          <div style={{ fontSize: 32 }}>{eq.image}</div>
          <div>
            <h2 style={{ ...s.h2, marginBottom: 2 }}>{eq.name}</h2>
            <div style={{ color: COLORS.textSoft, fontSize: 13 }}>{eq.number} · {eq.manufacturer} {eq.model} · {eq.year}</div>
          </div>
          <span style={{ ...s.badge(cfg.color, cfg.bg), marginRight: "auto", fontSize: 13, padding: "5px 14px" }}>{cfg.label}</span>
          <button style={s.btn()} onClick={() => setShowNewMaintenance(true)}>+ פתח טיפול</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "שעות עבודה", value: eq.hours.toLocaleString(), icon: "⏱" },
            { label: "טיפול הבא", value: `${eq.nextService.toLocaleString()} ש'`, icon: "🔔" },
            { label: "סה\"כ טיפולים", value: records.length, icon: "📋" },
            { label: "עלות כוללת", value: `₪${records.reduce((s, r) => s + r.cost, 0).toLocaleString()}`, icon: "💰" },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.card, flex: 1, textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.accent }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: COLORS.textSoft }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
          {[["history", "📋 היסטוריה"], ["chat", "💬 דיון צוות"], ["docs", "📎 מסמכים"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ background: "none", border: "none", borderBottom: activeTab === id ? `2px solid ${COLORS.accent}` : "2px solid transparent", color: activeTab === id ? COLORS.accent : COLORS.textSoft, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {records.length === 0 && <div style={{ color: COLORS.textSoft, textAlign: "center", padding: 40 }}>אין טיפולים מתועדים</div>}
            {records.map(rec => {
              const tc = typeConfig[rec.type];
              return (
                <div key={rec.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={s.tag(tc.color)}>{tc.label}</span>
                      <span style={{ fontWeight: 600 }}>{rec.description}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={s.badge(rec.status === "open" ? COLORS.orange : COLORS.green)}>{rec.status === "open" ? "פתוח" : "סגור"}</span>
                      <span style={{ color: COLORS.accent, fontWeight: 700 }}>₪{rec.cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, fontSize: 12, color: COLORS.textSoft, marginBottom: 8 }}>
                    <span>📅 {rec.date}</span>
                    <span>👤 {rec.worker}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {rec.parts.map(p => <span key={p} style={{ ...s.tag(COLORS.blue), fontSize: 11 }}>🔩 {p}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "chat" && (
          <div style={s.card}>
            <div style={{ maxHeight: 340, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {eqMessages.length === 0 && <div style={{ color: COLORS.textSoft, textAlign: "center", padding: 30 }}>אין הודעות עדיין</div>}
              {eqMessages.map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{msg.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{msg.user}</span>
                      <span style={{ fontSize: 11, color: COLORS.muted }}>{msg.time}</span>
                    </div>
                    <div style={{ background: COLORS.surface, borderRadius: "4px 12px 12px 12px", padding: "8px 12px", fontSize: 13, lineHeight: 1.5 }}>
                      {msg.text}
                      {msg.tagged.length > 0 && <div style={{ marginTop: 4 }}>{msg.tagged.map(t => <span key={t} style={{ color: COLORS.blue, fontSize: 12 }}>{t} </span>)}</div>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="כתוב הודעה... (@שם לתיוג)" style={{ ...s.input, flex: 1 }} />
              <button style={s.btn()} onClick={sendMessage}>שלח</button>
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div style={s.card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {["חשבונית_טיפול_042025.pdf", "תמונה_תקלה_1.jpg", "רשיון_כלי.pdf"].map(doc => (
                <div key={doc} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{doc.includes(".pdf") ? "📄" : "🖼"}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSoft, wordBreak: "break-all" }}>{doc}</div>
                </div>
              ))}
              <div onClick={() => showNotif("העלאת קובץ (בפיתוח)")} style={{ background: COLORS.surface, border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 14, textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
                <div style={{ fontSize: 24, color: COLORS.muted }}>+</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>העלה קובץ</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function MaintenanceList() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={s.h2}>טיפולים ותחזוקה</h2>
            <p style={{ color: COLORS.textSoft, margin: 0, fontSize: 14 }}>{maintenanceRecords.length} רשומות</p>
          </div>
          <button style={s.btn()} onClick={() => setShowNewMaintenance(true)}>+ פתח טיפול</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {maintenanceRecords.map(rec => {
            const eq = equipment.find(e => e.id === rec.equipmentId);
            const tc = typeConfig[rec.type];
            return (
              <div key={rec.id} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 28 }}>{eq?.image}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{eq?.name} <span style={{ color: COLORS.textSoft, fontWeight: 400 }}>({eq?.number})</span></div>
                      <div style={{ color: COLORS.text, fontSize: 13, marginTop: 2 }}>{rec.description}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <span style={s.tag(tc.color)}>{tc.label}</span>
                        <span style={{ fontSize: 12, color: COLORS.textSoft }}>📅 {rec.date}</span>
                        <span style={{ fontSize: 12, color: COLORS.textSoft }}>👤 {rec.worker}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={s.badge(rec.status === "open" ? COLORS.orange : COLORS.green)}>{rec.status === "open" ? "פתוח" : "סגור"}</span>
                    <span style={{ fontWeight: 800, fontSize: 17, color: COLORS.accent }}>₪{rec.cost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Inventory() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={s.h2}>מלאי ורכישות</h2>
            <p style={{ color: COLORS.textSoft, margin: 0, fontSize: 14 }}>{inventoryItems.length} פריטים · {lowStock.length} התראות מלאי</p>
          </div>
          <button style={s.btn()} onClick={() => showNotif("הוספת פריט למלאי (בפיתוח)")}>+ פריט חדש</button>
        </div>

        {lowStock.length > 0 && (
          <div style={{ background: `${COLORS.red}15`, border: `1px solid ${COLORS.red}44`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>⚠ {lowStock.length} פריטים דורשים הזמנה</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {lowStock.map(i => <span key={i.id} style={s.badge(i.stock === 0 ? COLORS.red : COLORS.orange)}>{i.name} — {i.stock === 0 ? "אזל" : `${i.stock} נותרו`}</span>)}
            </div>
          </div>
        )}

        <div style={s.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                {["פריט", "קטגוריה", "מלאי", "מינימום", "מחיר", "סטטוס"].map(h => (
                  <th key={h} style={{ textAlign: "right", padding: "8px 12px", color: COLORS.textSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => {
                const isLow = item.stock <= item.minStock;
                const isEmpty = item.stock === 0;
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", color: COLORS.textSoft }}>{item.category}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: isEmpty ? COLORS.red : isLow ? COLORS.orange : COLORS.green }}>{item.stock} {item.unit}</td>
                    <td style={{ padding: "10px 12px", color: COLORS.textSoft }}>{item.minStock} {item.unit}</td>
                    <td style={{ padding: "10px 12px" }}>₪{item.price}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEmpty ? <span style={s.badge(COLORS.red)}>אזל</span>
                        : isLow ? <span style={s.badge(COLORS.orange)}>נמוך</span>
                          : <span style={s.badge(COLORS.green)}>תקין</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function Chat() {
    const grouped = equipment.map(eq => ({
      eq,
      msgs: chatMessages.filter(m => m.equipmentId === eq.id)
    })).filter(g => g.msgs.length > 0);

    return (
      <div>
        <h2 style={{ ...s.h2, marginBottom: 20 }}>💬 דיוני צוות</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(({ eq, msgs }) => (
            <div key={eq.id} style={s.card}>
              <div style={{ display: "flex", align: "center", gap: 10, marginBottom: 14, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{eq.image}</span>
                <span style={{ fontWeight: 700 }}>{eq.name}</span>
                <span style={{ color: COLORS.textSoft, fontSize: 13 }}>{eq.number}</span>
                <span style={{ ...s.badge(COLORS.blue), marginRight: "auto" }}>{msgs.length} הודעות</span>
              </div>
              {msgs.slice(-2).map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{msg.avatar}</div>
                  <div style={{ background: COLORS.surface, borderRadius: "4px 10px 10px 10px", padding: "7px 11px", fontSize: 13, flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{msg.user}: </span>{msg.text}
                  </div>
                </div>
              ))}
              <button onClick={() => { setSelectedEquipment(eq); setActiveTab("chat"); setScreen("equipmentDetail"); }} style={{ ...s.btnOutline, fontSize: 12, padding: "6px 14px", marginTop: 4 }}>פתח דיון מלא →</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function Reports() {
    const totalCost = maintenanceRecords.reduce((s, r) => s + r.cost, 0);
    return (
      <div>
        <h2 style={{ ...s.h2, marginBottom: 20 }}>📊 דוחות וניתוח</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[
            { label: "סה\"כ עלויות טיפול", value: `₪${totalCost.toLocaleString()}`, icon: "💰", color: COLORS.accent },
            { label: "ממוצע לטיפול", value: `₪${Math.round(totalCost / maintenanceRecords.length).toLocaleString()}`, icon: "📈", color: COLORS.blue },
            { label: "טיפולים השנה", value: maintenanceRecords.length, icon: "🔧", color: COLORS.green },
            { label: "ימי השבתה", value: "14", icon: "⏸", color: COLORS.red },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.card, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, background: `${stat.color}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{stat.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: COLORS.textSoft }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <h3 style={s.h3}>עלויות לפי כלי</h3>
          {equipment.map(eq => {
            const cost = maintenanceRecords.filter(r => r.equipmentId === eq.id).reduce((s, r) => s + r.cost, 0);
            const maxCost = Math.max(...equipment.map(e => maintenanceRecords.filter(r => r.equipmentId === e.id).reduce((s, r) => s + r.cost, 0)));
            return (
              <div key={eq.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                  <span>{eq.image} {eq.name}</span>
                  <span style={{ fontWeight: 700, color: COLORS.accent }}>₪{cost.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(cost / maxCost) * 100}%`, background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.accent})`, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {["ייצוא לאקסל 📊", "ייצוא לוורד 📝", "דוח PDF 📄"].map(btn => (
            <button key={btn} style={s.btn()} onClick={() => showNotif(`${btn.split(" ")[0]} בהכנה...`)}>{btn}</button>
          ))}
        </div>
      </div>
    );
  }

  function NewMaintenanceModal() {
    const [form, setForm] = useState({ equipment: "", type: "periodic", description: "", worker: "", cost: "" });
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: "min(520px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ ...s.h3, margin: 0 }}>פתיחת טיפול חדש</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3].map(n => <div key={n} style={{ width: 24, height: 24, borderRadius: "50%", background: newMaintStep >= n ? COLORS.accent : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: newMaintStep >= n ? "#000" : COLORS.muted }}>{n}</div>)}
            </div>
          </div>

          {newMaintStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>כלי צמ"ה</label>
                <select value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} style={{ ...s.input, cursor: "pointer" }}>
                  <option value="">בחר כלי...</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} ({eq.number})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>סוג טיפול</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(typeConfig).map(([key, val]) => (
                    <button key={key} onClick={() => setForm({ ...form, type: key })} style={{ ...s.btnOutline, borderColor: form.type === key ? val.color : COLORS.border, color: form.type === key ? val.color : COLORS.textSoft, fontFamily: "inherit" }}>{val.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>תיאור העבודה</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="תאר את העבודה שנדרשת..." style={{ ...s.input, height: 90, resize: "vertical" }} />
              </div>
            </div>
          )}

          {newMaintStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>מבצע העבודה</label>
                <input value={form.worker} onChange={e => setForm({ ...form, worker: e.target.value })} placeholder="שם מכונאי / ספק חיצוני" style={s.input} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>חלקי חילוף בשימוש</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {inventoryItems.slice(0, 4).map(item => (
                    <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", padding: "8px 12px", background: COLORS.surface, borderRadius: 8, fontSize: 13 }}>
                      <input type="checkbox" style={{ accentColor: COLORS.accent }} />
                      <span>{item.name}</span>
                      <span style={{ ...s.badge(item.stock > item.minStock ? COLORS.green : COLORS.orange), marginRight: "auto", fontSize: 10 }}>מלאי: {item.stock}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>עלות משוערת</label>
                <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="₪" type="number" style={s.input} />
              </div>
            </div>
          )}

          {newMaintStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: COLORS.surface, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>סיכום הטיפול</div>
                {[
                  ["כלי", equipment.find(e => e.id === parseInt(form.equipment))?.name || "—"],
                  ["סוג", typeConfig[form.type]?.label],
                  ["תיאור", form.description || "—"],
                  ["מבצע", form.worker || "—"],
                  ["עלות", form.cost ? `₪${form.cost}` : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 10, fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: COLORS.textSoft, width: 60, flexShrink: 0 }}>{k}:</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textSoft, display: "block", marginBottom: 6 }}>תמונות (צלם מהשטח)</label>
                <div onClick={() => showNotif("📷 מצלמה נפתחת (בפיתוח native)")} style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", color: COLORS.textSoft }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                  <div style={{ fontSize: 13 }}>לחץ לצילום תמונה</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <button style={s.btnOutline} onClick={() => { setShowNewMaintenance(false); setNewMaintStep(1); }}>ביטול</button>
            {newMaintStep > 1 && <button style={s.btnOutline} onClick={() => setNewMaintStep(n => n - 1)}>← חזרה</button>}
            {newMaintStep < 3
              ? <button style={s.btn()} onClick={() => setNewMaintStep(n => n + 1)}>הבא ←</button>
              : <button style={s.btn(COLORS.green)} onClick={() => { setShowNewMaintenance(false); setNewMaintStep(1); showNotif("✅ טיפול נפתח בהצלחה!"); }}>שמור ופתח טיפול</button>
            }
          </div>
        </div>
      </div>
    );
  }

  const currentScreen = () => {
    if (screen === "equipmentDetail" && selectedEquipment) return <EquipmentDetail eq={selectedEquipment} />;
    switch (screen) {
      case "dashboard": return <Dashboard />;
      case "equipment": return <EquipmentList />;
      case "maintenance": return <MaintenanceList />;
      case "inventory": return <Inventory />;
      case "chat": return <Chat />;
      case "reports": return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={s.app}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logo}>
          <span style={{ background: COLORS.accent, color: "#000", width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>צ</span>
          מוסך צמ"ה — מערכת ניהול
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {lowStock.length > 0 && (
            <div style={{ ...s.badge(COLORS.orange), cursor: "pointer" }} onClick={() => setScreen("inventory")}>
              ⚠ {lowStock.length} התראות מלאי
            </div>
          )}
          {stats.openMaint > 0 && (
            <div style={{ ...s.badge(COLORS.red), cursor: "pointer" }} onClick={() => setScreen("maintenance")}>
              🔧 {stats.openMaint} טיפולים פתוחים
            </div>
          )}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS.accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>ימ</div>
        </div>
      </div>

      <div style={s.mainLayout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={{ padding: "0 14px 12px", fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: 1 }}>תפריט ראשי</div>
          {navItems.map(item => (
            <div key={item.id} style={s.sideItem(screen === item.id || (screen === "equipmentDetail" && item.id === "equipment"))} onClick={() => setScreen(item.id)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "12px 14px", paddingTop: 12 }}>
            <div style={s.sideItem(false)} onClick={() => showNotif("הגדרות מערכת (בפיתוח)")}>
              <span>⚙️</span><span>הגדרות</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={s.content}>{currentScreen()}</div>
      </div>

      {/* Modal */}
      {showNewMaintenance && <NewMaintenanceModal />}

      {/* Notification Toast */}
      {notification && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 22px", fontWeight: 600, fontSize: 14, zIndex: 300, boxShadow: "0 4px 24px #0006", animation: "fadeIn 0.2s" }}>
          {notification}
        </div>
      )}
    </div>
  );
}
