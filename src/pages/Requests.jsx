import { useMemo, useState } from "react";
import {
  ClipboardList, Search, Calendar, Clock, MapPin, Users, Check, X, Ban, CircleCheck, Trash2, History, Download,
  RotateCcw, TriangleAlert, ChevronDown, Pencil, Undo2, Eye, Phone, Mail, Copy, Building2
} from "lucide-react";
import { changeRequestStatus, deleteRequest, findConflicts, adminEditRequest, REQUEST_STATUS } from "../data";
import { fmtDate, fmtTime, fmtDateTime, downloadExcel, todayStr, authErrorText, pField, patientAge, patientGender, patientCode, patientHN, patientPhoto, genderLabel } from "../utils";
import { deviceInfo } from "../patientFields";
import { STATUS_LABEL } from "../labels";
import { StatusBadge, Empty, PageHead, Avatar, Modal, toast, confirmDialog } from "../components/ui";

const TABS = ["All", ...REQUEST_STATUS];

export default function Requests({ me, isAdmin, requests, patients, users = [], cart, go }) {
  const [tab, setTab] = useState(isAdmin ? "Pending" : "All");
  const [q, setQ] = useState("");
  const [when, setWhen] = useState("all"); // all | upcoming | past

  const counts = useMemo(() => {
    const c = { All: requests.length };
    requests.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [requests]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const today = todayStr();
    return requests
      .filter((r) => tab === "All" || r.status === tab)
      .filter((r) => when === "all" || (when === "upcoming" ? r.dateNeeded >= today : r.dateNeeded < today))
      .filter((r) => !term || [r.courseName, r.courseCode, r.requesterName, r.requesterEmail, r.location, ...(r.patients || []).map((p) => p.name)]
        .some((v) => String(v || "").toLowerCase().includes(term)))
      // Pending: oldest first (first come first served). Others: newest date first.
      .sort((a, b) => tab === "Pending"
        ? (a.createdAt || "").localeCompare(b.createdAt || "")
        : (b.dateNeeded || "").localeCompare(a.dateNeeded || ""));
  }, [requests, tab, q, when]);

  const exportList = () => downloadExcel(list.map((r) => ({
    "Date": r.dateNeeded, "Time": fmtTime(r.timeStart, r.timeEnd), "Course": r.courseName, "Course code": r.courseCode || "",
    "Requester": r.requesterName || r.requesterEmail, "Department": r.requesterDepartment || "", "Location": r.location || "",
    "Patients": (r.patients || []).map((p) => p.name).join(", "),
    "Status": STATUS_LABEL[r.status] || r.status, "Admin note": r.adminNote || "", "Sent at": fmtDateTime(r.createdAt)
  })), "Requests", `requests_${todayStr()}.xlsx`);

  return (
    <>
      <PageHead title={isAdmin ? "Manage Requests" : "My Requests"}
        subtitle={isAdmin ? "Approve or reject requests and track patient model use" : "Track the status of your requests"}>
        {isAdmin && <button className="btn btn-ghost" onClick={exportList} disabled={!list.length}><Download size={17} /> Export Excel</button>}
        {!isAdmin && <button className="btn btn-primary" onClick={() => go("patients")}>+ New request</button>}
      </PageHead>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {t === "All" ? "All" : STATUS_LABEL[t]} <em>{counts[t] || 0}</em>
          </button>
        ))}
      </div>

      <div className="card filters">
        <div className="search">
          <Search size={18} />
          <input placeholder={isAdmin ? "Search course, requester, patient…" : "Search course, patient…"} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg sm">
          {[["all", "Any date"], ["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => (
            <button key={k} className={when === k ? "on" : ""} onClick={() => setWhen(k)}>{l}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={ClipboardList} title="No requests in this tab" />
      ) : (
        <div className="stack">
          {list.map((r) => <RequestCard key={r.id} r={r} me={me} isAdmin={isAdmin} patients={patients} users={users} cart={cart} go={go} />)}
        </div>
      )}
    </>
  );
}

function RequestCard({ r, me, isAdmin, patients, users, cart, go }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const live = (r.patients || []).map((s) => patients.find((p) => String(p.id) === String(s.id))).filter(Boolean);
  const conflicts = r.status === "Pending" ? findConflicts(live, r.dateNeeded, r.timeStart, r.timeEnd, r.id) : [];
  const isPast = r.dateNeeded < todayStr();

  const act = async (status, opts = {}) => {
    const res = await confirmDialog(opts);
    if (!res) return;
    setBusy(true);
    try {
      await changeRequestStatus(r, status, { note: res.note || "", actor: me, patients });
      toast(`Status changed to “${STATUS_LABEL[status]}”`);
    } catch (err) { toast(authErrorText(err), "error"); }
    setBusy(false);
  };

  const approve = () => act("Approved", {
    title: "Approve request", confirmText: "Approve", withNote: true, noteLabel: "Message to requester",
    message: conflicts.length ? `⚠ ${new Set(conflicts.map((c) => c.patient.id)).size} patient(s) already have a booking at this time. Approve anyway?` : `Approve “${r.courseName}” on ${fmtDate(r.dateNeeded)}?`
  });
  const reject = () => act("Rejected", { title: "Reject request", confirmText: "Reject", danger: true, withNote: "required", noteLabel: "Reason" });
  const complete = () => act("Completed", { title: "Mark as completed", confirmText: "Completed", withNote: true, noteLabel: "Post-session note" });
  const cancel = () => act("Cancelled", {
    title: "Cancel request", confirmText: "Cancel request", danger: true, withNote: isAdmin ? "required" : true, noteLabel: "Reason for cancelling"
  });
  const reopen = () => act("Pending", { title: "Reopen request", confirmText: "Move back to Pending", withNote: true, noteLabel: "Note to requester",
    message: `Move “${r.courseName}” back to Pending so it can be approved again?` });
  const remove = async () => {
    if (!(await confirmDialog({ title: "Delete request", danger: true, confirmText: "Delete permanently", message: "Permanently delete this request?" }))) return;
    try { await deleteRequest(r.id); toast("Request deleted"); } catch (err) { toast(authErrorText(err), "error"); }
  };
  const reorder = () => {
    cart.set([...new Set([...cart.ids, ...live.map((p) => String(p.id))])]);
    toast(`${live.length} patient(s) added to your list`, "info");
    go("cart");
  };

  return (
    <article className={`card req status-${r.status}`}>
      <div className="req-top">
        <div className="req-date">
          <b>{new Date(`${r.dateNeeded}T00:00:00`).getDate() || "-"}</b>
          <small>{r.dateNeeded ? new Date(`${r.dateNeeded}T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) : ""}</small>
        </div>
        <div className="grow">
          <div className="req-title">
            <h3><button className="req-open" onClick={() => setViewing(true)}>{r.courseName}{r.courseCode && <span className="muted"> · {r.courseCode}</span>}</button></h3>
            <StatusBadge status={r.status} />
          </div>
          <div className="req-meta muted">
            <span><Calendar size={14} /> {fmtDate(r.dateNeeded)}</span>
            <span><Clock size={14} /> {fmtTime(r.timeStart, r.timeEnd)}</span>
            {r.location && <span><MapPin size={14} /> {r.location}</span>}
            {r.studentCount ? <span><Users size={14} /> {r.studentCount} students</span> : null}
          </div>
          {isAdmin && (
            <div className="req-by">By <b>{r.requesterName || r.requesterEmail}</b>{r.requesterDepartment && ` · ${r.requesterDepartment}`}
              <span className="muted"> · sent {fmtDateTime(r.createdAt)}</span></div>
          )}
        </div>
      </div>

      <div className="chips">
        {(r.patients || []).map((p) => {
          const clash = conflicts.some((c) => String(c.patient.id) === String(p.id));
          return <span key={p.id} className={`chip ${clash ? "chip-warn" : ""}`} title={clash ? "Already booked at this time" : ""}>
            <Avatar name={p.name} photo={p.photo} size={22} /> {p.name}{p.deviceType && <small> · {p.deviceType}</small>}
            {clash && <TriangleAlert size={13} />}
          </span>;
        })}
      </div>

      {r.purpose && <p className="req-purpose"><b>Purpose:</b> {r.purpose}</p>}
      {r.notes && <p className="req-purpose muted"><b>Notes:</b> {r.notes}</p>}
      {r.adminNote && <div className="note-box"><b>Message from admin</b><p>{r.adminNote}</p></div>}
      {conflicts.length > 0 && isAdmin && <div className="alert alert-warn small"><TriangleAlert size={15} /> Some patients already have a booking at this time (highlighted in orange)</div>}

      <div className="req-actions">
        <button className="link small" onClick={() => setOpen(!open)}><History size={14} /> History <ChevronDown size={14} className={open ? "rot" : ""} /></button>
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={() => setViewing(true)}><Eye size={15} /> Details &amp; contacts</button>
        {isAdmin && r.status === "Pending" && <>
          <button className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={reject}><X size={15} /> Reject</button>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={approve}><Check size={15} /> Approve</button>
        </>}
        {isAdmin && r.status === "Approved" && <>
          <button className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={cancel}><Ban size={15} /> Cancel</button>
          <button className="btn btn-soft btn-sm" disabled={busy || !isPast && r.dateNeeded !== todayStr()} title={!isPast ? "Available from the session date" : ""} onClick={complete}><CircleCheck size={15} /> Completed</button>
        </>}
        {!isAdmin && r.status === "Pending" && <button className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={cancel}><Ban size={15} /> Cancel request</button>}
        {!isAdmin && r.status === "Approved" && !isPast && <small className="muted">Need to cancel? Contact an admin</small>}
        {!isAdmin && ["Rejected", "Cancelled", "Completed"].includes(r.status) && live.length > 0 &&
          <button className="btn btn-ghost btn-sm" onClick={reorder}><RotateCcw size={15} /> Request again</button>}
        {isAdmin && ["Rejected", "Cancelled"].includes(r.status) &&
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={reopen}><Undo2 size={15} /> Reopen</button>}
        {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>}
        {isAdmin && ["Rejected", "Cancelled"].includes(r.status) &&
          <button className="btn btn-ghost btn-sm" onClick={remove} aria-label="Delete"><Trash2 size={15} /></button>}
      </div>

      {viewing && <RequestDetail r={r} isAdmin={isAdmin} patients={patients} users={users} onClose={() => setViewing(false)}
        actions={isAdmin && r.status === "Pending" ? <>
          <button className="btn btn-danger-ghost" disabled={busy} onClick={() => { setViewing(false); reject(); }}><X size={16} /> Reject</button>
          <button className="btn btn-primary" disabled={busy} onClick={() => { setViewing(false); approve(); }}><Check size={16} /> Approve</button>
        </> : null}
        onEdit={isAdmin ? () => { setViewing(false); setEditing(true); } : null} />}
      {editing && <EditRequest r={r} me={me} patients={patients} onClose={() => setEditing(false)} />}
      {open && (
        <ol className="timeline">
          {(r.history || []).map((h, i) => (
            <li key={i}><StatusBadge status={h.status} /> <span>{h.by}</span> <small className="muted">{fmtDateTime(h.at)}</small>
              {h.note && <div className="muted small">“{h.note}”</div>}</li>
          ))}
        </ol>
      )}
    </article>
  );
}

const EDIT_FIELDS = ["courseName", "courseCode", "dateNeeded", "timeStart", "timeEnd", "location", "purpose", "notes", "adminNote"];

// Admin only: change the details of any request (bookings move with the new date / time)
function EditRequest({ r, me, patients, onClose }) {
  const [f, setF] = useState(() => Object.fromEntries(EDIT_FIELDS.map((k) => [k, r[k] || ""])));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const live = (r.patients || []).map((s) => patients.find((p) => String(p.id) === String(s.id))).filter(Boolean);
  const clashes = findConflicts(live, f.dateNeeded, f.timeStart, f.timeEnd, r.id);

  const save = async (e) => {
    e.preventDefault();
    if (!f.courseName.trim() || !f.dateNeeded) return toast("Course name and date are required", "error");
    if (f.timeStart && f.timeEnd && f.timeEnd <= f.timeStart) return toast("End time must be after start time", "error");
    setBusy(true);
    try {
      const changes = Object.fromEntries(EDIT_FIELDS.map((k) => [k, String(f[k] || "").trim()]));
      const did = await adminEditRequest(r, changes, { actor: me, patients });
      toast(did ? "Request updated — the requester has been notified" : "No changes to save", did ? "success" : "info");
      onClose();
    } catch (err) { toast(authErrorText(err), "error"); setBusy(false); }
  };

  return (
    <Modal title="Edit request (admin)" onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" form="reqform" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </>}>
      <form id="reqform" onSubmit={save} className="form-grid">
        <label className="field span2"><span>Course / activity name *</span><input value={f.courseName} onChange={set("courseName")} /></label>
        <label className="field span2"><span>Course code</span><input value={f.courseCode} onChange={set("courseCode")} /></label>
        <label className="field span2"><span>Date needed *</span><input type="date" value={f.dateNeeded} onChange={set("dateNeeded")} /></label>
        <label className="field"><span>Start time</span><input type="time" value={f.timeStart} onChange={set("timeStart")} /></label>
        <label className="field"><span>End time</span><input type="time" value={f.timeEnd} onChange={set("timeEnd")} /></label>
        <label className="field span2"><span>Location</span><input value={f.location} onChange={set("location")} /></label>
        <label className="field span2"><span>Purpose / activities with the patient</span><textarea rows={2} value={f.purpose} onChange={set("purpose")} /></label>
        <label className="field span2"><span>Requester's note</span><textarea rows={2} value={f.notes} onChange={set("notes")} /></label>
        <label className="field span2"><span>Message from admin (shown to the requester)</span><textarea rows={2} value={f.adminNote} onChange={set("adminNote")} /></label>
        {clashes.length > 0 && <div className="alert alert-warn small span2"><TriangleAlert size={15} /> {new Set(clashes.map((c) => c.patient.id)).size} patient(s) already have another booking at this new time.</div>}
        {(r.status === "Approved" || r.status === "Completed") && <p className="muted small span2">This request is already booked. Changing the date or time moves the patients' bookings too.</p>}
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Request summary with every contact number (opened from a request)   */
/* ------------------------------------------------------------------ */
const telLink = (n) => <a href={`tel:${String(n).replace(/[^0-9+]/g, "")}`}>{n}</a>;

export function RequestDetail({ r, isAdmin, patients, users = [], onClose, actions, onEdit }) {
  const [copied, setCopied] = useState(false);
  const requester = users.find((u) => String(u.id) === String(r.requesterId) || String(u.uid) === String(r.requesterId));
  const reqPhone = requester?.phone || "";
  const reqEmail = r.requesterEmail || requester?.email || "";
  const reqName = r.requesterName || requester?.name || reqEmail;
  const dept = r.requesterDepartment || requester?.department || "";

  const live = (r.patients || []).map((s) => patients.find((p) => String(p.id) === String(s.id)));
  const rows = (r.patients || []).map((s, i) => {
    const p = live[i];
    const age = p ? patientAge(p) : "";
    return {
      id: s.id, name: p?.name || s.name, photo: p ? patientPhoto(p) : s.photo,
      code: p ? patientCode(p) : s.code || "", hn: p ? patientHN(p) : s.hn || "",
      device: p?.deviceType || s.deviceType || "", gender: p ? genderLabel(patientGender(p)) : "",
      age, province: p ? pField(p, "province") : "",
      phone: p ? pField(p, "phone") : s.phone || "", phone2: p ? pField(p, "phone2") : "",
      limitations: p?.limitations || "", removed: !p
    };
  });
  const byDevice = rows.reduce((c, x) => { if (x.device) c[x.device] = (c[x.device] || 0) + 1; return c; }, {});
  const others = findConflicts(live.filter(Boolean), r.dateNeeded, r.timeStart, r.timeEnd, r.id);
  const clashIds = new Set(others.map((c) => String(c.patient.id)));

  const summaryText = [
    `Patient model request: ${r.courseName}${r.courseCode ? ` (${r.courseCode})` : ""}`,
    `Status: ${STATUS_LABEL[r.status] || r.status}`,
    `Date: ${fmtDate(r.dateNeeded)} · ${fmtTime(r.timeStart, r.timeEnd)}`,
    r.location && `Location: ${r.location}`,
    `Requester: ${reqName}${dept ? ` (${dept})` : ""}${reqPhone ? ` · Tel ${reqPhone}` : ""}${reqEmail ? ` · ${reqEmail}` : ""}`,
    r.purpose && `Purpose: ${r.purpose}`,
    `Patients (${rows.length}):`,
    ...rows.map((x, i) => `${i + 1}. ${x.name}${x.device ? ` · ${x.device}` : ""}${x.code ? ` #${x.code}` : ""}${x.phone ? ` · Tel ${x.phone}` : ""}${x.phone2 ? ` / ${x.phone2}` : ""}`),
    r.adminNote && `Admin note: ${r.adminNote}`
  ].filter(Boolean).join("\n");

  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText); setCopied(true); toast("Summary copied — paste it into LINE or email", "info"); setTimeout(() => setCopied(false), 2500); }
    catch { toast("Could not copy automatically. Select the text in the summary box instead.", "error"); setCopied("manual"); }
  };

  return (
    <Modal title="Request details" onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-ghost" onClick={copy}><Copy size={16} /> {copied === true ? "Copied" : "Copy summary"}</button>
        {onEdit && <button className="btn btn-ghost" onClick={onEdit}><Pencil size={16} /> Edit</button>}
        <div className="spacer" />
        {actions || <button className="btn btn-primary" onClick={onClose}>Close</button>}
      </>}>
      <div className="rd-head">
        <div>
          <h2>{r.courseName}{r.courseCode && <span className="muted"> · {r.courseCode}</span>}</h2>
          <div className="req-meta muted">
            <span><Calendar size={14} /> {fmtDate(r.dateNeeded)}</span>
            <span><Clock size={14} /> {fmtTime(r.timeStart, r.timeEnd)}</span>
            {r.location && <span><MapPin size={14} /> {r.location}</span>}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="rd-stats">
        <div><b>{rows.length}</b><span>patient models</span></div>
        <div><b>{Object.entries(byDevice).map(([d, n]) => `${d}${n > 1 ? ` ×${n}` : ""}`).join(", ") || "–"}</b><span>device types</span></div>
        <div><b>{rows.filter((x) => x.phone || x.phone2).length}/{rows.length}</b><span>with a phone number</span></div>
        <div><b className={clashIds.size ? "warn-text" : ""}>{clashIds.size}</b><span>with another booking at this time</span></div>
      </div>

      <h4 className="sec-title">Requester</h4>
      <div className="rd-contact">
        <Avatar name={reqName} size={42} />
        <div className="grow">
          <b>{reqName}</b>
          <small className="muted">{dept && <><Building2 size={13} /> {dept} · </>}sent {fmtDateTime(r.createdAt)}</small>
        </div>
        <div className="rd-lines">
          {reqPhone ? <span><Phone size={14} /> {telLink(reqPhone)}</span> : <span className="muted"><Phone size={14} /> {isAdmin ? "No phone in profile" : "–"}</span>}
          {reqEmail && <span><Mail size={14} /> <span className="sel">{reqEmail}</span></span>}
        </div>
      </div>

      {(r.purpose || r.notes || r.adminNote) && <>
        <h4 className="sec-title">Session</h4>
        <div className="kv-grid">
          <div className="kv"><span>Purpose / activities</span><b>{r.purpose || "–"}</b></div>
          <div className="kv"><span>Requester's note</span><b>{r.notes || "–"}</b></div>
          {r.adminNote && <div className="kv"><span>Message from admin</span><b>{r.adminNote}</b></div>}
        </div>
      </>}

      <h4 className="sec-title">Patient models and contact numbers</h4>
      <div className="table-wrap rd-table">
        <table className="table">
          <thead><tr><th>#</th><th>Patient</th><th>Device</th><th>Gender / age</th><th>Phone</th><th>Phone 2</th><th>Province</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={x.id} className={clashIds.has(String(x.id)) ? "clash" : ""}>
                <td className="muted">{i + 1}</td>
                <td><div className="user-cell"><Avatar name={x.name} photo={x.photo} size={30} />
                  <div><b>{x.name}</b><small className="muted">{[x.code && `#${x.code}`, x.hn && `HN ${x.hn}`].filter(Boolean).join(" · ")}
                    {x.removed && " · removed from the system"}</small>
                    {clashIds.has(String(x.id)) && <small className="warn-text"><TriangleAlert size={12} /> Another booking at this time</small>}
                    {x.limitations && <small className="muted">Precautions: {x.limitations}</small>}</div></div></td>
                <td title={deviceInfo(x.device)?.name}>{x.device || "–"}</td>
                <td>{[x.gender, x.age && `${x.age} y`].filter(Boolean).join(" · ") || "–"}</td>
                <td className="nowrap">{x.phone ? <><Phone size={13} /> {telLink(x.phone)}</> : <span className="muted">–</span>}</td>
                <td className="nowrap">{x.phone2 ? telLink(x.phone2) : <span className="muted">–</span>}</td>
                <td>{x.province || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="sec-title">Summary to send</h4>
      <textarea className="rd-summary" readOnly rows={Math.min(14, summaryText.split("\n").length + 1)} value={summaryText}
        onFocus={(e) => e.target.select()} aria-label="Request summary text" />
      <p className="muted small">{copied === "manual" ? "Click the box, press Ctrl+C to copy." : "Use “Copy summary” to paste the request and all phone numbers into LINE or email."}</p>

      {(r.history || []).length > 0 && <>
        <h4 className="sec-title">History</h4>
        <ol className="timeline">
          {r.history.map((h, i) => (
            <li key={i}><StatusBadge status={h.status} /> <span>{h.by}</span> <small className="muted">{fmtDateTime(h.at)}</small>
              {h.note && <div className="muted small">“{h.note}”</div>}</li>
          ))}
        </ol>
      </>}
    </Modal>
  );
}
