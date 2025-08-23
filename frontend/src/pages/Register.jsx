import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        data
      );
      // Save token in localStorage (or context, as needed)
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Registration failed. Try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded shadow">
        <ThemeToggle />
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Create Account
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200">
              Name
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              className="input-class"
            />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
              className="input-class"
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
              className="input-class"
            />
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200">
              Role
            </label>
            <select
              {...register("role", { required: "Select a role" })}
              className="input-class"
            >
              <option value="">-- Select Role --</option>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs">{errors.role.message}</p>
            )}
          </div>
          {errorMsg && <div className="text-red-500 mb-2">{errorMsg}</div>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-700 dark:text-blue-400 hover:underline"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

// Tailwind input style
// Add this to your global CSS or use inline classes above instead:
// .input-class {
//   width: 100%;
//   padding: 0.5rem;
//   border-radius: 0.375rem;
//   border: 1px solid #d1d5db;
//   background-color: #f9fafb;
//   color: #374151;
// }
export default Register;
