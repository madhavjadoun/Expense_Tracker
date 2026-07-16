import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X, Search, ChevronDown, MessageSquare, Bug, Send, Bot, User, Upload, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import Button from "./Button";
import GlassCard from "./GlassCard";
import { FAQ_ITEMS } from "../support/faqs";
import { sendChatMessage } from "../support/ai";
import { useAppStore } from "../store/useAppStore";

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
  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  const cardClass = isLightTheme
    ? "rounded-2xl bg-[#090B0A] border border-[#1A1E1C] shadow-sm transition-all duration-300 ease-out hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "rounded-2xl border border-white/[0.05] bg-[#1b1b1d] shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:border-white/12";

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
              className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-md"
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
              className={`fixed left-0 top-0 z-[100] flex h-full w-full sm:w-[460px] flex-col border-r shadow-2xl ${isLightTheme ? "bg-[#0E110F] border-[#1A1E1C]" : "bg-[#0e1116] border-white/[0.08]"}`}
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
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-8">
                
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
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none focus:border-[#84cc16]/40 transition-all"
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


                {/* 4. Report a Bug Section */}
                <div className={`${cardClass} p-5`}>
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
                </div>

              </div>

              {/* Floating AI support icon button fixed to the bottom-right of the panel */}
              <div className="absolute bottom-6 right-6 z-10">
                <Motion.button
                  type="button"
                  onClick={() => setIsAiOpen(true)}
                  whileHover={{ y: -4, scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-[22px] border shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-white/50 hover:ring-1 hover:ring-white/20 cursor-pointer ${
                    isLightTheme
                      ? "bg-[#0E110F] border-[#1A1E1C] text-white/95"
                      : "bg-gradient-to-b from-[#1C1F23] to-[#181A1E] border-white/[0.06] text-white/95"
                  }`}
                  title="Ask AI Support"
                  aria-label="Ask AI Support"
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Speech bubble */}
                    <path d="M12 6c-3.3 0-6 2.2-6 5 0 1.6.9 3 2.4 3.9l-.4 2.1 2.2-1.1c.6.2 1.2.3 1.8.3 3.3 0 6-2.2 6-5s-2.7-5-6-5z" fill="currentColor" className="text-white" />
                    
                    {/* Three dots inside speech bubble */}
                    <circle cx="9.5" cy="11" r="0.75" fill="currentColor" className="text-[#090B0A]" />
                    <circle cx="12" cy="11" r="0.75" fill="currentColor" className="text-[#090B0A]" />
                    <circle cx="14.5" cy="11" r="0.75" fill="currentColor" className="text-[#090B0A]" />

                    {/* Headset Arc */}
                    <path d="M3 14v-3a9 9 0 0 1 18 0v3" />

                    {/* Left Ear Cup */}
                    <rect x="2" y="12" width="2" height="4" rx="1" fill="currentColor" />
                    
                    {/* Right Ear Cup */}
                    <rect x="20" y="12" width="2" height="4" rx="1" fill="currentColor" />

                    {/* Microphone stem & tip */}
                    <path d="M4 15a4 4 0 0 0 5 3.8" />
                    <circle cx="10" cy="19" r="1" fill="currentColor" />
                  </svg>
                </Motion.button>
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
                      ? (isLightTheme ? "bg-[#84cc16]/20 text-[#84cc16] ring-1 ring-[#84cc16]/30" : "bg-white/10 text-white/90 ring-1 ring-white/12")
                      : "bg-white/10 text-white/70 ring-1 ring-white/12"
                  }`}
                >
                  {msg.sender === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "assistant"
                      ? "rounded-bl-none bg-white/7 text-white/85"
                      : (isLightTheme ? "rounded-br-none bg-[#84cc16]/15 text-black border border-[#84cc16]/10" : "rounded-br-none bg-white/[0.04] text-white/95 border border-white/10")
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex gap-3 items-end">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isLightTheme ? "bg-[#84cc16]/20 text-[#84cc16] ring-1 ring-[#84cc16]/30" : "bg-white/10 text-white/90 ring-1 ring-white/12"
                }`}>
                  <Bot size={14} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-white/7 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <Motion.span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        isLightTheme ? "bg-[#84cc16]/75" : "bg-white/70"
                      }`}
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
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 focus-within:border-[#84cc16]/40 transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiTyping}
                placeholder={isAiTyping ? "AI is thinking..." : "Ask about budgets, workspaces, or expenses..."}
                className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiTyping}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-black disabled:opacity-30 transition-all active:scale-95 shrink-0 cursor-pointer ${
                  isLightTheme ? "bg-[#84cc16] hover:bg-[#a3e635]" : "bg-[#EFF2F0] hover:bg-white"
                }`}
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
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none focus:border-[#84cc16]/40 transition-all"
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
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none focus:border-[#84cc16]/40 transition-all resize-none"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
              Attach Screenshot (Optional)
            </span>
            <label
              htmlFor="screenshot-upload"
              className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-white/15 rounded-xl bg-white/2 hover:bg-white/5 hover:border-[#84cc16]/20 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {bugScreenshot ? (
                  <>
                    <span className={`${isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"} mb-1`}>
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
            <button
              type="button"
              onClick={() => setIsBugOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-normal border border-white/20 hover:border-white/40 bg-transparent hover:bg-white/[0.06] text-white/80 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border border-transparent hover:border-white/50 transition active:scale-95 cursor-pointer shadow-md ${
                isLightTheme ? "bg-[#84cc16] text-black" : "bg-[#EFF2F0] text-black hover:bg-white"
              }`}
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
