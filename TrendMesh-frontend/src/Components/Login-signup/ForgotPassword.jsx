import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo1 from "../Assets/logo1.png";
import api from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./forgotreset.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email format");
      return;
    }

    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset link sent!");
      // Navigate to Email Sent screen
      navigate("/forgot-password/sent", { state: { email } });
    } catch (err) {
      const backendMessage =
        err.response?.data?.message || "Error sending reset link";
      setError(backendMessage);
    }
  };

  return (
    <div className="forgot-reset-container">
      <div className="card">
        <img src={logo1} alt="TrendMesh Logo" className="logo1" />
        <h2>Forget Password?</h2>
        <p>
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            {error && <span className="error-text-inline">⚠️ {error}</span>}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className={error ? "input-error-border" : ""}
            />
          </div>

          <button type="submit" className="primary-btn">
            Send Reset Link
          </button>
        </form>

        <p className="return-link" onClick={() => navigate("/login")}>
          &lt; Return to Log In
        </p>
      </div>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar
        closeButton={false}
      />
    </div>
  );
};

export default ForgotPassword;
