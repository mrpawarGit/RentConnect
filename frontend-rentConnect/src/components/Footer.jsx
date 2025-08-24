import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-primary/20 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-primary">RentConnect</h3>
          <p className="text-xs opacity-70">
            Seamless tenant & landlord communication
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-4 text-sm font-medium">
          <Link to="/features" className="hover:text-primary">
            Features
          </Link>
          <Link to="/about" className="hover:text-primary">
            About
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
        </nav>

        {/* Copyright */}
        <div className="text-xs opacity-70 text-center sm:text-right">
          &copy; {new Date().getFullYear()} RentConnect
        </div>
      </div>
    </footer>
  );
}
