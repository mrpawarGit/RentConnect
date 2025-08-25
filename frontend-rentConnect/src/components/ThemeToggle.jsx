import { useEffect, useState } from "react";
import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const initial = saved
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");

    // watch reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  return (
    <Classic
      toggled={theme === "dark"}
      toggle={toggleTheme}
      duration={reduced ? 0 : 950} // a bit longer, disabled if reduced motion
      className="cursor-pointer text-2xl"
      aria-label="Toggle dark mode"
      title="Toggle light/dark mode"
    />
  );
}
