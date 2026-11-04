import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import { DatabaseBackup, Contact, Hourglass, CalendarCheck, UserCog, ClipboardList, CircleCheck, ShoppingCart, Calendar, Clock, MapPin } from "lucide-react";
import { REQUEST_STATUS, ACCOUNT_STATUS } from "../data";
import { STATUS_STYLE, COLORS, todayStr, addDays, fmtTime, downloadWorkbook } from "../utils";
import { STATUS_LABEL } from "../labels";
import { StatCard, StatusBadge, Empty, PageHead } from "../components/ui";

export default function Dashboard(props) {
  return props.isAdmin ? <AdminDashboard {...props} /> : <UserDashboard {...props} />;
}

function Upcoming({ list, go, showRequester }) {
  if (!list.length) return <Empty icon={Calendar} title="No upcoming bookings" />;
  return (
    <ul className="upcoming">
      {list.map((r) => (
        <li key={r.id} onClick={() => go("requests")}>
          <div className="req-date sm">
            <b>{new Date(`${r.dateNeeded}T00:00:00`).getDate()}</b>
            <small>{new Date(`${r.dateNeeded}T00:00:00`).toLocaleDateString("en-GB", { month: "short" })}</small>
          </div>
          <div className="grow">
            <b>{r.courseName}</b>
            <small className="muted">
              <Clock size={12} /> {fmtTime(r.timeStart, r.timeEnd)}
              {r.location && <> · <MapPin size={12} /> {r.location}</>}
              {showRequester && <> · {r.requesterName}</>}
            </small>
            <small className="muted">Patients: {(r.patients || []).map((p) => p.name).join(", ")}</small>
          </div>
          <StatusBadge status={r.status} />
        </li>
      ))}
    </ul>
  );
}

function UserDashboard({ me, requests, patients, cart, go }) {
  const today = todayStr();
  const count = (s) => requests.filter((r) => r.status === s).length;
  const upcoming = requests
    .filter((r) => r.dateNeeded >= today && (r.status === "Approved" || r.status === "Pending"))
    .sort((a, b) => (a.dateNeeded + a.timeStart).localeCompare(b.dateNeeded + b.timeStart))
    .slice(0, 6);

  return (
    <>
      <PageHead title={`Hello, ${me.name}`} subtitle="Request patient models in 3 steps" />
      <div className="steps">
        <button className="step" onClick={() => go("patients")}><em>1</em><Contact size={22} /><b>Choose patients</b><small>Search by device type or free date</small></button>
        <button className="step" onClick={() => go("cart")}><em>2</em><ShoppingCart size={22} /><b>Fill in details</b><small>{cart.ids.length ? `${cart.ids.length} selected` : "Date, time, course"}</small></button>
        <button className="step" onClick={() => go("requests")}><em>3</em><ClipboardList size={22} /><b>Track status</b><small>Get notified when approved</small></button>
      </div>
      <div className="stats">
        <StatCard icon={Hourglass} tone="orange" label="Pending" value={count("Pending")} onClick={() => go("requests")} />
        <StatCard icon={CalendarCheck} tone="green" label="Approved" value={count("Approved")} onClick={() => go("requests")} />
        <StatCard icon={CircleCheck} tone="blue" label="Completed" value={count("Completed")} onClick={() => go("requests")} />
        <StatCard icon={Contact} tone="teal" label="Available patients" value={patients.filter((p) => p.available !== false).length} onClick={() => go("patients")} />
      </div>
      <section className="card">
        <div className="card-head"><h3>My upcoming bookings</h3></div>
        <Upcoming list={upcoming} go={go} />
      </section>
    </>
  );
}

function AdminDashboard({ requests, patients, users, go }) {
  const today = todayStr();
  const monthKey = today.slice(0, 7);

  const byStatus = REQUEST_STATUS.map((s) => ({ name: STATUS_LABEL[s], value: requests.filter((r) => r.status === s).length, color: STATUS_STYLE[s].color }))
    .filter((x) => x.value);

  const byMonth = useMemo(() => {
    const months = [];
    const d = new Date(); d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`, name: m.toLocaleDateString("en-GB", { month: "short" }) });
    }
    return months.map((m) => ({
      name: m.name,
      "Approved/Completed": requests.filter((r) => r.dateNeeded?.startsWith(m.key) && ["Approved", "Completed"].includes(r.status)).length,
      "Other": requests.filter((r) => r.dateNeeded?.startsWith(m.key) && !["Approved", "Completed"].includes(r.status)).length
    }));
  }, [requests]);

  const byDevice = useMemo(() => {
    const c = {};
    patients.forEach((p) => { const k = p.deviceType || "Not specified"; c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [patients]);

  const topPatients = [...patients].sort((a, b) => (b.inviteCount || 0) - (a.inviteCount || 0)).filter((p) => p.inviteCount > 0).slice(0, 6);
  const upcoming = requests
    .filter((r) => r.status === "Approved" && r.dateNeeded >= today && r.dateNeeded <= addDays(today, 14))
    .sort((a, b) => (a.dateNeeded + a.timeStart).localeCompare(b.dateNeeded + b.timeStart));

  const pendingReq = requests.filter((r) => r.status === "Pending").length;
  const pendingUsers = users.filter((u) => u.status === ACCOUNT_STATUS.PENDING).length;

  return (
    <>
      <PageHead title="System overview" subtitle="Admin view">
        <button className="btn btn-ghost" title="All patients, requests and users in one Excel file"
          onClick={() => downloadWorkbook({ Patients: patients, Requests: requests, Users: users }, `sspo_backup_${today}.xlsx`)}>
          <DatabaseBackup size={17} /> Download full backup
        </button>
      </PageHead>
      {(pendingReq > 0 || pendingUsers > 0) && (
        <div className="todo">
          <b>Waiting for you:</b>
          {pendingReq > 0 && <button className="btn btn-soft btn-sm" onClick={() => go("requests")}>{pendingReq} pending request(s) →</button>}
          {pendingUsers > 0 && <button className="btn btn-soft btn-sm" onClick={() => go("users")}>{pendingUsers} account(s) awaiting approval →</button>}
        </div>
      )}
      <div className="stats">
        <StatCard icon={Hourglass} tone="orange" label="Pending requests" value={pendingReq} onClick={() => go("requests")} />
        <StatCard icon={ClipboardList} tone="blue" label="Requests this month" value={requests.filter((r) => r.dateNeeded?.startsWith(monthKey)).length} onClick={() => go("requests")} />
        <StatCard icon={Contact} tone="teal" label="Patient models" value={patients.length} onClick={() => go("patients")} />
        <StatCard icon={UserCog} tone="purple" label="Active users" value={users.filter((u) => u.status === "active").length} onClick={() => go("users")} />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head"><h3>Approved bookings (next 14 days)</h3></div>
          <Upcoming list={upcoming} go={go} showRequester />
        </section>
        <section className="card">
          <div className="card-head"><h3>All requests by status</h3></div>
          {byStatus.length === 0 ? <Empty icon={ClipboardList} title="No requests yet" /> : (
            <div className="pie-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {byStatus.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="legend">{byStatus.map((s) => <li key={s.name}><i style={{ background: s.color }} />{s.name}<b>{s.value}</b></li>)}</ul>
            </div>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h3>Requests per month (by date needed)</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: "var(--hover)" }} />
              <Bar dataKey="Approved/Completed" stackId="a" fill={COLORS[0]} />
              <Bar dataKey="Other" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="card">
          <div className="card-head"><h3>Patients by device type</h3></div>
          {byDevice.length === 0 ? <Empty icon={Contact} title="No data yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDevice} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="name" width={70} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--hover)" }} />
                <Bar dataKey="value" name="Count" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
        <section className="card">
          <div className="card-head"><h3>Most-invited patients</h3></div>
          {topPatients.length === 0 ? <p className="muted small">No invitations yet</p> : (
            <ol className="rank">{topPatients.map((p) => <li key={p.id}><span>{p.name} <small className="muted">{p.deviceType}</small></span><b>{p.inviteCount}×</b></li>)}</ol>
          )}
          <p className="muted small">Use this to spread invitations so the same patients are not invited too often.</p>
        </section>
      </div>
    </>
  );
}
