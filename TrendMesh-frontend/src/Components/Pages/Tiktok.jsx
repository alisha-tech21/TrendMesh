import React, { useEffect, useState } from "react";
import "./TikTok.css";
import tiktokLogo from "../Assets/tiktoklogo.png";
import noDataIcon from "../Assets/star.png";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import Swal from "sweetalert2";

const TikTok = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("comments");
  const [visibleVideos, setVisibleVideos] = useState(5);

  const chartData = [
    { day: "Mon", impression: 120, likes: 80, comments: 30 },
    { day: "Tue", impression: 160, likes: 100, comments: 40 },
    { day: "Wed", impression: 180, likes: 120, comments: 50 },
    { day: "Thu", impression: 90, likes: 60, comments: 25 },
    { day: "Fri", impression: 140, likes: 90, comments: 35 },
    { day: "Sat", impression: 200, likes: 140, comments: 55 },
    { day: "Sun", impression: 110, likes: 70, comments: 20 },
  ];

  const sentimentData = [
    { name: "Positive", value: 29.5, fill: "#69C9D0" },
    { name: "Neutral", value: 44.7, fill: "#94A3B8" },
    { name: "Negative", value: 25.8, fill: "#EE1D52" },
  ];

  const fetchTikTokVideos = async () => {
    try {
      setLoading(true); // Loading start karein
      const res = await axios.get("http://localhost:5000/api/tiktok/videos");
      console.log("DATABASE SE AAYA HUA DATA:", res.data);
      console.log("Backend Full Response:", res);
      console.log("Backend Data Content:", res.data);
      const allData =
        res.data.posts ||
        res.data.videos ||
        (Array.isArray(res.data) ? res.data : []);
      const sortedVideos = allData.sort(
        (a, b) =>
          new Date(b.createdAt || b.publishedAt) -
          new Date(a.createdAt || a.publishedAt),
      );

      setVideos(sortedVideos);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching TikTok videos:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTikTokVideos();
  }, []);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      return Swal.fire(
        "Error",
        "File is too large! Max 50MB allowed.",
        "error",
      );
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", "Video ka Title");
    formData.append("description", "Video ka Message/Caption");

    try {
      Swal.fire({
        title: "Uploading...",
        text: "Please wait while we process your video.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        "http://localhost:5000/api/tiktok/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.data) {
        Swal.fire("Success", "Video uploaded successfully!", "success");
        fetchTikTokVideos();
      }
    } catch (err) {
      console.error("Upload Error:", err);
      Swal.fire("Error", "Failed to upload video.", "error");
    }
  };

  // ================= DELETE LOGIC =================
  const handleDeletePost = async (item) => {
    const id = item._id || item.id; // since backend already sends id
    if (!id) return;

    const result = await Swal.fire({
      title: "Delete TikTok?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EE1D52",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(
          `http://localhost:5000/api/tiktok/post/${id}`,
        );
        if (res.data.success) {
          setVideos((prev) => prev.filter((v) => (v._id || v.id) !== id));
          setSidebarOpen(false);
          Swal.fire("Deleted!", "Video removed.", "success");
        }
      } catch (err) {
        Swal.fire("Error", "Delete failed", "error");
      }
    }
  };

  // View More / View Less Logic
  const handleToggleVideos = () => {
    if (visibleVideos >= videos.length) {
      setVisibleVideos(5);
    } else {
      setVisibleVideos(videos.length);
    }
  };

  const openSidebar = (item) => {
    console.log("SELECTED ITEM DATA:", item);
    setSelectedItem(item);
    setSidebarOpen(true);
    setActiveTab("comments");

    const randomLikes = Math.floor(Math.random() * 800) + 20;
    const names = ["Ali", "Sara", "Ahmed", "Zain", "Ayesha", "Hamza", "Fatima"];
    const texts = [
      "Amazing video! 🔥",
      "Super content!",
      "TikTok star!",
      "Keep it up!",
      "Nice one! 🙌",
      "Love this! ❤️",
    ];

    const demoComments = Array.from({ length: 4 }, () => ({
      username: names[Math.floor(Math.random() * names.length)],
      text: texts[Math.floor(Math.random() * texts.length)],
    }));

    setSelectedItem({
      ...item,
      likes: randomLikes,
      fakeComments: demoComments,
      comments_count: demoComments.length,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchTikTokVideos();
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="tiktok-wrapper">
      {/* 1. Header */}
      <div className="tiktok-header">
        <img
          src={tiktokLogo}
          alt="tiktok"
          className="tiktoklogo"
          style={{ width: "45px" }}
        />
        <div>
          <h3>TikTok Dashboard</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Analyze video performance and audience engagement
          </p>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="tiktok-scrollable-content">
        {/* ===== CHARTS & SENTIMENT SECTION ===== */}
        <div className="tiktok-stats-container">
          {/* 1. Weekly Performance Box */}
          <div className="tiktok-stats-box performance-chart">
            <h3>Weekly Performance</h3>
            <div className="chart-container" style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impression" fill="#69C9D0" />
                  <Bar dataKey="likes" fill="#EE1D52" />
                  <Bar dataKey="comments" fill="#555" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <p>
                <span className="legend-dot impression-tiktok"></span>{" "}
                Impression
              </p>
              <p>
                <span className="legend-dot likes-tiktok"></span> Likes
              </p>
              <p>
                <span className="legend-dot comments-tiktok"></span> Comments
              </p>
            </div>
          </div>

          {/* 2. Share of Sentiment Box */}
          <div className="tiktok-stats-box sentiment-chart">
            <h3>Share of Sentiment</h3>
            <div className="chart-container" style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <LabelList
                      dataKey="value"
                      formatter={(v) => `${v}%`}
                      position="outside"
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        fill: "#333",
                      }}
                    />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="sentiment-legend">
              <div>
                <span className="legend-dot pos-tiktok"></span> Positive
              </div>
              <div>
                <span className="legend-dot neu-tiktok"></span> Neutral
              </div>
              <div>
                <span className="legend-dot neg-tiktok"></span> Negative
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="tiktok-video-content-container">
          <div className="tiktok-section-header">
            <h3 className="section-title">Video Content</h3>
            <span className="video-count-badge-alt">
              {videos.length} Videos
            </span>
          </div>

          <div className="tiktok-video-display-area">
            {loading ? (
              <div className="loader-container">
                <div className="tiktok-spinner"></div>
                <p>Loading TikToks...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="tiktok-empty-state">
                <img
                  src={noDataIcon}
                  alt="no-data"
                  className="empty-icon-star"
                />
                <h4>No Videos found</h4>
              </div>
            ) : (
              <>
                <div className="tiktok-grid">
                  {videos.slice(0, visibleVideos).map((v) => (
                    <div
                      key={v._id}
                      className="tiktok-card"
                      onClick={() => openSidebar(v)}
                    >
                      <div className="video-preview-wrapper">
                        <video
                          src={
                            v.media_url?.startsWith("http")
                              ? v.media_url
                              : `http://localhost:5000/${v.media_url}`
                          }
                          muted
                          preload="metadata"
                          className="card-video-element"
                        />
                        <div className="video-overlay">
                          <span>▶ {v.view_count || 0}</span>
                        </div>
                      </div>
                      <div className="video-info">
                        <p className="video-caption-text">
                          {v.caption || "No caption"}
                        </p>
                        <small className="video-date">
                          {v.timestamp
                            ? new Date(v.timestamp).toLocaleDateString("en-GB")
                            : "No Date"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                {videos.length > 5 && (
                  <div
                    className="view-more-container"
                    style={{ textAlign: "center", marginTop: "30px" }}
                  >
                    <button
                      className="view-more-btn"
                      onClick={handleToggleVideos}
                    >
                      {visibleVideos >= videos.length
                        ? "View Less"
                        : "View More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* TikTok Sidebar */}
      {sidebarOpen && selectedItem && (
        <div className="post-sidebar tiktok-sidebar-theme">
          {/* 1. Header */}
          <div className="sidebar-header">
            <h4>Tiktok Video</h4>
            <button className="close-btn" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div className="sidebar-scrollable-body">
            {/* Video Section */}
            <div className="sidebar-media-container">
              <video
                key={selectedItem.id}
                src={selectedItem.media_url}
                controls
                autoPlay
                className="sidebar-post-image"
              />
            </div>
            <div className="sidebar-post-caption">
              {selectedItem.caption || "No description available"}
            </div>
            <div className="engagement-row">
              <div className="engagement-item">
                ❤️ {selectedItem.likes || 0}
              </div>
              <div className="engagement-item">
                💬 {selectedItem.comments_count || 0}
              </div>
              <div className="engagement-item">
                👁️ {selectedItem.view_count || 0}
              </div>
            </div>

            {/*Tabs Section */}
            <div className="sidebar-tabs">
              <span
                className={activeTab === "comments" ? "active" : ""}
                onClick={() => setActiveTab("comments")}
              >
                💬 Comments
              </span>
              <span
                className={activeTab === "likes" ? "active" : ""}
                onClick={() => setActiveTab("likes")}
              >
                ❤️ Likes
              </span>
            </div>

            {/*Content Section*/}
            <div className="sidebar-tab-content">
              {activeTab === "comments" ? (
                /* --- COMMENTS TAB --- */
                selectedItem.fakeComments &&
                selectedItem.fakeComments.length > 0 ? (
                  selectedItem.fakeComments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <img
                        src={`https://ui-avatars.com/api/?name=${c.username || "User"}&background=random&color=fff`}
                        className="comment-avatar-img"
                        alt="avatar"
                      />
                      <div className="comment-body">
                        <span className="comment-username">{c.username}</span>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No comments yet</p>
                )
              ) : (
                /* --- LIKES TAB --- */
                <div
                  className="likes-tab-content"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "25px 10px",
                    borderBottom: "1px solid #eff3f4",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "16px",
                      color: "#0f1419",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>❤️</span>
                    <span>
                      <strong>{selectedItem.likes || 0}</strong> Likes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/*Footer Delete Button */}
          <div className="sidebar-footer">
            <button
              className="delete-post-btn-footer"
              onClick={() => handleDeletePost(selectedItem)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
              Delete TikTok Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTok;
