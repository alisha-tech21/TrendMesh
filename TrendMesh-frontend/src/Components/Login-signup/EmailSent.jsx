import React, { useState, useEffect } from "react";
import logo1 from "../Assets/logo1.png";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./forgotreset.css";

const EmailSent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "user@example.com";
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = () => {
    // Call backend to resend email
    toast.info("Resend link sent!");
    setTimer(60);
  };

  return (
    <div className="forgot-reset-container">
      <div className="card">
        <img src={logo1} alt="TrendMesh Logo" className="logo1" />
        <h2>Check Your Inbox!</h2>
        <p>We have sent a password reset link to <b>{email}</b>. Please check your spam folder.</p>
        <p style={{ fontSize: "48px" }}>✉️</p>

        {timer === 0 ? (
          <button className="primary-btn" onClick={handleResend}>
            Resend Email
          </button>
        ) : (
          <p>Resend available in {timer}s</p>
        )}

        <button className="secondary-btn" onClick={() => navigate("/login")}>
          Return to Log In
        </button>
      </div>
      <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar closeButton={false} />
    </div>
  );
};

export default EmailSent;
