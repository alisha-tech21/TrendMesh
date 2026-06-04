import React, { useEffect, useState } from "react";
import "./Facebookpg.css";
import fbIcon from "../Assets/Fblogo (2).png";
import noDataIcon from "../Assets/star.png";
import Swal from "sweetalert2";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  LabelList,
} from "recharts";

// imports ke foran baad add karein
const fixCloudinaryUrl = (url) => {
  if (!url) return "";
  // Cloudinary videos ke liye https aur correct format ensure karta hai
  return url.replace("http://", "https://");
};

const Facebookpg = () => {
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [visiblePosts, setVisiblePosts] = useState(5);

  // Static Data for Charts
  const chartData = [
    { day: "Mon", reach: 120, likes: 80, comments: 30 },
    { day: "Tue", reach: 160, likes: 100, comments: 40 },
    { day: "Wed", reach: 180, likes: 120, comments: 50 },
    { day: "Thu", reach: 90, likes: 60, comments: 25 },
    { day: "Fri", reach: 140, likes: 90, comments: 35 },
    { day: "Sat", reach: 200, likes: 140, comments: 55 },
    { day: "Sun", reach: 110, likes: 70, comments: 20 },
  ];

  const sentimentData = [
    { name: "Positive", value: 29.5, fill: "#4ADE80" },
    { name: "Neutral", value: 44.7, fill: "#94A3B8" },
    { name: "Negative", value: 25.8, fill: "#F87171" },
  ];

  const fetchPages = async () => {
    setPagesLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/facebook/pages");
      setPages(res.data.pages || []);
    } catch (err) {
      console.error("Error loading pages:", err);
    } finally {
      setPagesLoading(false);
    }
  };

  const fetchPostsByPage = async (pageId) => {
    setLoading(true);
    setSelectedPageId(pageId);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/facebook/posts/${pageId}`,
      );
      if (response.data.success) {
        setPosts(response.data.posts);
        setVisiblePosts(5);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Error loading page posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    const idToDelete = post._id || post.postId;
    Swal.fire({
      title: "Are you sure?",
      text: "This post will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `http://localhost:5000/api/facebook/post/${idToDelete}`,
          );
          if (response.data.success) {
            setPosts((prev) =>
              prev.filter((p) => (p._id || p.postId) !== idToDelete),
            );
            setSidebarOpen(false);
            Swal.fire("Deleted!", "Post removed successfully.", "success");
          }
        } catch (err) {
          Swal.fire("Error!", "Failed to delete post.", "error");
        }
      }
    });
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <div className="fb-wrapper">
      {/* Header */}
      <div className="fb-header">
        <img src={fbIcon} alt="fb" className="fb-icon" />
        <div>
          <h3>Your Facebook Page</h3>
          <p>Manage your Facebook posts and track performance</p>
        </div>
      </div>

      {/* ===== CHARTS & SENTIMENT SECTION ===== */}
      <div className="fb-stats-container">
        {/* 1. Weekly Performance Box */}
        <div className="fb-stats-box performance-chart">
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
                <Bar dataKey="reach" fill="#5B8DEF" />
                <Bar dataKey="likes" fill="#9B6BFF" />
                <Bar dataKey="comments" fill="#FF8A65" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <p>
              <span className="legend-dot reach-fb"></span> Reach
            </p>
            <p>
              <span className="legend-dot likes-fb"></span> Likes
            </p>
            <p>
              <span className="legend-dot comments-fb"></span> Comments
            </p>
          </div>
        </div>

        {/* 2. Share of Sentiment Box */}
        <div className="fb-stats-box sentiment-chart">
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
              <span className="legend-dot pos-fb"></span> Positive
            </div>
            <div>
              <span className="legend-dot neu-fb"></span> Neutral
            </div>
            <div>
              <span className="legend-dot neg-fb"></span> Negative
            </div>
          </div>
        </div>
      </div>

      {/* Pages Section */}
      <div className="fb-page-section">
        <div className="fb-page-header">
          <h3>Your Facebook Pages</h3>
          <span className="page-count">
            {pagesLoading ? "Loading..." : `${pages.length} Pages`}
          </span>
        </div>
        {pagesLoading ? (
          <p className="loading-text">Loading pages...</p>
        ) : (
          <div className="fb-page-list">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`fb-page-card ${selectedPageId === page.id ? "active-card" : ""}`}
              >
                <img
                  src={page.picture?.data?.url}
                  alt={page.name}
                  className="fb-page-image"
                />
                <h4>{page.name}</h4>
                <p className="page-category">
                  {page.category || "Social Media Page"}
                </p>
                <button
                  className="manage-page-btn"
                  onClick={() => fetchPostsByPage(page.id)}
                >
                  View Posts
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div className="fb-post-section">
        <div className="fb-post-header">
          <h3>Your Facebook Posts</h3>
          <span className="post-count">
            {loading ? "Loading..." : `${posts.length} Posts`}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading posts...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="fb-post-list">
              {posts.slice(0, visiblePosts).map((post) => (
                <div
                  key={post._id || post.postId}
                  className="fb-post-card"
                  onClick={() => {
                    setSelectedPost(post);
                    setSidebarOpen(true);
                    setActiveTab("comments");
                  }}
                >
                  <div className="post-card-media">
                    {post.imageUrl ? (
                      // ✨ Improved Video Check
                      post.imageUrl.toLowerCase().includes(".mp4") ||
                      post.imageUrl.toLowerCase().includes("/video/upload") ? (
                        <video
                          src={post.imageUrl}
                          className="fb-post-image"
                          muted
                          playsInline
                          onMouseOver={(e) => e.target.play()} // Hover par play hoga
                          onMouseOut={(e) => e.target.pause()}
                        />
                      ) : (
                        <img
                          src={post.imageUrl}
                          alt="FB"
                          className="fb-post-image"
                        />
                      )
                    ) : (
                      <div className="fb-placeholder-media">No Media</div>
                    )}
                  </div>
                  <div className="post-card-content">
                    <p>{post.message || "Facebook Post"}</p>
                  </div>
                  <small className="post-date">
                    {new Date(post.created_time).toLocaleDateString("en-GB")}
                  </small>
                </div>
              ))}
            </div>

            <div className="view-more-container">
              {visiblePosts < posts.length && (
                <button
                  className="view-more-btn"
                  onClick={() => setVisiblePosts(posts.length)}
                >
                  View More
                </button>
              )}
              {visiblePosts > 5 && (
                <button
                  className="view-less-btn"
                  onClick={() => setVisiblePosts(5)}
                >
                  View Less
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="fb-no-posts">
            <img
              src={noDataIcon}
              alt="no-posts"
              className="no-posts-icon star-bright"
            />
            <h4>
              {selectedPageId
                ? "No posts found for this page"
                : "Select a page to see posts"}
            </h4>
          </div>
        )}
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && selectedPost && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="post-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h4>Facebook post</h4>
              <button
                className="close-btn"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="sidebar-scrollable-body">
              {selectedPost.imageUrl &&
                // Behtar check: mediaType check karein ya URL mein video keyword dhoondein
                (selectedPost.mediaType === "VIDEO" ||
                selectedPost.imageUrl.toLowerCase().includes("/video/upload") ||
                selectedPost.imageUrl.match(/\.(mp4|mov|webm|ogv)$/i) ? (
                  <video
                    key={selectedPost.postId} // unique key taake video reload ho
                    src={fixCloudinaryUrl(selectedPost.imageUrl)}
                    controls
                    playsInline
                    preload="auto"
                    className="sidebar-post-image"
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      backgroundColor: "#000",
                    }}
                    onError={(e) => console.log("Video load error:", e)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={selectedPost.imageUrl}
                    alt="post"
                    className="sidebar-post-image"
                  />
                ))}
              <p className="sidebar-post-caption">{selectedPost.message}</p>

              <div className="engagement-row">
                <div className="engagement-item">
                  ❤️ {selectedPost.likes || 0}
                </div>
                <div className="engagement-item">
                  💬 {selectedPost.comments?.length || 0}
                </div>
              </div>

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
                  👍 Likes
                </span>
              </div>

              <div className="sidebar-tab-content">
                {activeTab === "comments" ? (
                  selectedPost.comments?.length > 0 ? (
                    selectedPost.comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.username || c.from?.name || "User")}&background=random`}
                          className="comment-avatar-img"
                          alt="avatar"
                        />
                        <div className="comment-body">
                          <span className="comment-username">
                            {c.username || c.from?.name || "Facebook User"}
                          </span>
                          <p className="comment-text">{c.message || c.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No comments yet</p>
                  )
                ) : (
                  <p className="likes-count">
                    ❤️ This post has <strong>{selectedPost.likes || 0}</strong>{" "}
                    likes
                  </p>
                )}
              </div>
            </div>
            <div className="sidebar-footer">
              <button
                className="delete-post-btn-footer"
                onClick={() => handleDeletePost(selectedPost)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facebookpg;
