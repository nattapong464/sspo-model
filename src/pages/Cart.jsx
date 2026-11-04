import { useMemo, useState } from "react";
import { ShoppingCart, Trash2, Send, TriangleAlert, Contact } from "lucide-react";
import { createRequest, findConflicts } from "../data";
import { patientSnapshot, patientHN, patientPhoto, todayStr, fmtDate, fmtTime, authErrorText } from "../utils";
import { Avatar, Empty, PageHead, toast } from "../components/ui";

const EMPTY_FORM = {
  courseName: "", courseCode: "", dateNeeded: "", timeStart: "09:00", timeEnd: "12:00",
  location: "", purpose: "", notes: ""
};
const DRAFT_KEY = "sspo-request-draft";
const loadDraft = () => { try { return { ...EMPTY_FORM, ...JSON.parse(localStorage.getItem(DRAFT_KEY)) }; } catch { return EMPTY_FORM; } };

export default function Cart({ me, patients, cart, go }) {
  const [f, setF] = useState(loadDraft);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const set = (k) => (e) => {
    const next = { ...f, [k]: e.target.value };
    setF(next);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const selected = useMemo(() => cart.ids.map((id) => patients.find((p) => String(p.id) === id)).filter(Boolean), [cart.ids, patients]);
  const missing = cart.ids.length - selected.length;
  const conflicts = f.dateNeeded ? findConflicts(selected, f.dateNeeded, f.timeStart, f.timeEnd) : [];

  const errors = {
    courseName: !f.courseName.trim() && "Please enter the course / activity name",
    dateNeeded: !f.dateNeeded ? "Please choose a date" : f.dateNeeded < todayStr() && "Date cannot be in the past",
    timeEnd: f.timeStart && f.timeEnd && f.timeEnd <= f.timeStart && "End time must be after start time"
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    if (!selected.length) return toast("No patients selected yet", "error");
    if (hasErrors) return toast("Please check the highlighted fields", "error");
    setBusy(true);
    try {
      await createRequest({
        courseName: f.courseName.trim(), courseCode: f.courseCode.trim(), dateNeeded: f.dateNeeded,
        timeStart: f.timeStart, timeEnd: f.timeEnd, location: f.location.trim(),
        purpose: f.purpose.trim(), notes: f.notes.trim(),
        requesterName: me.name, requesterDepartment: me.department || "", requesterPhone: me.phone || "",
        patients: selected.map(patientSnapshot)
      }, me);
      cart.clear();
      setF(EMPTY_FORM);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      toast("Request sent. Waiting for admin approval.");
      go("requests");
    } catch (err) {
      toast(authErrorText(err), "error");
      setBusy(false);
    }
  };

  const err = (k) => tried && errors[k] ? <small className="field-err">{errors[k]}</small> : null;

  return (
    <>
      <PageHead title="Request Cart" subtitle="Check the selected patients, fill in the details and send your request" />
      {cart.ids.length === 0 ? (
        <Empty icon={ShoppingCart} title="No patients selected yet">
          <p>Go to the Patient Directory and click “Add to cart”</p>
          <button className="btn btn-primary" onClick={() => go("patients")}><Contact size={17} /> Browse patients</button>
        </Empty>
      ) : (
        <div className="two-col">
          <section className="card">
            <div className="card-head">
              <h3>Selected patients ({selected.length})</h3>
              <button className="link small" onClick={() => go("patients")}>+ Add more</button>
            </div>
            {missing > 0 && <div className="alert alert-warn small">{missing} selected patient(s) have been removed from the system.
              <button className="link small" onClick={() => cart.set(selected.map((p) => p.id))}>Remove them</button></div>}
            <ul className="cart-list">
              {selected.map((p) => {
                const clash = conflicts.filter((c) => c.patient.id === p.id);
                return (
                  <li key={p.id} className={clash.length ? "clash" : ""}>
                    <Avatar name={p.name} photo={patientPhoto(p)} size={40} />
                    <div className="grow">
                      <b>{p.name}</b>
                      <small className="muted">{[p.deviceType, patientHN(p) && `HN ${patientHN(p)}`].filter(Boolean).join(" · ")}</small>
                      {clash.map((c) => (
                        <small key={c.slot.requestId} className="warn-text"><TriangleAlert size={13} /> Already booked {fmtDate(c.slot.date)} {fmtTime(c.slot.timeStart, c.slot.timeEnd)}</small>
                      ))}
                    </div>
                    <button className="icon-btn" aria-label="Remove" onClick={() => cart.toggle(p.id)}><Trash2 size={17} /></button>
                  </li>
                );
              })}
            </ul>
          </section>

          <form className="card stack" onSubmit={submit}>
            <h3>Request details</h3>
            <div className="form-grid">
              <label className="field span2"><span>Course / activity name *</span>
                <input value={f.courseName} onChange={set("courseName")} placeholder="e.g. Lower Limb Prosthetics Lab" />{err("courseName")}</label>
              <label className="field span2"><span>Course code</span><input value={f.courseCode} onChange={set("courseCode")} /></label>
              <label className="field span2"><span>Date needed *</span>
                <input type="date" min={todayStr()} value={f.dateNeeded} onChange={set("dateNeeded")} />{err("dateNeeded")}</label>
              <label className="field"><span>Start time</span><input type="time" value={f.timeStart} onChange={set("timeStart")} /></label>
              <label className="field"><span>End time</span><input type="time" value={f.timeEnd} onChange={set("timeEnd")} />{err("timeEnd")}</label>
              <label className="field span2"><span>Location</span><input value={f.location} onChange={set("location")} placeholder="e.g. Lab room 301" /></label>
              <label className="field span2"><span>Purpose / activities with the patient</span>
                <textarea rows={3} value={f.purpose} onChange={set("purpose")} placeholder="e.g. gait assessment, casting, fitting practice" /></label>
              <label className="field span2"><span>Note to admin</span><textarea rows={2} value={f.notes} onChange={set("notes")} /></label>
            </div>
            {conflicts.length > 0 && (
              <div className="alert alert-warn"><TriangleAlert size={17} /> {new Set(conflicts.map((c) => c.patient.id)).size} patient(s) already have a booking at this time. You can still send the request, but the admin may not approve it.</div>
            )}
            <button className="btn btn-primary btn-lg" disabled={busy}><Send size={18} /> {busy ? "Sending…" : `Send request (${selected.length} patient${selected.length > 1 ? "s" : ""})`}</button>
            <p className="muted small center">Your draft is saved in this browser, even if you close the page.</p>
          </form>
        </div>
      )}
    </>
  );
}
