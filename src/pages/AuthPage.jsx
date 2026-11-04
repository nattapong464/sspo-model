import { useState } from "react";
import { LogIn, UserPlus, KeyRound, Hourglass, Ban, LogOut } from "lucide-react";
import { login, registerAccount, resetPassword, logout } from "../data";
import { authErrorText } from "../utils";

function Brand() {
  return (
    <div className="auth-brand">
      <div className="brand-mark">SS</div>
      <div>
        <h1>SSPO Patient Model</h1>
        <p>Request patient models for teaching and practical classes</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | register | reset
  const [f, setF] = useState({ email: "", password: "", password2: "", name: "", department: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (mode === "register") {
      if (!f.name.trim()) return setError("Please enter your full name");
      if (f.password.length < 6) return setError("Password must be at least 6 characters");
      if (f.password !== f.password2) return setError("Passwords do not match");
    }
    setBusy(true);
    try {
      if (mode === "login") await login(f.email, f.password);
      else if (mode === "register") await registerAccount(f);
      else {
        await resetPassword(f.email);
        setInfo("A password reset link has been sent. Please check your inbox (and Junk/Spam).");
      }
    } catch (err) {
      setError(authErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Brand />
        {mode !== "reset" && (
          <div className="seg">
            <button className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")}>Sign in</button>
            <button className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>Create account</button>
          </div>
        )}
        {mode === "reset" && <h2 className="auth-sub">Forgot password</h2>}

        <form onSubmit={submit} className="stack">
          {mode === "register" && (
            <>
              <label className="field"><span>Full name *</span>
                <input value={f.name} onChange={set("name")} placeholder="e.g. Somchai Jaidee" autoComplete="name" /></label>
              <label className="field"><span>Department / Programme</span>
                <input value={f.department} onChange={set("department")} placeholder="e.g. Prosthetics & Orthotics" /></label>
            </>
          )}
          <label className="field"><span>Email *</span>
            <input type="email" required value={f.email} onChange={set("email")} autoComplete="email" /></label>
          {mode !== "reset" && (
            <label className="field"><span>Password *</span>
              <input type="password" required value={f.password} onChange={set("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          )}
          {mode === "register" && (
            <label className="field"><span>Confirm password *</span>
              <input type="password" required value={f.password2} onChange={set("password2")} autoComplete="new-password" /></label>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-info">{info}</div>}

          <button className="btn btn-primary btn-lg" disabled={busy}>
            {mode === "login" && <><LogIn size={18} /> Sign in</>}
            {mode === "register" && <><UserPlus size={18} /> Create account</>}
            {mode === "reset" && <><KeyRound size={18} /> Send reset link</>}
          </button>
        </form>

        <div className="auth-foot">
          {mode === "login" && <button className="link" onClick={() => switchMode("reset")}>Forgot password?</button>}
          {mode === "reset" && <button className="link" onClick={() => switchMode("login")}>← Back to sign in</button>}
          {mode === "register" && <p className="muted small">New accounts must be approved by an admin before use.</p>}
        </div>
      </div>
    </div>
  );
}

// Shown when an account is pending approval or disabled
export function AccountGate({ profile }) {
  const disabled = profile?.status === "disabled";
  return (
    <div className="auth-wrap">
      <div className="auth-card center">
        <div className={`gate-icon ${disabled ? "red" : ""}`}>{disabled ? <Ban size={34} /> : <Hourglass size={34} />}</div>
        <h2>{disabled ? "Your account has been disabled" : "Your account is waiting for approval"}</h2>
        <p className="muted">
          {disabled
            ? "Please contact an admin if you think this is a mistake."
            : "The admins have been notified. This page will open the app automatically once you are approved."}
        </p>
        <div className="gate-info">
          <div><b>{profile?.name}</b></div>
          <div className="muted">{profile?.email}</div>
        </div>
        <button className="btn btn-ghost" onClick={logout}><LogOut size={18} /> Sign out</button>
      </div>
    </div>
  );
}
