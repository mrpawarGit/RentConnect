import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20 px-6 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-5xl font-extrabold text-primary-light dark:text-primary-dark">
        Streamline Tenant & Landlord Communication
      </h1>
      <p className="text-lg max-w-3xl text-primary-light dark:text-primary-dark">
        Manage maintenance, payments, and messages all in one intuitive
        platform.
      </p>
      <div className="space-x-6">
        <Link
          to="/register"
          className="px-8 py-3 bg-primary-light dark:bg-primary-dark text-background-light dark:text-background-dark rounded-lg shadow-lg hover:brightness-90 transition"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="px-8 py-3 border-2 border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark rounded-lg hover:bg-primary-light hover:text-background-light dark:hover:bg-primary-dark dark:hover:text-background-dark transition"
        >
          Login
        </Link>
      </div>
    </section>
  );
}
