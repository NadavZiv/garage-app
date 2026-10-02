import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  bg: "#0a0c12", surface: "#13161f", card: "#1a1e2e", border: "#252a3d",
  accent: "#f59e0b", accentDim: "#f59e0b33", green: "#22c55e", greenDim: "#22c55e22",
  red: "#ef4444", redDim: "#ef444422", orange: "#f97316", orangeDim: "#f9731622",
  blue: "#3b82f6", blueDim: "#3b82f622", muted: "#4b5568", text: "#e2e8f0", soft: "#94a3b8",
};

const statusCfg = {
  active:      { label: "פעיל",    color: C.green,  dim: C.greenDim  },
  maintenance: { label: "בטיפול", color: C.orange, dim: C.orangeDim },
  disabled:    { label: "מושבת",  color: C.red,    dim: C.redDim    },
};

const maintTypeCfg = {
  periodic:   { label: "תקופתי", color: C.blue   },
  fault:      { label: "תקלה",   color: C.orange },
  emergency:  { label: "חירום",  color: C.red    },
  inspection: { label: "בדיקה", color: C.soft   },
};

const PARTS_LIST = [
  "פילטר שמן", "פילטר סולר", "פילטר אוויר", "נשם הידראולי",
  "שמן מנוע", "שמן הידראולי", "שמן גיר", "נוזל קירור",
  "אלטרנטור", "רדיאטור", "מצבר", "צמיג", "רצועות",
  "חיישן", "סטארטר", "בוכנה", "תושבת קבינה", "זחל", "אחר",
];

const EQ_CATEGORIES = ["הכל", "שופל גלגלים", "מהפך", "מגרסה", "נפה", "מלגזה", "באגר", "מכבש", "קומפרסור", "גנרטור", "כלי נוסף"];

const NAV = [
  { id: "home",        icon: "🏠", label: "ראשי"     },
  { id: "equipment",   icon: "🚜", label: "כלים"     },
  { id: "maintenance", icon: "🔧", label: "טיפולים"  },
  { id: "inventory",   icon: "📦", label: "מלאי"     },
  { id: "search",      icon: "🔍", label: "חיפוש"    },
];

const ICON_OPTIONS = ["🚜", "🚛", "🏗️", "🚧", "⛏️", "🔧"];

// ── Shared components ─────────────────────────────────────────────────────────
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

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: value ? C.text : C.soft, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: C.text, outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

// ── New Maintenance Modal ─────────────────────────────────────────────────────
function NewMaintModal({ equipment, workers, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    equipment_name: "",
    date: new Date().toISOString().split("T")[0],
    type: "periodic",
    worker: "",
    hours: "",
    labor_cost: "",
    parts_cost: "",
    selected_parts: [],
    notes: "",
    next_service_date: "",
    status: "open",
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const togglePart = (part) => {
    setForm(p => ({
      ...p,
      selected_parts: p.selected_parts.includes(part)
        ? p.selected_parts.filter(x => x !== part)
        : [...p.selected_parts, part],
    }));
  };

  const totalCost = (parseInt(form.labor_cost) || 0) + (parseInt(form.parts_cost) || 0);

  const canProceed = () => {
    if (step === 1) return form.equipment_name && form.date && form.worker;
    return true;
  };

  async function handleSave() {
    if (!form.equipment_name || !form.worker) {
      return;
    }
    setSaving(true);
    const payload = {
      equipment_name: form.equipment_name,
      date: form.date,
      type: form.type,
      worker: form.worker,
      description: form.selected_parts.length > 0 ? form.selected_parts.join(", ") : "",
      notes: form.notes,
      labor_cost: parseInt(form.labor_cost) || 0,
      parts_cost: parseInt(form.parts_cost) || 0,
      total_cost: totalCost,
      Replace: next_service_date: form.next_service_date ? form.next_service_date : null,
      status: form.status,
      hours: parseInt(form.hours) || null,
    };
    await onSave(payload);
    setSaving(false);
  }

  const stepTitles = ["פרטי טיפול", "חלקים ועלויות", "סיכום ושמירה"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>🔧 פתיחת טיפול חדש</h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= n ? C.accent : C.border, color: step >= n ? "#000" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{n}</div>
                {n < 3 && <div style={{ width: 16, height: 2, background: step > n ? C.accent : C.border }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.soft, marginBottom: 18, fontWeight: 600 }}>{stepTitles[step - 1]}</div>

        {/* Step 1: Basic details */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SelectField
              label="כלי צמ\"ה *"
              value={form.equipment_name}
              onChange={v => f("equipment_name", v)}
              placeholder="בחר כלי..."
              options={equipment.map(eq => ({ value: eq.Name, label: `${eq.Icon || "🚜"} ${eq.Name}` }))}
            />
            <SelectField
              label="מכונאי מבצע *"
              value={form.worker}
              onChange={v => f("worker", v)}
              placeholder="בחר מכונאי..."
              options={workers.map(w => ({ value: w.name, label: `${w.name} — ${w.role}` }))}
            />
            <InputField label="תאריך" value={form.date} onChange={v => f("date", v)} type="date" />
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 8, fontWeight: 600 }}>סוג טיפול</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(maintTypeCfg).map(([key, val]) => (
                  <button key={key} onClick={() => f("type", key)} style={{ background: form.type === key ? `${val.color}22` : C.surface, border: `2px solid ${form.type === key ? val.color : C.border}`, borderRadius: 10, padding: "11px", color: form.type === key ? val.color : C.soft, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{val.label}</button>
                ))}
              </div>
            </div>
            <InputField label="שעות מנוע נוכחיות" value={form.hours} onChange={v => f("hours", v)} type="number" placeholder="לדוגמה: 4820" />
          </div>
        )}

        {/* Step 2: Parts + costs */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 10, fontWeight: 600 }}>
                חלקים וחומרים שהוחלפו
                {form.selected_parts.length > 0 && <span style={{ color: C.accent, marginRight: 8 }}>({form.selected_parts.length} נבחרו)</span>}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PARTS_LIST.map(part => {
                  const selected = form.selected_parts.includes(part);
                  return (
                    <button key={part} onClick={() => togglePart(part)} style={{ display: "flex", alignItems: "center", gap: 8, background: selected ? C.accentDim : C.surface, border: `2px solid ${selected ? C.accent : C.border}`, borderRadius: 10, padding: "10px 12px", color: selected ? C.accent : C.soft, fontWeight: selected ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "right" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: selected ? C.accent : "transparent", border: `2px solid ${selected ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#000", fontWeight: 900 }}>
                        {selected ? "✓" : ""}
                      </div>
                      {part}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InputField label="עלות עבודה (₪)" value={form.labor_cost} onChange={v => f("labor_cost", v)} type="number" placeholder="0" />
              <InputField label="עלות חלקים (₪)" value={form.parts_cost} onChange={v => f("parts_cost", v)} type="number" placeholder="0" />
            </div>

            {totalCost > 0 && (
              <div style={{ background: C.surface, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>עלות כוללת</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: C.accent }}>₪{totalCost.toLocaleString()}</span>
              </div>
            )}

            <InputField label="מועד טיפול הבא (אופציונלי)" value={form.next_service_date} onChange={v => f("next_service_date", v)} type="date" />

            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>הערות / תיאור נוסף (אופציונלי)</label>
              <textarea value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="פרטים נוספים על הטיפול..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.text, height: 80, resize: "none", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>📋 סיכום הטיפול</div>
              {[
                ["כלי", form.equipment_name],
                ["מכונאי", form.worker],
                ["תאריך", form.date],
                ["סוג", maintTypeCfg[form.type]?.label],
                ["שעות מנוע", form.hours || "—"],
                ["חלקים", form.selected_parts.length > 0 ? form.selected_parts.join(", ") : "—"],
                ["עלות עבודה", form.labor_cost ? `₪${parseInt(form.labor_cost).toLocaleString()}` : "—"],
                ["עלות חלקים", form.parts_cost ? `₪${parseInt(form.parts_cost).toLocaleString()}` : "—"],
                ["סה\"כ", totalCost > 0 ? `₪${totalCost.toLocaleString()}` : "—"],
                ["טיפול הבא", form.next_service_date || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, fontSize: 13, marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                  <span style={{ color: C.soft, width: 90, flexShrink: 0, fontWeight: 600 }}>{k}:</span>
                  <span style={{ fontWeight: 500, flex: 1 }}>{v}</span>
                </div>
              ))}
              {form.notes && (
                <div style={{ marginTop: 8, fontSize: 13, color: C.soft }}>
                  <span style={{ fontWeight: 600 }}>הערות: </span>{form.notes}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>סטטוס טיפול</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["open", "פתוח", C.orange], ["closed", "סגור", C.green]].map(([key, label, color]) => (
                  <button key={key} onClick={() => f("status", key)} style={{ flex: 1, background: form.status === key ? `${color}22` : C.surface, border: `2px solid ${form.status === key ? color : C.border}`, borderRadius: 10, padding: "11px", color: form.status === key ? color : C.soft, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} style={{ flex: 2, background: canProceed() ? C.accent : C.border, color: canProceed() ? "#000" : C.muted, border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: canProceed() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              הבא ←
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: saving ? C.border : C.green, color: saving ? C.muted : "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {saving ? "שומר..." : "✅ שמור טיפול"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Equipment Edit Modal ──────────────────────────────────────────────────────
function EditEqModal({ eq, onSave, onClose }) {
  const [form, setForm] = useState(eq ? {
    Name: eq.Name || "", equipment_number: eq.equipment_number || "",
    type: eq.type || "", status: eq.status || "active",
    hours: eq.hours || 0, next_service: eq.next_service || 0,
    manufacturer: eq.manufacturer || "", Year: eq.Year || "",
    Icon: eq.Icon || "🚜",
  } : { Name: "", equipment_number: "", type: "", status: "active", hours: 0, next_service: 0, manufacturer: "", Year: "", Icon: "🚜" });
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
          <InputField label="שם הכלי *" value={form.Name} onChange={v => f("Name", v)} placeholder="שופל 220 (L220H) 2015" />
          <InputField label="מספר רישוי" value={form.equipment_number} onChange={v => f("equipment_number", v)} placeholder="139-144" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InputField label="שנת ייצור" value={form.Year} onChange={v => f("Year", v)} type="number" placeholder="2022" />
            <InputField label="יצרן" value={form.manufacturer} onChange={v => f("manufacturer", v)} placeholder="Volvo" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InputField label="שעות מנוע" value={form.hours} onChange={v => f("hours", v)} type="number" />
            <InputField label="טיפול הבא (שעות)" value={form.next_service} onChange={v => f("next_service", v)} type="number" />
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

// ── Inventory Modal ───────────────────────────────────────────────────────────
function EditInventoryModal({ item, onSave, onClose }) {
  const CATS = ["שמן", "פילטר", "חלק חילוף", "צמיג", "כלי עבודה", "מתכלה", "אחר"];
  const [form, setForm] = useState(item ? {
    name: item.name || "", category: item.category || "שמן",
    catalog_number: item.catalog_number || "", unit: item.unit || "יח'",
    quantity: item.quantity || 0, min_quantity: item.min_quantity || 0,
    price: item.price || 0, vendor: item.vendor || "", notes: item.notes || "",
  } : { name: "", category: "שמן", catalog_number: "", unit: "יח'", quantity: 0, min_quantity: 0, price: 0, vendor: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>{item ? "✏️ עריכת פריט" : "➕ פריט חדש"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InputField label="שם הפריט *" value={form.name} onChange={v => f("name", v)} placeholder="שמן מנוע 10W-40" />
          <div>
            <label style={{ fontSize: 12, color: C.soft, display: "block", marginBottom: 6, fontWeight: 600 }}>קטגוריה</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => f("category", cat)} style={{ background: form.category === cat ? C.accentDim : C.surface, border: `2px solid ${form.category === cat ? C.accent : C.border}`, borderRadius: 20, padding: "6px 14px", color: form.category === cat ? C.accent : C.soft, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InputField label="מקט" value={form.catalog_number} onChange={v => f("catalog_number", v)} placeholder="OIL-001" />
            <InputField label="יחידה" value={form.unit} onChange={v => f("unit", v)} placeholder="ליטר" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <InputField label="כמות" value={form.quantity} onChange={v => f("quantity", v)} type="number" />
            <InputField label="מינימום" value={form.min_quantity} onChange={v => f("min_quantity", v)} type="number" />
            <InputField label="מחיר (₪)" value={form.price} onChange={v => f("price", v)} type="number" />
          </div>
          <InputField label="ספק" value={form.vendor} onChange={v => f("vendor", v)} placeholder="שם הספק" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.surface, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>ביטול</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "שומר..." : "💾 שמור"}</button>
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
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEq, setDetailEq] = useState(null);
  const [editEq, setEditEq] = useState(null);
  const [showEqModal, setShowEqModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [editInvItem, setEditInvItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  function notify(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadData() {
    setLoading(true);
    const [eqRes, maintRes, invRes, workRes] = await Promise.all([
      supabase.from("equipment").select("Name, Year, type, status, hours, next_service, manufacturer, Icon, equipment_number").order("Name"),
      supabase.from("maintenance").select("*").order("date", { ascending: false }),
      supabase.from("inventory").select("*").order("name"),
      supabase.from("workers").select("*").order("name"),
    ]);
    if (eqRes.error)   notify("❌ שגיאה בטעינת כלים: "    + eqRes.error.message,   true);
    else setEquipment(eqRes.data || []);
    if (maintRes.error) notify("❌ שגיאה בטעינת טיפולים: " + maintRes.error.message, true);
    else setMaintenance(maintRes.data || []);
    if (invRes.error)  notify("❌ שגיאה בטעינת מלאי: "    + invRes.error.message,   true);
    else setInventory(invRes.data || []);
    if (workRes.error) notify("❌ שגיאה בטעינת עובדים: "  + workRes.error.message,  true);
    else setWorkers(workRes.data || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function saveEquipment(form) {
    const payload = { Name: form.Name, equipment_number: form.equipment_number, type: form.type, status: form.status, hours: form.hours, next_service: form.next_service, manufacturer: form.manufacturer, Year: form.Year || null, Icon: form.Icon };
    if (editEq) {
      const { error } = await supabase.from("equipment").update(payload).eq("Name", editEq.Name);
      if (error) { notify("❌ שגיאה: " + error.message, true); return; }
      notify("✅ הכלי עודכן!");
    } else {
      const { error } = await supabase.from("equipment").insert([payload]);
      if (error) { notify("❌ שגיאה: " + error.message, true); return; }
      notify("✅ כלי חדש נוצר!");
    }
    setShowEqModal(false); setEditEq(null); setDetailEq(null);
    await loadData();
  }

  async function deleteEquipment(name) {
    const { error } = await supabase.from("equipment").delete().eq("Name", name);
    if (error) { notify("❌ שגיאה: " + error.message, true); return; }
    notify("🗑️ הכלי נמחק");
    setDeleteConfirm(null); setDetailEq(null);
    await loadData();
  }

  async function saveMaintenance(payload) {
    const { error } = await supabase.from("maintenance").insert([payload]);
    if (error) { notify("❌ שגיאה בשמירת טיפול: " + error.message, true); return; }
    notify("✅ טיפול נשמר בהצלחה!");
    setShowMaintModal(false);
    await loadData();
  }

  async function closeMaintenance(id) {
    const { error } = await supabase.from("maintenance").update({ status: "closed" }).eq("id", id);
    if (error) { notify("❌ שגיאה: " + error.message, true); return; }
    notify("✅ טיפול נסגר");
    await loadData();
  }

  async function saveInventory(form) {
    if (editInvItem) {
      const { error } = await supabase.from("inventory").update(form).eq("id", editInvItem.id);
      if (error) { notify("❌ שגיאה: " + error.message, true); return; }
      notify("✅ פריט עודכן!");
    } else {
      const { error } = await supabase.from("inventory").insert([form]);
      if (error) { notify("❌ שגיאה: " + error.message, true); return; }
      notify("✅ פריט חדש נוצר!");
    }
    setShowInvModal(false); setEditInvItem(null);
    await loadData();
  }

  async function deleteInventory(id) {
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) { notify("❌ שגיאה: " + error.message, true); return; }
    notify("🗑️ פריט נמחק");
    await loadData();
  }

  async function updateQuantity(id, delta) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    const { error } = await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
    if (error) { notify("❌ שגיאה", true); return; }
    await loadData();
  }

  const openMaint  = maintenance.filter(m => m.status === "open").length;
  const lowStock   = inventory.filter(i => i.quantity <= i.min_quantity);

  const screenProps = { equipment, maintenance, inventory, workers, setTab, setDetailEq, notify, loadData };

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

      {/* Header */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 14 }}>צמ"ה</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>מוסך קומפוסט אור</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {lowStock.length > 0 && <Badge color={C.red} small>📦 {lowStock.length}</Badge>}
          {openMaint > 0 && <Badge color={C.orange} small>🔧 {openMaint}</Badge>}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Desktop sidebar */}
        <nav className="sidebar" style={{ display: "none", flexDirection: "column", width: 210, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "12px 0", flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "none", border: "none", borderRight: tab === n.id ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === n.id ? C.accent : C.soft, fontWeight: tab === n.id ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", padding: "12px 18px", borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => setShowMaintModal(true)} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "11px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🔧 פתח טיפול</button>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: 90 }}>
          {loading ? <Spinner /> :
            detailEq
              ? <EqDetail eq={detailEq} maintenance={maintenance} back={() => setDetailEq(null)}
                  onEdit={() => { setEditEq(detailEq); setShowEqModal(true); }}
                  onDelete={() => setDeleteConfirm(detailEq.Name)}
                  onNewMaint={() => setShowMaintModal(true)}
                  onCloseMaint={closeMaintenance} />
              : tab === "home"        ? <Home {...screenProps} onNewMaint={() => setShowMaintModal(true)} onNewEq={() => { setEditEq(null); setShowEqModal(true); }} lowStock={lowStock} openMaint={openMaint} />
              : tab === "equipment"   ? <EqList equipment={equipment} setDetailEq={setDetailEq} onNew={() => { setEditEq(null); setShowEqModal(true); }} />
              : tab === "maintenance" ? <MaintList maintenance={maintenance} equipment={equipment} workers={workers} onNew={() => setShowMaintModal(true)} onClose={closeMaintenance} />
              : tab === "inventory"   ? <InventoryScreen inventory={inventory} onNew={() => { setEditInvItem(null); setShowInvModal(true); }} onEdit={item => { setEditInvItem(item); setShowInvModal(true); }} onDelete={deleteInventory} onUpdateQty={updateQuantity} lowStock={lowStock} />
              : tab === "search"      ? <SearchScreen maintenance={maintenance} equipment={equipment} />
              : null
          }
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottomnav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setDetailEq(null); }} style={{ flex: 1, background: "none", border: "none", padding: "10px 4px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: tab === n.id ? C.accent : C.muted, fontFamily: "inherit", position: "relative" }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 700 : 400 }}>{n.label}</span>
            {n.id === "inventory" && lowStock.length > 0 && <div style={{ position: "absolute", top: 6, right: "18%", width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
          </button>
        ))}
      </nav>

      {/* FAB */}
      {!detailEq && (
        <button className="fab" onClick={() => setShowMaintModal(true)} style={{ position: "fixed", bottom: 76, left: 16, width: 56, height: 56, borderRadius: "50%", background: C.accent, color: "#000", border: "none", fontSize: 24, cursor: "pointer", boxShadow: `0 4px 20px ${C.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 49, fontFamily: "inherit", fontWeight: 900 }}>+</button>
      )}

      {/* Modals */}
      {showMaintModal && <NewMaintModal equipment={equipment} workers={workers} onSave={saveMaintenance} onClose={() => setShowMaintModal(false)} />}
      {showEqModal    && <EditEqModal  eq={editEq}   onSave={saveEquipment}  onClose={() => { setShowEqModal(false);  setEditEq(null);      }} />}
      {showInvModal   && <EditInventoryModal item={editInvItem} onSave={saveInventory} onClose={() => { setShowInvModal(false); setEditInvItem(null); }} />}

      {/* Delete confirm */}
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

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: toast.isError ? C.redDim : C.card, border: `1px solid ${toast.isError ? C.red : C.border}`, borderRadius: 12, padding: "12px 22px", fontWeight: 600, fontSize: 14, zIndex: 200, boxShadow: "0 4px 24px #0008", animation: "slideUp .25s ease", whiteSpace: "nowrap", maxWidth: "90vw" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────────────────────

function EqCard({ eq, onClick }) {
  const cfg = statusCfg[eq.status] || statusCfg.active;
  const pct = eq.next_service ? (eq.hours / eq.next_service) * 100 : 0;
  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 48, height: 48, background: C.surface, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{eq.Icon || "🚜"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{eq.Name}</div>
          <div style={{ color: C.soft, fontSize: 11, marginTop: 2 }}>{eq.type}{eq.equipment_number ? ` · ${eq.equipment_number}` : ""}</div>
        </div>
        <Badge color={cfg.color} dim={cfg.dim} small>{cfg.label}</Badge>
      </div>
      {eq.next_service > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.soft, marginBottom: 5 }}>
            <span>⏱ {eq.hours?.toLocaleString() || 0} שעות</span>
            <span>הבא: {eq.next_service?.toLocaleString()}</span>
          </div>
          <Bar value={eq.hours || 0} max={eq.next_service} />
          {pct > 85 && <div style={{ fontSize: 11, color: C.orange, marginTop: 4 }}>⚠ {(eq.next_service - eq.hours).toLocaleString()} שעות לטיפול הבא</div>}
        </>
      )}
    </div>
  );
}

function MaintCard({ rec, equipment, onClose }) {
  const eq  = equipment.find(e => e.Name === rec.equipment_name);
  const tc  = maintTypeCfg[rec.type] || maintTypeCfg.periodic;
  const parts = rec.description ? rec.description.split(", ").filter(Boolean) : [];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ width: 42, height: 42, background: C.surface, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{eq?.Icon || "🚜"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{rec.equipment_name}</div>
          {rec.hours && <div style={{ color: C.soft, fontSize: 12 }}>⏱ {rec.hours.toLocaleString()} שעות</div>}
        </div>
        <div style={{ color: C.accent, fontWeight: 900, fontSize: 15, flexShrink: 0 }}>₪{rec.total_cost?.toLocaleString() || 0}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <Badge color={tc.color} small>{tc.label}</Badge>
        <Badge color={rec.status === "open" ? C.orange : C.green} small>{rec.status === "open" ? "פתוח" : "סגור"}</Badge>
        <span style={{ fontSize: 11, color: C.soft, marginRight: "auto" }}>📅 {rec.date}{rec.worker ? ` · ${rec.worker}` : ""}</span>
      </div>
      {parts.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {parts.map(p => <span key={p} style={{ background: C.blueDim, color: C.blue, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>🔩 {p}</span>)}
        </div>
      )}
      {rec.notes && <div style={{ fontSize: 12, color: C.soft, marginBottom: 8 }}>💬 {rec.notes}</div>}
      {rec.status === "open" && (
        <button onClick={() => onClose(rec.id)} style={{ width: "100%", background: C.greenDim, color: C.green, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>✅ סגור טיפול</button>
      )}
    </div>
  );
}

function Home({ equipment, maintenance, lowStock, openMaint, setTab, setDetailEq, onNewMaint, onNewEq }) {
  const openRecs = maintenance.filter(m => m.status === "open");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn .3s" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px" }}>דשבורד</h1>
        <p style={{ color: C.soft, margin: 0, fontSize: 13 }}>מוסך קומפוסט אור · {equipment.length} כלים</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "כלים פעילים",     val: equipment.filter(e => e.status === "active").length,      color: C.green,  icon: "✅" },
          { label: "בטיפול",          val: equipment.filter(e => e.status === "maintenance").length,  color: C.orange, icon: "🔧" },
          { label: "טיפולים פתוחים", val: openMaint,                                                 color: C.red,    icon: "📋" },
          { label: "התראות מלאי",    val: lowStock.length,                                            color: lowStock.length > 0 ? C.red : C.green, icon: "📦" },
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
        <button onClick={onNewEq}   style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>➕ כלי חדש</button>
      </div>
      {lowStock.length > 0 && (
        <div onClick={() => setTab("inventory")} style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 14, padding: "12px 16px", cursor: "pointer" }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 6, fontSize: 14 }}>⚠ {lowStock.length} פריטים דורשים הזמנה</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lowStock.map(i => <Badge key={i.id} color={i.quantity === 0 ? C.red : C.orange} small>{i.name} — {i.quantity === 0 ? "אזל" : `${i.quantity} נותרו`}</Badge>)}
          </div>
        </div>
      )}
      {openRecs.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>⚡ טיפולים פתוחים</div>
          {openRecs.slice(0, 3).map(rec => {
            const eq = equipment.find(e => e.Name === rec.equipment_name);
            const tc = maintTypeCfg[rec.type] || maintTypeCfg.periodic;
            return (
              <div key={rec.id} onClick={() => setTab("maintenance")} style={{ background: C.card, border: `1px solid ${C.orange}44`, borderRadius: 14, padding: "12px 16px", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{eq?.Icon || "🚜"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{rec.equipment_name}</div>
                    <div style={{ color: C.soft, fontSize: 12 }}>{rec.date}{rec.worker ? ` · ${rec.worker}` : ""}</div>
                  </div>
                  <Badge color={tc.color} small>{tc.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>כלים</div>
      {equipment.slice(0, 8).map(eq => <EqCard key={eq.Name} eq={eq} onClick={() => setDetailEq(eq)} />)}
      {equipment.length > 8 && (
        <button onClick={() => setTab("equipment")} style={{ background: C.card, color: C.soft, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          הצג את כל {equipment.length} הכלים →
        </button>
      )}
    </div>
  );
}

function EqList({ equipment, setDetailEq, onNew }) {
  const [filter, setFilter] = useState("הכל");
  const [search, setSearch] = useState("");
  const filtered = equipment.filter(e => {
    const matchCat = filter === "הכל" || e.type === filter;
    const matchSearch = e.Name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>כלי צמ"ה</h1>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חיפוש כלי..." style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {EQ_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ background: filter === cat ? C.accent : C.card, color: filter === cat ? "#000" : C.soft, border: `1px solid ${filter === cat ? C.accent : C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>{cat}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(eq => <EqCard key={eq.Name} eq={eq} onClick={() => setDetailEq(eq)} />)}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין כלים להצגה</div>}
      </div>
    </div>
  );
}

function EqDetail({ eq, maintenance, back, onEdit, onDelete, onNewMaint, onCloseMaint }) {
  const cfg      = statusCfg[eq.status] || statusCfg.active;
  const eqMaint  = maintenance.filter(m => m.equipment_name === eq.Name);
  const totalCost= eqMaint.reduce((s, m) => s + (m.total_cost || 0), 0);
  const [activeTab, setActiveTab] = useState("history");
  return (
    <div style={{ animation: "fadeIn .25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "8px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← חזרה</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{eq.Name}</div>
          <div style={{ color: C.soft, fontSize: 12 }}>{eq.type}{eq.equipment_number ? ` · ${eq.equipment_number}` : ""}</div>
        </div>
        <Badge color={cfg.color} dim={cfg.dim}>{cfg.label}</Badge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "שעות",        val: eq.hours?.toLocaleString() || "0", icon: "⏱" },
          { label: "טיפול הבא",  val: eq.next_service ? `${eq.next_service.toLocaleString()}ש'` : "—", icon: "🔔" },
          { label: "סה\"כ טיפולים", val: eqMaint.length, icon: "📋" },
          { label: "עלות כוללת", val: `₪${totalCost.toLocaleString()}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.accent }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.soft }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onNewMaint} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: 13, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>🔧 פתח טיפול חדש</button>
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
          {[["שם", eq.Name], ["סוג", eq.type || "—"], ["יצרן", eq.manufacturer || "—"], ["שנת ייצור", eq.Year || "—"], ["מספר רישוי", eq.equipment_number || "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
              <span style={{ color: C.soft }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onEdit}   style={{ flex: 2, background: C.accent, color: "#000", border: "none", borderRadius: 12, padding: 13, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>✏️ ערוך</button>
            <button onClick={onDelete} style={{ flex: 1, background: C.redDim, color: C.red, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 13, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🗑️</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintList({ maintenance, equipment, onNew, onClose }) {
  const [filter, setFilter] = useState("all");
  const filtered   = maintenance.filter(m => filter === "all" || m.status === filter);
  const totalCost  = maintenance.reduce((s, m) => s + (m.total_cost || 0), 0);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🔧 טיפולים</h1>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "סה\"כ", val: maintenance.length, color: C.blue },
          { label: "פתוחים", val: maintenance.filter(m => m.status === "open").length, color: C.orange },
          { label: "עלות", val: `₪${totalCost.toLocaleString()}`, color: C.accent },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: k.color }}>{k.val}</div>
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

function InventoryScreen({ inventory, onNew, onEdit, onDelete, onUpdateQty, lowStock }) {
  const CATS = ["שמן", "פילטר", "חלק חילוף", "צמיג", "כלי עבודה", "מתכלה", "אחר"];
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = inventory.filter(i => {
    const matchCat    = filter === "all" || i.category === filter;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const totalValue = inventory.reduce((s, i) => s + ((i.quantity || 0) * (i.price || 0)), 0);
  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📦 מלאי</h1>
        <button onClick={onNew} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ חדש</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "פריטים", val: inventory.length, color: C.blue },
          { label: "התראות", val: lowStock.length, color: lowStock.length > 0 ? C.red : C.green },
          { label: "שווי מלאי", val: `₪${totalValue.toLocaleString()}`, color: C.accent },
        ].map(k => (
          <div key={k.label} style={{ background: C.card, border: `1px solid ${k.color}33`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: C.soft, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: C.red, marginBottom: 6, fontSize: 13 }}>⚠ {lowStock.length} פריטים דורשים הזמנה</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lowStock.map(i => <Badge key={i.id} color={i.quantity === 0 ? C.red : C.orange} small>{i.name} — {i.quantity === 0 ? "אזל" : `${i.quantity} נותרו`}</Badge>)}
          </div>
        </div>
      )}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חיפוש פריט..." style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {["all", ...CATS].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ background: filter === cat ? C.accent : C.card, color: filter === cat ? "#000" : C.soft, border: `1px solid ${filter === cat ? C.accent : C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>{cat === "all" ? "הכל" : cat}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(item => {
          const isLow   = item.quantity <= item.min_quantity;
          const isEmpty = item.quantity === 0;
          const sColor  = isEmpty ? C.red : isLow ? C.orange : C.green;
          return (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${isLow ? sColor + "44" : C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ color: C.soft, fontSize: 12, marginTop: 2 }}>{item.category}{item.vendor ? ` · ${item.vendor}` : ""}</div>
                </div>
                <Badge color={sColor} small>{isEmpty ? "אזל" : isLow ? "נמוך" : "תקין"}</Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => onUpdateQty(item.id, -1)} style={{ width: 34, height: 34, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: sColor }}>{item.quantity}</div>
                    <div style={{ fontSize: 10, color: C.soft }}>{item.unit} / מינ' {item.min_quantity}</div>
                  </div>
                  <button onClick={() => onUpdateQty(item.id, 1)} style={{ width: 34, height: 34, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {item.price > 0 && <span style={{ fontSize: 12, color: C.soft }}>₪{item.price}/{item.unit}</span>}
                  <button onClick={() => onEdit(item)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.soft, borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }}>✏️</button>
                  <button onClick={() => onDelete(item.id)} style={{ background: C.redDim, border: `1px solid ${C.red}44`, color: C.red, borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>אין פריטים להצגה</div>}
      </div>
    </div>
  );
}

function SearchScreen({ maintenance, equipment }) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  function doSearch() {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const found = maintenance.filter(rec =>
      rec.equipment_name?.toLowerCase().includes(q) ||
      rec.description?.toLowerCase().includes(q) ||
      rec.worker?.toLowerCase().includes(q) ||
      rec.notes?.toLowerCase().includes(q) ||
      rec.date?.includes(q)
    );
    setResults(found);
    setSearched(true);
  }

  return (
    <div style={{ animation: "fadeIn .3s" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>🔍 חיפוש בהיסטוריה</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
          placeholder="חפש לפי כלי, חלק, מכונאי, תאריך..."
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={doSearch} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "12px 18px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>חפש</button>
      </div>
      {searched && (
        <div style={{ marginBottom: 12, color: C.soft, fontSize: 13 }}>
          {results.length > 0 ? `נמצאו ${results.length} תוצאות` : "לא נמצאו תוצאות"}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map(rec => <MaintCard key={rec.id} rec={rec} equipment={equipment} onClose={() => {}} />)}
      </div>
      {!searched && (
        <div style={{ textAlign: "center", color: C.soft, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>חפש לפי שם כלי, חלק שהוחלף, שם מכונאי או תאריך</div>
        </div>
      )}
    </div>
  );
}
