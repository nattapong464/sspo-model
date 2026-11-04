// Shared constants and small helper functions
import * as XLSX from "xlsx";

export const COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#64748b", "#14b8a6", "#ec4899"];

export const DEVICE_TYPES_LIST = [
  "FO", "AFO", "KO", "KAFO", "HO", "HKAFO", "CO", "SO", "ULO", "shoes",
  "Seating", "PFP", "ADP", "TTP", "KDP", "TFP", "HDP", "ULP"
];

export const RATINGS = ["Excellent", "Good", "Fair", "Poor"];
export const RATING_ORDER = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };

export const STATUS_STYLE = {
  Pending: { badge: "badge-orange", color: "#f59e0b" },
  Approved: { badge: "badge-green", color: "#10b981" },
  Completed: { badge: "badge-blue", color: "#3b82f6" },
  Rejected: { badge: "badge-red", color: "#ef4444" },
  Cancelled: { badge: "badge-gray", color: "#94a3b8" }
};

// Excel column names that are mapped to main fields (not shown again under "Other information")
export const KNOWN_EXCEL_KEYS = [
  "Full Name", "Name", "ชื่อ-สกุล", "ชื่อ", "Device type", "Type of Orthoses", "DeviceType", "ชนิดอุปกรณ์",
  "Underlying Disease", "Disease", "โรค", "โรคประจำตัว", "Province", "จังหวัด", "Phone", "Phone2", "เบอร์โทร",
  "เบอร์โทรศัพท์", "PhotoURL", "SuitabilityLevel", "ระดับ", "SuitabilityScore", "InviteCount", "Gender", "เพศ",
  "Current Age", "Age", "อายุ", "HN", "Limitations", "ข้อจำกัด", "Problems", "ปัญหา"
];

export const getAvatarUrl = (gender = "", ageStr = "") => {
  const g = String(gender || "").toLowerCase().trim();
  const ageMatch = String(ageStr).match(/\d+/);
  const age = ageMatch ? parseInt(ageMatch[0]) : 30;
  const isFemale = g === "f" || g === "female" || g === "หญิง" || g === "ญ" || g.includes("หญิง") || g.includes("นาง") || g.includes("ด.ญ.");
  const male = !isFemale;
  if (age < 18) return male ? "/avatars/child_boy.jpg" : "/avatars/child_girl.jpg";
  if (age >= 60) return male ? "/avatars/elder_male.jpg" : "/avatars/elder_female.jpg";
  return male ? "/avatars/adult_male.jpg" : "/avatars/adult_female.jpg";
};

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
export const patientHN = (p) => p?.hn || p?.rawExcelData?.HN || "";
export const patientAge = (p) => p?.age || p?.rawExcelData?.["Current Age"] || p?.rawExcelData?.Age || p?.rawExcelData?.["อายุ"] || "";
export const upcomingSlots = (p) =>
  (p?.bookedSlots || []).filter((s) => s.date >= todayStr()).sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));

// Small copy of a patient stored inside a request (so the request still makes sense if the patient changes)
export const patientSnapshot = (p) => ({
  id: String(p.id), name: p.name || "", deviceType: p.deviceType || "", phone: p.phone || "",
  photo: p.photo || "", hn: patientHN(p)
});

/* Excel ------------------------------------------------------------- */
const getVal = (row, keys) => {
  for (const key of Object.keys(row)) {
    const clean = key.trim().toLowerCase();
    if (keys.some((k) => k.toLowerCase() === clean)) {
      const v = row[key];
      return v === undefined || v === null ? null : String(v).trim();
    }
  }
  return null;
};

// Convert one Excel row into patient fields. Only columns that exist are returned,
// so re-importing never wipes data that is not in the file.
export const excelRowToPatient = (row) => {
  const out = {};
  const set = (field, keys) => { const v = getVal(row, keys); if (v) out[field] = v; };
  set("name", ["Full Name", "Name", "ชื่อ-สกุล", "ชื่อ"]);
  set("hn", ["HN"]);
  set("gender", ["Gender", "เพศ"]);
  set("age", ["Current Age", "Age", "อายุ"]);
  set("deviceType", ["Device type", "Type of Orthoses", "DeviceType", "ชนิดอุปกรณ์"]);
  set("disease", ["Underlying Disease", "Disease", "โรค", "โรคประจำตัว"]);
  set("province", ["Province", "จังหวัด"]);
  set("phone", ["Phone", "Phone2", "เบอร์โทร", "เบอร์โทรศัพท์"]);
  set("limitations", ["Limitations", "ข้อจำกัด"]);
  set("problems", ["Problems", "ปัญหา"]);
  const level = getVal(row, ["SuitabilityLevel", "ระดับ"]);
  if (level && RATINGS.includes(level)) out.suitabilityLevel = level;
  const photo = getVal(row, ["PhotoURL"]);
  out.photo = photo || getAvatarUrl(out.gender, out.age);
  out.rawExcelData = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)]));
  return out;
};

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

export const PATIENT_TEMPLATE_ROW = {
  "Full Name": "Somchai Jaidee", HN: "123456", Gender: "Male", Age: 55, "Device type": "TTP",
  "Underlying Disease": "Diabetes", Province: "Bangkok", Phone: "081-234-5678",
  Limitations: "Pain if walking over 2 hours", Problems: "Loose socket", SuitabilityLevel: "Good"
};

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
