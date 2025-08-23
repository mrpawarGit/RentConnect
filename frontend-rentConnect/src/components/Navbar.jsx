import ThemeToggle from "./ThemeToggle";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-light dark:bg-background-dark shadow-md p-4 flex justify-between items-center">
      <Link
        to="/"
        className="text-primary-light dark:text-primary-dark font-bold text-xl"
      >
        TenantLandlord
      </Link>
      <div className="space-x-6 flex items-center">
        <Link
          to="/login"
          className="text-primary-light dark:text-primary-dark hover:underline"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="text-primary-light dark:text-primary-dark hover:underline"
        >
          Register
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
