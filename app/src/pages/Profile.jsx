import { useState } from "react";
import { Save, KeyRound } from "lucide-react";
import { updateMyProfile, resetPassword } from "../data";
import { fmtDate, authErrorText } from "../utils";
import { ROLE_LABEL, ACCOUNT_STATUS_LABEL } from "../labels";
import { Avatar, PageHead, toast } from "../components/ui";

export default function Profile({ me, requests }) {
  const [f, setF] = useState({ name: me.name || "", department: me.department || "", phone: me.phone || "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const mine = requests.filter((r) => r.requesterId === me.uid);

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast("Please enter a name", "error");
    setBusy(true);
    try {
      await updateMyProfile(me.uid, { name: f.name.trim(), department: f.department.trim(), phone: f.phone.trim() });
      toast("Profile saved");
    } catch (err) { toast(authErrorText(err), "error"); }
    setBusy(false);
  };

  const sendReset = async () => {
    try { await resetPassword(me.email); toast(`Password reset link sent to ${me.email}`, "info"); }
    catch (err) { toast(authErrorText(err), "error"); }
  };

  return (
    <>
      <PageHead title="My Profile" />
      <div className="two-col">
        <form className="card stack" onSubmit={save}>
          <h3>Personal details</h3>
          <label className="field"><span>Full name *</span><input value={f.name} onChange={set("name")} /></label>
          <label className="field"><span>Department / Programme</span><input value={f.department} onChange={set("department")} /></label>
          <label className="field"><span>Contact phone</span><input value={f.phone} onChange={set("phone")} inputMode="tel" /></label>
          <label className="field"><span>Email</span><input value={me.email} disabled /></label>
          <button className="btn btn-primary" disabled={busy}><Save size={17} /> Save</button>
        </form>
        <section className="card stack">
          <div className="detail-head">
            <Avatar name={me.name} size={64} />
            <div><h2>{me.name}</h2><div className="muted">{me.email}</div></div>
          </div>
          <div className="kv-grid one">
            <div className="kv"><span>Role</span><b>{ROLE_LABEL[me.role]}</b></div>
            <div className="kv"><span>Account status</span><b>{ACCOUNT_STATUS_LABEL[me.status]}</b></div>
            <div className="kv"><span>Joined</span><b>{fmtDate(me.createdAt)}</b></div>
            <div className="kv"><span>Requests sent</span><b>{mine.length}</b></div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={sendReset}><KeyRound size={17} /> Change password (email link)</button>
        </section>
      </div>
    </>
  );
}
