import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-primary/20 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand / Logo */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-primary">RentConnect</h3>
            <p className="text-sm opacity-70">
              Streamlining tenant & landlord communication
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <Link to="/features" className="hover:text-primary">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-primary">
              About
            </Link>
            <Link to="/contact" className="hover:text-primary">
              Contact
            </Link>
          </nav>

          {/* Socials (optional) */}
          <div className="flex gap-4 text-lg">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
              aria-label="Twitter"
            >
              🐦
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
              aria-label="LinkedIn"
            >
              💼
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
              aria-label="GitHub"
            >
              💻
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 border-t border-primary/20 pt-4 text-center text-xs opacity-70">
          &copy; {new Date().getFullYear()} RentConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
