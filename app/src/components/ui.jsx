// Small reusable UI pieces: Modal, Toast, Confirm dialog, Avatar, Badges, Empty state
import { useEffect, useState } from "react";
import { X, CircleCheck, TriangleAlert, Info } from "lucide-react";
import { STATUS_STYLE, isDefaultAvatar } from "../utils";
import { STATUS_LABEL } from "../labels";

/* Toast ------------------------------------------------------------- */
// Call toast("บันทึกแล้ว") from anywhere; <Toaster/> (in App) shows it.
export const toast = (message, type = "success") =>
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type, id: Math.random() } }));

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setItems((list) => [...list, t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), 3800);
    };
    window.addEventListener("app-toast", onToast);
    return () => window.removeEventListener("app-toast", onToast);
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "error" ? <TriangleAlert size={18} /> : t.type === "info" ? <Info size={18} /> : <CircleCheck size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* Confirm dialog ---------------------------------------------------- */
// const ok = await confirmDialog({ title, message, confirmText, danger, withNote })
// Resolves to false (cancel), true, or { note } when withNote is set.
export const confirmDialog = (opts) =>
  new Promise((resolve) => window.dispatchEvent(new CustomEvent("app-confirm", { detail: { ...opts, resolve } })));

export function ConfirmHost() {
  const [req, setReq] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    const onConfirm = (e) => { setNote(""); setReq(e.detail); };
    window.addEventListener("app-confirm", onConfirm);
    return () => window.removeEventListener("app-confirm", onConfirm);
  }, []);
  if (!req) return null;
  const close = (val) => { req.resolve(val); setReq(null); };
  const needNote = req.withNote === "required" && !note.trim();
  return (
    <Modal title={req.title || "Confirm"} onClose={() => close(false)} size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
        <button className={`btn ${req.danger ? "btn-danger" : "btn-primary"}`} disabled={needNote}
          onClick={() => close(req.withNote ? { note: note.trim() } : true)}>
          {req.confirmText || "Confirm"}
        </button>
      </>}>
      {req.message && <p className="confirm-msg">{req.message}</p>}
      {req.withNote && (
        <label className="field">
          <span>{req.noteLabel || "Note"}{req.withNote === "required" ? " *" : " (optional)"}</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </label>
      )}
    </Modal>
  );
}

/* Modal ------------------------------------------------------------- */
export function Modal({ title, children, footer, onClose, size = "md" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("no-scroll"); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* Misc -------------------------------------------------------------- */
export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLE[status]?.badge || "badge-gray"}`}>{STATUS_LABEL[status] || status}</span>;
}

export function Avatar({ name = "", photo, size = 44 }) {
  const [broken, setBroken] = useState(false);
  // First consonant/letter of the first two words (skips Thai leading vowels and titles like ด.ญ.)
  const initials = String(name).replace(/^(ด\.ญ\.|ด\.ช\.|นางสาว|นาย|นาง|อ\.|ดร\.)\s*/, "").trim().split(/\s+/).slice(0, 2)
    .map((w) => (w.match(/[ก-ฮA-Za-z0-9]/) || [""])[0]).join("").toUpperCase() || "?";
  if (photo && !isDefaultAvatar(photo) && !broken)
    return <img className="avatar" src={photo} alt="" style={{ width: size, height: size }} onError={() => setBroken(true)} />;
  return <div className="avatar avatar-text" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={40} strokeWidth={1.5} />}
      <h4>{title}</h4>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, tone = "teal", onClick }) {
  return (
    <button type="button" className={`stat stat-${tone}`} onClick={onClick} disabled={!onClick}>
      <div className="stat-icon"><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </button>
  );
}

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
