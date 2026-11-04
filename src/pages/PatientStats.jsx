// Patient model (ครูต้นแบบ) dashboard: how many patients we have, by device, gender, age group and province.
import { useMemo, useState } from "react";
import { Contact, CircleCheck, Footprints, Bone, PersonStanding, Download } from "lucide-react";
import { DEVICE_TYPES, deviceGroup, deviceInfo, GROUP_LABEL } from "../patientFields";
import { AGE_BANDS, ageBand, genderKey, patientGender, patientAge, pField, downloadWorkbook, todayStr } from "../utils";
import { StatCard, PageHead, Empty } from "../components/ui";

const GROUPS = ["prosthesis", "orthosis", "spinal", ""];
const GROUP_TITLE = { ...GROUP_LABEL, "": "Device not specified" };
const DEVICE_ORDER = Object.fromEntries(DEVICE_TYPES.map((d, i) => [d.code, i]));
const pct = (n, total) => (total ? `${((n / total) * 100).toFixed(1)}%` : "0%");

export default function PatientStats({ patients, go }) {
  const [scope, setScope] = useState("all");
  const list = useMemo(() => (scope === "available" ? patients.filter((p) => p.available !== false) : patients), [patients, scope]);

  const rows = useMemo(() => list.map((p) => ({
    device: p.deviceType || "",
    group: p.deviceType ? deviceGroup(p.deviceType) : "",
    gender: genderKey(patientGender(p)),
    band: ageBand(patientAge(p))?.key || "",
    province: pField(p, "province").trim()
  })), [list]);
  const total = rows.length;

  // Device type × gender, grouped by prosthesis / orthosis / spinal
  const byDevice = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      const k = r.device || "—";
      m[k] ||= { code: r.device, group: r.group, male: 0, female: 0, unknown: 0, total: 0 };
      m[k][r.gender || "unknown"]++; m[k].total++;
    });
    return GROUPS.map((g) => {
      const items = Object.values(m).filter((x) => x.group === g)
        .sort((a, b) => (DEVICE_ORDER[a.code] ?? 99) - (DEVICE_ORDER[b.code] ?? 99) || a.code.localeCompare(b.code));
      const sum = (k) => items.reduce((s, x) => s + x[k], 0);
      return { group: g, items, male: sum("male"), female: sum("female"), unknown: sum("unknown"), total: sum("total") };
    }).filter((g) => g.total);
  }, [rows]);
  const maxDevice = Math.max(1, ...byDevice.flatMap((g) => g.items.map((x) => x.total)));
  const groupCount = (g) => byDevice.find((x) => x.group === g)?.total || 0;

  // Age group × gender
  const byAge = useMemo(() => [...AGE_BANDS.map((b) => ({ key: b.key, label: b.label })), { key: "", label: "Age not recorded" }]
    .map((b) => {
      const sub = rows.filter((r) => r.band === b.key);
      return { ...b, male: sub.filter((r) => r.gender === "male").length, female: sub.filter((r) => r.gender === "female").length,
        unknown: sub.filter((r) => !r.gender).length, total: sub.length };
    }).filter((b) => b.total || b.key), [rows]);
  const maxAge = Math.max(1, ...byAge.map((b) => b.total));
  const genderTotals = { male: rows.filter((r) => r.gender === "male").length, female: rows.filter((r) => r.gender === "female").length };
  genderTotals.unknown = total - genderTotals.male - genderTotals.female;

  // Province (top 10, rest folded into "Other provinces")
  const byProvince = useMemo(() => {
    const c = {};
    rows.forEach((r) => { const k = r.province || "Not recorded"; c[k] = (c[k] || 0) + 1; });
    const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 10);
    const rest = sorted.slice(10).reduce((s, [, n]) => s + n, 0);
    return rest ? [...top, [`Other provinces (${sorted.length - 10})`, rest]] : top;
  }, [rows]);
  const maxProv = Math.max(1, ...byProvince.map(([, n]) => n));

  const open = (params) => go(`patients?${new URLSearchParams(params)}`);

  const exportSummary = () => downloadWorkbook({
    "By device type": byDevice.flatMap((g) => g.items.map((x) => ({
      Group: GROUP_TITLE[g.group], "Device type": x.code || "Not specified", Name: deviceInfo(x.code)?.name || "",
      Male: x.male, Female: x.female, "Gender not recorded": x.unknown, Total: x.total, Percentage: pct(x.total, total)
    }))),
    "By gender & age": byAge.map((b) => ({ "Age group": b.label, Male: b.male, Female: b.female, "Gender not recorded": b.unknown, Total: b.total, Percentage: pct(b.total, total) })),
    "By province": byProvince.map(([name, n]) => ({ Province: name, Count: n, Percentage: pct(n, total) }))
  }, `patient_models_summary_${todayStr()}.xlsx`);

  return (
    <>
      <PageHead title="Patient Model Dashboard" subtitle="Number of patient models (ครูต้นแบบ) by device type, gender, age group and province">
        <div className="seg" role="group" aria-label="Which patients to count">
          <button className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>All patients</button>
          <button className={scope === "available" ? "on" : ""} onClick={() => setScope("available")}>Available only</button>
        </div>
        <button className="btn btn-ghost" onClick={exportSummary} disabled={!total}><Download size={17} /> Export summary</button>
      </PageHead>

      <div className="stats stats-5">
        <StatCard icon={Contact} tone="teal" label={scope === "all" ? "Patient models" : "Available patient models"} value={total} onClick={() => go("patients")} />
        <StatCard icon={CircleCheck} tone="green" label="Available for booking" value={patients.filter((p) => p.available !== false).length} />
        <StatCard icon={Footprints} tone="blue" label="Prosthesis" value={groupCount("prosthesis")} />
        <StatCard icon={PersonStanding} tone="purple" label="Orthosis" value={groupCount("orthosis")} />
        <StatCard icon={Bone} tone="orange" label="Spinal orthosis" value={groupCount("spinal")} />
      </div>

      {!total ? <section className="card"><Empty icon={Contact} title="No patient models yet" /></section> : (
        <>
          <section className="card table-wrap">
            <div className="card-head pad-x"><h3>Patients by device type</h3><small className="muted">Click a row to see the patients</small></div>
            <table className="table stat-table">
              <thead>
                <tr><th>Device type</th><th className="num">Male</th><th className="num">Female</th><th className="num">Total</th><th className="bar-col">Share of all</th></tr>
              </thead>
              {byDevice.map((g) => (
                <tbody key={g.group}>
                  <tr className="group-row">
                    <td>{GROUP_TITLE[g.group]}</td><td className="num">{g.male}</td><td className="num">{g.female}</td>
                    <td className="num">{g.total}</td><td className="muted">{pct(g.total, total)}</td>
                  </tr>
                  {g.items.map((x) => (
                    <tr key={x.code || "none"} className="click" onClick={() => x.code && open({ device: x.code })}>
                      <td><b>{x.code || "—"}</b> <span className="muted small dev-name">{deviceInfo(x.code)?.name || (x.code ? "" : "Not specified")}</span></td>
                      <td className="num">{x.male}</td><td className="num">{x.female}</td><td className="num"><b>{x.total}</b></td>
                      <td className="bar-col">
                        <div className="hbar-row" title={`${x.code || "Not specified"}: ${x.total} patients (${pct(x.total, total)})`}>
                          <div className="hbar"><i className="seg-main" style={{ width: `${(x.total / maxDevice) * 100}%` }} /></div>
                          <span>{pct(x.total, total)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot><tr><td>Total</td><td className="num">{genderTotals.male}</td><td className="num">{genderTotals.female}</td><td className="num">{total}</td><td>100%</td></tr></tfoot>
            </table>
          </section>

          <div className="dash-grid even">
            <section className="card">
              <div className="card-head"><h3>Patients by age group and gender</h3></div>
              <ul className="viz-legend">
                <li><i className="seg-male" />Male {genderTotals.male}</li>
                <li><i className="seg-female" />Female {genderTotals.female}</li>
                {genderTotals.unknown > 0 && <li><i className="seg-unknown" />Not recorded {genderTotals.unknown}</li>}
              </ul>
              <ul className="bar-list">
                {byAge.map((b) => (
                  <li key={b.key || "none"} className={b.key ? "click" : ""} onClick={() => b.key && open({ band: b.key })}
                    title={`${b.label}: ${b.male} male, ${b.female} female${b.unknown ? `, ${b.unknown} not recorded` : ""}`}>
                    <span className="bar-label">{b.label}</span>
                    <div className="hbar stacked" style={{ width: `${Math.max((b.total / maxAge) * 100, b.total ? 2 : 0)}%` }}>
                      {b.male > 0 && <i className="seg-male" style={{ flex: b.male }} />}
                      {b.female > 0 && <i className="seg-female" style={{ flex: b.female }} />}
                      {b.unknown > 0 && <i className="seg-unknown" style={{ flex: b.unknown }} />}
                    </div>
                    <b className="bar-val">{b.total}</b>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <div className="card-head"><h3>Patients by province</h3></div>
              <ul className="bar-list">
                {byProvince.map(([name, n]) => (
                  <li key={name} title={`${name}: ${n} patients (${pct(n, total)})`}>
                    <span className="bar-label">{name}</span>
                    <div className="hbar" style={{ width: `${Math.max((n / maxProv) * 100, 2)}%` }}><i className="seg-main" style={{ flex: 1 }} /></div>
                    <b className="bar-val">{n}</b>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
