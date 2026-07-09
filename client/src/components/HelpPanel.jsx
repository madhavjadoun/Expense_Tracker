import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X, Search, ChevronDown, MessageSquare, Bug, Send, Bot, User, Upload, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import Button from "./Button";
import GlassCard from "./GlassCard";
import { FAQ_ITEMS } from "../support/faqs";
import { sendChatMessage } from "../support/ai";

/**
 * @typedef {Object} ChatMessage
 * @property {'user' | 'assistant'} sender
 * @property {string} text
 */

// ── Accordion FAQ item component ─────────────────────────────────────
/**
 * @param {Object} props
 * @param {import("../types").FAQItem} props.item
 * @param {boolean} props.isOpen
 * @param {() => void} props.onToggle
 */
function FaqAccordion({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-white/5 py-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left font-medium text-white/80 hover:text-white transition-colors py-2 focus:outline-none"
      >
        <span className="text-sm">{item.question}</span>
        <Motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40 shrink-0"
        >
          <ChevronDown size={16} />
        </Motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs leading-relaxed text-white/50 pb-3 pt-1">
              {item.answer}
            </p>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Root HelpPanel component ──────────────────────────────────────────
export default function HelpPanel({ open, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  
  // Modals state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isBugOpen, setIsBugOpen] = useState(false);

  // AI Chat state
  /** @type {[ChatMessage[], React.Dispatch<React.SetStateAction<ChatMessage[]>>]} */
  const [chatMessages, setChatMessages] = useState([
    { sender: "assistant", text: "Hi! I'm your Expense Tracker Assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Bug Report Form State
  const [bugSubject, setBugSubject] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugScreenshot, setBugScreenshot] = useState(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (isAiOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiTyping, isAiOpen]);

  // Filtered FAQ items based on search query
  const filteredFaqs = FAQ_ITEMS.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Send message in mock AI chat
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsAiTyping(true);

    try {
      const reply = await sendChatMessage(userText);
      setChatMessages((prev) => [...prev, { sender: "assistant", text: reply }]);
    } catch (err) {
      toast.error("Could not connect to the AI support assistant. Please try again later.");
    } finally {
      setIsAiTyping(false);
    }
  };

  // Submit bug report handler
  const handleBugSubmit = (e) => {
    e.preventDefault();
    if (!bugSubject.trim() || !bugDescription.trim()) {
      toast.error("Please fill in both the subject and description.");
      return;
    }

    // Success actions
    toast.success("Bug report submitted successfully! Thank you.");
    setIsBugOpen(false);
    
    // Reset Form
    setBugSubject("");
    setBugDescription("");
    setBugScreenshot(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBugScreenshot(file);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
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
              initial={{ x: -460, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -460, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed left-0 top-0 z-50 flex h-full w-full sm:w-[460px] flex-col border-r border-white/10 bg-gradient-to-b from-[#0d1829] to-[#020617] shadow-2xl"
              role="dialog"
              aria-label="Help Panel"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-white/90">Help & Support</h2>
                  <p className="text-xs text-white/40">Find answers and get help with tracking</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-white/40 hover:bg-white/8 hover:text-white/80 transition-colors"
                  aria-label="Close Panel"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                
                {/* 1. Search Bar */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOpenFaqIndex(null);
                    }}
                    placeholder="Search FAQ questions..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setOpenFaqIndex(null);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs focus:outline-none"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 2. FAQ Accordions list */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                    Frequently Asked Questions
                  </h3>

                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-dashed border-white/8 bg-white/2">
                      <p className="text-sm text-white/40">No matching questions found.</p>
                      <p className="text-xs text-white/30 mt-1">Try searching with other keywords.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredFaqs.map((faq, index) => (
                        <FaqAccordion
                          key={faq.question}
                          item={faq}
                          isOpen={openFaqIndex === index}
                          onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. AI Assistant Section */}
                <GlassCard className="p-5 border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/12 text-emerald-400 border border-emerald-500/25">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/90">Still need help?</h4>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">
                        Ask our interactive AI support assistant for help or insights about your workspace data.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setIsAiOpen(true)}
                        className="mt-4 py-2 px-4 h-9"
                      >
                        <MessageSquare size={14} />
                        Ask AI
                      </Button>
                    </div>
                  </div>
                </GlassCard>

                {/* 4. Report a Bug Section */}
                <GlassCard className="p-5 border border-white/10 bg-white/2">
                  <div className="flex gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-white/60 border border-white/10">
                      <Bug size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/90">Found a bug?</h4>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed">
                        Experiencing visual glitches, calculations mismatch, or technical errors? Let us know.
                      </p>
                      <Button
                        variant="subtle"
                        onClick={() => setIsBugOpen(true)}
                        className="mt-4 py-2 px-4 h-9"
                      >
                        Report a Bug
                      </Button>
                    </div>
                  </div>
                </GlassCard>

              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat Assistant Modal ── */}
      <Modal
        open={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        title="AI Help Assistant"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col h-[480px]">
          {/* Scrollable Message Box */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 items-end ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    msg.sender === "assistant"
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-white/10 text-white/70 ring-1 ring-white/12"
                  }`}
                >
                  {msg.sender === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "assistant"
                      ? "rounded-bl-none bg-white/7 text-white/85"
                      : "rounded-br-none bg-emerald-500/15 text-emerald-100 border border-emerald-500/10"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex gap-3 items-end">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                  <Bot size={14} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-white/7 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <Motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400/70"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input footer */}
          <form onSubmit={handleSendChatMessage} className="border-t border-white/8 pt-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-emerald-500/40 focus-within:bg-emerald-500/5 transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiTyping}
                placeholder={isAiTyping ? "AI is thinking..." : "Ask about budgets, workspaces, or expenses..."}
                className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/30 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiTyping}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white disabled:opacity-30 hover:bg-emerald-400 transition-all active:scale-95 shrink-0"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Report a Bug Modal ── */}
      <Modal
        open={isBugOpen}
        onClose={() => setIsBugOpen(false)}
        title="Report a Bug"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBugSubmit} className="space-y-5">
          <div>
            <label htmlFor="bug-subject" className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
              Subject
            </label>
            <input
              id="bug-subject"
              type="text"
              required
              value={bugSubject}
              onChange={(e) => setBugSubject(e.target.value)}
              placeholder="Brief summary of the issue (e.g. Split calculation error)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
            />
          </div>

          <div>
            <label htmlFor="bug-desc" className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
              Description
            </label>
            <textarea
              id="bug-desc"
              rows={4}
              required
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Please describe steps to reproduce the issue, expected vs actual behavior..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 placeholder-white/30 outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all resize-none"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
              Attach Screenshot (Optional)
            </span>
            <label
              htmlFor="screenshot-upload"
              className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-white/15 rounded-xl bg-white/2 hover:bg-white/5 hover:border-emerald-500/20 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {bugScreenshot ? (
                  <>
                    <span className="text-emerald-400 mb-1">
                      <Check size={20} />
                    </span>
                    <p className="text-xs text-white/80 font-medium truncate max-w-[280px]">
                      {bugScreenshot.name}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Click to replace file</p>
                  </>
                ) : (
                  <>
                    <span className="text-white/40 mb-2">
                      <Upload size={18} />
                    </span>
                    <p className="text-xs text-white/60 font-medium">Click to select screenshot</p>
                    <p className="text-[10px] text-white/30 mt-0.5">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
              <input
                id="screenshot-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBugOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
