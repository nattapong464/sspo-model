import { useMemo, useRef, useState } from "react";
import {
  Search, Plus, Upload, Download, FileSpreadsheet, Pencil, Trash2, Check, ShoppingCart, Eye,
  Calendar, Phone, MapPin, Contact, Link as LinkIcon, EyeOff
} from "lucide-react";
import { addPatient, updatePatient, deletePatient, upsertPatients } from "../data";
import {
  DEVICE_TYPES_LIST, RATINGS, RATING_ORDER, patientHN, patientAge, patientCode, patientGender, patientBirthday,
  patientDetails, patientPhoto, patientSummary, pField, upcomingSlots, fmtDate, fmtTime, todayStr, excelRowToPatient, normName,
  downloadExcel, readExcelFile, PATIENT_TEMPLATE_ROW, patientsToExcelRows, getAvatarUrl, isDefaultAvatar, authErrorText,
  AGE_BANDS, ageBand, genderKey, genderLabel, ageFromBirthday, nextPatientCode, deviceLabel
} from "../utils";
import { DEVICE_TYPES, DETAIL_FIELDS, KNOWN_EXCEL_KEYS, sectionsFor, deviceGroup, deviceInfo, GROUP_LABEL } from "../patientFields";
import { RATING_STYLE } from "../labels";
import { Modal, Avatar, Empty, PageHead, toast, confirmDialog } from "../components/ui";

const SORTS = {
  rating: { label: "Suitability", fn: (a, b) => (RATING_ORDER[b.suitabilityLevel] || 0) - (RATING_ORDER[a.suitabilityLevel] || 0) },
  least: { label: "Least invited", fn: (a, b) => (a.inviteCount || 0) - (b.inviteCount || 0) },
  name: { label: "Name (A–Z)", fn: (a, b) => (a.name || "").localeCompare(b.name || "", "th") }
};

// Filters can be preset from the link, e.g. "#/patients?device=TTP&band=elder" (used by the Patient Dashboard)
const hashParam = (k) => new URLSearchParams(window.location.hash.split("?")[1] || "").get(k) || "";

export default function Patients({ isAdmin, patients, cart }) {
  const [q, setQ] = useState("");
  const [device, setDevice] = useState(() => hashParam("device"));
  const [rating, setRating] = useState("");
  const [gender, setGender] = useState(() => hashParam("gender"));
  const [band, setBand] = useState(() => hashParam("band"));
  const [freeOn, setFreeOn] = useState("");
  const [sort, setSort] = useState("rating");
  const [showInactive, setShowInactive] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null); // {} for new, patient for edit
  const [importRows, setImportRows] = useState(null);
  const fileRef = useRef(null);

  const deviceCounts = useMemo(() => {
    const c = {};
    patients.forEach((p) => { if (p.deviceType) c[p.deviceType] = (c[p.deviceType] || 0) + 1; });
    return c;
  }, [patients]);
  const deviceOptions = useMemo(
    () => [...new Set([...DEVICE_TYPES_LIST, ...Object.keys(deviceCounts)])].filter((d) => deviceCounts[d]),
    [deviceCounts]
  );

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients
      .filter((p) => (isAdmin && showInactive) || p.available !== false)
      .filter((p) => !device || p.deviceType === device)
      .filter((p) => !rating || p.suitabilityLevel === rating)
      .filter((p) => !gender || genderKey(patientGender(p)) === gender)
      .filter((p) => !band || ageBand(patientAge(p))?.key === band)
      .filter((p) => !freeOn || !(p.bookedSlots || []).some((s) => s.date === freeOn))
      .filter((p) => !term || [p.name, patientHN(p), patientCode(p), pField(p, "disease"), pField(p, "province"), p.deviceType, p.problems,
        ...Object.values(patientDetails(p))]
        .some((v) => String(v || "").toLowerCase().includes(term)))
      .sort(SORTS[sort].fn);
  }, [patients, q, device, rating, gender, band, freeOn, sort, showInactive, isAdmin]);

  const hasFilter = q || device || rating || gender || band || freeOn;
  const resetFilters = () => { setQ(""); setDevice(""); setRating(""); setGender(""); setBand(""); setFreeOn(""); };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rows = await readExcelFile(file);
      if (!rows.length) return toast("No rows found in the file", "error");
      setImportRows(rows);
    } catch {
      toast("Could not read the file. Please use .xlsx or .csv.", "error");
    }
  };

  // Same columns as "SSPO patient Bank.xlsx", so the file can be edited and imported back
  const exportAll = () => downloadExcel(patientsToExcelRows(patients), "Patients", `patients_${new Date().toISOString().slice(0, 10)}.xlsx`);

  const remove = async (p) => {
    const ok = await confirmDialog({
      title: "Delete patient", danger: true, confirmText: "Delete",
      message: `Delete "${p.name}" from the system? Past requests that included this patient will keep the name.`
    });
    if (!ok) return;
    try { await deletePatient(p.id); toast("Patient deleted"); setDetail(null); }
    catch (err) { toast(authErrorText(err), "error"); }
  };

  return (
    <>
      <PageHead title={isAdmin ? "Manage Patients" : "Patient Directory"}
        subtitle={isAdmin ? `${patients.length} patients in total — add, edit, import or hide patient models` : "Choose the patients you need, then click “Add to cart” to send a request"}>
        {isAdmin && (
          <>
            <button className="btn btn-ghost" onClick={() => downloadExcel([PATIENT_TEMPLATE_ROW], "Patients", "patient_template.xlsx")}>
              <FileSpreadsheet size={17} /> Excel template
            </button>
            <button className="btn btn-ghost" onClick={exportAll}><Download size={17} /> Export</button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={17} /> Import Excel</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={onPickFile} />
            <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={17} /> Add patient</button>
          </>
        )}
      </PageHead>

      <div className="card filters">
        <div className="search">
          <Search size={18} />
          <input placeholder="Search name, code, HN, disease, province, cause, problem…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filter-row">
          <select value={device} onChange={(e) => setDevice(e.target.value)} aria-label="Device type">
            <option value="">All device types</option>
            {deviceOptions.map((d) => <option key={d} value={d}>{d} ({deviceCounts[d]})</option>)}
          </select>
          <select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Gender">
            <option value="">All genders</option><option value="male">Male</option><option value="female">Female</option>
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value)} aria-label="Age group">
            <option value="">All ages</option>
            {AGE_BANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
          <select value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Suitability level">
            <option value="">All suitability levels</option>
            {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="inline-field" title="Show only patients with no booking on this date">
            <Calendar size={16} /><span>Free on</span>
            <input type="date" value={freeOn} onChange={(e) => setFreeOn(e.target.value)} />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>Sort: {s.label}</option>)}
          </select>
          {isAdmin && (
            <label className="check"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show unavailable</label>
          )}
          {hasFilter && <button className="link" onClick={resetFilters}>Clear filters</button>}
        </div>
      </div>

      <p className="muted small result-count">{list.length} found</p>

      {list.length === 0 ? (
        <Empty icon={Contact} title={patients.length ? "No patients match your filters" : "No patients yet"}>
          {isAdmin && !patients.length && "Start by importing an Excel file or clicking “Add patient”"}
        </Empty>
      ) : (
        <div className="grid-cards">
          {list.map((p) => (
            <PatientCard key={p.id} p={p} isAdmin={isAdmin} inCart={cart.has(p.id)}
              onToggle={() => cart.toggle(p.id)} onView={() => setDetail(p)} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      {detail && (
        <PatientDetail p={patients.find((x) => x.id === detail.id) || detail} isAdmin={isAdmin} inCart={cart.has(detail.id)}
          onToggle={() => cart.toggle(detail.id)} onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); }} onDelete={() => remove(detail)} />
      )}
      {editing && <PatientForm initial={editing} patients={patients} onClose={() => setEditing(null)} />}
      {importRows && <ImportModal rows={importRows} patients={patients} onClose={() => setImportRows(null)} />}
    </>
  );
}

function RatingBadge({ level }) {
  if (!level) return null;
  return <span className={`badge ${RATING_STYLE[level]}`}>{level}</span>;
}

// "Male · 66 y · Older adult"
const whoLine = (p) => {
  const age = patientAge(p);
  const b = ageBand(age);
  return [genderLabel(patientGender(p)), age && `${age} y`, b && b.label.replace(/\s*\(.*\)/, "")].filter(Boolean).join(" · ");
};

function PatientCard({ p, isAdmin, inCart, onToggle, onView, onEdit }) {
  const next = upcomingSlots(p);
  const off = p.available === false;
  const summary = patientSummary(p);
  const disease = pField(p, "disease");
  return (
    <div className={`card pcard ${inCart ? "selected" : ""} ${off ? "dim" : ""}`}>
      <div className="pcard-top" onClick={onView} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onView()}>
        <Avatar name={p.name} photo={patientPhoto(p)} size={56} />
        <div className="pcard-id">
          <b>{p.name || "(no name)"}</b>
          <small className="muted">{whoLine(p)}</small>
          <small className="muted">{[patientCode(p) && `#${patientCode(p)}`, patientHN(p) && `HN ${patientHN(p)}`].filter(Boolean).join(" · ")}</small>
        </div>
      </div>
      <div className="pcard-tags">
        {p.deviceType && <span className="badge badge-teal" title={deviceInfo(p.deviceType)?.name}>{p.deviceType}</span>}
        <RatingBadge level={p.suitabilityLevel} />
        {off && <span className="badge badge-gray">Unavailable</span>}
      </div>
      {summary && <div className="pcard-line">{summary}</div>}
      {disease && disease !== "None" && <div className="pcard-line muted">Underlying: {disease}</div>}
      {p.problems && <div className="pcard-line muted clamp2">Problem: {p.problems}</div>}
      <div className="pcard-meta muted small">
        <span>Invited {p.inviteCount || 0}×</span>
        {next.length > 0 && <span className="warn-text">Next booking {fmtDate(next[0].date)}</span>}
      </div>
      <div className="pcard-actions">
        <button className="btn btn-ghost btn-sm" onClick={onView}><Eye size={15} /> Details</button>
        {isAdmin && <button className="btn btn-soft btn-sm" onClick={onEdit}><Pencil size={15} /> Edit</button>}
        <button className={`btn btn-sm ${inCart ? "btn-soft" : "btn-primary"}`} onClick={onToggle} disabled={off && !inCart}>
          {inCart ? <><Check size={15} /> In cart</> : <><ShoppingCart size={15} /> Add to cart</>}
        </button>
      </div>
    </div>
  );
}

const isUrl = (v) => /^https?:\/\//i.test(String(v || "").trim());
const optionLabel = (field, value) => {
  const hit = (field.options || []).find((o) => Array.isArray(o) && o[0] === value);
  return hit ? hit[1] : value;
};

function PatientDetail({ p, isAdmin, inCart, onToggle, onClose, onEdit, onDelete }) {
  const slots = upcomingSlots(p);
  const d = patientDetails(p);
  const extra = Object.entries(p.rawExcelData || {}).filter(([k, v]) => v && !KNOWN_EXCEL_KEYS.has(k));
  // Every field is listed (blank ones show "–") so the record matches the patient bank file
  const row = (label, value) => (
    <div className="kv" key={label}><span>{label}</span>{value ? <b>{value}</b> : <b className="kv-empty">–</b>}</div>
  );
  const birthday = patientBirthday(p);
  const note = pField(p, "note");
  const toggleAvailable = async () => {
    try { await updatePatient(p.id, { available: p.available === false }); toast(p.available === false ? "Patient is available for bookings" : "Patient hidden from users"); }
    catch (err) { toast(authErrorText(err), "error"); }
  };

  // All fields of the sections for this device type, plus any other filled clinical data
  const own = sectionsFor(p.deviceType);
  const shown = new Set();
  const blocks = own.map((s) => {
    s.fields.forEach((f) => shown.add(f.key));
    return { title: s.title, items: s.fields };
  });
  const leftovers = DETAIL_FIELDS.filter((f) => d[f.key] && !shown.has(f.key));
  if (leftovers.length) blocks.push({ title: own.length ? "Other clinical details" : "Clinical details", items: leftovers });

  return (
    <Modal title="Patient details" onClose={onClose} size="lg"
      footer={<>
        {isAdmin && <button className="btn btn-danger-ghost" onClick={onDelete}><Trash2 size={16} /> Delete</button>}
        {isAdmin && <button className="btn btn-ghost" onClick={onEdit}><Pencil size={16} /> Edit</button>}
        {isAdmin && <button className="btn btn-ghost" onClick={toggleAvailable}>
          {p.available === false ? <><Eye size={16} /> Make available</> : <><EyeOff size={16} /> Make unavailable</>}</button>}
        <div className="spacer" />
        <button className={`btn ${inCart ? "btn-soft" : "btn-primary"}`} onClick={onToggle} disabled={p.available === false && !inCart}>
          {inCart ? <><Check size={16} /> In cart (click to remove)</> : <><ShoppingCart size={16} /> Add to cart</>}
        </button>
      </>}>
      <div className="detail-head">
        <Avatar name={p.name} photo={patientPhoto(p)} size={88} />
        <div>
          <h2>{p.name}</h2>
          <p className="muted small">{whoLine(p)}</p>
          <div className="pcard-tags">
            {p.deviceType && <span className="badge badge-teal">{deviceLabel(p.deviceType)}</span>}
            <RatingBadge level={p.suitabilityLevel} />
            {p.available === false && <span className="badge badge-gray">Unavailable</span>}
          </div>
        </div>
      </div>

      <h4 className="sec-title">General information</h4>
      <div className="kv-grid">
        {row("ID / Code", patientCode(p))}
        {row("HN", patientHN(p))}
        {row("Gender", genderLabel(patientGender(p)))}
        {row("Date of birth", birthday ? fmtDate(birthday) : pField(p, "birthday"))}
        {row("Age", patientAge(p) && `${patientAge(p)} years`)}
        {row("Device type", deviceLabel(p.deviceType))}
        {row("Province", pField(p, "province") && <><MapPin size={14} /> {pField(p, "province")}</>)}
        {row("Underlying disease", pField(p, "disease"))}
        {[["phone", "Phone"], ["phone2", "Phone 2"]].map(([k, label]) => row(label, pField(p, k) &&
          <><Phone size={14} /> <a href={`tel:${pField(p, k)}`}>{pField(p, k)}</a></>))}
        {row("Times invited", `${p.inviteCount || 0}`)}
      </div>

      {!own.length && <p className="muted small form-hint" style={{ marginTop: 14 }}>Device type is not set, so the clinical sections cannot be chosen. Edit the patient and pick a device type.</p>}
      {blocks.filter((b) => b.items.length).map((b) => (
        <div key={b.title}>
          <h4 className="sec-title">{b.title}</h4>
          <div className="kv-grid">{b.items.map((f) => row(f.label, optionLabel(f, d[f.key])))}</div>
        </div>
      ))}

      <h4 className="sec-title">Notes</h4>
      <div className="kv-grid">
        {row("Note / document link", note && (isUrl(note) ? <a href={note} target="_blank" rel="noreferrer"><LinkIcon size={14} /> Open document</a> : note))}
        {row("Other notes", pField(p, "otherNote"))}
        {row("Device / patient problems", p.problems)}
        {row("Limitations / precautions", p.limitations)}
      </div>
      {p.adminNote && isAdmin && <div className="note-box"><b>Admin note</b><p>{p.adminNote}</p></div>}

      <h4 className="sec-title">Booked sessions</h4>
      {slots.length === 0 ? <p className="muted small">No upcoming bookings</p> : (
        <ul className="slot-list">
          {slots.map((s) => <li key={s.requestId + s.date}><Calendar size={14} /> {fmtDate(s.date)} · {fmtTime(s.timeStart, s.timeEnd)}</li>)}
        </ul>
      )}

      {extra.length > 0 && (
        <>
          <h4 className="sec-title">Other data from Excel</h4>
          <div className="kv-grid">{extra.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        </>
      )}
    </Modal>
  );
}

const GENERAL_KEYS = ["code", "hn", "name", "gender", "birthday", "age", "deviceType", "province", "phone", "phone2",
  "disease", "note", "otherNote", "problems", "limitations", "suitabilityLevel", "adminNote", "photo"];

// One input for a clinical field: free text with suggestions, a fixed list, a number or a long text
function DetailInput({ field, value, onChange }) {
  const id = `dl-${field.key}`;
  if (field.type === "select") {
    const opts = field.options.map((o) => (Array.isArray(o) ? o : [o, o]));
    if (value && !opts.some(([v]) => v === value)) opts.push([value, value]);
    return (
      <select value={value} onChange={onChange}>
        <option value="">-</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    );
  }
  if (field.type === "textarea") return <textarea rows={2} value={value} onChange={onChange} />;
  if (field.type === "number") return <input value={value} onChange={onChange} inputMode="decimal" />;
  return (
    <>
      <input value={value} onChange={onChange} list={field.options ? id : undefined} placeholder={field.options ? "Type or pick…" : ""} />
      {field.options && <datalist id={id}>{field.options.map((o) => <option key={o} value={o} />)}</datalist>}
    </>
  );
}

function PatientForm({ initial, patients, onClose }) {
  const isNew = !initial.id;
  const [f, setF] = useState(() => {
    const g = Object.fromEntries(GENERAL_KEYS.map((k) => [k, pField(initial, k)]));
    g.gender = genderLabel(g.gender);
    g.birthday = patientBirthday(initial);
    g.age = patientAge(initial);
    g.adminNote = initial.adminNote || "";
    g.photo = isDefaultAvatar(initial.photo) ? "" : initial.photo || "";
    return { ...g, available: initial.available !== false, details: patientDetails(initial) };
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setD = (k) => (e) => setF({ ...f, details: { ...f.details, [k]: e.target.value } });

  const ageAuto = ageFromBirthday(f.birthday);
  const age = ageAuto || f.age;
  const sections = sectionsFor(f.deviceType);
  const suggestedCode = f.deviceType ? nextPatientCode(patients, f.deviceType) : "";

  const onDevice = (e) => {
    const deviceType = e.target.value;
    const next = { ...f, deviceType };
    // New patient: fill the next free code for this device type
    if (isNew && (!f.code || f.code === suggestedCode)) next.code = nextPatientCode(patients, deviceType);
    setF(next);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast("Please enter a name", "error");
    const code = f.code.trim();
    if (code && patients.some((p) => p.id !== initial.id && patientCode(p) === code))
      return toast(`Code ${code} is already used by another patient`, "error");
    setBusy(true);
    const clean = (v) => String(v ?? "").trim();
    const data = {
      ...Object.fromEntries(GENERAL_KEYS.map((k) => [k, clean(f[k])])),
      age: clean(age),
      available: f.available,
      details: Object.fromEntries(DETAIL_FIELDS.map((x) => [x.key, clean(f.details[x.key])])),
      photo: clean(f.photo) || getAvatarUrl(f.gender, age)
    };
    try {
      if (isNew) await addPatient(data); else await updatePatient(initial.id, data);
      toast(isNew ? "Patient added" : "Changes saved");
      onClose();
    } catch (err) { toast(authErrorText(err), "error"); setBusy(false); }
  };

  const group = deviceGroup(f.deviceType);
  const band = ageBand(age);

  return (
    <Modal title={isNew ? "Add patient model" : "Edit patient"} onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="pform" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </>}>
      <form id="pform" onSubmit={save}>
        <div className="avatar-preview">
          <Avatar name={f.name} photo={f.photo.trim() || getAvatarUrl(f.gender, age)} size={76} />
          <div>
            <b>{f.name || "New patient"}</b>
            <small className="muted">
              {f.photo.trim() ? "Custom photo" : `Picture chosen automatically: ${genderLabel(f.gender) || "gender not set"} · ${band ? band.label : "age not set"}`}
            </small>
          </div>
        </div>

        <fieldset className="form-sec">
          <legend>General information</legend>
          <div className="form-grid">
            <label className="field span2"><span>Full name *</span><input value={f.name} onChange={set("name")} autoFocus={isNew} /></label>
            <label className="field"><span>Device type</span>
              <select value={f.deviceType} onChange={onDevice}>
                <option value="">-</option>
                {DEVICE_TYPES.map((d) => <option key={d.code} value={d.code}>{d.code} – {d.name}</option>)}
                {f.deviceType && !deviceInfo(f.deviceType) && <option value={f.deviceType}>{f.deviceType}</option>}
              </select></label>
            <label className="field"><span>ID / Code</span>
              <input value={f.code} onChange={set("code")} placeholder={suggestedCode || "e.g. 03001"} />
              {suggestedCode && f.code !== suggestedCode && (isNew || !f.code) && (
                <button type="button" className="link small" onClick={() => setF({ ...f, code: suggestedCode })}>Use next code {suggestedCode}</button>
              )}</label>
            <label className="field"><span>HN</span><input value={f.hn} onChange={set("hn")} /></label>
            <label className="field"><span>Gender</span>
              <select value={f.gender} onChange={set("gender")}><option value="">-</option><option>Male</option><option>Female</option></select></label>
            <label className="field"><span>Date of birth</span><input type="date" value={f.birthday} onChange={set("birthday")} max={todayStr()} /></label>
            <label className="field"><span>Age (years){ageAuto && " – from date of birth"}</span>
              <input value={age} onChange={set("age")} inputMode="numeric" disabled={!!ageAuto} /></label>
            <label className="field"><span>Province</span><input value={f.province} onChange={set("province")} list="dl-province" />
              <datalist id="dl-province">{[...new Set(patients.map((p) => pField(p, "province")).filter(Boolean))].sort().map((v) => <option key={v} value={v} />)}</datalist></label>
            <label className="field"><span>Underlying disease</span><input value={f.disease} onChange={set("disease")} list="dl-disease" />
              <datalist id="dl-disease">{["None", "Diabetes", "Hypertension", "Heart disease", "Dyslipidemia", "CP", "Stroke", "Neurological disease"].map((v) => <option key={v} value={v} />)}</datalist></label>
            <label className="field"><span>Phone</span><input value={f.phone} onChange={set("phone")} inputMode="tel" /></label>
            <label className="field"><span>Phone 2</span><input value={f.phone2} onChange={set("phone2")} inputMode="tel" /></label>
          </div>
        </fieldset>

        {!group && <p className="muted small form-hint">Choose a device type to show the clinical fields for prosthesis, orthosis or scoliosis.</p>}
        {sections.map((s) => (
          <fieldset className="form-sec" key={s.id}>
            <legend>{s.title}{s.id !== "function" && group && <small> · {GROUP_LABEL[group]}</small>}</legend>
            <div className="form-grid">
              {s.fields.map((x) => (
                <label className={`field ${x.type === "textarea" ? "span2" : ""}`} key={x.key}>
                  <span>{x.label}</span>
                  <DetailInput field={x} value={f.details[x.key] || ""} onChange={setD(x.key)} />
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <fieldset className="form-sec">
          <legend>Teaching use & notes</legend>
          <div className="form-grid">
            <label className="field"><span>Suitability level</span>
              <select value={f.suitabilityLevel} onChange={set("suitabilityLevel")}>
                <option value="">-</option>{RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select></label>
            <label className="field"><span>Note / document link</span><input value={f.note} onChange={set("note")} placeholder="e.g. Veteran, or https://…" /></label>
            <label className="field span2"><span>Device / patient problems</span><textarea rows={2} value={f.problems} onChange={set("problems")} /></label>
            <label className="field span2"><span>Limitations / precautions</span><textarea rows={2} value={f.limitations} onChange={set("limitations")} /></label>
            <label className="field span2"><span>Other notes</span><textarea rows={2} value={f.otherNote} onChange={set("otherNote")} /></label>
            <label className="field span2"><span>Admin note (admins only)</span><textarea rows={2} value={f.adminNote} onChange={set("adminNote")} /></label>
            <label className="field span2"><span>Photo URL (optional – leave empty to use the picture by gender and age)</span>
              <input value={f.photo} onChange={set("photo")} placeholder="https://…" /></label>
            <label className="check span2"><input type="checkbox" checked={f.available} onChange={set("available")} /> Available for bookings (if unticked, users won't see this patient)</label>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function ImportModal({ rows, patients, onClose }) {
  const [busy, setBusy] = useState(false);
  // Match each row to an existing patient by HN first, then by name
  const plan = useMemo(() => {
    const byCode = new Map(), byHN = new Map(), byName = new Map();
    patients.forEach((p) => {
      if (patientCode(p)) byCode.set(patientCode(p), p.id);
      if (patientHN(p)) byHN.set(String(patientHN(p)), p.id);
      if (p.name) byName.set(normName(p.name), p.id);
    });
    return rows.map((row) => {
      const data = excelRowToPatient(row);
      const id = (data.code && byCode.get(data.code)) || (data.hn && byHN.get(data.hn)) || (data.name && byName.get(normName(data.name))) || null;
      return { id, data };
    }).filter((x) => x.data.name);
  }, [rows, patients]);
  const updates = plan.filter((x) => x.id).length;
  const skipped = rows.length - plan.length;

  const run = async () => {
    setBusy(true);
    try {
      await upsertPatients(plan);
      toast(`Import complete: ${plan.length - updates} added, ${updates} updated`);
      onClose();
    } catch (err) { toast(authErrorText(err), "error"); setBusy(false); }
  };

  return (
    <Modal title="Import from Excel" onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={run} disabled={busy || !plan.length}>{busy ? "Importing…" : `Import ${plan.length} rows`}</button>
      </>}>
      <div className="import-sum">
        <div><b>{plan.length - updates}</b><span>New</span></div>
        <div><b>{updates}</b><span>Update existing (matched by code / HN / name)</span></div>
        <div><b>{skipped}</b><span>Skipped (no name)</span></div>
      </div>
      <p className="muted small">Reads every column of the SSPO patient bank (general, prosthesis, orthosis and scoliosis data). Only columns with a value are updated; other data (e.g. invite count, bookings) is kept.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th></th><th>Code</th><th>Name</th><th>Device</th><th>Gender / age</th><th>Details</th></tr></thead>
          <tbody>
            {plan.slice(0, 50).map((x, i) => (
              <tr key={i}>
                <td>{x.id ? <span className="badge badge-blue">Update</span> : <span className="badge badge-green">New</span>}</td>
                <td>{x.data.code || "-"}</td><td>{x.data.name}</td><td>{x.data.deviceType || "-"}</td>
                <td>{[x.data.gender, x.data.age && `${x.data.age} y`].filter(Boolean).join(" · ") || "-"}</td>
                <td>{Object.keys(x.data.details || {}).length} clinical fields</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {plan.length > 50 && <p className="muted small">Showing the first 50 of {plan.length} rows</p>}
    </Modal>
  );
}
