import React, { useEffect, useState } from "react";
import "./Twitter.css";
import twitterLogo from "../Assets/twitterlogo.png";
import starIcon from "../Assets/star.png";
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
  LabelList,
} from "recharts";

const Twitter = () => {
  const [tweets, setTweets] = useState([]);
  const [videoTweets, setVideoTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [contentType, setContentType] = useState("");

  const [activeTab, setActiveTab] = useState("comments");
  const [showAllTweets, setShowAllTweets] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const initialLimit = 5;

  const [fakeLikes, setFakeLikes] = useState(0);
  const [fakeComments, setFakeComments] = useState([]);

  // Weekly Performance Data
  const chartData = [
    { day: "Mon", impression: 120, tweets: 80, comments: 30 },
    { day: "Tue", impression: 160, tweets: 100, comments: 40 },
    { day: "Wed", impression: 180, tweets: 120, comments: 50 },
    { day: "Thu", impression: 90, tweets: 60, comments: 25 },
    { day: "Fri", impression: 140, tweets: 90, comments: 35 },
    { day: "Sat", impression: 200, tweets: 140, comments: 55 },
    { day: "Sun", impression: 110, tweets: 70, comments: 20 },
  ];

  // Sentiment Data
  const sentimentData = [
    { name: "Positive", value: 30, fill: "#1DA1F2" },
    { name: "Neutral", value: 45, fill: "#A8A8A8" },
    { name: "Negative", value: 25, fill: "#F56040" },
  ];

  // ================= FETCH =================
  const fetchTwitterData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/twitter/scheduled",
      );
      const allPosts = res.data.posts || [];

      const sorted = allPosts.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt) -
          new Date(a.publishedAt || a.createdAt),
      );
      const publishedPosts = sorted.filter((p) => p.status === "published");
      setTweets(
        publishedPosts.filter((p) => {
          const isVid =
            p.imageUrl?.match(/\.(mp4|mov|webm)$/i) || p.media_type === "VIDEO";
          return !isVid;
        }),
      );

      setVideoTweets(
        publishedPosts.filter((p) => {
          return (
            p.imageUrl?.match(/\.(mp4|mov|webm)$/i) || p.media_type === "VIDEO"
          );
        }),
      );

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwitterData();
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

  // ================= SIDEBAR OPEN =================
  const openSidebar = (item, type) => {
    setSelectedItem(item);
    setContentType(type);
    setSidebarOpen(true);
    setActiveTab("comments");

    const randomLikes = Math.floor(Math.random() * 500) + 10;

    const names = ["Ali", "Sara", "Ahmed", "Zain", "Ayesha"];
    const texts = ["Nice!", "Great 🔥", "Love it!", "Amazing!", "Cool post"];

    const demoComments = Array.from({ length: 3 }, () => ({
      username: names[Math.floor(Math.random() * names.length)],
      text: texts[Math.floor(Math.random() * texts.length)],
    }));

    setFakeLikes(randomLikes);
    setFakeComments(demoComments);
  };

  // ================= DELETE =================
  const handleDeletePost = async (post) => {
    const id = post?._id;
    if (!id) return;

    const result = await Swal.fire({
      title: "Delete post?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(
          `http://localhost:5000/api/twitter/post/${id}`,
        );

        if (res.data.success) {
          setTweets((p) => p.filter((x) => x._id !== id));
          setVideoTweets((p) => p.filter((x) => x._id !== id));

          setSidebarOpen(false);
          setSelectedItem(null);

          Swal.fire("Deleted!", "Post removed.", "success");
        }
      } catch (err) {
        Swal.fire("Error", "Delete failed", "error");
      }
    }
  };

  // ================= RENDER =================
  return (
    <div className="twitter-wrapper">
      {/* HEADER */}
      <div className="twitter-header">
        <img src={twitterLogo} className="twitterlogo" />
        <div>
          <h3>Twitter Analytics</h3>
          <p>Monitor engagement</p>
        </div>
      </div>

      {/* ===== CHARTS & SENTIMENT SECTION ===== */}
      <div className="twitter-stats-container">
        {/* 1. Weekly Performance Box */}
        <div className="twitter-stats-box performance-chart">
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
                <Bar dataKey="impression" fill="#1DA1F2" />
                <Bar dataKey="tweets" fill="#17BF63" />
                <Bar dataKey="comments" fill="#F45D22" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <p>
              <span className="legend-dot impression-twitter"></span> Impression
            </p>
            <p>
              <span className="legend-dot tweets-twitter"></span> Tweets
            </p>
            <p>
              <span className="legend-dot comments-twitter"></span> Comments
            </p>
          </div>
        </div>

        {/* 2. Share of Sentiment Box */}
        <div className="twitter-stats-box sentiment-chart">
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
              <span className="legend-dot pos-twitter"></span> Positive
            </div>
            <div>
              <span className="legend-dot neu-twitter"></span> Neutral
            </div>
            <div>
              <span className="legend-dot neg-twitter"></span> Negative
            </div>
          </div>
        </div>
      </div>

      {/* ================= TWEETS ================= */}
      <div className="twitter-post-section">
        <div className="twitter-post-header">
          <h3>Latest Tweets</h3>
          <span>{tweets.length} Posts</span>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : tweets.length === 0 ? (
          <div className="empty-state">
            <img src={starIcon} className="star-icon" />
            <p>No Tweets found</p>
          </div>
        ) : (
          <>
            <div className="twitter-post-list">
              {(showAllTweets ? tweets : tweets.slice(0, initialLimit)).map(
                (t) => (
                  <div
                    key={t._id}
                    className="twitter-post-card"
                    onClick={() => openSidebar(t, "tweet")}
                  >
                    <div className="post-card-media">
                      {t.imageUrl ? (
                        t.media_type === "VIDEO" ? (
                          <video src={t.imageUrl} controls />
                        ) : (
                          <img src={t.imageUrl} />
                        )
                      ) : (
                        <div className="text-only-placeholder">Text Tweet</div>
                      )}
                    </div>

                    <p className="tweet-text">{t.message}</p>
                    <small className="post-date">
                      {formatDate(t.timestamp || t.created_time || t.createdAt)}
                    </small>
                  </div>
                ),
              )}
            </div>

            {tweets.length > initialLimit && (
              <button
                className="view-more-btn"
                onClick={() => setShowAllTweets(!showAllTweets)}
              >
                {showAllTweets ? "View Less" : "View More"}
              </button>
            )}
          </>
        )}
      </div>

      {/* ================= VIDEOS ================= */}
      <div className="twitter-post-section">
        <div className="twitter-post-header">
          <h3>Video Tweets</h3>
          <span>{videoTweets.length} Videos</span>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : videoTweets.length === 0 ? (
          <div className="empty-state">
            <img src={starIcon} className="star-icon" alt="no videos" />
            <p>No Videos available</p>
          </div>
        ) : (
          <>
            <div className="twitter-post-list">
              {(showAllVideos
                ? videoTweets
                : videoTweets.slice(0, initialLimit)
              ).map((v) => (
                <div
                  key={v._id}
                  className="twitter-post-card"
                  onClick={() => openSidebar(v, "video")}
                >
                  <div className="post-card-media">
                    {v.imageUrl && <video src={v.imageUrl} controls muted />}
                  </div>

                  <p className="tweet-text">{v.message}</p>
                  <small className="post-date">
                    {formatDate(v.timestamp || v.created_time || v.createdAt)}
                  </small>
                </div>
              ))}
            </div>

            {videoTweets.length > initialLimit && (
              <button
                className="view-more-btn"
                onClick={() => setShowAllVideos(!showAllVideos)}
              >
                {showAllVideos ? "View Less" : "View More"}
              </button>
            )}
          </>
        )}
      </div>

      {/* ================= SIDEBAR ================= */}
      {sidebarOpen && selectedItem && (
        <div className="post-sidebar">
          <div className="sidebar-header">
            <h4>Twitter {contentType}</h4>
            <button className="close-btn" onClick={() => setSidebarOpen(false)}>
              ✕
            </button>
          </div>

          <div className="sidebar-scrollable-body">
            {/* MEDIA */}
            {selectedItem.imageUrl &&
              (selectedItem.imageUrl.match(/\.(mp4|mov|webm)$/i) ||
              selectedItem.media_type === "VIDEO" ||
              selectedItem.mediaType === "VIDEO" ? (
                <video
                  src={selectedItem.imageUrl}
                  className="sidebar-post-image"
                  controls
                />
              ) : (
                <img
                  src={selectedItem.imageUrl}
                  className="sidebar-post-image"
                  alt="post"
                />
              ))}

            {/* CAPTION */}
            <div className="sidebar-post-caption">{selectedItem.message}</div>

            {/* ENGAGEMENT */}
            <div className="engagement-row">
              <div>❤️ {fakeLikes}</div>
              <div>💬 {fakeComments.length}</div>
            </div>

            {/* TABS */}
            <div className="sidebar-tabs">
              <span
                className={activeTab === "comments" ? "active" : ""}
                onClick={() => setActiveTab("comments")}
              >
                Comments
              </span>

              <span
                className={activeTab === "likes" ? "active" : ""}
                onClick={() => setActiveTab("likes")}
              >
                Likes
              </span>
            </div>

            {/* CONTENT */}
            <div className="sidebar-content">
              {activeTab === "comments" ? (
                fakeComments.length ? (
                  fakeComments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <img
                        src={`https://ui-avatars.com/api/?name=${c.username || "User"}&background=random&color=fff`}
                        className="comment-avatar-img"
                      />
                      <div>
                        <div className="comment-username">{c.username}</div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No comments</p>
                )
              ) : (
                <p className="likes-count">❤️ {fakeLikes} Likes</p>
              )}
            </div>
          </div>

          {/* DELETE */}
          <div className="sidebar-footer">
            <button
              className="delete-post-btn-footer"
              onClick={() => handleDeletePost(selectedItem)}
            >
              Delete Posts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Twitter;
