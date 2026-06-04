import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo1 from "../Assets/logo1.png";
import LS from "../Assets/LS.png";
import Login from "./Login";
import Signup from "./Signup";
import "./loginsignup.css";

const AuthContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  // Sync state with current route
  useEffect(() => {
    if (location.pathname === "/login") setIsLogin(true);
    else if (location.pathname === "/signup") setIsLogin(false);
  }, [location.pathname]);

  return (
    <div className="auth-wrapper">
      <div className="auth-container-modern">

        {/* LEFT PANEL */}
        <div className="vibrant-panel">
          <div className="logo">
          <img src={logo1} alt="TrendMesh Logo" className="logo1" />
          </div>
          <h2 className="tagline">
            TrendMesh
            <span className="tagline-sub">
              (Unified Social Media Management & Scheduler)
            </span>
          </h2>
          <p>Managing multiple social media platforms can be time-consuming. TrendMesh streamlines the process with centralized scheduling and automation.</p>
           <div className="LS-wrapper">
    <img src={LS} alt="3D Illustration" className="LS-image" />
  </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="form-panel-modern">
          {isLogin ? (
            <Login onSuccess={() => navigate("/dashboard")} />
          ) : (
            <Signup onSuccess={() => navigate("/login")} />
          )}

          {/* Toggle */}
          <p className="toggle-text">
            {isLogin ? (
              <>
                Don’t have an account?{" "}
                <span onClick={() => navigate("/signup")}>Create Account</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span onClick={() => navigate("/login")}>Login</span>
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthContainer;
