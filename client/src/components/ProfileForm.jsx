import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Camera, Eye, Upload, X } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ─── Full-screen photo preview ────────────────────────────────────────────────
function PhotoPreview({ src, onClose }) {
  if (!src) return null;
  return (
    <AnimatePresence>
      <Motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Motion.div
          className="flex flex-col items-center gap-4"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt="Profile"
            style={{ width: 240, height: 240, borderRadius: "50%", objectFit: "cover" }}
            className="ring-4 ring-white/15 shadow-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/18"
          >
            <X size={12} /> Close
          </button>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
}

// ─── Photo options dropdown ───────────────────────────────────────────────────
function PhotoMenu({ hasPhoto, onView, onUpload, onClose }) {
  return (
    <>
      {/* Dismiss layer */}
      <button
        type="button"
        className="fixed inset-0 z-20"
        onClick={onClose}
        aria-label="Close menu"
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.93, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: -6 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="absolute left-0 top-full z-30 mt-2 min-w-[188px] rounded-2xl border border-white/10 bg-[#0d1224]/96 shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {hasPhoto && (
          <button
            type="button"
            onClick={onView}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/8"
          >
            <Eye size={14} className="text-blue-300" /> View Profile Photo
          </button>
        )}
        <button
          type="button"
          onClick={onUpload}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/8"
        >
          <Upload size={14} className="text-violet-300" /> Upload New Photo
        </button>
      </Motion.div>
    </>
  );
}

// ─── Main ProfileForm ─────────────────────────────────────────────────────────
export default function ProfileForm() {
  const ResolvedInput      = typeof Input      === "function" ? Input      : Input?.default;
  const ResolvedButton     = typeof Button     === "function" ? Button     : Button?.default;
  const ResolvedPhoneInput = typeof PhoneInput === "function" ? PhoneInput : PhoneInput?.default;

  const profile       = useUserStore((s) => s.profile);
  const avatar        = useUserStore((s) => s.avatar);
  const setProfile    = useUserStore((s) => s.setProfile);
  const setAvatar     = useUserStore((s) => s.setAvatar);
  const budgetMonthly = useAppStore((s) => s.budgetMonthly);

  const [editing, setEditing]         = useState(false);
  const [draft, setDraft]             = useState(profile);
  const [draftAvatar, setDraftAvatar] = useState(avatar || null);
  const [errors, setErrors]           = useState({});
  const [menuOpen, setMenuOpen]       = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Hidden file input — triggered programmatically
  const fileInputRef = useRef(null);

  const display       = editing ? draft : profile;
  const displayAvatar = editing ? draftAvatar : avatar;

  const hasInvalidComponents =
    typeof ResolvedInput !== "function" ||
    typeof ResolvedButton !== "function" ||
    typeof ResolvedPhoneInput !== "function";

  const initials = useMemo(() => {
    return (
      (display?.name || "U")
        .split(" ").filter(Boolean).slice(0, 2)
        .map((w) => w[0]?.toUpperCase()).join("")
    ) || "U";
  }, [display?.name]);

  function update(key, value) {
    setDraft((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  }

  function validateForm(d) {
    const e = {};
    if (!isValidEmail(d.email || "")) e.email = "Please enter a valid email address.";
    if (!String(d.mobile || "").trim()) e.mobile = "Mobile number is required.";
    return e;
  }

  async function handleSave() {
    const e = validateForm(draft);
    if (Object.keys(e).length) { setErrors(e); return; }

    // ── Optimistic update: apply immediately, don't wait for API ──
    setProfile({ ...draft, monthlyBudget: budgetMonthly });
    setAvatar(draftAvatar);
    setEditing(false);

    // ── Sync to server silently in background ──
    try {
      const { avatar: _a, ...rest } = draft;
      const saved = await api.saveProfile({ ...rest, monthlyBudget: budgetMonthly });
      // Patch only if server returns a different monthlyBudget
      if (saved?.monthlyBudget !== undefined && saved.monthlyBudget !== budgetMonthly) {
        setProfile((prev) => ({ ...prev, monthlyBudget: saved.monthlyBudget }));
      }
    } catch {
      // Silent fail — local state already reflects user's intent
    }
  }

  function handleCancel() {
    setDraft(profile);
    setDraftAvatar(avatar || null);
    setErrors({});
    setEditing(false);
    setMenuOpen(false);
  }

  function startEditing() {
    setDraft(profile);
    setDraftAvatar(avatar || null);
    setErrors({});
    setEditing(true);
  }

  // Triggered when user picks a file
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setDraftAvatar(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setMenuOpen(false);
  }

  if (hasInvalidComponents) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        Profile UI failed to load. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header row: avatar + name + buttons ── */}
      <div className="flex items-center justify-between gap-3">

        {/* Left: avatar + name */}
        <div className="flex items-center gap-4">

          {/* Avatar */}
          <div className="relative shrink-0">
            {/* Circle */}
            <Motion.div
              animate={{ width: editing ? 80 : 64, height: editing ? 80 : 64 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={editing ? () => setMenuOpen((o) => !o) : undefined}
              className={`relative overflow-hidden rounded-full bg-gradient-to-br from-blue-500/25 to-emerald-500/20 ring-1 ring-white/10 ${editing ? "cursor-pointer" : ""}`}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Profile avatar"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                />
              ) : (
                <span
                  className="absolute inset-0 flex items-center justify-center font-bold text-white/85"
                  style={{ fontSize: editing ? "1.4rem" : "0.85rem" }}
                >
                  {initials}
                </span>
              )}

              {/* Camera overlay — edit mode only */}
              {editing && (
                <Motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 backdrop-blur-[2px]"
                >
                  <Camera size={18} className="text-white" />
                  <span className="text-[9px] font-medium text-white/80">Change</span>
                </Motion.div>
              )}
            </Motion.div>

            {/* Photo options dropdown */}
            <AnimatePresence>
              {editing && menuOpen && (
                <PhotoMenu
                  hasPhoto={!!displayAvatar}
                  onView={() => { setPreviewOpen(true); setMenuOpen(false); }}
                  onUpload={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Name + subtitle */}
          <div>
            <div className="text-lg font-semibold leading-tight text-white/90">
              {display?.name || "Your profile"}
            </div>
            <div className="mt-0.5 text-xs text-white/45">Manage your account details.</div>

            {/* "Add Profile Photo" — visible ONLY in edit mode */}
            {editing && (
              <Motion.button
                type="button"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={() => setMenuOpen((o) => !o)}
                className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 transition hover:bg-violet-500/18 active:scale-95"
              >
                <Camera size={11} />
                {displayAvatar ? "Edit Profile Photo" : "Add Profile Photo"}
              </Motion.button>
            )}
          </div>
        </div>

        {/* Right: Edit / Cancel / Save */}
        <div className="flex shrink-0 items-center gap-2">
          {!editing ? (
            <ResolvedButton variant="subtle" type="button" onClick={startEditing}>
              Edit Profile
            </ResolvedButton>
          ) : (
            <>
              <ResolvedButton variant="subtle" type="button" onClick={handleCancel}>
                Cancel
              </ResolvedButton>
              <ResolvedButton type="button" onClick={handleSave}>
                Save
              </ResolvedButton>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Photo preview modal */}
      <PhotoPreview
        src={previewOpen ? (displayAvatar || null) : null}
        onClose={() => setPreviewOpen(false)}
      />

      {/* ── Form fields ── */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={editing ? "edit" : "view"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ResolvedInput
              label="Name"
              value={display.name || ""}
              disabled={!editing}
              onChange={(e) => update("name", e.target.value)}
            />

            <div>
              <ResolvedInput
                label="Email"
                type="email"
                value={display.email || ""}
                disabled={!editing}
                onChange={(e) => update("email", e.target.value)}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-white/70">Mobile Number</span>
              <ResolvedPhoneInput
                country="in"
                onlyCountries={["in", "us", "gb"]}
                preferredCountries={["in", "us", "gb"]}
                value={(display.mobile || "").replace(/^\+/, "")}
                disabled={!editing}
                onChange={(val) => update("mobile", `+${val}`)}
                inputProps={{ name: "mobile" }}
                containerClass="!w-full relative"
                buttonClass="!border-transparent !bg-transparent !pl-2 hover:!bg-white/5 !rounded-l-xl"
                inputClass="!w-full !h-10 !rounded-xl !border !border-white/10 !bg-white/5 !text-sm !text-white !pl-12 !outline-none transition-colors"
                dropdownClass="!max-w-[250px] !rounded-xl dark:!border-white/10 !border-gray-200 dark:!bg-[#020617] !bg-white dark:!text-white !text-gray-800"
              />
              {errors.mobile && <p className="mt-1 text-xs text-rose-300">{errors.mobile}</p>}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-white/70">Gender</span>
              <Motion.select
                whileFocus={{ scale: 1.01 }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-60"
                value={display.gender || "male"}
                disabled={!editing}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="nonbinary">Non-binary</option>
                <option value="prefer_not">Prefer not to say</option>
              </Motion.select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-white/70">Profession</span>
              <Motion.select
                whileFocus={{ scale: 1.01 }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-60"
                value={display.profession || ""}
                disabled={!editing}
                onChange={(e) => update("profession", e.target.value)}
              >
                <option value="">Select profession</option>
                <option value="Student">Student</option>
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="Engineer">Engineer</option>
                <option value="Other">Other</option>
              </Motion.select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">About You</span>
            <Motion.textarea
              whileFocus={{ scale: 1.005 }}
              className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-60"
              value={display.about || ""}
              disabled={!editing}
              onChange={(e) => update("about", e.target.value)}
            />
          </label>
        </Motion.div>
      </AnimatePresence>
    </div>
  );
}
