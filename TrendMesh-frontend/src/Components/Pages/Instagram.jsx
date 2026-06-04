import React, { useEffect, useState } from "react";
import "./Instagram.css";
import instagramlogo from "../Assets/instagramlogo.png";
import noDataIcon from "../Assets/star.png";
import axios from "axios";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

const Instagram = () => {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("comments");
  const [contentType, setContentType] = useState("");
  const [weeklyData, setWeeklyData] = useState([]);
  const [sentimentStats, setSentimentStats] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [visibleReels, setVisibleReels] = useState(5);
  const COLORS = ["#E1306C", "#A8A8A8", "#F56040"];

  // Existing Chart Data
  const chartData = [
    { day: "Mon", reach: 120, likes: 80, comments: 30 },
    { day: "Tue", reach: 160, likes: 100, comments: 40 },
    { day: "Wed", reach: 180, likes: 120, comments: 50 },
    { day: "Thu", reach: 90, likes: 60, comments: 25 },
    { day: "Fri", reach: 140, likes: 90, comments: 35 },
    { day: "Sat", reach: 200, likes: 140, comments: 55 },
    { day: "Sun", reach: 110, likes: 70, comments: 20 },
  ];

  //Fetch Functions
  const fetchInstagramPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/instagram/posts");
      setPosts(
        (res.data.posts || []).map((p) => ({
          ...p,
          mediaType:
            p.mediaType || (p.media_type === "VIDEO" ? "VIDEO" : "IMAGE"),
        })),
      );
    } catch (err) {
      console.error("Posts fetch error:", err);
    }
  };

  const fetchInstagramReels = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/instagram/reels");
      setReels(res.data.reels || []);
    } catch (err) {
      console.error("Reels fetch error:", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/instagram/dashboard-stats",
      );

      setWeeklyData(res.data.weeklyPerformance || []);
      setSentimentStats(res.data.sentimentStats || []);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  const handleTogglePosts = () => {
    if (visiblePosts >= posts.length) {
      setVisiblePosts(5);
    } else {
      setVisiblePosts(posts.length);
    }
  };

  const handleToggleReels = () => {
    if (visibleReels >= reels.length) {
      setVisibleReels(5);
    } else {
      setVisibleReels(reels.length);
    }
  };

  const handleDeletePost = async (item) => {
    const idToDelete = item.postId || item.id || item._id;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the post from Instagram!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff4d4f",
      cancelButtonColor: "#8c8c8c",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(
          `http://localhost:5000/api/instagram/post/${idToDelete}`,
        );
        if (res.data.success) {
          Swal.fire("Deleted!", "Your post has been removed.", "success");
          setSidebarOpen(false);
          fetchInstagramPosts();
        }
      } catch (err) {
        Swal.fire(
          "Error!",
          err.response?.data?.error || "Failed to delete",
          "error",
        );
      }
    }
  };

  const openSidebar = async (item, type) => {
    setSelectedItem(item);
    setContentType(type);
    setSidebarOpen(true);

    setActiveTab("comments");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/instagram/comments/${item.id || item.postId}`,
      );
      console.log("Comments Data from API:", res.data.comments); // Isse browser console mein check karein
      setSelectedItem((prev) => ({ ...prev, comments: res.data.comments }));
    } catch (err) {
      console.log("No comments found");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchInstagramPosts(),
        fetchInstagramReels(),
        fetchDashboardStats(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "No Date";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "No Date"
      : date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div className="insta-wrapper">
      <div className="insta-header">
        <img src={instagramlogo} alt="insta" className="instagramlogo" />
        <div>
          <h3>Your Instagram Page</h3>
          <p>Manage your Instagram posts, reels and track performance</p>
        </div>
      </div>

      <div className="insta-stats-container">
        {/* Weekly Bar Chart */}
        <div className="insta-stats-box performance-chart">
          <h3>Weekly Performance</h3>
          <div className="chart-container custom" style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData.length > 0 ? weeklyData : []}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reach" fill="#E1306C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="likes" fill="#833AB4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" fill="#FCAF45" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <p>
              <span className="legend-dot reach-insta"></span> Reach
            </p>
            <p>
              <span className="legend-dot likes-insta"></span> Likes
            </p>
            <p>
              <span className="legend-dot comments-insta"></span> Comments
            </p>
          </div>
        </div>

        {/* Sentiment Pie Chart */}
        <div className="insta-stats-box sentiment-chart">
          <h3>Share of Sentiment</h3>
          <div className="chart-container" style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    sentimentStats && sentimentStats.length > 0
                      ? sentimentStats
                      : [{ name: "No Data", value: 100, fill: "#eee" }]
                  }
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {sentimentStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || COLORS[index % COLORS.length]}
                    />
                  ))}

                  <LabelList
                    dataKey="value"
                    formatter={(v) => (v > 0 ? `${v}%` : "")}
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
              <span className="legend-dot pos-insta"></span> Positive
            </div>
            <div>
              <span className="legend-dot neu-insta"></span> Neutral
            </div>
            <div>
              <span className="legend-dot neg-insta"></span> Negative
            </div>
          </div>
        </div>
      </div>

      {/*Reels, Posts Sections*/}

      <div className="insta-post-section reels-section">
        <div className="insta-post-header">
          <h3>Instagram Reels</h3>
          <span>{reels.length} Reels</span>
        </div>
        <div className="insta-post-list">
          {reels
            .filter((r) => (r.mediaType || r.media_type) === "VIDEO")
            .slice(0, visibleReels)
            .map((r) => (
              <div
                key={r.id}
                className="insta-post-card"
                onClick={() => openSidebar(r, "reel")}
              >
                <div className="post-card-media">
                  <video src={r.media_url || r.imageUrl} />
                </div>
                <div className="post-card-content">
                  {r.caption && <p>{r.caption}</p>}
                </div>
                <small className="post-date">
                  {formatDate(r.timestamp || r.createdAt)}
                </small>
              </div>
            ))}
        </div>
        {/* View More/Less for Reels */}
        {reels.length > 5 && (
          <div
            className="view-more-container"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            <button className="view-more-btn" onClick={handleToggleReels}>
              {visibleReels >= reels.length ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>

      <div className="insta-post-section posts-section">
        <div className="insta-post-header">
          <h3>Instagram Posts</h3>
          <span>{posts.length} Posts</span>
        </div>
        <div className="insta-post-list">
          {posts
            .filter((p) => p.mediaType === "IMAGE" || !p.mediaType)
            .slice(0, visiblePosts)
            .map((p) => (
              <div
                key={p.postId}
                className="insta-post-card"
                onClick={() => openSidebar(p, "post")}
              >
                <div className="post-card-media">
                  {p.media_url || p.imageUrl ? (
                    <img
                      src={
                        p.mediaType === "VIDEO" || p.media_type === "REELS"
                          ? p.thumbnail_url || p.imageUrl
                          : p.media_url || p.imageUrl
                      }
                      alt="post"
                    />
                  ) : (
                    <div>No Image</div>
                  )}{" "}
                </div>
                <div className="post-card-content">
                  {p.title && <h4 className="post-card-title">{p.title}</h4>}
                  <p>{p.message || p.caption}</p>
                </div>
                <small className="post-date">
                  {formatDate(p.created_time || p.createdAt)}
                </small>
              </div>
            ))}
        </div>
        {/* View More/Less for Posts */}
        {posts.length > 5 && (
          <div
            className="view-more-container"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            <button className="view-more-btn" onClick={handleTogglePosts}>
              {visiblePosts >= posts.length ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Section */}
      {sidebarOpen && selectedItem && (
        <div className="post-sidebar">
          <div className="sidebar-header">
            <h4>
              Instagram{" "}
              {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </h4>
            <button className="close-btn" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>

          <div className="sidebar-scrollable-body">
            {(selectedItem.media_url || selectedItem.imageUrl) &&
              (contentType === "reel" ? (
                <video
                  src={selectedItem.media_url || selectedItem.imageUrl}
                  controls
                  className="sidebar-post-image"
                />
              ) : (
                <img
                  src={selectedItem.media_url || selectedItem.imageUrl}
                  className="sidebar-post-image"
                  alt=""
                />
              ))}
            <div className="sidebar-post-caption">
              {selectedItem.title && (
                <strong>
                  {selectedItem.title}
                  <br />
                </strong>
              )}
              {selectedItem.caption || selectedItem.message || "No description"}
            </div>

            {/* Engagement & Tabs*/}
            <div className="engagement-row">
              <div className="engagement-item">
                ❤️ {selectedItem.likes || 0}
              </div>
              {contentType !== "story" && (
                <div className="engagement-item">
                  💬 {selectedItem.comments?.length || 0}
                </div>
              )}
            </div>

            <div className="sidebar-tabs">
              {contentType !== "story" && (
                <span
                  className={activeTab === "comments" ? "active" : ""}
                  onClick={() => setActiveTab("comments")}
                >
                  💬 Comments
                </span>
              )}
              <span
                className={activeTab === "likes" ? "active" : ""}
                onClick={() => setActiveTab("likes")}
              >
                👍 Likes
              </span>
            </div>

            <div className="sidebar-tab-content">
              {/* Tab mapping*/}
              {activeTab === "comments" ? (
                selectedItem.comments?.map((c, i) => (
                  <div key={i} className="comment-item">
                    <img
                      src={`https://ui-avatars.com/api/?name=${c.username}`}
                      className="comment-avatar-img"
                      alt=""
                    />
                    <div className="comment-body">
                      <span className="comment-username">{c.username}</span>
                      <p className="comment-text">{c.message || c.text}</p>
                    </div>
                  </div>
                )) || <p className="empty-text">No comments</p>
              ) : (
                <div className="likes-tab">
                  <p>❤️ {selectedItem.likes || 0} Likes</p>
                </div>
              )}
            </div>
          </div>

          {/*DELETE BUTTON*/}
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
              Delete Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instagram;
