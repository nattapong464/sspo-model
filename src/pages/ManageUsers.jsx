import { useMemo, useState } from "react";
import { Search, UserCheck, UserX, Shield, ShieldOff, Trash2, RotateCcw, UserCog } from "lucide-react";
import { adminUpdateUser, adminDeleteUserProfile, ROLE, ACCOUNT_STATUS } from "../data";
import { fmtDate, downloadExcel, todayStr, authErrorText } from "../utils";
import { ROLE_LABEL, ACCOUNT_STATUS_LABEL } from "../labels";
import { Avatar, Empty, PageHead, toast, confirmDialog } from "../components/ui";
import { Download } from "lucide-react";

const TABS = [
  { key: ACCOUNT_STATUS.PENDING, label: "Pending" },
  { key: ACCOUNT_STATUS.ACTIVE, label: "Active" },
  { key: ACCOUNT_STATUS.DISABLED, label: "Disabled" },
  { key: "all", label: "All" }
];

export default function ManageUsers({ me, users, requests }) {
  const pendingCount = users.filter((u) => u.status === ACCOUNT_STATUS.PENDING).length;
  const [tab, setTab] = useState(pendingCount ? ACCOUNT_STATUS.PENDING : ACCOUNT_STATUS.ACTIVE);
  const [q, setQ] = useState("");

  const reqCount = useMemo(() => {
    const c = {};
    requests.forEach((r) => { c[r.requesterId] = (c[r.requesterId] || 0) + 1; });
    return c;
  }, [requests]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => tab === "all" || u.status === tab)
      .filter((u) => !term || [u.name, u.email, u.department].some((v) => String(v || "").toLowerCase().includes(term)))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [users, tab, q]);

  const update = async (u, data, msg, okText) => {
    try { await adminUpdateUser(u.id, data, msg); toast(okText); }
    catch (err) { toast(authErrorText(err), "error"); }
  };

  const approve = (u) => update(u, { status: ACCOUNT_STATUS.ACTIVE }, "Your account has been approved. You can start using the app now.", `${u.name} approved`);
  const disable = async (u) => {
    if (!(await confirmDialog({ title: "Disable account", danger: true, confirmText: "Disable", message: `${u.name} will not be able to sign in until the account is re-enabled.` }))) return;
    update(u, { status: ACCOUNT_STATUS.DISABLED }, null, "Account disabled");
  };
  const enable = (u) => update(u, { status: ACCOUNT_STATUS.ACTIVE }, "Your account has been re-enabled.", "Account re-enabled");
  const toggleRole = async (u) => {
    const toAdmin = u.role !== ROLE.ADMIN;
    const ok = await confirmDialog({
      title: toAdmin ? "Make admin" : "Change to regular user", confirmText: "Confirm", danger: !toAdmin,
      message: toAdmin
        ? `${u.name} will be able to approve requests, edit patient data and manage all users.`
        : `${u.name} will only be able to send and view their own requests.`
    });
    if (!ok) return;
    update(u, { role: toAdmin ? ROLE.ADMIN : ROLE.USER },
      toAdmin ? "You have been given admin rights." : "Your role has been changed to regular user.", "Role updated");
  };
  const remove = async (u) => {
    const ok = await confirmDialog({
      title: "Delete user profile", danger: true, confirmText: "Delete",
      message: `Delete ${u.name}'s profile? They will no longer be able to use the app. Past requests are kept. To remove the login completely, also delete it in Firebase Console > Authentication.`
    });
    if (!ok) return;
    try { await adminDeleteUserProfile(u.id); toast("Profile deleted"); } catch (err) { toast(authErrorText(err), "error"); }
  };

  const exportUsers = () => downloadExcel(users.map((u) => ({
    "Name": u.name, "Email": u.email, "Department": u.department || "", "Phone": u.phone || "",
    "Role": ROLE_LABEL[u.role] || u.role, "Status": ACCOUNT_STATUS_LABEL[u.status] || u.status,
    "Requests": reqCount[u.id] || 0, "Joined": fmtDate(u.createdAt)
  })), "Users", `users_${todayStr()}.xlsx`);

  return (
    <>
      <PageHead title="Manage Users" subtitle="Approve new accounts, set Admin / User roles and disable accounts">
        <button className="btn btn-ghost" onClick={exportUsers}><Download size={17} /> Export Excel</button>
      </PageHead>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label} <em>{t.key === "all" ? users.length : users.filter((u) => u.status === t.key).length}</em>
          </button>
        ))}
      </div>

      <div className="card filters">
        <div className="search"><Search size={18} />
          <input placeholder="Search name, email, department…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>

      {list.length === 0 ? <Empty icon={UserCog} title="No users in this tab" /> : (
        <div className="card table-wrap">
          <table className="table users-table">
            <thead><tr><th>User</th><th>Department</th><th>Role</th><th>Status</th><th>Requests</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {list.map((u) => {
                const self = u.id === me.uid;
                return (
                  <tr key={u.id}>
                    <td data-label="User"><div className="user-cell"><Avatar name={u.name} size={34} />
                      <div><b>{u.name}{self && <span className="muted"> (you)</span>}</b><small className="muted">{u.email}</small>
                        {u.phone && <small className="muted">{u.phone}</small>}</div></div></td>
                    <td data-label="Department">{u.department || "-"}</td>
                    <td data-label="Role"><span className={`badge ${u.role === ROLE.ADMIN ? "badge-purple" : "badge-gray"}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                    <td data-label="Status"><span className={`badge ${u.status === "active" ? "badge-green" : u.status === "pending" ? "badge-orange" : "badge-red"}`}>{ACCOUNT_STATUS_LABEL[u.status] || u.status}</span></td>
                    <td data-label="Requests">{reqCount[u.id] || 0}</td>
                    <td data-label="Joined">{fmtDate(u.createdAt)}</td>
                    <td className="row-actions">
                      {u.status === ACCOUNT_STATUS.PENDING && <>
                        <button className="btn btn-primary btn-sm" onClick={() => approve(u)}><UserCheck size={15} /> Approve</button>
                        <button className="btn btn-danger-ghost btn-sm" onClick={() => disable(u)}><UserX size={15} /> Decline</button>
                      </>}
                      {u.status === ACCOUNT_STATUS.ACTIVE && !self && <>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleRole(u)}>
                          {u.role === ROLE.ADMIN ? <><ShieldOff size={15} /> Remove admin</> : <><Shield size={15} /> Make admin</>}
                        </button>
                        <button className="btn btn-danger-ghost btn-sm" onClick={() => disable(u)}><UserX size={15} /> Disable</button>
                      </>}
                      {u.status === ACCOUNT_STATUS.DISABLED && <>
                        <button className="btn btn-ghost btn-sm" onClick={() => enable(u)}><RotateCcw size={15} /> Re-enable</button>
                        <button className="btn btn-danger-ghost btn-sm" onClick={() => remove(u)} aria-label="Delete"><Trash2 size={15} /></button>
                      </>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
