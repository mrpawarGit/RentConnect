import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { dark, setDark } = useContext(ThemeContext);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded bg-gray-300 dark:bg-gray-700"
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
};

export default ThemeToggle;
