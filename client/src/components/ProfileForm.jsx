import { useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Input from "./Input";
import Button from "./Button";
import { useUserStore } from "../store/useUserStore";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ProfileForm() {
  const ResolvedInput = typeof Input === "function" ? Input : Input?.default;
  const ResolvedButton = typeof Button === "function" ? Button : Button?.default;
  const ResolvedPhoneInput =
    typeof PhoneInput === "function" ? PhoneInput : PhoneInput?.default;

  const profile = useUserStore((s) => s.profile);
  const avatar = useUserStore((s) => s.avatar);
  const setProfile = useUserStore((s) => s.setProfile);
  const setAvatar = useUserStore((s) => s.setAvatar);
  const budgetMonthly = useAppStore((s) => s.budgetMonthly);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [draftAvatar, setDraftAvatar] = useState(avatar || null);
  const [errors, setErrors] = useState({});

  const display = editing ? draft : profile;
  const displayAvatar = editing ? draftAvatar : avatar;

  const hasInvalidComponents =
    typeof ResolvedInput !== "function" ||
    typeof ResolvedButton !== "function" ||
    typeof ResolvedPhoneInput !== "function";

  const initials = useMemo(() => {
    return (
      (display?.name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0]?.toUpperCase())
        .join("") || "U"
    );
  }, [display?.name]);

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validateForm(nextDraft) {
    const nextErrors = {};
    if (!isValidEmail(nextDraft.email || "")) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!String(nextDraft.mobile || "").trim()) {
      nextErrors.mobile = "Mobile number is required.";
    }
    return nextErrors;
  }

  async function handleSave() {
    const nextErrors = validateForm(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      const { avatar: _avatar, ...restDraft } = draft;
      const saved = await api.saveProfile({
        ...restDraft,
        monthlyBudget: budgetMonthly,
      });
      setProfile({
        ...draft,
        monthlyBudget: saved?.monthlyBudget ?? budgetMonthly,
      });
      setAvatar(draftAvatar);
      setEditing(false);
    } catch {
      setProfile(draft);
      setAvatar(draftAvatar);
      setEditing(false);
    }
  }

  function handleCancel() {
    setDraft(profile);
    setDraftAvatar(avatar || null);
    setErrors({});
    setEditing(false);
  }

  function startEditing() {
    setDraft(profile);
    setDraftAvatar(avatar || null);
    setErrors({});
    setEditing(true);
  }

  if (hasInvalidComponents) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        Profile UI failed to load. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500/25 to-emerald-500/20 ring-1 ring-white/10"
          >
            {displayAvatar ? (
              <img 
                src={displayAvatar} 
                alt="Profile avatar" 
                className="h-full w-full object-cover"
                style={{
                  filter: "none",
                  mixBlendMode: "normal",
                  isolation: "isolate",
                }}
              />
            ) : (
              <span className="text-xs font-semibold text-white/85">{initials}</span>
            )}
          </Motion.button>
          <div>
            <div className="text-sm font-semibold text-white/90">{display?.name || "Your profile"}</div>
            <div className="text-xs text-white/50">Manage your account details.</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      <AnimatePresence mode="wait">
        <Motion.div
          key={editing ? "editing" : "view"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-white/70">Profile image</span>
              <input
                type="file"
                accept="image/*"
                disabled={!editing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setDraftAvatar(reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/20 disabled:opacity-60"
              />
            </label>

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
              {errors.email ? <p className="mt-1 text-xs text-rose-300">{errors.email}</p> : null}
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
              {errors.mobile ? <p className="mt-1 text-xs text-rose-300">{errors.mobile}</p> : null}
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
