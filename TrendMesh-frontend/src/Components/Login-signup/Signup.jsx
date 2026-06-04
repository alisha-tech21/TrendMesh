import React, { useState, useEffect } from "react";
import api from "../api";
import "./loginsignup.css";

const Signup = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    general: "",
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOtp("");
    setErrors({ name: "", email: "", password: "", general: "" });
    setSuccessMsg("");
    setShowOtpField(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setErrors({ name: "", email: "", password: "", general: "" });

    let formErrors = {};

    if (!name.trim()) {
      formErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      formErrors.email = "Email is required";
    }

    if (!password.trim()) {
      formErrors.password = "Password is required";
    } else if (password.length < 8) {
      formErrors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const res = await api.post("/auth/signup", { name, email, password });
      setSuccessMsg(""); // Signup success message ko gayab kar dega
      setErrors({});
      setShowOtpField(true);
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      const message = err.response?.data?.message || "Sign Up failed";

      let newErrors = { email: "", password: "", general: "" };

      if (backendErrors) {
        newErrors = { ...newErrors, ...backendErrors };
      } else if (message) {
        // Fallback if backend sends a single message
        if (message.includes("Email")) newErrors.email = message;
        else if (message.includes("Password")) newErrors.password = message;
        else newErrors.general = message;
      }

      setErrors(newErrors);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      setSuccessMsg("Email verified successfully! Redirecting to login...");

      setTimeout(() => {
        onSuccess(email);
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        otp: err.response?.data?.message || "Invalid OTP",
      }));
    }
  };

  return (
    <>
      {!showOtpField ? (
        <form onSubmit={handleSignup} className="auth-form" autoComplete="off">
          <h1 className="form-title">Create Account</h1>

          <input
            type="text"
            name={`name_${Math.random()}`}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="new-password"
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <input
            type="email"
            name={`email_${Math.random()}`}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="new-password"
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <p className="error-msg">{errors.email}</p>}

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
              autoComplete="new-password"
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️" : "🔒"}
            </span>
          </div>
          {errors.password && <p className="error-msg">{errors.password}</p>}
          {errors.general && <p className="error-msg">{errors.general}</p>}

          <button type="submit" className="primary-cta-button">
            Create Account
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <h1 className="form-title">Verify Email</h1>
          <p>Please enter the 6-digit code sent to your email.</p>

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={errors.otp ? "input-error" : ""}
          />
          {errors.otp && <p className="error-msg">{errors.otp}</p>}
          {successMsg && (
            <p className="success-msg" style={{ color: "green" }}>
              {successMsg}
            </p>
          )}

          <button type="submit" className="primary-cta-button">
            Verify OTP
          </button>
          <button
            type="button"
            className="primary-cta-button secondary-style"
            onClick={resetForm}
          >
            Back to Signup
          </button>
        </form>
      )}
    </>
  );
};

export default Signup;
