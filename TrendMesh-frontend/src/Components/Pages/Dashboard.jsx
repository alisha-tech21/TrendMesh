import React, { useState, useEffect, useMemo, useCallback } from "react";
import TMbg from "../Assets/TMbg.png";
import userIcon from "../Assets/userIcon.png";
import fblogo from "../Assets/fblogo.png";
import twlogo from "../Assets/twlogo.png";
import instalogo from "../Assets/instalogo.png";
import TMlogo from "../Assets/TMlogo.png";
import DB from "../Assets/DB.png";
import Facebookpg from "../Pages/Facebookpg";
import tiktoklogo from "../Assets/tiktoklogo.png";
import api from "../api";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Users, TrendingUp, Heart, Camera } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";

// Ye function imports ke baad aur DashboardHome se pehle likhein
const getCroppedImg = (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  return new Promise((resolve) => {
    image.onload = () => {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    };
  });
};

const DashboardHome = () => {
  const [platform, setPlatform] = useState("All Platforms");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    const getStats = async () => {
      try {
        const res = await api.get("/dashboard/combined-stats");
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Axios Fetch Error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    getStats();
  }, []);

  const current = useMemo(() => {
    if (!stats) return { followers: 0, engagement: 0, likes: 0 };

    const fb = stats.facebook || {};
    const ig = stats.instagram || {};
    const tt = stats.tiktok || {};
    const tw = stats.twitter || {};
    const all = stats.all || {};

    let selected = {};
    if (platform === "Facebook Only") {
      selected = fb;
    } else if (platform === "Instagram Only") {
      selected = ig;
    } else if (platform === "TikTok Only") {
      selected = tt;
    } else if (platform === "Twitter Only") {
      selected = tw;
    } else {
      selected = all;
    }

    return {
      followers: Number(selected.followers || 0),
      engagement: Number(selected.engagement || 0),
      likes: Number(selected.likes || 0),
    };
  }, [stats, platform]);

  const data = [
    { day: "Mon", reach: 120, likes: 80, comments: 30 },
    { day: "Tue", reach: 160, likes: 100, comments: 40 },
    { day: "Wed", reach: 180, likes: 120, comments: 50 },
    { day: "Thu", reach: 90, likes: 60, comments: 25 },
    { day: "Fri", reach: 140, likes: 90, comments: 35 },
    { day: "Sat", reach: 200, likes: 140, comments: 55 },
    { day: "Sun", reach: 110, likes: 70, comments: 20 },
  ];

  const sentimentData = [
    { name: "Positive", value: 29.5, fill: "#00D09C" },
    { name: "Neutral", value: 44.7, fill: "#FFC400" },
    { name: "Negative", value: 25.8, fill: "#FF007F" },
  ];

  return (
    <div className="dashboard-content">
      <div className="welcome-box fade-in">
        <div className="welcome-text">
          <h2>Welcome Back, {user?.name || "User"}!</h2>
          <p>You got 80% improved performance this week.</p>
        </div>
        <img src={DB} alt="Welcome" className="welcome-img" />
      </div>

      <div className="dashboard-header-row">
        <h3>Dashboard Overview</h3>
        <select
          className="platform-dropdown"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="All Platforms">All Platforms</option>
          <option value="Facebook Only">Facebook Only</option>
          <option value="Instagram Only">Instagram Only</option>
          <option value="TikTok Only">TikTok Only</option>
          <option value="Twitter Only">Twitter Only</option>
        </select>
      </div>

      <div className="stats-row fade-in">
        <div className="stat-box-small">
          <div className="stat-card-header">
            <Users className="stat-icon" />
          </div>
          <h2>
            {loading ? "..." : (current?.followers ?? 0).toLocaleString()}
          </h2>
          <p>Total Followers</p>
        </div>

        <div className="stat-box-small">
          <div className="stat-card-header">
            <TrendingUp className="stat-icon" />
          </div>
          <h2>{loading ? "..." : `${current?.engagement ?? 0}%`}</h2>
          <p>User Engagement</p>
        </div>

        <div className="stat-box-small">
          <div className="stat-card-header">
            <Heart className="stat-icon" />
          </div>
          <h2>
            {loading
              ? "..."
              : current?.likes >= 1000
                ? (current.likes / 1000).toFixed(1) + "K"
                : (current?.likes ?? 0)}
          </h2>
          <p>Total Likes</p>
        </div>
      </div>

      <div className="insta-stats-container">
        <div className="stats-box performance-chart">
          <h3>Weekly Performance</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="80%">
              <BarChart
                data={data}
                barGap={4}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee"
                />
                <XAxis
                  dataKey="day"
                  axisLine={{ stroke: "#ccc" }}
                  tickLine={false}
                />
                <YAxis axisLine={{ stroke: "#ccc" }} tickLine={false} />
                <Tooltip cursor={{ fill: "#f0f0f0" }} />
                <Bar
                  name="Reach"
                  dataKey="reach"
                  fill="#0022ff"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Likes"
                  dataKey="likes"
                  fill="#ff00aa"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Comments"
                  dataKey="comments"
                  fill="#6600ff"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="chart-legend"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "10px",
            }}
          >
            <p
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#0022ff",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Reach
            </p>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#ff00aa",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Likes
            </p>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#6600ff",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Comments
            </p>
          </div>
        </div>

        <div className="stats-box sentiment-chart">
          <h3>Share of Sentiment</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="80%" minWidth={0}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ value }) => `${value}%`}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            className="sentiment-legend"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#00d09c",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Positive
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#ffc400",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Neutral
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
                color: "#333",
              }}
            >
              <span
                style={{
                  backgroundColor: "#ff007f",
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  marginRight: "8px",
                  display: "inline-block",
                }}
              ></span>
              Negative
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(23, 11, 41, 0.8)", // Dark purple tint overlay
  backdropFilter: "blur(6px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const cropCardStyle = {
  background: "#ffffff", // White background like your cards
  color: "#1a1a2e",
  padding: "24px",
  borderRadius: "20px",
  width: "90%",
  maxWidth: "450px",
  textAlign: "center",
  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
  border: "none",
};

const Dashboard = () => {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    api.get("/facebook/me").catch(console.error);
  }, []);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setImage(reader.result);
        setShowModal(true);
      };
    }
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFinalUpload = async () => {
    const toastId = toast.loading("Updating profile...");

    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");

      const res = await api.post("/auth/update-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success) {
        // 1. Pehle toast ko success mein badlein
        toast.update(toastId, {
          render: "Profile updated!",
          type: "success",
          isLoading: false,
          autoClose: 1800, // Ye toast 1.5 seconds tak dikhega
        });

        // 2. Timeout lagayein taake photo toast khatam hone par lage
        setTimeout(() => {
          const updatedUser = { ...user, avatar: res.data.avatarPath };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser); // Photo ab update hogi
          setShowModal(false); // Modal ab band hoga
        }, 1600); // 1.5s toast ke liye + 100ms gap
      }
    } catch (error) {
      toast.update(toastId, {
        render: "Upload failed!",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    }
  };
  const socialMedia = [
    { name: "Facebook", icon: fblogo, route: "/dashboard/facebook" },
    { name: "Instagram", icon: instalogo, route: "/dashboard/instagram" },
    { name: "Twitter", icon: twlogo, route: "/dashboard/twitter" },
    { name: "TikTok", icon: tiktoklogo, route: "/dashboard/tiktok" },
  ];

  const scheduledData = [
    { date: "2025-1-27", platform: "instagram", time: "08:30 AM" },
    { date: "2025-1-27", platform: "twitter", time: "11:30 AM" },
    { date: "2025-1-28", platform: "tiktok", time: "09:30 AM" },
    { date: "2025-1-28", platform: "facebook", time: "09:30 AM" },
  ];

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Log Out?",
      text: "You will be signed out of your TrendMesh account.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#c2185b",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Log Out",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        popup: "swal2-border-radius",
      },
    });

    if (!result.isConfirmed) return;

    // Optional success message
    await Swal.fire({
      title: "Logged Out",
      text: "You have been successfully signed out.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    // Clear stored data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    sessionStorage.clear();

    // Redirect to login page
    navigate("/login", { replace: true });
  };
  return (
    <div className="dashboard-view" style={{ backgroundImage: `url(${TMbg})` }}>
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="logo-section">
            <img src={TMlogo} alt="TrendMesh Logo" className="logo" />
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
          <div
            className="user-section"
            style={{ padding: "10px", textAlign: "left" }}
          >
            <div
              className="avatar-wrapper"
              style={{ position: "relative", display: "inline-block" }}
            >
              <img
                src={
                  user?.avatar
                    ? `http://localhost:5000/${user.avatar}`
                    : userIcon
                }
                alt="User"
                style={{
                  borderRadius: "50%",
                  width: "50px", // Size chota kar diya
                  height: "50px",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              />
              <label
                htmlFor="avatar-upload"
                className="camera-icon-label"
                title="Edit Profile Picture"
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  background: "#6366f1", // Modern purple-blue color
                  borderRadius: "50%",
                  width: "22px",
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "2px solid #1a1a2e",
                }}
              >
                <Camera size={12} color="#fff" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onFileChange}
                />
              </label>
            </div>
            <span style={{ marginLeft: "10px", fontWeight: "500" }}>
              {user?.email || "Guest User"}
            </span>
          </div>
          <div className="menu">
            <h4>Social Media</h4>
            <div className="social-buttons">
              {socialMedia.map((media, index) => (
                <button
                  key={index}
                  className={`social-btn ${location.pathname === media.route ? "active" : ""}`}
                  onClick={() => navigate(media.route)}
                >
                  <img src={media.icon} alt={media.name} className="icon" />
                  <span>{media.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div
            className="logout"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            Log Out
          </div>
        </aside>

        <main className="main-container">
          <div className="content-box">
            <nav className="navbar">
              <div className="nav-buttons">
                <button
                  className={isActive("/dashboard") ? "active-nav" : ""}
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </button>
                <button
                  className={
                    isActive("/dashboard/scheduledposts") ? "active-nav" : ""
                  }
                  onClick={() => navigate("/dashboard/scheduledposts")}
                >
                  Scheduled Posts
                </button>
                <button
                  className={isActive("/dashboard/aichat") ? "active-nav" : ""}
                  onClick={() => navigate("/dashboard/aichat")}
                >
                  AI ✦
                </button>
                <button
                  className={
                    isActive("/dashboard/createpost") ? "active-nav" : ""
                  }
                  onClick={() => navigate("/dashboard/createpost")}
                >
                  Create Post
                </button>
              </div>
            </nav>
            {location.pathname === "/dashboard" ? (
              <DashboardHome />
            ) : (
              <Outlet context={{ scheduledData }} />
            )}
          </div>
        </main>
      </div>
      {/* --- CROP MODAL --- */}
      {/* --- UPDATED CROP MODAL --- */}
      {/* --- BRAND MATCHED CROP MODAL --- */}
      {showModal && (
        <div className="crop-modal-overlay" style={modalOverlayStyle}>
          <div className="crop-card" style={cropCardStyle}>
            <h3
              style={{
                marginBottom: "20px",
                color: "#c2185b", // Matching your dashboard active tab color
                fontWeight: "700",
                fontFamily: "inherit",
              }}
            >
              Adjust Profile Photo
            </h3>

            <div
              className="crop-container"
              style={{
                position: "relative",
                height: "300px",
                width: "100%",
                background: "#f8f9fa",
                borderRadius: "15px",
                overflow: "hidden",
                border: "1px solid #eee",
              }}
            >
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ padding: "20px 0 10px" }}>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: "25px",
                  accentColor: "#c2185b", // Pink slider
                }}
              />

              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={handleFinalUpload}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(90deg, #6a1b9a, #c2185b)", // Matches your Welcome banner gradient
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(194, 24, 91, 0.3)",
                  }}
                >
                  Save Changes
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#ada3a3",
                    color: "#222121",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
