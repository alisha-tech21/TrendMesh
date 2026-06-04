import React, { useState, useRef } from "react";
import api from "../api";
import "./CreatePost.css";
import {
  Sparkles,
  Image as ImageIcon,
  Upload,
  X,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

const platforms = ["Instagram", "Facebook", "Twitter", "TikTok"];

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [schedule, setSchedule] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedResult, setGeneratedResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const fileInputRef = useRef();
  const isImageSelected = imageFile && imageFile.type.startsWith("image");
  // AI MODAL LOGIC
  const openAIModal = () => {
    setShowAIModal(true);
    if (title) {
      setAiPrompt(`Write a professional social media caption for: ${title}`);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) {
      alert("Please enter what you want the AI to write about.");
      return;
    }
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/ai/chat",
        { message: aiPrompt },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data && res.data.message) {
        setGeneratedResult(res.data.message);
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert("AI service is currently busy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const useCaption = () => {
    setPostText(generatedResult);
    setShowAIModal(false);
    setGeneratedResult("");
    setAiPrompt("");
  };

  // CORE FUNCTIONS
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeInBytes = 10 * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        showStatus("File size exceeds 10MB limit!", "error");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setImage(URL.createObjectURL(file));
      setImageFile(file);

      if (file.type.startsWith("image")) {
        setSelectedPlatforms((prev) => prev.filter((p) => p !== "TikTok"));
      }
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const resetForm = () => {
    setTitle("");
    setPostText("");
    setImage(null);
    setImageFile(null);
    setSelectedPlatforms([]);
    setSchedule("");
  };

  const showStatus = (msg, type) => {
    setPopup({ show: true, message: msg, type: type });
    setTimeout(
      () => setPopup({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const handlePublish = async () => {
    if (!title || !postText || selectedPlatforms.length === 0) {
      showStatus("Please fill all fields and select a platform", "error");
      return;
    }

    setIsPublishing(true);

    try {
      for (let platform of selectedPlatforms) {
        if (platform === "TikTok") {
          if (!imageFile) {
            showStatus("Please select a video for TikTok", "error");
            continue;
          }

          const tiktokToken = localStorage.getItem("tiktok_token"); // Ensure underscore usage
          const appToken = localStorage.getItem("token");

          if (!tiktokToken) {
            showStatus("Please login to TikTok first!", "error");
            return;
          }

          const tiktokData = new FormData();
          tiktokData.append("title", title);
          tiktokData.append("video", imageFile);
          tiktokData.append("description", postText);
          tiktokData.append("accessToken", tiktokToken);

          await api.post("/tiktok/upload", tiktokData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${appToken}`,
            },
          });
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("message", postText);
        formData.append("postType", "now");
        formData.append("activeTab", "Post");
        formData.append("platforms", JSON.stringify([platform]));

        if (imageFile) {
          formData.append("image", imageFile);
          formData.append(
            "mediaType",
            imageFile.type.startsWith("video") ? "VIDEO" : "IMAGE",
          );
        }

        if (platform === "Facebook") await api.post("/facebook/post", formData);
        if (platform === "Instagram")
          await api.post("/instagram/post", formData);
        if (platform === "Twitter") await api.post("/twitter/post", formData);
      }

      showStatus(`Post published successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error("Publish Error:", err);
      showStatus("Failed to publish post", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!title || !postText || selectedPlatforms.length === 0 || !schedule) {
      showStatus(
        "Validation failed: All fields and date/time are required",
        "error",
      );
      return;
    }

    // --- PAST DATE & TIME CHECK ---
    const scheduled = new Date(schedule).getTime();
    const now = Date.now();

    if (schedule && scheduled <= now) {
      showStatus("Cannot schedule in past time", "error");
      return;
    }

    const isoSchedule = new Date(schedule).toISOString();

    setIsScheduling(true);

    try {
      for (let platform of selectedPlatforms) {
        // =======================
        // TIKTOK
        // =======================
        if (platform === "TikTok") {
          if (!imageFile) {
            showStatus("Please select a video for TikTok", "error");
            continue;
          }

          const tiktokToken = localStorage.getItem("tiktok_token");
          const appToken = localStorage.getItem("token");

          const tiktokData = new FormData();
          tiktokData.append("title", title);
          tiktokData.append("video", imageFile);
          tiktokData.append("description", postText);

          tiktokData.append("scheduledTime", isoSchedule);

          tiktokData.append("accessToken", tiktokToken);

          await api.post("/tiktok/upload", tiktokData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${appToken}`,
            },
          });

          continue;
        }

        // =======================
        // COMMON FORM DATA
        // =======================
        const formData = new FormData();
        formData.append("title", title);
        formData.append("message", postText);
        formData.append("postType", "schedule");

        formData.append("scheduledTime", isoSchedule);

        formData.append("platforms", JSON.stringify([platform]));

        if (imageFile) {
          formData.append("image", imageFile);
          formData.append(
            "mediaType",
            imageFile.type.startsWith("video") ? "VIDEO" : "IMAGE",
          );
        }

        // =======================
        // PLATFORM ROUTES
        // =======================
        if (platform === "Facebook") await api.post("/facebook/post", formData);
        else if (platform === "Instagram")
          await api.post("/instagram/post", formData);
        else if (platform === "Twitter")
          await api.post("/twitter/post", formData);
      }

      showStatus(`Post scheduled successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error("Scheduling Error:", err);
      showStatus("Scheduling failed", "error");
    } finally {
      setIsScheduling(false);
    }
  };
  return (
    <div className="create-post-wrapper">
      <h2 className="page-title">Create New Post</h2>
      <label className="section-label">Post Title</label>
      <input
        className="title-input"
        placeholder="Enter a title for your post"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="section-label">Content</label>
      <div className="content-container">
        <textarea
          placeholder="What's on your mind?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
        <button
          type="button"
          className="ai-gen-btn-inner"
          onClick={openAIModal}
        >
          ✨ AI Generate
        </button>
      </div>

      <label className="section-label">Media (Optional)</label>
      <div
        className={`upload-box ${image ? "has-image" : ""}`}
        onClick={() => !image && fileInputRef.current.click()}
      >
        {!image ? (
          <div className="upload-content">
            <div className="upload-icon">⬆</div>
            <p className="upload-text">Upload Media</p>
            <span className="upload-note">Max size 10MB</span>
          </div>
        ) : (
          <>
            {imageFile?.type.startsWith("video") ? (
              <video src={image} className="preview-img" controls />
            ) : (
              <img src={image} className="preview-img" alt="Preview" />
            )}
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
            >
              ✕
            </button>
          </>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleUpload}
          hidden
        />
      </div>

      <div className="platform-schedule-row">
        <div className="platform-section">
          <label className="section-label">
            Select Platforms ({selectedPlatforms.length} selected)
          </label>
          <div className="platform-pills">
            {platforms.map((platform) => {
              const isTikTokDisabled = platform === "TikTok" && isImageSelected;

              return (
                <button
                  key={platform}
                  className={`pill ${selectedPlatforms.includes(platform) ? "active" : ""} ${
                    isTikTokDisabled ? "disabled-pill" : ""
                  }`}
                  onClick={() => !isTikTokDisabled && togglePlatform(platform)}
                  disabled={isTikTokDisabled}
                  title={isTikTokDisabled ? "TikTok only supports videos" : ""}
                >
                  {platform} {selectedPlatforms.includes(platform) ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="schedule-section">
          <label className="section-label">Schedule Date & Time</label>
          <input
            type="datetime-local"
            className="date-input"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>
      </div>

      <div className="action-row">
        <button
          className="publish-btn"
          onClick={handlePublish}
          disabled={isPublishing || isScheduling}
        >
          {isPublishing ? "Publishing..." : "Publish Now"}
        </button>
        <button
          className="schedule-btn-primary"
          onClick={handleSchedule}
          disabled={isPublishing || isScheduling}
        >
          {isScheduling ? "Scheduling..." : "Schedule Post"}
        </button>
      </div>

      {showAIModal && (
        <div className="modal-overlay">
          <div className="ai-modal">
            <div className="modal-header">
              <h3>
                <Sparkles size={20} className="purple-icon" /> TrendMesh AI
              </h3>
              <button className="close-x" onClick={() => setShowAIModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Describe what you want to post about:
              </p>
              <input
                className="ai-prompt-input"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. A professional post about new summer collection..."
              />
              <button
                className="gen-action-btn"
                onClick={handleGenerateAI}
                disabled={isGenerating}
              >
                {isGenerating ? "AI is thinking..." : "Generate Magic ✨"}
              </button>

              {generatedResult && (
                <div className="ai-result-preview">
                  <p>{generatedResult}</p>
                  <button className="use-caption-btn" onClick={useCaption}>
                    Use This Caption
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {popup.show && (
        <div className={`popup ${popup.type}`}>{popup.message}</div>
      )}
    </div>
  );
};

export default CreatePost;
