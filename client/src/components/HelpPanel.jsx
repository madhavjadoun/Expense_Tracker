import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X, MessageCircle, ChevronDown, ChevronRight, Send, Bot, User } from "lucide-react";
import { FAQ_ITEMS, QUICK_FAQS, GREETING_RESPONSE, UI_COPY } from "../data/helpData";
import { getAnswer } from "../utils/chatEngine";

// ─────────────────────────────────────────────────────────────
//  Tiny helpers
// ─────────────────────────────────────────────────────────────
function Avatar({ role }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
        ${role === "bot"
          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
          : "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
        }`}
    >
      {role === "bot" ? <Bot size={14} /> : <User size={14} />}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <Motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className={`flex items-end gap-2 ${isBot ? "flex-row" : "flex-row-reverse"}`}
    >
      <Avatar role={msg.role} />
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isBot
            ? "rounded-bl-sm bg-white/7 text-white/85"
            : "rounded-br-sm bg-emerald-500/15 text-emerald-100"
          }`}
      >
        {msg.text}
      </div>
    </Motion.div>
  );
}

function TypingIndicator() {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2"
    >
      <Avatar role="bot" />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white/7 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <Motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-400/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <span className="ml-1 text-[10px] text-white/30">{UI_COPY.typingText}</span>
      </div>
    </Motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FAQ accordion item
// ─────────────────────────────────────────────────────────────
function FaqItem({ entry, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm text-white/80 hover:text-white transition-colors"
      >
        <span className="font-medium">{entry.question}</span>
        {open
          ? <ChevronDown size={15} className="shrink-0 text-emerald-400" />
          : <ChevronRight size={15} className="shrink-0 text-white/40" />}
      </button>
      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-4 pb-3 pt-2 text-sm text-white/60 leading-relaxed">
              {entry.answer}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Chat view
// ─────────────────────────────────────────────────────────────
function ChatView({ onBack }) {
  const [messages, setMessages] = useState([
    { id: 0, role: "bot", text: GREETING_RESPONSE },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    (text) => {
      const userText = (text ?? input).trim();
      if (!userText) return;
      setInput("");
      setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: userText }]);
      setTyping(true);
      setTimeout(() => {
        const answer = getAnswer(userText);
        setTyping(false);
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: answer }]);
      }, 800);
    },
    [input]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = [
    "Can't add an expense",
    "How to use Split feature",
    "Budget not updating",
    "How to export expenses to CSV",
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white transition-colors text-sm"
          aria-label="Wapas jaao"
        >
          {UI_COPY.chatBackBtn}
        </button>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)] animate-pulse" />
          <span className="text-sm font-medium text-white/85">{UI_COPY.chatHeaderTitle}</span>
        </div>
        <span className="ml-auto text-xs text-white/35">{UI_COPY.chatHeaderSubtitle}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        <AnimatePresence>{typing && <TypingIndicator />}</AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick reply chips */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {quickReplies.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-300 transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/8 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-emerald-500/40 focus-within:bg-emerald-500/5 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={UI_COPY.chatInputPlaceholder}
            className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/30 outline-none"
            id="help-chat-input"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white disabled:opacity-30 hover:bg-emerald-400 transition-all active:scale-95"
            aria-label="Bhejo"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FAQ panel view
// ─────────────────────────────────────────────────────────────
function FaqView({ onOpenChat, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [clickedFaq, setClickedFaq] = useState(null);

  const filtered = searchQuery.trim()
    ? FAQ_ITEMS.filter(
        (e) =>
          e.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.keywords.some((k) =>
            k.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : FAQ_ITEMS.slice(0, 12);

  const handleQuickFaq = (q) => {
    setClickedFaq(q);
    setSearchQuery(q);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white/90">{UI_COPY.panelTitle}</h2>
            <p className="text-xs text-white/40 mt-0.5">{UI_COPY.panelSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/40 hover:bg-white/8 hover:text-white/80 transition-colors"
            aria-label="Band karo"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-emerald-500/40 transition-all">
          <span className="text-white/30 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI_COPY.searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
            id="help-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setClickedFaq(null); }}
              className="text-white/30 hover:text-white/60 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Quick FAQ chips — only when not searching */}
        {!searchQuery && (
          <div>
            <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
              {UI_COPY.commonIssuesLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_FAQS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickFaq(q)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all text-left
                    ${clickedFaq === q
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                    }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ accordion list */}
        <div>
          {!searchQuery && (
            <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
              {UI_COPY.allTopicsLabel}
            </p>
          )}
          {filtered.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">
              {UI_COPY.noResultsText}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry) => (
                <FaqItem
                  key={entry.question}
                  entry={entry}
                  defaultOpen={filtered.length === 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat CTA */}
      <div className="border-t border-white/8 px-4 py-3">
        <button
          type="button"
          onClick={onOpenChat}
          id="help-chat-cta-btn"
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_16px_rgba(52,211,153,0.15)]"
        >
          <MessageCircle size={15} className="group-hover:scale-110 transition-transform" />
          {UI_COPY.chatCtaBtn}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Root HelpPanel — spring-animated side panel
// ─────────────────────────────────────────────────────────────
export default function HelpPanel({ open, onClose }) {
  const [view, setView] = useState("faq"); // "faq" | "chat"

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setView("faq"), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — doesn't block main app */}
          <Motion.div
            key="help-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <Motion.div
            key="help-panel"
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed left-0 top-0 z-50 flex h-full w-[340px] flex-col border-r border-white/10 bg-gradient-to-b from-[#0d1829] to-[#020617] shadow-2xl"
            role="dialog"
            aria-label="Help Panel"
          >
            {view === "faq" ? (
              <FaqView onOpenChat={() => setView("chat")} onClose={onClose} />
            ) : (
              <ChatView onBack={() => setView("faq")} />
            )}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
