import { useEffect, useRef, useState } from "react";
import "./App.css";

const createChat = () => ({
  id: Date.now(),
  title: "New Conversation",
  messages: [],
  createdAt: new Date().toISOString(),
});

const initialChats = [
  {
    id: 1,
    title: "React useState Help",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 11,
        text: "Hey there! 👋\nI'm Busy Chatbot 🤖\nHow can I help you today? 💗",
        sender: "bot",
        time: "11:08 PM",
      },
    ],
  },
];

function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem("busyChats");
      return saved ? JSON.parse(saved) : initialChats;
    } catch {
      return initialChats;
    }
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem("busyActiveChat");
    return saved ? Number(saved) : 1;
  });

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("busyDarkMode") === "true";
  });

  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem("busyChats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("busyActiveChat", activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem("busyDarkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeChat?.messages, isTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const updateActiveChat = (updatedChat) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === updatedChat.id ? updatedChat : chat
      )
    );
  };

  const createNewChat = () => {
    const newChat = createChat();

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);

    setInput("");
    setAttachment(null);
  };

  const deleteChat = (chatId, event) => {
    event.stopPropagation();

    setChats((prev) => {
      const remaining = prev.filter(
        (chat) => chat.id !== chatId
      );

      if (remaining.length === 0) {
        const freshChat = createChat();

        setActiveChatId(freshChat.id);

        return [freshChat];
      }

      if (chatId === activeChatId) {
        setActiveChatId(remaining[0].id);
      }

      return remaining;
    });
  };

  const clearAllChats = () => {
    const freshChat = createChat();

    setChats([freshChat]);
    setActiveChatId(freshChat.id);
  };

  // SEND MESSAGE TO OUR BACKEND
  const sendMessage = async (message = input) => {
    if (!message.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: message.trim(),
      sender: "user",
      time: getCurrentTime(),
    };

    const updatedMessages = [
      ...activeChat.messages,
      userMessage,
    ];

    const updatedChat = {
      ...activeChat,
      title:
        activeChat.messages.length === 0
          ? message.trim().slice(0, 30)
          : activeChat.title,
      messages: updatedMessages,
    };

    // Show user's message immediately
    updateActiveChat(updatedChat);

    setInput("");
    setAttachment(null);
    setIsTyping(true);

    try {
      // Send conversation to our backend
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get AI response."
        );
      }

      // Create AI response
      const botMessage = {
        id: Date.now() + 1,
        text: data.reply,
        sender: "bot",
        time: getCurrentTime(),
        liked: false,
        disliked: false,
      };

      updateActiveChat({
        ...updatedChat,
        messages: [
          ...updatedMessages,
          botMessage,
        ],
      });

    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        id: Date.now() + 1,
        text:
          "I'm sorry 💗 I couldn't connect to the AI right now. Please try again.",
        sender: "bot",
        time: getCurrentTime(),
        liked: false,
        disliked: false,
      };

      updateActiveChat({
        ...updatedChat,
        messages: [
          ...updatedMessages,
          errorMessage,
        ],
      });

    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const toggleReaction = (messageId, type) => {
    const updatedMessages = activeChat.messages.map(
      (message) => {
        if (message.id !== messageId) {
          return message;
        }

        return {
          ...message,

          liked:
            type === "like"
              ? !message.liked
              : false,

          disliked:
            type === "dislike"
              ? !message.disliked
              : false,
        };
      }
    );

    updateActiveChat({
      ...activeChat,
      messages: updatedMessages,
    });
  };

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.log("Could not copy message.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setAttachment(file.name);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const groupedChats = {
    Today: filteredChats.slice(0, 3),
    Yesterday: filteredChats.slice(3, 6),
    Earlier: filteredChats.slice(6),
  };

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-avatar">
            🎀
          </div>

          <div>
            <h1>
              Busy Chatbot <span>♡</span>
            </h1>

            <p>
              Your AI assistant ✨
            </p>
          </div>

        </div>

        <button
          className="new-chat-btn"
          onClick={createNewChat}
        >
          <span>＋</span>
          New Chat
        </button>

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="chat-history">

          {Object.entries(groupedChats).map(
            ([group, groupChats]) => {

              if (groupChats.length === 0) {
                return null;
              }

              return (
                <div
                  className="history-group"
                  key={group}
                >

                  <div className="history-title">
                    {group}
                  </div>

                  {groupChats.map((chat) => (

                    <div
                      key={chat.id}
                      className={`history-item ${
                        chat.id === activeChatId
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setActiveChatId(chat.id)
                      }
                    >

                      <div className="history-icon">
                        ♡
                      </div>

                      <div className="history-content">

                        <strong>
                          {chat.title}
                        </strong>

                        <span>
                          {chat.messages.length > 0
                            ? chat.messages[
                                chat.messages.length - 1
                              ].text.slice(0, 32)
                            : "Start a new conversation..."}
                        </span>

                      </div>

                      <button
                        className="history-delete"
                        onClick={(event) =>
                          deleteChat(
                            chat.id,
                            event
                          )
                        }
                        title="Delete chat"
                      >
                        ⋮
                      </button>

                    </div>

                  ))}

                </div>
              );
            }
          )}

        </div>

        <div className="sidebar-bottom">

          <button className="sidebar-option">
            ⚙️
            <span>Settings</span>
          </button>

          <button
            className="sidebar-option"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            🌙

            <span>
              Dark Mode
            </span>

            <div
              className={`toggle ${
                darkMode ? "on" : ""
              }`}
            >
              <div />
            </div>

          </button>

          <button
            className="sidebar-option danger"
            onClick={clearAllChats}
          >
            🗑️

            <span>
              Clear all chats
            </span>

          </button>

        </div>

      </aside>

      {/* MAIN CHAT */}

      <main className="main-chat">

        <header className="chat-header">

          <div className="header-avatar">
            🎀
          </div>

          <div className="header-info">

            <h2>
              Busy Chatbot <span>♡</span>
            </h2>

            <p>
              <span className="online-dot" />
              AI Assistant
            </p>

          </div>

          <div className="header-actions">

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              title="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button
              onClick={clearAllChats}
              title="Clear chats"
            >
              🗑️
            </button>

            <button title="More options">
              ⋮
            </button>

          </div>

        </header>

        {/* MESSAGES */}

        <section className="messages-area">

          {activeChat.messages.length === 0 ? (

            <div className="welcome-screen">

              <div className="welcome-avatar">
                🎀
              </div>

              <h2>
                Hey there! 👋
              </h2>

              <p>
                I'm <strong>Busy Chatbot</strong> 💗
                <br />
                What would you like to talk about?
              </p>

              <div className="suggestions">

                <button
                  onClick={() =>
                    handleSuggestedPrompt(
                      "Explain React in simple words"
                    )
                  }
                >
                  ⚛️ Explain React
                </button>

                <button
                  onClick={() =>
                    handleSuggestedPrompt(
                      "Give me some JavaScript tips"
                    )
                  }
                >
                  💻 JavaScript tips
                </button>

                <button
                  onClick={() =>
                    handleSuggestedPrompt(
                      "Help me learn Python"
                    )
                  }
                >
                  🐍 Learn Python
                </button>

                <button
                  onClick={() =>
                    handleSuggestedPrompt(
                      "Give me a productivity tip"
                    )
                  }
                >
                  ✨ Productivity tip
                </button>

              </div>

            </div>

          ) : (

            <>

              <div className="date-label">
                Today
              </div>

              {activeChat.messages.map(
                (message) => (

                  <div
                    className={`message-row ${message.sender}`}
                    key={message.id}
                  >

                    {message.sender === "bot" && (
                      <div className="message-avatar bot-avatar">
                        🎀
                      </div>
                    )}

                    <div className="message-wrapper">

                      <div className="message-bubble">

                        <div className="message-text">
                          {message.text}
                        </div>

                        <div className="message-meta">

                          <span>
                            {message.time}
                          </span>

                          {message.sender === "user" && (
                            <span className="read-status">
                              ✓✓
                            </span>
                          )}

                        </div>

                      </div>

                      {message.sender === "bot" && (

                        <div className="message-actions">

                          <button
                            className={
                              message.liked
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              toggleReaction(
                                message.id,
                                "like"
                              )
                            }
                            title="Like"
                          >
                            ♡
                          </button>

                          <button
                            className={
                              message.disliked
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              toggleReaction(
                                message.id,
                                "dislike"
                              )
                            }
                            title="Dislike"
                          >
                            ♧
                          </button>

                          <button
                            onClick={() =>
                              copyMessage(
                                message.text
                              )
                            }
                            title="Copy"
                          >
                            ⧉
                          </button>

                        </div>

                      )}

                    </div>

                    {message.sender === "user" && (
                      <div className="message-avatar user-avatar">
                        🌸
                      </div>
                    )}

                  </div>

                )
              )}

              {isTyping && (

                <div className="message-row bot">

                  <div className="message-avatar bot-avatar">
                    🎀
                  </div>

                  <div className="typing-bubble">

                    <span>
                      Busy Chatbot is thinking
                    </span>

                    <div className="typing-dots">
                      <i />
                      <i />
                      <i />
                    </div>

                  </div>

                </div>

              )}

            </>

          )}

          <div ref={messagesEndRef} />

        </section>

        {/* COMPOSER */}

        <footer className="composer-section">

          {attachment && (

            <div className="attachment-preview">

              📎 {attachment}

              <button
                onClick={() =>
                  setAttachment(null)
                }
              >
                ×
              </button>

            </div>

          )}

          <div className="composer">

            <button
              className="composer-icon"
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Attach file"
            >
              📎
            </button>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFileChange}
            />

            <textarea
              placeholder="Type your message..."
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              rows="1"
            />

            <button
              className="emoji-btn"
              onClick={() =>
                setInput(
                  (prev) => `${prev} 💗`
                )
              }
              title="Add emoji"
            >
              ☺
            </button>

            <button
              className="send-btn"
              onClick={() =>
                sendMessage()
              }
              disabled={
                !input.trim() || isTyping
              }
            >
              ➤
            </button>

          </div>

          <p className="composer-hint">
            Press <strong>Enter</strong> to send
            <span>•</span>
            <strong>Shift + Enter</strong> for new line
          </p>

          <p className="disclaimer">
            Busy Chatbot may make mistakes.
            Please verify important information.
          </p>

        </footer>

      </main>

    </div>
  );
}

export default App;