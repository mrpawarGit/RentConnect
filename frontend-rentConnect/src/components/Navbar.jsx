// src/components/Navbar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getCurrentUser, logout } from "../lib/auth";
import { disconnectSocket } from "../lib/socket";

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

  // close mobile menu whenever auth/user changes
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
        { to: "/properties/admin", label: "Properties" },
      ];
    }
    return common;
  }, [user]);

  // Enhanced link styling with better hover effects
  const activeClass = ({ isActive }) =>
    [
      "px-4 py-2.5 rounded-lg transition-all duration-300 border font-medium",
      "hover:scale-105 hover:shadow-sm",
      isActive
        ? "bg-primary text-white shadow-sm"
        : "bg-transparent text-primary border-transparent hover:border-primary/30 hover:bg-primary/10",
    ]
      .filter(Boolean)
      .join(" ");

  // Enhanced button styling
  const buttonClass =
    "px-4 py-2.5 rounded-lg transition-all duration-300 border font-medium " +
    "bg-primary text-white border-primary " +
    "hover:bg-primary-hover hover:shadow-sm hover:scale-105 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-bg/70 bg-bg/90 border-b border-primary"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <NavLink
            to="/"
            className="font-bold text-xl md:text-2xl text-primary flex items-center gap-2 transition-all hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            TenantLandlord
          </NavLink>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-3">
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
                <button onClick={handleLogout} className={buttonClass}>
                  Logout
                </button>
              </>
            )}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              className="inline-flex items-center justify-center p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-6 w-6"
              >
                {open ? (
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={[
          "md:hidden overflow-hidden border-t border-primary bg-bg/95 backdrop-blur",
          open ? "max-h-screen opacity-100" : "max-h-0 opacity-0",
          "transition-all duration-300 ease-in-out",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="px-4 py-4 flex flex-col gap-3">
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
                className={buttonClass + " text-left"}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
