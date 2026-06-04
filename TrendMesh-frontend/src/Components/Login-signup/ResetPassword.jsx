import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo1 from "../Assets/logo1.png";
import api from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./forgotreset.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!password || !confirmPassword) {
    toast.error("Both fields are required");
    return;
  }
  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }
  try {
    // Token goes in URL, password in body
    await api.post(`/auth/reset-password/${token}`, { password });
    toast.success("Password reset successful!");
    setTimeout(() => navigate("/login"), 1500);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to reset password");
  }
};


  return (
    <div className="forgot-reset-container">
      <div className="card">
        <img src={logo1} alt="TrendMesh Logo" className="logo1" />
        <h2>Set New Password</h2>
        <p>Enter a new password for your account.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="primary-btn">Reset Password</button>
        </form>
      </div>
      <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar closeButton={false} />
    </div>
  );
};

export default ResetPassword;
