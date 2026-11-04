// Patient model (ครูต้นแบบ) fields — mirrors every column of "SSPO patient Bank.xlsx".
// General fields are stored at the top level of the patient document.
// Clinical fields are stored in patient.details = { key: value }.
// `excel` lists the column names in the Excel file (first one is used when exporting).

/* Device types ------------------------------------------------------ */
// group decides which clinical section the form shows. prefix = first 2 digits of "ID / Code".
export const DEVICE_TYPES = [
  { code: "PFP", name: "Partial foot prosthesis", group: "prosthesis", prefix: "01" },
  { code: "ADP", name: "Ankle disarticulation prosthesis", group: "prosthesis", prefix: "02" },
  { code: "TTP", name: "Transtibial prosthesis", group: "prosthesis", prefix: "03" },
  { code: "KDP", name: "Knee disarticulation prosthesis", group: "prosthesis", prefix: "04" },
  { code: "TFP", name: "Transfemoral prosthesis", group: "prosthesis", prefix: "05" },
  { code: "HDP", name: "Hip disarticulation prosthesis", group: "prosthesis", prefix: "06" },
  { code: "BE", name: "Below-elbow prosthesis", group: "prosthesis", prefix: "07" },
  { code: "AE", name: "Above-elbow prosthesis", group: "prosthesis", prefix: "08" },
  { code: "SD", name: "Shoulder disarticulation prosthesis", group: "prosthesis", prefix: "09" },
  { code: "ULP", name: "Upper limb prosthesis", group: "prosthesis" },
  { code: "SO", name: "Spinal orthosis (scoliosis)", group: "spinal", prefix: "10" },
  { code: "CO", name: "Cervical orthosis", group: "spinal" },
  { code: "FO", name: "Foot orthosis", group: "orthosis", prefix: "11" },
  { code: "AFO", name: "Ankle-foot orthosis", group: "orthosis", prefix: "12" },
  { code: "KAFO", name: "Knee-ankle-foot orthosis", group: "orthosis", prefix: "13" },
  { code: "KO", name: "Knee orthosis", group: "orthosis" },
  { code: "HO", name: "Hip orthosis", group: "orthosis" },
  { code: "HKAFO", name: "Hip-knee-ankle-foot orthosis", group: "orthosis" },
  { code: "ULO", name: "Upper limb orthosis", group: "orthosis" },
  { code: "shoes", name: "Orthopaedic shoes", group: "orthosis" },
  { code: "Seating", name: "Seating system", group: "orthosis" },
  { code: "Other", name: "Other", group: "orthosis", prefix: "16" }
];
const DEVICE_BY_CODE = Object.fromEntries(DEVICE_TYPES.map((d) => [d.code.toLowerCase(), d]));
export const deviceInfo = (code) => DEVICE_BY_CODE[String(code || "").trim().toLowerCase()] || null;
export const deviceGroup = (code) => deviceInfo(code)?.group || (code ? "orthosis" : "");
export const GROUP_LABEL = { prosthesis: "Prosthesis", orthosis: "Orthosis", spinal: "Spinal orthosis" };

/* General fields (top level) --------------------------------------- */
export const GENERAL_FIELDS = [
  { key: "code", label: "ID / Code", excel: ["ID / Code", "ID", "Code", "รหัส"] },
  { key: "hn", label: "HN", excel: ["HN"] },
  { key: "name", label: "Full name", excel: ["Full Name", "Name", "ชื่อ-สกุล", "ชื่อ"] },
  { key: "gender", label: "Gender", excel: ["Gender", "เพศ"] },
  { key: "birthday", label: "Date of birth", excel: ["Birthday", "Date of Birth", "วันเกิด"] },
  { key: "age", label: "Age", excel: ["Current Age", "Age", "อายุ"] },
  { key: "deviceType", label: "Device type", excel: ["Device type", "DeviceType", "ชนิดอุปกรณ์"] },
  { key: "province", label: "Province", excel: ["Province", "จังหวัด"] },
  { key: "phone", label: "Phone", excel: ["Phone", "เบอร์โทร", "เบอร์โทรศัพท์"] },
  { key: "phone2", label: "Phone 2", excel: ["Phone2"] },
  { key: "disease", label: "Underlying disease", excel: ["Underlying Disease", "Disease", "โรค", "โรคประจำตัว"] },
  { key: "note", label: "Note / document link", excel: ["Note / Document Link", "Note"] },
  { key: "otherNote", label: "Other notes", excel: ["other2"] },
  // app-only fields (not in the original file, kept for round-trip export)
  { key: "problems", label: "Device / patient problems", excel: ["Problems", "ปัญหา"] },
  { key: "limitations", label: "Limitations / precautions", excel: ["Limitations", "ข้อจำกัด"] },
  { key: "suitabilityLevel", label: "Suitability level", excel: ["SuitabilityLevel", "ระดับ"] },
  { key: "photo", label: "Photo URL", excel: ["PhotoURL"] }
];

/* Clinical sections (patient.details) ------------------------------ */
// type: "combo" = free text with suggestions, "select" = fixed list, "textarea", "number"
const YES_NO = ["No", "Yes"];
const NONE_YES = ["None", "Yes"];
const SIDE = ["Left", "Right", "Both sides"];
const CURVE_REGION = ["Thoracic curve", "Thoracolumbar", "Lumbar curve"];

export const SECTIONS = [
  {
    id: "amputation", title: "Amputation & residual limb", groups: ["prosthesis"],
    fields: [
      { key: "causeOfAmputation", label: "Cause of amputation", excel: ["Cause of Amputation"], type: "combo",
        options: ["Accident", "Infected wound", "Vascular disease", "Diabetes", "Cancer", "Congenital", "Electric shock", "Trauma", "Explosion"] },
      { key: "affectedSide", label: "Affected side", excel: ["Affected Side", "Effected side"], type: "combo", options: SIDE },
      { key: "stumpShape", label: "Stump shape", excel: ["Stump Shape"], type: "combo", options: ["Cylindrical shape", "Conical shape", "Bulbous shape"] },
      { key: "stumpLength", label: "Stump length", excel: ["Stump Length"], type: "combo",
        options: ["Short", "Medium", "Long", "Less than half of sound side", "More than half of sound side"] },
      { key: "skin", label: "Skin", excel: ["Skin"], type: "combo", options: ["Normal", "Suture line", "Callus", "Scar", "Hair patches"] },
      { key: "stumpCondition", label: "Stump condition", excel: ["Stump Condition"], type: "combo",
        options: ["Normal", "Pain at stump end", "Hypertrophic scar", "Dry / callused skin"] },
      { key: "sensation", label: "Sensation", excel: ["Sensation"], type: "combo", options: ["Normal", "Abnormal"] },
      { key: "phantomPain", label: "Phantom pain", excel: ["Phantom Pain"], type: "combo", options: NONE_YES },
      { key: "phantomSensation", label: "Phantom sensation", excel: ["Phantom Sensation"], type: "combo", options: NONE_YES },
      { key: "jointContracture", label: "Joint contracture", excel: ["Joint Contracture"], type: "combo", options: NONE_YES },
      { key: "soundSide", label: "Sound side", excel: ["Sound Side"], type: "combo",
        options: ["Normal", "Joint pain when walking / moving", "Muscle spasm", "Scar", "Foot numbness", "Bilateral amputation"] },
      { key: "functionalLevel", label: "Functional level (K-level)", excel: ["Functional Level"], type: "select",
        options: [["0", "K0 – Non-ambulatory"], ["1", "K1 – Household"], ["2", "K2 – Limited community"], ["3", "K3 – Community"], ["4", "K4 – High activity"]] }
    ]
  },
  {
    id: "orthosis", title: "Orthotic assessment", groups: ["orthosis"],
    fields: [
      { key: "affectedSide", label: "Affected side", excel: ["Affected Side", "Effected side"], type: "combo", options: ["Left", "Right", "Both"] },
      { key: "problematicLLJoint", label: "Problematic lower-limb joint", excel: ["Problematic LL joint"], type: "combo", options: ["Ankle joint", "Knee joint", "Hip joint"] },
      { key: "problematicULJoint", label: "Problematic upper-limb joint", excel: ["Problematic UL joint"], type: "combo", options: ["Wrist joint", "Elbow joint", "Shoulder joint", "Finger joints"] },
      { key: "problem", label: "Problem", excel: ["Problem"], type: "combo", options: ["Normal", "Weakness", "Spasticity", "Deformity", "Instability"] },
      { key: "lossOfSensation", label: "Loss of sensation", excel: ["Loss of sensation"], type: "combo", options: YES_NO },
      { key: "jointContracture", label: "Joint contracture", excel: ["Joint Contracture"], type: "combo", options: NONE_YES },
      { key: "typeOfOrthosis", label: "Type of orthosis", excel: ["Type of Orthoses"], type: "combo", options: ["Rigid", "Articulated", "Conventional", "Plastic", "IWB KAFO"] },
      { key: "footCondition", label: "Foot condition", excel: ["Other"], type: "combo",
        options: ["Plantar fasciitis", "Flat foot", "Flexible flat foot", "High arch", "Very high arch"] },
      { key: "otherCondition", label: "Other condition", excel: ["Other3"], type: "combo", options: ["Charcot"] }
    ]
  },
  {
    id: "scoliosis", title: "Scoliosis / spinal assessment", groups: ["spinal"],
    fields: [
      { key: "doctor", label: "Doctor", excel: ["Doctor"], type: "combo" },
      { key: "department", label: "Department", excel: ["Department"], type: "combo", options: ["Rehab", "Orthopedic"] },
      { key: "causeOfSO", label: "Cause of scoliosis", excel: ["Cause of SO"], type: "combo", options: ["Idiopathic", "Congenital", "Neuromuscular"] },
      { key: "idiopathicType", label: "Idiopathic type", excel: ["Idiopathic"], type: "combo", options: ["Infantile", "Juvenile", "Adolescent", "Adult"] },
      { key: "cobb1", label: "1st X-ray Cobb angle", excel: ["1st X-ray Cobb Angle"], type: "combo", options: ["0-25", "25-45", "45-65", ">65"] },
      { key: "cobb2", label: "2nd X-ray Cobb angle", excel: ["2nd X-ray Cobb Angle"], type: "combo", options: ["0-25", "25-45", "45-65", ">65"] },
      { key: "risser", label: "Risser sign", excel: ["Risser Sign"], type: "select", options: ["0", "1", "2", "3", "4", "5"] },
      { key: "curveType", label: "Type of curvature", excel: ["Type of Curvature 1"], type: "combo", options: ["Single", "Double (major-minor)", "Double major"] },
      { key: "curve1", label: "Curve region (1)", excel: ["Type of Curvature 2"], type: "combo", options: CURVE_REGION },
      { key: "curve2", label: "Curve region (2)", excel: ["Type of Curvature 3"], type: "combo", options: CURVE_REGION },
      { key: "legLength", label: "Leg length discrepancy", excel: ["leg Length"], type: "combo", options: ["Not present", "Present (Left)", "Present (Right)"] },
      { key: "trunk", label: "Trunk shift", excel: ["Trunk"], type: "combo", options: ["No", "Left 1 cm", "Left 2 cm", "Left 3 cm", "Right 1 cm", "Right 2 cm"] },
      { key: "backPain", label: "Back pain", excel: ["Back Pain"], type: "combo", options: ["No pain", "Mild pain", "Moderate pain", "Severe pain"] },
      { key: "breathing", label: "Breathing", excel: ["Breathing"], type: "combo", options: ["No problem", "Difficult"] },
      { key: "skin", label: "Skin", excel: ["Skin"], type: "combo", options: ["Normal", "Redness", "Pressure mark"] },
      { key: "familyHistory", label: "Family history of scoliosis", excel: ["SO Family History"], type: "combo", options: ["no", "yes"] },
      { key: "deviceHistory", label: "Previous brace", excel: ["Device History"], type: "combo", options: ["no", "yes"] },
      { key: "typeOfSO", label: "Type of spinal orthosis", excel: ["Type of SO"], type: "combo", options: ["Boston", "Cheneau", "Milwaukee", "N / A"] },
      { key: "hoursOfUse", label: "Hours of use per day", excel: ["Hours of Use"], type: "number" },
      { key: "problemWithDevice", label: "Problem with device", excel: ["Problem with Device"], type: "combo", options: ["N / A", "Pain", "Discomfort"] }
    ]
  },
  {
    id: "function", title: "Function, device use & travel", groups: ["prosthesis", "orthosis", "spinal"],
    fields: [
      { key: "experience", label: "Experience with device", excel: ["Experience with Device"], type: "combo",
        options: ["New user", "Yes 1 year", "Yes 2 years", "More than 5 years", "More than 10 years"] },
      { key: "donning", label: "Can don device independently", excel: ["Donning ability", "Ability to Don Device"], type: "combo", options: YES_NO },
      { key: "ambulation", label: "Ambulation / mobility", excel: ["Ambulation ability", "Ambulation / Mobility Ability"], type: "combo",
        options: ["Independent", "With walk aid", "Wheelchair"] },
      { key: "transport", label: "Transport", excel: ["Transport"], type: "combo", options: ["Own car", "Public", "Taxi", "Needs pick-up"] },
      { key: "availableTime", label: "Convenient time", excel: ["Time"], type: "combo", options: ["Morning", "Afternoon", "All day", "Weekdays", "Weekends"] }
    ]
  }
];

// Every clinical field once (affectedSide / jointContracture / skin appear in more than one section)
export const DETAIL_FIELDS = Object.values(
  Object.fromEntries(SECTIONS.flatMap((s) => s.fields).map((f) => [f.key, f]))
);

export const sectionsFor = (deviceType) => {
  const g = deviceGroup(deviceType);
  return g ? SECTIONS.filter((s) => s.groups.includes(g)) : [];
};

// Excel columns handled by the app (not shown again under "Other data from Excel")
export const KNOWN_EXCEL_KEYS = new Set(
  [...GENERAL_FIELDS, ...DETAIL_FIELDS].flatMap((f) => f.excel).concat(["SuitabilityScore", "InviteCount", "Available", "Type of Orthoses"])
);

// Column order for export / template — same order as the original Excel file, then app columns
export const EXPORT_COLUMNS = [
  ["Device type", "deviceType"], ["ID / Code", "code"], ["HN", "hn"], ["Full Name", "name"], ["Gender", "gender"],
  ["Phone", "phone"], ["Birthday", "birthday"], ["Current Age", "age"], ["Province", "province"],
  ["Underlying Disease", "disease"], ["Cause of Amputation", "d.causeOfAmputation"], ["Affected Side", "d.affectedSide"],
  ["Stump Shape", "d.stumpShape"], ["Stump Length", "d.stumpLength"], ["Skin", "d.skin"], ["Stump Condition", "d.stumpCondition"],
  ["Sensation", "d.sensation"], ["Phantom Pain", "d.phantomPain"], ["Phantom Sensation", "d.phantomSensation"],
  ["Joint Contracture", "d.jointContracture"], ["Sound Side", "d.soundSide"], ["Functional Level", "d.functionalLevel"],
  ["Note / Document Link", "note"], ["Transport", "d.transport"], ["Time", "d.availableTime"],
  ["Experience with Device", "d.experience"], ["Device History", "d.deviceHistory"], ["Doctor", "d.doctor"],
  ["Department", "d.department"], ["Cause of SO", "d.causeOfSO"], ["Idiopathic", "d.idiopathicType"],
  ["1st X-ray Cobb Angle", "d.cobb1"], ["2nd X-ray Cobb Angle", "d.cobb2"], ["Risser Sign", "d.risser"],
  ["Back Pain", "d.backPain"], ["Breathing", "d.breathing"], ["Type of SO", "d.typeOfSO"], ["Hours of Use", "d.hoursOfUse"],
  ["Problem with Device", "d.problemWithDevice"], ["SO Family History", "d.familyHistory"],
  ["Type of Curvature 1", "d.curveType"], ["Type of Curvature 2", "d.curve1"], ["Type of Curvature 3", "d.curve2"],
  ["leg Length", "d.legLength"], ["Trunk", "d.trunk"], ["Phone2", "phone2"], ["Donning ability", "d.donning"],
  ["Ambulation ability", "d.ambulation"], ["Problematic LL joint", "d.problematicLLJoint"],
  ["Problematic UL joint", "d.problematicULJoint"], ["Problem", "d.problem"], ["Loss of sensation", "d.lossOfSensation"],
  ["Type of Orthoses", "d.typeOfOrthosis"], ["Other", "d.footCondition"], ["Other3", "d.otherCondition"], ["other2", "otherNote"],
  ["Problems", "problems"], ["Limitations", "limitations"], ["SuitabilityLevel", "suitabilityLevel"], ["PhotoURL", "photo"]
];
