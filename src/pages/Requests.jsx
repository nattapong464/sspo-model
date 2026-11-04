import { useMemo, useState } from "react";
import {
  ClipboardList, Search, Calendar, Clock, MapPin, Users, Check, X, Ban, CircleCheck, Trash2, History, Download,
  RotateCcw, TriangleAlert, ChevronDown, Pencil, Undo2
} from "lucide-react";
import { changeRequestStatus, deleteRequest, findConflicts, adminEditRequest, REQUEST_STATUS } from "../data";
import { fmtDate, fmtTime, fmtDateTime, downloadExcel, todayStr, authErrorText } from "../utils";
import { STATUS_LABEL } from "../labels";
import { StatusBadge, Empty, PageHead, Avatar, Modal, toast, confirmDialog } from "../components/ui";

const TABS = ["All", ...REQUEST_STATUS];

export default function Requests({ me, isAdmin, requests, patients, cart, go }) {
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
          {list.map((r) => <RequestCard key={r.id} r={r} me={me} isAdmin={isAdmin} patients={patients} cart={cart} go={go} />)}
        </div>
      )}
    </>
  );
}

function RequestCard({ r, me, isAdmin, patients, cart, go }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
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
            <h3>{r.courseName}{r.courseCode && <span className="muted"> · {r.courseCode}</span>}</h3>
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
