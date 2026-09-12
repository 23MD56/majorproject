import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, User, Sparkles, AlertCircle, ExternalLink } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";
import { useAppStore } from "../../store/useAppStore";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: string[];
  timestamp: string;
}

interface NitiBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  "What is our active market regime?",
  "Why is my portfolio rebalance recommended?",
  "Explain my ESG Conscience score",
  "How does 10Y compounding beat Bank FD?",
];

export const NitiBotModal: React.FC<NitiBotModalProps> = ({ isOpen, onClose }) => {
  const { activeRegime, currentBasket, activePortfolio, nitibotSessionId } = useAppStore();
  const { request, isLoading } = useAbortableRequest();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am NitiBot, your AI quantitative portfolio assistant. Ask me anything about current market regimes, your asset allocations, or compounding strategies.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setErrorMessage(null);

    try {
      const response = await request("nitibot-chat", "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          session_id: nitibotSessionId,
          context: {
            regime: activeRegime?.regime || activeRegime?.name || "BULL_TRENDING",
            basket_id: currentBasket?.basket_id,
            portfolio_value: activePortfolio?.current_value,
          },
        }),
      });

      if (response) {
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: response.reply,
          sources: response.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setErrorMessage("Unable to connect to NitiBot right now. Please verify API key configuration.");
      }
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--text-main)] text-base">NitiBot AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Real-time Grounded Quantitative Assistant</p>
          </div>
        </div>
      }
      className="max-h-[90vh]"
    >
      <div className="flex flex-col h-[60vh] -mx-2 -mb-2">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-accent shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-600/20"
                    : "bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-bl-none shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Grounding citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-violet-500/10 text-accent border border-violet-500/20 font-medium"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                <span className="block text-[10px] text-[var(--text-muted)] text-right mt-1">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-accent shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-accent shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="text-[11px] text-[var(--text-muted)] ml-1">Analyzing portfolio data...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 ml-1" />
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] bg-[var(--bg-card)] hover:bg-violet-500/10 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-accent transition-colors disabled:opacity-50 shadow-sm"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Send Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about regimes, stocks, rebalancing..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-xs focus:outline-none focus:border-accent transition-colors disabled:opacity-50 shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </ModalSheet>
  );
};
