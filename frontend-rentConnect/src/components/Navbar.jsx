// src/components/Navbar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getCurrentUser, logout } from "../lib/auth";
import { disconnectSocket } from "../lib/socket"; // safe even if socket not connected

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [open, setOpen] = useState(false);

  // reflect auth changes from other tabs/windows and same-tab updates
  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    const onStorage = (e) => {
      if (e.key === "token") refresh();
    };
    window.addEventListener("rentconnect-auth", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rentconnect-auth", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // close mobile menu on route change (naive: close whenever user changes)
  useEffect(() => {
    setOpen(false);
  }, [user]);

  function handleLogout() {
    logout();
    disconnectSocket();
    setUser(null);
    navigate("/login");
  }

  const links = useMemo(() => {
    if (!user) return [];
    const common = [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/chat", label: "Chat" },
      {
        to: user.role === "tenant" ? "/payments" : "/payments/admin",
        label: "Payments",
      },
    ];
    if (user.role === "tenant") {
      return [
        ...common,
        { to: "/requests/new", label: "New Request" },
        { to: "/requests/mine", label: "My Requests" },
      ];
    }
    if (user.role === "landlord") {
      return [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/chat", label: "Chat" },
        { to: "/requests/admin", label: "Requests" },
        { to: "/payments/admin", label: "Payments" },
        { to: "/properties/admin", label: "Properties" }, // NEW
      ];
    }
    return common;
  }, [user]);

  const activeClass = ({ isActive }) =>
    `hover:underline ${isActive ? "underline underline-offset-4" : ""}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-custom shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="font-bold text-xl">
          TenantLandlord
        </NavLink>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <NavLink to="/login" className={activeClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={activeClass}>
                Register
              </NavLink>
            </>
          ) : (
            <>
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={activeClass}>
                  {l.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="hover:underline">
                Logout
              </button>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center border rounded px-3 py-1"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="md:hidden border-t">
          <div className="px-4 py-3 flex flex-col gap-3">
            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className={activeClass}
                  onClick={() => setOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={activeClass}
                  onClick={() => setOpen(false)}
                >
                  Register
                </NavLink>
              </>
            ) : (
              <>
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={activeClass}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="text-left hover:underline"
                >
                  Logout
                </button>
              </>
            )}
            <div className="pt-2 border-t">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
