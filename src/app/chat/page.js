"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import Image from "next/image";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const chatRef = useRef(null);


  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const parseCommand = (inputText) => {
    const trimmed = inputText.trim();

    // Check for repo commands with /owner/repo pattern
    const repoMatch = trimmed.match(/^\/([^/\s]+)\/([^/\s]+)(?:\s+(.+))?$/);
    if (repoMatch) {
      const repo = `${repoMatch[1]}/${repoMatch[2]}`;
      const additionalText = repoMatch[3] || "";

      // Determine the action based on additional text
      const lowerText = additionalText.toLowerCase();

      if (
        lowerText.includes("dockerize") ||
        lowerText.includes("docker") ||
        lowerText.includes("containerize")
      ) {
        return {
          repo,
          command: "dockerize",
          content: `Please dockerize the application in ${repo}${
            additionalText ? ` - ${additionalText}` : ""
          }`,
        };
      } else if (
        lowerText.includes("safety") ||
        lowerText.includes("security") ||
        lowerText.includes("vulnerability") ||
        lowerText.includes("scan")
      ) {
        return {
          repo,
          command: "safety",
          content: `Please analyze the safety and security of the application in ${repo}${
            additionalText ? ` - ${additionalText}` : ""
          }`,
        };
      } else {
        return {
          repo,
          command: "readme",
          content: additionalText || `Summarize the README for ${repo}`,
        };
      }
    }
    
    const plainLower = trimmed.toLowerCase();
    const repoPattern = /github\.com[\/]([^\/\s]+)[\/]([^\/\s]+)/;
    const repoMatchPlain = trimmed.match(repoPattern);

    if (repoMatchPlain) {
      const repo = `${repoMatchPlain[1]}/${repoMatchPlain[2]}`;
      if (
        plainLower.includes("dockerize") ||
        plainLower.includes("docker") ||
        plainLower.includes("containerize")
      ) {
        return {
          repo,
          command: "dockerize",
          content: trimmed,
        };
      } else if (
        plainLower.includes("safety") ||
        plainLower.includes("security") ||
        plainLower.includes("vulnerability") ||
        plainLower.includes("scan")
      ) {
        return {
          repo,
          command: "safety",
          content: trimmed,
        };
      }
    }

    return { repo: null, command: null, content: trimmed };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const { repo, command, content } = parseCommand(input);

    // Add user message
    const newMessage = { role: "user", content };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    // Debug: Log messages being sent
    console.log("Sending messages:", updatedMessages);
    if (repo) {
      console.log("Repository specified:", repo, "Command:", command);
    }

    // Validate messages
    if (!updatedMessages.some((msg) => msg.content.trim())) {
      setIsLoading(false);
      setErrorMessage("Cannot send empty messages.");
      setTimeout(() => setErrorMessage(null), 5000);
      setMessages((prev) => prev.slice(0, -1));
      return;
    }

    try {
      const requestBody = {
        messages: updatedMessages,
        stream: true,
      };

      // Add repo info if detected
      if (repo) {
        requestBody.repo_info = { repo, command };
      }

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const messageId = updatedMessages.length; // Index for assistant message

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              setIsLoading(false);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === messageId
                      ? { ...msg, content: msg.content + content }
                      : msg
                  )
                );
              }
            } catch (err) {
              console.error("Stream parse error:", err);
              setErrorMessage(err.message || "Failed to process response.");
              setTimeout(() => setErrorMessage(null), 5000);
              setMessages((prev) => prev.slice(0, -1));
              setIsLoading(false);
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to send message.");
      setTimeout(() => setErrorMessage(null), 5000);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 flex justify-between items-center">
      <Image
        className="h-25 w-25 mr-3"
        src="/logo.png"
        alt="Logo"
        width={100}
        height={100}
    />
        <h1 className="text-xl font-bold text-cyan-400">Akira AI Chat</h1>
        <Link
          href="/dashboard"
          className="text-cyan-200 hover:text-indigo-400 transition-colors pr-10"
        >
          Back to Dashboard
        </Link>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6" ref={chatRef}>
        {messages.length === 0 && !isLoading && (
          <div className="text-gray-400 text-center space-y-4">
            <p className="text-lg">Start a conversation with Akira AI!</p>
            <div className="text-sm space-y-2">
              <p>
                <strong>Quick Commands:</strong>
              </p>
              <div className="text-left max-w-md mx-auto space-y-1 text-xs">
                <p className="text-indigo-300">
                  • <code>/owner/repo</code> - Summarize README
                </p>
                <p className="text-green-300">
                  • <code>/owner/repo dockerize</code> - Dockerize the app
                </p>
                <p className="text-orange-300">
                  • <code>/owner/repo safety</code> - Security analysis
                </p>
                <p className="text-blue-300">• Or just ask in plain English!</p>
                <p className="text-gray-500 italic text-xs mt-2">
                  Example: "Please dockerize myapp/user/repo" or "Analyze
                  security for github.com/user/repo"
                </p>
              </div>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 p-4 rounded-lg max-w-2xl ${
              message.role === "user"
                ? "bg-indigo-900 ml-auto text-right"
                : "bg-gray-800 mr-auto"
            } shadow-md`}
          >
            <div
              className={`prose prose-invert prose-headings:text-white prose-a:text-indigo-400 ${
                message.role === "assistant" ? "prose-sm" : ""
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code: ({ node, inline, className, children, ...props }) => (
                    <code
                      className={`${
                        inline
                          ? "px-1 bg-gray-700 rounded text-xs"
                          : "block p-3 bg-gray-800 rounded-lg overflow-x-auto"
                      } ${className || ""} border border-gray-600`}
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children, ...props }) => (
                    <pre
                      className="bg-gray-800 p-4 rounded-lg overflow-x-auto border border-gray-600"
                      {...props}
                    >
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-4 border-indigo-500 pl-4 italic bg-gray-800/50"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content || "..."}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-gray-400 text-center flex items-center justify-center gap-2 py-8">
            <svg
              className="animate-spin h-5 w-5 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>
              Akira is thinking... This might take a moment for complex
              operations like dockerization or security scanning.
            </span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-center max-w-md mx-auto">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-4 shadow-lg flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Akira AI... Try: /owner/repo, /owner/repo dockerize, /owner/repo safety, or just ask in English!"
          className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-bl from-indigo-900 via-blue-600 to-cyan-500 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}
