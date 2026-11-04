import { useMemo, useRef, useState } from "react";
import {
  Search, Plus, Upload, Download, FileSpreadsheet, Pencil, Trash2, Check, ShoppingCart, Eye,
  Calendar, Phone, MapPin, Contact
} from "lucide-react";
import { addPatient, updatePatient, deletePatient, upsertPatients } from "../data";
import {
  DEVICE_TYPES_LIST, RATINGS, RATING_ORDER, KNOWN_EXCEL_KEYS, patientHN, patientAge, upcomingSlots,
  fmtDate, fmtTime, excelRowToPatient, normName, downloadExcel, readExcelFile, PATIENT_TEMPLATE_ROW,
  getAvatarUrl, authErrorText
} from "../utils";
import { RATING_STYLE } from "../labels";
import { Modal, Avatar, Empty, PageHead, toast, confirmDialog } from "../components/ui";

const SORTS = {
  rating: { label: "Suitability", fn: (a, b) => (RATING_ORDER[b.suitabilityLevel] || 0) - (RATING_ORDER[a.suitabilityLevel] || 0) },
  least: { label: "Least invited", fn: (a, b) => (a.inviteCount || 0) - (b.inviteCount || 0) },
  name: { label: "Name (A–Z)", fn: (a, b) => (a.name || "").localeCompare(b.name || "", "th") }
};

export default function Patients({ isAdmin, patients, cart }) {
  const [q, setQ] = useState("");
  const [device, setDevice] = useState("");
  const [rating, setRating] = useState("");
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
      .filter((p) => !freeOn || !(p.bookedSlots || []).some((s) => s.date === freeOn))
      .filter((p) => !term || [p.name, patientHN(p), p.disease, p.province, p.deviceType, p.problems]
        .some((v) => String(v || "").toLowerCase().includes(term)))
      .sort(SORTS[sort].fn);
  }, [patients, q, device, rating, freeOn, sort, showInactive, isAdmin]);

  const hasFilter = q || device || rating || freeOn;
  const resetFilters = () => { setQ(""); setDevice(""); setRating(""); setFreeOn(""); };

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

  const exportAll = () => downloadExcel(
    patients.map((p) => ({
      "Full Name": p.name, HN: patientHN(p), Gender: p.gender || "", Age: patientAge(p), "Device type": p.deviceType || "",
      "Underlying Disease": p.disease || "", Province: p.province || "", Phone: p.phone || "",
      Limitations: p.limitations || "", Problems: p.problems || "", SuitabilityLevel: p.suitabilityLevel || "",
      InviteCount: p.inviteCount || 0, Available: p.available === false ? "No" : "Yes"
    })),
    "Patients", `patients_${new Date().toISOString().slice(0, 10)}.xlsx`
  );

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
      <PageHead title="Patient Directory"
        subtitle={isAdmin ? `${patients.length} patients in total` : "Choose the patients you need, then click “Add to cart” to send a request"}>
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
          <input placeholder="Search name, HN, disease, province, problem…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filter-row">
          <select value={device} onChange={(e) => setDevice(e.target.value)} aria-label="Device type">
            <option value="">All device types</option>
            {deviceOptions.map((d) => <option key={d} value={d}>{d} ({deviceCounts[d]})</option>)}
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
      {editing && <PatientForm initial={editing} onClose={() => setEditing(null)} />}
      {importRows && <ImportModal rows={importRows} patients={patients} onClose={() => setImportRows(null)} />}
    </>
  );
}

function RatingBadge({ level }) {
  if (!level) return null;
  return <span className={`badge ${RATING_STYLE[level]}`}>{level}</span>;
}

function PatientCard({ p, isAdmin, inCart, onToggle, onView, onEdit }) {
  const next = upcomingSlots(p);
  const off = p.available === false;
  return (
    <div className={`card pcard ${inCart ? "selected" : ""} ${off ? "dim" : ""}`}>
      <div className="pcard-top" onClick={onView} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onView()}>
        <Avatar name={p.name} photo={p.photo} size={52} />
        <div className="pcard-id">
          <b>{p.name || "(no name)"}</b>
          <small className="muted">
            {[patientHN(p) && `HN ${patientHN(p)}`, p.gender, patientAge(p) && `${patientAge(p)} y`].filter(Boolean).join(" · ")}
          </small>
        </div>
      </div>
      <div className="pcard-tags">
        {p.deviceType && <span className="badge badge-teal">{p.deviceType}</span>}
        <RatingBadge level={p.suitabilityLevel} />
        {off && <span className="badge badge-gray">Unavailable</span>}
      </div>
      {p.disease && <div className="pcard-line">{p.disease}</div>}
      {p.problems && <div className="pcard-line muted clamp2">Problem: {p.problems}</div>}
      <div className="pcard-meta muted small">
        <span>Invited {p.inviteCount || 0}×</span>
        {next.length > 0 && <span className="warn-text">Next booking {fmtDate(next[0].date)}</span>}
      </div>
      <div className="pcard-actions">
        <button className="btn btn-ghost btn-sm" onClick={onView}><Eye size={15} /> Details</button>
        {isAdmin && <button className="btn btn-ghost btn-sm" onClick={onEdit} aria-label="Edit"><Pencil size={15} /></button>}
        <button className={`btn btn-sm ${inCart ? "btn-soft" : "btn-primary"}`} onClick={onToggle} disabled={off && !inCart}>
          {inCart ? <><Check size={15} /> In cart</> : <><ShoppingCart size={15} /> Add to cart</>}
        </button>
      </div>
    </div>
  );
}

function PatientDetail({ p, isAdmin, inCart, onToggle, onClose, onEdit, onDelete }) {
  const slots = upcomingSlots(p);
  const extra = Object.entries(p.rawExcelData || {}).filter(([k, v]) => v && !KNOWN_EXCEL_KEYS.includes(k));
  const row = (label, value) => value ? <div className="kv"><span>{label}</span><b>{value}</b></div> : null;
  return (
    <Modal title="Patient details" onClose={onClose} size="lg"
      footer={<>
        {isAdmin && <button className="btn btn-danger-ghost" onClick={onDelete}><Trash2 size={16} /> Delete</button>}
        {isAdmin && <button className="btn btn-ghost" onClick={onEdit}><Pencil size={16} /> Edit</button>}
        <div className="spacer" />
        <button className={`btn ${inCart ? "btn-soft" : "btn-primary"}`} onClick={onToggle} disabled={p.available === false && !inCart}>
          {inCart ? <><Check size={16} /> In cart (click to remove)</> : <><ShoppingCart size={16} /> Add to cart</>}
        </button>
      </>}>
      <div className="detail-head">
        <Avatar name={p.name} photo={p.photo} size={72} />
        <div>
          <h2>{p.name}</h2>
          <div className="pcard-tags">
            {p.deviceType && <span className="badge badge-teal">{p.deviceType}</span>}
            <RatingBadge level={p.suitabilityLevel} />
            {p.available === false && <span className="badge badge-gray">Unavailable</span>}
          </div>
        </div>
      </div>
      <div className="kv-grid">
        {row("HN", patientHN(p))}
        {row("Gender", p.gender)}
        {row("Age", patientAge(p) && `${patientAge(p)} y`)}
        {row("Underlying disease", p.disease)}
        {p.province && <div className="kv"><span>Province</span><b><MapPin size={14} /> {p.province}</b></div>}
        {isAdmin && p.phone && <div className="kv"><span>Phone</span><b><Phone size={14} /> <a href={`tel:${p.phone}`}>{p.phone}</a></b></div>}
        {row("Times invited", `${p.inviteCount || 0}`)}
      </div>
      {p.problems && <div className="note-box"><b>Device / patient problems</b><p>{p.problems}</p></div>}
      {p.limitations && <div className="note-box warn"><b>Limitations / precautions</b><p>{p.limitations}</p></div>}
      {p.adminNote && isAdmin && <div className="note-box"><b>Admin note</b><p>{p.adminNote}</p></div>}

      <h4 className="sec-title">Booked sessions</h4>
      {slots.length === 0 ? <p className="muted small">No upcoming bookings</p> : (
        <ul className="slot-list">
          {slots.map((s) => <li key={s.requestId + s.date}><Calendar size={14} /> {fmtDate(s.date)} · {fmtTime(s.timeStart, s.timeEnd)}</li>)}
        </ul>
      )}

      {isAdmin && extra.length > 0 && (
        <>
          <h4 className="sec-title">Other data from Excel</h4>
          <div className="kv-grid">{extra.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        </>
      )}
    </Modal>
  );
}

const EMPTY = {
  name: "", hn: "", gender: "", age: "", deviceType: "", disease: "", province: "", phone: "",
  limitations: "", problems: "", suitabilityLevel: "", photo: "", adminNote: "", available: true
};

function PatientForm({ initial, onClose }) {
  const isNew = !initial.id;
  const [f, setF] = useState({ ...EMPTY, ...initial, hn: patientHN(initial), age: patientAge(initial), available: initial.available !== false });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast("Please enter a name", "error");
    setBusy(true);
    const data = {
      name: f.name.trim(), hn: f.hn.trim(), gender: f.gender, age: String(f.age).trim(), deviceType: f.deviceType,
      disease: f.disease.trim(), province: f.province.trim(), phone: f.phone.trim(), limitations: f.limitations.trim(),
      problems: f.problems.trim(), suitabilityLevel: f.suitabilityLevel, adminNote: f.adminNote.trim(),
      available: f.available, photo: f.photo.trim() || getAvatarUrl(f.gender, f.age)
    };
    try {
      if (isNew) await addPatient(data); else await updatePatient(initial.id, data);
      toast(isNew ? "Patient added" : "Changes saved");
      onClose();
    } catch (err) { toast(authErrorText(err), "error"); setBusy(false); }
  };

  return (
    <Modal title={isNew ? "Add patient model" : "Edit patient"} onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="pform" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </>}>
      <form id="pform" onSubmit={save} className="form-grid">
        <label className="field span2"><span>Full name *</span><input value={f.name} onChange={set("name")} autoFocus /></label>
        <label className="field"><span>HN</span><input value={f.hn} onChange={set("hn")} /></label>
        <label className="field"><span>Gender</span>
          <select value={f.gender} onChange={set("gender")}><option value="">-</option><option>Male</option><option>Female</option></select></label>
        <label className="field"><span>Age (years)</span><input value={f.age} onChange={set("age")} inputMode="numeric" /></label>
        <label className="field"><span>Device type</span>
          <select value={f.deviceType} onChange={set("deviceType")}>
            <option value="">-</option>
            {[...new Set([...DEVICE_TYPES_LIST, f.deviceType].filter(Boolean))].map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label className="field"><span>Suitability level</span>
          <select value={f.suitabilityLevel} onChange={set("suitabilityLevel")}>
            <option value="">-</option>{RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select></label>
        <label className="field"><span>Underlying disease</span><input value={f.disease} onChange={set("disease")} /></label>
        <label className="field"><span>Province</span><input value={f.province} onChange={set("province")} /></label>
        <label className="field"><span>Phone (admins only)</span><input value={f.phone} onChange={set("phone")} inputMode="tel" /></label>
        <label className="field span2"><span>Device / patient problems</span><textarea rows={2} value={f.problems} onChange={set("problems")} /></label>
        <label className="field span2"><span>Limitations / precautions</span><textarea rows={2} value={f.limitations} onChange={set("limitations")} /></label>
        <label className="field span2"><span>Admin note (admins only)</span><textarea rows={2} value={f.adminNote} onChange={set("adminNote")} /></label>
        <label className="field span2"><span>Photo URL (optional)</span><input value={f.photo.startsWith("/avatars/") ? "" : f.photo} onChange={set("photo")} placeholder="https://…" /></label>
        <label className="check span2"><input type="checkbox" checked={f.available} onChange={set("available")} /> Available for bookings (if unticked, users won't see this patient)</label>
      </form>
    </Modal>
  );
}

function ImportModal({ rows, patients, onClose }) {
  const [busy, setBusy] = useState(false);
  // Match each row to an existing patient by HN first, then by name
  const plan = useMemo(() => {
    const byHN = new Map(), byName = new Map();
    patients.forEach((p) => { if (patientHN(p)) byHN.set(String(patientHN(p)), p.id); if (p.name) byName.set(normName(p.name), p.id); });
    return rows.map((row) => {
      const data = excelRowToPatient(row);
      const id = (data.hn && byHN.get(data.hn)) || (data.name && byName.get(normName(data.name))) || null;
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
        <div><b>{updates}</b><span>Update existing (matched by HN / name)</span></div>
        <div><b>{skipped}</b><span>Skipped (no name)</span></div>
      </div>
      <p className="muted small">Only columns in the file are updated. Other data (e.g. invite count, bookings) is kept.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th></th><th>Name</th><th>HN</th><th>Device</th><th>Disease</th><th>Level</th></tr></thead>
          <tbody>
            {plan.slice(0, 50).map((x, i) => (
              <tr key={i}>
                <td>{x.id ? <span className="badge badge-blue">Update</span> : <span className="badge badge-green">New</span>}</td>
                <td>{x.data.name}</td><td>{x.data.hn || "-"}</td><td>{x.data.deviceType || "-"}</td>
                <td>{x.data.disease || "-"}</td><td>{x.data.suitabilityLevel || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {plan.length > 50 && <p className="muted small">Showing the first 50 of {plan.length} rows</p>}
    </Modal>
  );
}
