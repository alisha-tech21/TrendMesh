import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  SendHorizontal,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import api from "../api";
import "./AIChat.css";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load History
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/ai/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedMessages = res.data.map((chat) => ({
          id: chat._id,
          sender: chat.role === "user" ? "user" : "ai",
          text: chat.content,
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    fetchChatHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestion = (text) => setInput(text);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: "user", text: userMessage },
    ]);
    setInput("");

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/ai/chat",
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages((prev) => [
        ...prev,
        {
          id: res.data.id || Date.now() + 1,
          sender: "ai",
          text: res.data.message,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "TrendMesh GPT is offline." },
      ]);
    }
  };

  const clearChat = async () => {
    if (window.confirm("Are you sure you want to delete all chats?")) {
      try {
        const token = localStorage.getItem("token");
        await api.delete("/ai/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages([]);
      } catch (err) {
        alert("Action failed.");
      }
    }
  };

  const handleClearClick = () => {
    setIsModalOpen(true);
  };

  const confirmClearChat = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.delete("/ai/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Action failed.");
      setIsModalOpen(false);
    }
  };

  const deleteSingleMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/ai/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };
  const copyToClipboard = (text, msgId) => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1 className="title">
          How can <span className="highlight">TrendMesh GPT</span> help?
        </h1>
        <button className="clear-btn" onClick={handleClearClick}>
          <Trash2 size={16} /> Clear Chat
        </button>
      </div>

      <div className="chat-history">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`msg-wrapper ${msg.sender === "user" ? "user-wrapper" : "ai-wrapper"}`}
          >
            <div
              className={`chat-msg ${msg.sender === "ai" ? "ai-msg" : "user-msg"}`}
            >
              {msg.text}

              <div className="msg-actions">
                {/* Copy Button */}
                <button
                  className="copy-icon"
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                >
                  <Copy size={12} />
                </button>

                {/* Delete Button */}
                <button
                  className="delete-icon"
                  onClick={() => deleteSingleMessage(msg.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="suggestions">
        <button onClick={() => handleSuggestion("Give me a campaign idea")}>
          <Sparkles size={14} /> Campaign Idea
        </button>
        <button onClick={() => handleSuggestion("Write an Instagram caption")}>
          <MessageSquare size={14} /> IG Caption
        </button>
      </div>

      <div className="input-wrapper">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask TrendMesh GPT anything..."
        />
        <button onClick={sendMessage} className="send-btn">
          <SendHorizontal size={20} />
        </button>
      </div>
      {showToast && (
        <div className="copy-toast">Message copied to clipboard</div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="custom-modal">
            <h3>Delete All Chats?</h3>
            <p>
              Are you sure you want to clear your entire conversation history?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmClearChat}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
