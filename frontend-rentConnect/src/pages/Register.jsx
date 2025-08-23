export default function Register() {
  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
      <h2 className="text-2xl font-semibold mb-6">Register</h2>
      <form>
        <label className="block mb-4">
          Full Name
          <input
            type="text"
            placeholder="Enter your full name"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
        <label className="block mb-4">
          Email
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
        <label className="block mb-4">
          Password
          <input
            type="password"
            placeholder="Create a password"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 bg-primary-light dark:bg-primary-dark text-background-light dark:text-background-dark rounded hover:brightness-90 transition"
        >
          Register
        </button>
      </form>
    </section>
  );
}
