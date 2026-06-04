import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Pencil, Trash2, Calendar, Plus } from "lucide-react";
import fblogo from "../Assets/Fblogo (2).png";
import twlogo from "../Assets/twitterlogo.png";
import instalogo from "../Assets/instagramlogo.png";
import tiktoklogo from "../Assets/tiktok.png"; // Ensure you have this asset
import "./ScheduledPosts.css";

const API_BASE_URL = "http://localhost:5000";

const icons = {
  facebook: fblogo,
  instagram: instalogo,
  twitter: twlogo,
  tiktok: tiktoklogo, // TikTok Icon Added
};

const platformColors = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  twitter: "#373838",
  tiktok: "#000000", // TikTok Color Added
};

const ClockIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      width: "14px",
      height: "14px",
      marginRight: "5px",
      verticalAlign: "middle",
    }}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ScheduledPosts = () => {
  const navigate = useNavigate();
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState("all");
  const dateInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [editedTime, setEditedTime] = useState("");

  useEffect(() => {
    fetchScheduledPosts();
    updateWeekStart(currentDate);
  }, [currentDate]);

  const isToday = (day, month, year) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const fetchScheduledPosts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/posts/all-scheduled",
      );
      setScheduledPosts(res.data.posts || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;

    if (!destination || destination.droppableId === source.droppableId) return;
    const now = new Date();
    const [year, month, day] = destination.droppableId.split("-").map(Number);
    const destDate = new Date(year, month, day);
    destDate.setHours(23, 59, 59, 999);

    if (destDate < now) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Move",
        text: "You cannot reschedule posts to a past date!",
        confirmButtonColor: "#007bff",
      });
      return;
    }

    const parts = draggableId.split("-");
    const postId = parts[0];
    const platform = parts[1].toLowerCase();

    try {
      await axios.put(`http://localhost:5000/api/posts/reschedule/${postId}`, {
        newDate: destination.droppableId,
        platform: platform,
        status: "scheduled",
      });

      await fetchScheduledPosts();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Post Moved Successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error("Move Error:", err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Post move nahi ho saki!",
      });
    }
  };

  const updateWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateWeekStart(today);
  };

  const getFilteredPosts = () => {
    if (platformFilter === "all") return scheduledPosts;
    return scheduledPosts.filter((post) => {
      const matchSingle = post.platform?.toLowerCase() === platformFilter;
      const matchArray = post.platforms?.some(
        (p) => p.toLowerCase() === platformFilter,
      );
      return matchSingle || matchArray;
    });
  };

  const handleDelete = async (postId) => {
    const platform = selectedPost?.platform?.toLowerCase();
    const deleteURL =
      platform === "tiktok"
        ? `http://localhost:5000/api/tiktok/post/${postId}`
        : `http://localhost:5000/api/posts/delete/${postId}`;

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#007bff",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(deleteURL);

          if (response.data.success) {
            setShowModal(false);
            fetchScheduledPosts();
            Swal.fire("Deleted!", "Your post has been removed.", "success");
          } else {
            Swal.fire(
              "Error!",
              response.data.message || "Could not delete.",
              "error",
            );
          }
        } catch (error) {
          Swal.fire("Error!", "Failed to delete post.", "error");
        }
      }
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/posts/update/${selectedPost._id}`,
        {
          message: editedMessage,
          scheduledTime: new Date(editedTime),
        },
      );
      setIsEditing(false);
      fetchScheduledPosts();
      setShowModal(false);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Post updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire("Error!", "Failed to update post.", "error");
    }
  };

  const openPostModal = (post) => {
    setSelectedPost(post);
    setEditedMessage(post.message || "");
    if (post.scheduledTime) {
      const date = new Date(post.scheduledTime);
      const formattedDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      setEditedTime(formattedDate);
    }
    setIsEditing(false);
    setShowModal(true);
  };

  const getMediaUrl = (url) => {
    if (!url) return "";

    if (url.startsWith("http")) {
      if (url.includes("cloudinary.com") && url.includes("/upload/")) {
        return url.replace("/upload/", "/upload/f_auto,q_auto,vc_h264/");
      }
      return url;
    }

    return `${API_BASE_URL}/${url.replace(/\\/g, "/")}`;
  };
  const renderPostItem = (post, index) => {
    const rawPlatform =
      post.platform || (post.platforms && post.platforms[0]) || "facebook";
    const platformKey = rawPlatform.toLowerCase();
    const isPublished = post.status?.toLowerCase() === "published";
    const postStatusClass = isPublished ? "published-post" : "scheduled-post";

    const rawUrl = post.videoUrl || post.imageUrl;

    const isVideo =
      post.videoUrl ||
      post.imageUrl?.toLowerCase().endsWith(".mp4") ||
      post.imageUrl?.toLowerCase().endsWith(".webm") ||
      post.imageUrl?.toLowerCase().endsWith(".mov") ||
      platformKey === "tiktok";

    const mediaUrl =
      rawUrl && !rawUrl.startsWith("http")
        ? `http://localhost:5000/${rawUrl.replace(/\\/g, "/")}`
        : rawUrl;

    return (
      <Draggable
        key={`${post._id}-${post.platform}`}
        draggableId={`${post._id}-${post.platform}`}
        index={index}
        isDragDisabled={isPublished}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={
              viewMode === "month"
                ? `post-item ${postStatusClass}`
                : viewMode === "week"
                  ? `post-card-professional ${postStatusClass}`
                  : `day-view-post-card ${postStatusClass}`
            }
            style={{
              ...provided.draggableProps.style,
              backgroundColor:
                viewMode === "month" ? platformColors[platformKey] : undefined,
              opacity: snapshot.isDragging ? 0.8 : 1,
            }}
            onClick={() => openPostModal(post)}
          >
            {viewMode === "month" ? (
              <>
                <img src={icons[platformKey]} className="post-icon" alt="" />
                <span className="post-time-text">
                  {new Date(post.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isPublished ? (
                  <span>✔</span>
                ) : (
                  <ClockIcon className="pro-icon-month" />
                )}
              </>
            ) : viewMode === "week" ? (
              <>
                <div
                  className="post-card-header"
                  style={{
                    borderLeft: `3px solid ${platformColors[platformKey]}`,
                  }}
                >
                  <div className="platform-info">
                    <img
                      src={icons[platformKey]}
                      className="mini-platform-icon"
                      alt=""
                    />
                    <span className="post-time">
                      {new Date(post.scheduledTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="post-card-body-compact">
                  <p className="post-card-caption-top">
                    {post.message?.split(" ").slice(0, 2).join(" ") + "..."}
                  </p>
                  {mediaUrl &&
                    (isVideo ? (
                      <video
                        src={mediaUrl}
                        className="post-card-thumbnail-small"
                        muted
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        className="post-card-thumbnail-small"
                        alt=""
                      />
                    ))}
                  <div
                    className={`status-square-box ${isPublished ? "is-published" : "is-scheduled"}`}
                  >
                    {isPublished ? (
                      <>
                        <span className="published-tick">✔</span>
                        Published
                      </>
                    ) : (
                      <>
                        <ClockIcon /> Scheduled
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="day-post-header"
                  style={{
                    borderLeft: `5px solid ${platformColors[platformKey]}`,
                  }}
                >
                  <img
                    src={icons[platformKey]}
                    className="day-platform-icon"
                    alt=""
                  />
                  <span className="day-post-time">
                    {new Date(post.scheduledTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`day-status-pill ${isPublished ? "pill-pub" : "pill-sch"}`}
                  >
                    {isPublished ? (
                      "✔ Published"
                    ) : (
                      <>
                        <ClockIcon /> Scheduled
                      </>
                    )}
                  </span>
                </div>
                <div className="day-post-content">
                  {mediaUrl &&
                    (isVideo ? (
                      <video src={mediaUrl} className="day-post-image" muted />
                    ) : (
                      <img src={mediaUrl} className="day-post-image" alt="" />
                    ))}
                  <p className="day-post-message">{post.message}</p>
                </div>
              </>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const monthDays = [
    ...Array(startDay === 0 ? 6 : startDay - 1).fill(""),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      month,
      year,
      dateId: `${year}-${month}-${i + 1}`,
    })),
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return {
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateId: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    };
  });

  const singleDay = [
    {
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      dayNameLong: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
      dateId: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
    },
  ];

  return (
    <div className="calendar-container">
      <div className="modern-toolbar">
        <div className="toolbar-left">
          <button className="nav-circle-btn" onClick={handlePrev}>
            ‹
          </button>
          <button className="today-btn" onClick={handleGoToToday}>
            Today
          </button>
          <button className="nav-circle-btn" onClick={handleNext}>
            ›
          </button>
          <div
            className="date-range-display"
            onClick={() => dateInputRef.current.showPicker()}
          >
            <Calendar size={18} className="calendar-trigger-icon" />
            <span className="date-text">
              {viewMode === "month"
                ? currentDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                : viewMode === "week"
                  ? `${new Date(currentWeekStart).toLocaleString("default", { month: "short", day: "numeric" })} - ${new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleString("default", { month: "short", day: "numeric" })}, ${currentDate.getFullYear()}`
                  : currentDate.toLocaleDateString("default", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
            </span>
            <input
              type="date"
              ref={dateInputRef}
              className="invisible-input"
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <select
            className="platform-filter-dropdown"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="tiktok">TikTok</option> {/* Added TikTok Option */}
          </select>
          <div className="tooltip-container">
            <button
              className="plus-action-btn"
              onClick={() => navigate("/dashboard/createpost")}
            >
              <Plus size={22} />
            </button>
            <span className="tooltip-text">Create Post</span>
          </div>
          <div className="view-mode-pill">
            <button
              className={viewMode === "day" ? "active" : ""}
              onClick={() => setViewMode("day")}
            >
              Day
            </button>
            <button
              className={viewMode === "month" ? "active" : ""}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
            <button
              className={viewMode === "week" ? "active" : ""}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={
            viewMode === "week"
              ? "week-grid"
              : viewMode === "day"
                ? "day-grid"
                : "calendar-grid"
          }
        >
          {(viewMode === "month"
            ? monthDays
            : viewMode === "week"
              ? weekDays
              : singleDay
          ).map((item, index) => {
            if (!item || (viewMode === "month" && item === ""))
              return <div className="day-box empty" key={index}></div>;

            const rawPosts = getFilteredPosts().filter((p) => {
              const d = new Date(p.scheduledTime);
              const postDateId = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              return postDateId === item.dateId;
            });

            const postsForDay = rawPosts.flatMap((p) => {
              // Check karein agar 'platforms' array exists karta hai aur khali nahi hai
              if (p.platforms && p.platforms.length > 0) {
                return p.platforms.map((plt) => ({ ...p, platform: plt }));
              }

              // Fallback agar sirf 'platform' string ho
              return [{ ...p, platform: p.platform || "facebook" }];
            });

            const shouldLimit = viewMode === "month" || viewMode === "week";
            const MAX_VISIBLE = 2;
            const visiblePosts = shouldLimit
              ? postsForDay.slice(0, MAX_VISIBLE)
              : postsForDay;
            const remainingCount = postsForDay.length - MAX_VISIBLE;

            return (
              <Droppable droppableId={item.dateId} key={item.dateId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`day-box ${viewMode !== "month" ? "day-column" : ""} ${snapshot.isDraggingOver ? "dragging-over" : ""} ${isToday(item.day, item.month, item.year) ? "active-today" : ""}`}
                  >
                    <div className="day-header-container">
                      {viewMode !== "month" && (
                        <span className="day-name-label">
                          {item.dayName || item.dayNameLong}
                        </span>
                      )}
                      <div
                        className={`day-number ${isToday(item.day, item.month, item.year) ? "today-number-active" : ""}`}
                      >
                        {item.day}
                      </div>
                    </div>
                    <div className="posts-container">
                      {postsForDay.length > 0 ? (
                        <>
                          {visiblePosts.map((post, i) =>
                            renderPostItem(post, i),
                          )}
                          {shouldLimit && remainingCount > 0 && (
                            <div
                              className="view-more-badge-professional"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentDate(
                                  new Date(item.year, item.month, item.day),
                                );
                                setViewMode("day");
                              }}
                            >
                              + {remainingCount} more
                            </div>
                          )}
                        </>
                      ) : (
                        viewMode === "day" && (
                          <div className="no-posts-container">
                            <div className="no-posts-icon">📅</div>
                            <p className="no-posts-text">
                              No posts scheduled for today
                            </p>
                            <button
                              className="schedule-now-btn"
                              onClick={() => navigate("/dashboard/createpost")}
                            >
                              Schedule a Post
                            </button>
                          </div>
                        )
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal Section */}
      {showModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal edit-modal-height"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="schedule-post-card">
              <div className="schedule-post-header">
                <img
                  src={icons[selectedPost.platform?.toLowerCase()]}
                  className="schedule-platform-icon"
                  alt=""
                />
                <h4>{selectedPost.platform} Post</h4>
                <div className="action-buttons">
                  {!isEditing && (
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(selectedPost._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Modal Media Section: Image aur Video dono ke liye */}
              {/* Modal Media Section - Replace your existing media div with this */}
              {(selectedPost.imageUrl || selectedPost.videoUrl) && (
                <div className="schedule-media-preview">
                  {selectedPost.videoUrl ||
                  selectedPost.imageUrl?.toLowerCase().endsWith(".mp4") ||
                  selectedPost.platform?.toLowerCase() === "tiktok" ? (
                    <video
                      src={
                        (
                          selectedPost.videoUrl || selectedPost.imageUrl
                        )?.startsWith("http")
                          ? selectedPost.videoUrl || selectedPost.imageUrl
                          : `http://localhost:5000/${(selectedPost.videoUrl || selectedPost.imageUrl)?.replace(/\\/g, "/")}`
                      }
                      controls
                      autoPlay
                      className="schedule-post-image"
                    />
                  ) : (
                    <img
                      src={selectedPost.imageUrl}
                      className="schedule-post-image"
                      alt=""
                    />
                  )}
                </div>
              )}
              <div className="schedule-post-caption">
                {isEditing ? (
                  <>
                    <label className="edit-label">Caption</label>
                    <textarea
                      className="edit-textarea"
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                    />
                    <label className="edit-label">Schedule Time</label>
                    <input
                      type="datetime-local"
                      className="edit-time-input"
                      value={editedTime}
                      onChange={(e) => setEditedTime(e.target.value)}
                    />
                  </>
                ) : (
                  <p>{selectedPost.message}</p>
                )}
              </div>
              {isEditing ? (
                <div className="edit-save-actions">
                  <button className="save-btn" onClick={handleUpdate}>
                    Save Changes
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="schedule-post-info">
                  <p>
                    <strong>Time:</strong>{" "}
                    {new Date(selectedPost.scheduledTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedPost.status}
                  </p>
                </div>
              )}
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledPosts;
