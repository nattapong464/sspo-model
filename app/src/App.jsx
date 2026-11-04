import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, Users, ShoppingCart, ClipboardList, Bell, LogOut, Menu, X, UserCog, Contact
} from "lucide-react";
import {
  watchAuth, subscribeToMyProfile, getProfile, createOwnProfile, subscribeToPatients, subscribeToRequests,
  subscribeToNotifications, subscribeToUsers, markNotificationsRead, logout, ROLE, ACCOUNT_STATUS
} from "./data";
import { fmtDateTime } from "./utils";
import { ROLE_LABEL } from "./labels";
import { Toaster, ConfirmHost, Avatar } from "./components/ui";
import AuthPage, { AccountGate } from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Cart from "./pages/Cart";
import Requests from "./pages/Requests";
import ManageUsers from "./pages/ManageUsers";
import Profile from "./pages/Profile";
import "./App.css";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "patients", label: "Patient Directory", icon: Contact },
  { key: "cart", label: "Request Cart", icon: ShoppingCart, badge: "cart" },
  { key: "requests", label: "My Requests", adminLabel: "Manage Requests", icon: ClipboardList, badge: "requests" },
  { key: "users", label: "Manage Users", icon: UserCog, adminOnly: true, badge: "users" },
  { key: "profile", label: "My Profile", icon: Users }
];
// Notification "link" values -> page keys
const LINK_TO_PAGE = { manage_users: "users", requests: "requests", patients: "patients" };

const readHash = () => window.location.hash.replace(/^#\/?/, "") || "dashboard";
const CART_KEY = "sspo-cart";
const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };

export default function App() {
  const [fbUser, setFbUser] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(undefined);
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]); // admins only
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(readHash);
  const [cart, setCart] = useState(loadCart);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- auth + own profile -------------------------------------------
  useEffect(() => watchAuth((u) => { setFbUser(u); if (!u) setProfile(undefined); }), []);

  useEffect(() => {
    if (!fbUser) return;
    let fixTimer;
    const unsub = subscribeToMyProfile(fbUser.uid, (p) => {
      if (p) { clearTimeout(fixTimer); setProfile(p); return; }
      // No profile yet: registration may still be writing it. Wait, then create one if still missing.
      fixTimer = setTimeout(async () => {
        if (!(await getProfile(fbUser.uid))) await createOwnProfile(fbUser).catch(() => {});
      }, 2500);
    });
    return () => { clearTimeout(fixTimer); unsub(); };
  }, [fbUser]);

  const active = profile?.status === ACCOUNT_STATUS.ACTIVE;
  const isAdmin = active && profile?.role === ROLE.ADMIN;
  const me = useMemo(() => profile && { ...profile, uid: fbUser?.uid }, [profile, fbUser]);

  // --- data subscriptions (only for approved accounts) ---------------
  useEffect(() => {
    if (!active || !fbUser) return;
    const opts = { uid: fbUser.uid, isAdmin };
    const u1 = subscribeToPatients(setPatients, console.error);
    const u2 = subscribeToRequests(opts, setRequests, console.error);
    const u3 = subscribeToNotifications(opts, setNotifications);
    const u4 = isAdmin ? subscribeToUsers(setUsers, console.error) : () => setUsers([]);
    return () => { u1(); u2(); u3(); u4(); };
  }, [active, isAdmin, fbUser]);

  // --- routing (#/page) ---------------------------------------------
  useEffect(() => {
    const onHash = () => setPage(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (p) => { window.location.hash = `/${p}`; setMenuOpen(false); window.scrollTo(0, 0); };

  // --- cart (kept in this browser so it survives refresh) -------------
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);
  const cartApi = useMemo(() => ({
    ids: cart,
    has: (id) => cart.includes(String(id)),
    toggle: (id) => setCart((c) => (c.includes(String(id)) ? c.filter((x) => x !== String(id)) : [...c, String(id)])),
    set: (ids) => setCart(ids.map(String)),
    clear: () => setCart([])
  }), [cart]);

  // --- render gates --------------------------------------------------
  if (fbUser === undefined || (fbUser && profile === undefined)) return <Loading />;
  if (!fbUser) return <><AuthPage /><Toaster /></>;
  if (!active) return <AccountGate profile={profile} />;

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);
  const current = visibleNav.some((n) => n.key === page) ? page : "dashboard";
  const badges = {
    cart: cart.length,
    requests: isAdmin ? requests.filter((r) => r.status === "Pending").length : 0,
    users: users.filter((u) => u.status === ACCOUNT_STATUS.PENDING).length
  };

  const shared = { me, isAdmin, patients, requests, users, cart: cartApi, go };
  const PAGES = { dashboard: Dashboard, patients: Patients, cart: Cart, requests: Requests, users: ManageUsers, profile: Profile };
  const PageComp = PAGES[current];

  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="side-brand">
          <div className="brand-mark sm">SS</div>
          <div>
            <b>SSPO</b>
            <small>Patient Model Request</small>
          </div>
          <button className="icon-btn only-mobile" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav>
          {visibleNav.map((n) => (
            <button key={n.key} className={`nav-item ${current === n.key ? "on" : ""}`} onClick={() => go(n.key)}>
              <n.icon size={19} />
              <span>{isAdmin && n.adminLabel ? n.adminLabel : n.label}</span>
              {n.badge && badges[n.badge] > 0 && <em className="nav-badge">{badges[n.badge]}</em>}
            </button>
          ))}
        </nav>
        <div className="side-user">
          <Avatar name={me.name} size={36} />
          <div className="side-user-text">
            <b>{me.name}</b>
            <small className={isAdmin ? "role-admin" : ""}>{ROLE_LABEL[me.role]}</small>
          </div>
          <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={logout}><LogOut size={18} /></button>
        </div>
      </aside>
      {menuOpen && <div className="side-scrim" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="topbar-title only-mobile">SSPO Patient Model</div>
          <div className="topbar-spacer" />
          {cart.length > 0 && current !== "cart" && (
            <button className="btn btn-soft btn-sm" onClick={() => go("cart")}>
              <ShoppingCart size={16} /> {cart.length} selected
            </button>
          )}
          <NotificationBell list={notifications} onOpen={(n) => n.link && go(LINK_TO_PAGE[n.link] || n.link)} />
        </header>
        <main className="content">
          <PageComp {...shared} />
        </main>
      </div>
      <Toaster />
      <ConfirmHost />
    </div>
  );
}

function Loading() {
  return <div className="loading"><div className="spinner" /><span>Loading…</span></div>;
}

function NotificationBell({ list, onOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = list.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <Bell size={21} />
        {unread > 0 && <em className="dot">{unread > 9 ? "9+" : unread}</em>}
      </button>
      {open && (
        <div className="bell-pop">
          <div className="bell-head">
            <b>Notifications</b>
            {unread > 0 && <button className="link small" onClick={() => markNotificationsRead(list)}>Mark all read</button>}
          </div>
          <div className="bell-list">
            {list.length === 0 && <div className="muted pad">No notifications yet</div>}
            {list.slice(0, 30).map((n) => (
              <button key={n.id} className={`bell-item ${n.read ? "" : "unread"}`}
                onClick={() => { markNotificationsRead([n]); setOpen(false); onOpen(n); }}>
                <span>{n.message}</span>
                <small>{fmtDateTime(n.date)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
