import React, { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./loginsignup.css";
import { toast, ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SmoothFade = cssTransition({
  enter: "fade-in",
  exit: "fade-out",
  duration: [300, 300], // 300ms for enter and exit
});

const Login = ({ onSuccess, prefilledEmail }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });
    setSuccessMsg("");

    // Frontend validation
    let formErrors = {};
    if (!email.trim()) formErrors.email = "Email cannot be empty";
    if (!password.trim()) formErrors.password = "Password cannot be empty";
    if (password.length > 0 && password.length < 8)
      formErrors.password = "Password must be at least 8 characters";

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const res = await api.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Login Successful!", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeButton: false,
        draggable: false,
        pauseOnHover: true,
        limit: 1,
        transition: SmoothFade,
        style: {
          borderRadius: "40px",
          background: "#f3f3f3ff",
          color: "#020202ff",
          padding: "2px 6px", // compact padding
          fontSize: "14px",
          textAlign: "center",
          width: "200px", // set width
          minWidth: "0px", // override default min-width
          maxWidth: "200px", // optional max width
        },
      });

      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      const message = err.response?.data?.message || "Login failed";

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

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h1 className="form-title">Log In</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={errors.email ? "input-error" : ""}
      />
      {errors.email && <p className="error-msg">{errors.email}</p>}

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={errors.password ? "input-error" : ""}
      />
      {errors.password && <p className="error-msg">{errors.password}</p>}

      <div className="forgot-password-row">
        <span onClick={() => navigate("/forgot-password")}>
          Forgot Password?
        </span>
      </div>

      {errors.general && <p className="error-msg">{errors.general}</p>}

      <button type="submit" className="primary-cta-button">
        Login to Account
      </button>

      <ToastContainer />
    </form>
  );
};

export default Login;
