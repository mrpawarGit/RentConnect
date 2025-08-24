// components/Navbar.jsx
import { useNavigate, Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-custom shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl">
        TenantLandlord
      </Link>
      <div className="space-x-6 flex items-center">
        {!token ? (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
