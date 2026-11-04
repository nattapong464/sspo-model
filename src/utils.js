// Shared constants and small helper functions
import * as XLSX from "xlsx";
import { DEVICE_TYPES, GENERAL_FIELDS, DETAIL_FIELDS, EXPORT_COLUMNS, deviceInfo, deviceGroup } from "./patientFields";

export const COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#64748b", "#14b8a6", "#ec4899"];

export const DEVICE_TYPES_LIST = DEVICE_TYPES.map((d) => d.code);

export const RATINGS = ["Excellent", "Good", "Fair", "Poor"];
export const RATING_ORDER = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };

export const STATUS_STYLE = {
  Pending: { badge: "badge-orange", color: "#f59e0b" },
  Approved: { badge: "badge-green", color: "#10b981" },
  Completed: { badge: "badge-blue", color: "#3b82f6" },
  Rejected: { badge: "badge-red", color: "#ef4444" },
  Cancelled: { badge: "badge-gray", color: "#94a3b8" }
};

/* Age, gender & avatar --------------------------------------------- */
// Age bands used for the illustration and the "Age group" filter
export const AGE_BANDS = [
  { key: "child", label: "Child (0–12)", max: 12 },
  { key: "teen", label: "Teen (13–19)", max: 19 },
  { key: "adult", label: "Adult (20–39)", max: 39 },
  { key: "middle", label: "Middle-aged (40–59)", max: 59 },
  { key: "elder", label: "Older adult (60+)", max: 200 }
];
export const ageBand = (age) => {
  const n = parseInt(age, 10);
  return Number.isFinite(n) ? AGE_BANDS.find((b) => n <= b.max) : null;
};

// "male" | "female" | "" (accepts Thai, M/F, titles)
export const genderKey = (g = "") => {
  const s = String(g || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "f" || s.startsWith("female") || s.includes("หญิง") || s === "ญ" || s.includes("นาง") || s.includes("ด.ญ.")) return "female";
  if (s === "m" || s.startsWith("male") || s.includes("ชาย") || s === "ช" || s.includes("นาย") || s.includes("ด.ช.")) return "male";
  return "";
};
export const genderLabel = (g) => ({ male: "Male", female: "Female" })[genderKey(g)] || (g || "");

const AVATAR_FILE = {
  male: { child: "child_boy", teen: "teen_boy", adult: "adult_male", middle: "middle_male", elder: "elder_male" },
  female: { child: "child_girl", teen: "teen_girl", adult: "adult_female", middle: "middle_female", elder: "elder_female" }
};
// Illustration that matches gender + age group (files in public/avatars)
export const getAvatarUrl = (gender = "", age = "") => {
  const g = genderKey(gender);
  if (!g) return "/avatars/unknown.svg";
  return `/avatars/${AVATAR_FILE[g][ageBand(age)?.key || "adult"]}.svg`;
};
// Built-in illustrations (including old "/avatars/*.jpg" values saved by earlier versions)
export const isDefaultAvatar = (url) => !url || String(url).startsWith("/avatars/");

/* Dates ------------------------------------------------------------- */
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// "2026-07-20" -> "20 Jul 2026" (parsed as local date, so it never shifts by a day)
export const fmtDate = (s) => {
  if (!s) return "-";
  const d = new Date(String(s).length === 10 ? `${s}T00:00:00` : s);
  return isNaN(d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
export const fmtDateTime = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
export const fmtTime = (a, b) => (a || b ? `${a || "?"} – ${b || "?"}` : "All day");

/* Patients ---------------------------------------------------------- */
const firstFilled = (obj, keys) => {
  if (!obj) return "";
  const map = Object.fromEntries(Object.keys(obj).map((k) => [k.trim().toLowerCase(), k]));
  for (const k of keys) {
    const real = map[k.toLowerCase()];
    if (real !== undefined && obj[real] !== null && obj[real] !== undefined && String(obj[real]).trim() !== "") return String(obj[real]).trim();
  }
  return "";
};
const GENERAL_BY_KEY = Object.fromEntries(GENERAL_FIELDS.map((f) => [f.key, f]));
// A general field, falling back to the original Excel row for patients imported by older versions
export const pField = (p, key) => {
  const v = p?.[key];
  if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  return GENERAL_BY_KEY[key] ? firstFilled(p?.rawExcelData, GENERAL_BY_KEY[key].excel) : "";
};
// All clinical details: saved values first, then values from the original Excel row
export const patientDetails = (p) => {
  const saved = p?.details || {};
  return Object.fromEntries(DETAIL_FIELDS.map((f) => [f.key,
    saved[f.key] !== undefined ? String(saved[f.key] ?? "") : firstFilled(p?.rawExcelData, f.excel)]));
};

// Accepts "1 / 16 / 1967" (M/D/Y, as in the patient bank), "16/01/2510" (D/M/Y, Buddhist year),
// "1967-01-16", Excel serial numbers and Date objects. Returns "YYYY-MM-DD" or "".
export const parseBirthday = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const iso = (y, m, d) => {
    if (y > 2400) y -= 543;
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt) || dt.getMonth() !== m - 1 || y < 1890 || dt > new Date()) return "";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  if (v instanceof Date) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number" || /^\d{4,5}(\.\d+)?$/.test(String(v).trim())) {
    const n = Number(v);
    if (n > 1000 && n < 80000) { const d = new Date(Math.round((n - 25569) * 86400000)); return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
    return "";
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4}|\d{2})$/);
  if (m) {
    let [a, b, y] = [+m[1], +m[2], +m[3]];
    if (m[3].length === 2) y += y > new Date().getFullYear() % 100 ? 1900 : 2000; // "99" -> 1999
    // Buddhist year or first number > 12 means day/month; otherwise month/day like the patient bank file
    const dayFirst = y > 2400 || a > 12;
    return dayFirst ? iso(y, b, a) : iso(y, a, b);
  }
  return "";
};
export const ageFromBirthday = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date();
  let age = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) age--;
  return age >= 0 && age <= 110 ? String(age) : "";
};
export const patientBirthday = (p) => parseBirthday(pField(p, "birthday"));
// Age is worked out from the date of birth when there is one, so it stays current.
export const patientAge = (p) => {
  const fromBirth = ageFromBirthday(patientBirthday(p));
  if (fromBirth) return fromBirth;
  const n = parseInt(pField(p, "age"), 10);
  return Number.isFinite(n) && n >= 0 && n <= 110 ? String(n) : "";
};
export const patientHN = (p) => pField(p, "hn");
export const patientCode = (p) => pField(p, "code");
export const patientGender = (p) => pField(p, "gender");
// Custom photo if set, otherwise the illustration for this patient's gender and age
export const patientPhoto = (p) => (p?.photo && !isDefaultAvatar(p.photo) ? p.photo : getAvatarUrl(patientGender(p), patientAge(p)));

export const deviceLabel = (code) => { const d = deviceInfo(code); return d ? `${d.code} – ${d.name}` : code || ""; };

// One short clinical line for the patient card
export const patientSummary = (p) => {
  const d = patientDetails(p);
  const g = deviceGroup(p?.deviceType);
  const bits = g === "prosthesis"
    ? [d.affectedSide, d.causeOfAmputation, d.functionalLevel && `K${d.functionalLevel}`]
    : g === "spinal"
      ? [d.curveType, d.curve1, d.cobb1 && `Cobb ${d.cobb1}°`, d.typeOfSO]
      : [d.affectedSide, d.problematicLLJoint || d.problematicULJoint, d.problem !== "Normal" && d.problem, d.footCondition];
  return bits.filter(Boolean).join(" · ");
};

// Next free "ID / Code" for a device type, e.g. TTP -> "03059"
export const nextPatientCode = (patients, deviceType) => {
  const info = deviceInfo(deviceType);
  const same = patients.filter((p) => p.deviceType === deviceType).map(patientCode).filter((c) => /^\d{5}$/.test(c));
  const prefix = info?.prefix || (same[0] || "").slice(0, 2);
  if (!prefix) return "";
  const nums = patients.map(patientCode).filter((c) => /^\d{5}$/.test(c) && c.startsWith(prefix)).map((c) => +c.slice(2));
  return prefix + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
};

export const upcomingSlots = (p) =>
  (p?.bookedSlots || []).filter((s) => s.date >= todayStr()).sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));

// Small copy of a patient stored inside a request (so the request still makes sense if the patient changes)
export const patientSnapshot = (p) => ({
  id: String(p.id), name: p.name || "", deviceType: p.deviceType || "", phone: p.phone || "",
  photo: patientPhoto(p), hn: patientHN(p), code: patientCode(p)
});

/* Excel ------------------------------------------------------------- */
// Convert one Excel row into patient fields. Only columns that have a value are returned,
// so re-importing never wipes data that is not in the file.
export const excelRowToPatient = (row) => {
  const out = {};
  GENERAL_FIELDS.forEach((f) => { const v = firstFilled(row, f.excel); if (v) out[f.key] = v; });
  if (out.deviceType) out.deviceType = deviceInfo(out.deviceType)?.code || out.deviceType;
  if (out.gender) out.gender = genderLabel(out.gender);
  if (out.birthday !== undefined) {
    const iso = parseBirthday(out.birthday);
    if (iso) out.birthday = iso; else delete out.birthday;
  }
  const fromBirth = ageFromBirthday(out.birthday);
  if (fromBirth) out.age = fromBirth;
  else if (out.age && !(+out.age >= 0 && +out.age <= 110)) delete out.age; // e.g. "126" from a missing birth year
  if (out.suitabilityLevel && !RATINGS.includes(out.suitabilityLevel)) delete out.suitabilityLevel;
  if (out.photo && isDefaultAvatar(out.photo)) delete out.photo;
  const details = {};
  DETAIL_FIELDS.forEach((f) => { const v = firstFilled(row, f.excel); if (v) details[f.key] = v; });
  if (Object.keys(details).length) out.details = details;
  out.rawExcelData = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)]));
  return out;
};

// Patients -> rows with the same column names as "SSPO patient Bank.xlsx" (can be imported back)
export const patientsToExcelRows = (patients) => patients.map((p) => {
  const d = patientDetails(p);
  const row = {};
  EXPORT_COLUMNS.forEach(([col, key]) => {
    if (key.startsWith("d.")) row[col] = d[key.slice(2)] || "";
    else if (key === "age") row[col] = patientAge(p);
    else if (key === "birthday") row[col] = patientBirthday(p) || pField(p, "birthday"); // keep text that is not a full date
    else if (key === "photo") row[col] = isDefaultAvatar(p.photo) ? "" : p.photo;
    else row[col] = pField(p, key);
  });
  row.InviteCount = p.inviteCount || 0;
  row.Available = p.available === false ? "No" : "Yes";
  return row;
});

export const normName = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

export const downloadExcel = (rows, sheetName, fileName) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

// One Excel file with several sheets: { Patients: [...], Requests: [...] }.
// Nested values (lists, objects) are stored as JSON text so nothing is lost.
export const downloadWorkbook = (sheets, fileName) => {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const flat = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) =>
      [k, v !== null && typeof v === "object" ? JSON.stringify(v) : v])));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat.length ? flat : [{}]), name);
  });
  XLSX.writeFile(wb, fileName);
};

export const readExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

export const PATIENT_TEMPLATE_ROW = Object.fromEntries(EXPORT_COLUMNS.map(([col]) => [col, ""]));
Object.assign(PATIENT_TEMPLATE_ROW, {
  "Device type": "TTP", "ID / Code": "03099", HN: "53-123456", "Full Name": "Somchai Jaidee", Gender: "Male",
  Phone: "081-234-5678", Birthday: "1970-01-16", Province: "Bangkok", "Underlying Disease": "Diabetes",
  "Cause of Amputation": "Accident", "Affected Side": "Left", "Stump Shape": "Cylindrical shape", "Stump Length": "Medium",
  Skin: "Normal", "Stump Condition": "Normal", Sensation: "Normal", "Phantom Pain": "None", "Phantom Sensation": "Yes",
  "Joint Contracture": "None", "Sound Side": "Normal", "Functional Level": "3", Transport: "Own car",
  Problems: "Loose socket", Limitations: "Pain if walking over 2 hours", SuitabilityLevel: "Good"
});

// Friendly text for common Firebase errors
export const authErrorText = (err) => {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Incorrect email or password.";
  if (code.includes("email-already-in-use")) return "This email is already registered. Try signing in or reset your password.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  if (code.includes("operation-not-allowed")) return "Email/Password sign-in is not enabled in Firebase yet.";
  if (code.includes("network")) return "Network error. Check your internet connection.";
  if (code.includes("permission-denied")) return "You don't have permission to do this.";
  return err?.message || "Something went wrong. Please try again.";
};
