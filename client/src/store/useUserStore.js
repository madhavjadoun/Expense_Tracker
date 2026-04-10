import { create } from "zustand";
import { api } from "../services/api";

const DEFAULT_PROFILE = {
  name: "User",
  email: "",
  mobile: "",
  gender: "male",
  profession: "",
  about: "",
  monthlyBudget: 0,
};

/** User-scoped keys — never use a global "profile" key. */
export function profileStorageKey(uid) {
  return `profile_${uid}`;
}

export function avatarStorageKey(uid) {
  return `avatar_${uid}`;
}

function readLocalProfile(uid) {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(profileStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
    const legacy = window.localStorage.getItem(`profileData_${uid}`);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function readLocalAvatar(uid) {
  if (!uid || typeof window === "undefined") return null;
  try {
    const fromAvatarKey = window.localStorage.getItem(avatarStorageKey(uid));
    if (fromAvatarKey) return fromAvatarKey;
    const legacy = window.localStorage.getItem(`profileAvatar_${uid}`);
    return legacy || null;
  } catch {
    return null;
  }
}

function persistProfile(uid, profile) {
  if (!uid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(profileStorageKey(uid), JSON.stringify(profile));
    if (profile?.avatar) {
      window.localStorage.setItem(avatarStorageKey(uid), profile.avatar);
    }
  } catch {
    // ignore quota / private mode
  }
}

export const useUserStore = create((set, get) => ({
  storageUid: null,
  profile: DEFAULT_PROFILE,
  avatar: null,
  loading: false,

  setLoading: (loading) => set({ loading: Boolean(loading) }),

  resetForLogout: () =>
    set({
      storageUid: null,
      profile: DEFAULT_PROFILE,
      avatar: null,
    }),

  /** Load profile from MongoDB (authoritative) and cache under profile_<uid>. */
  syncProfileFromServer: async (authUser) => {
    const uid = authUser?.uid;
    if (!uid) {
      set({ storageUid: null, profile: DEFAULT_PROFILE, avatar: null });
      return;
    }
    try {
      const remote = await api.fetchProfile();
      const merged = {
        ...DEFAULT_PROFILE,
        ...remote,
        name: authUser.name || remote?.name || DEFAULT_PROFILE.name,
        email: authUser.email || remote?.email || DEFAULT_PROFILE.email,
        monthlyBudget: Number(remote?.monthlyBudget) || 0,
      };
      const avatarVal = merged.avatar || readLocalAvatar(uid) || null;
      set({
        storageUid: uid,
        profile: merged,
        avatar: avatarVal,
      });
      persistProfile(uid, { ...merged, avatar: avatarVal || "" });
    } catch {
      get().hydrateFromAuthUserLocal(authUser);
    }
  },

  /** Offline / API failure: local cache only. */
  hydrateFromAuthUserLocal: (authUser) => {
    const uid = authUser?.uid;
    if (!uid) {
      set({ storageUid: null, profile: DEFAULT_PROFILE, avatar: null });
      return;
    }
    const loaded = readLocalProfile(uid) || {};
    const merged = {
      ...DEFAULT_PROFILE,
      ...loaded,
      name: authUser.name || loaded.name || DEFAULT_PROFILE.name,
      email: authUser.email || loaded.email || DEFAULT_PROFILE.email,
      monthlyBudget: Number(loaded.monthlyBudget) || 0,
    };
    const avatarVal = merged.avatar || readLocalAvatar(uid) || null;
    set({ storageUid: uid, profile: merged, avatar: avatarVal });
    persistProfile(uid, { ...merged, avatar: avatarVal || "" });
  },

  setProfile: (nextProfile) => {
    const uid = get().storageUid;
    const merged = { ...DEFAULT_PROFILE, ...(nextProfile || {}) };
    if (typeof window !== "undefined" && uid) {
      persistProfile(uid, { ...merged, avatar: get().avatar || merged.avatar || "" });
    }
    set({ profile: merged });
  },

  setAvatar: (dataUrlOrNull) => {
    const uid = get().storageUid;
    const value = dataUrlOrNull || null;
    try {
      if (typeof window !== "undefined" && uid) {
        if (value) window.localStorage.setItem(avatarStorageKey(uid), value);
        else window.localStorage.removeItem(avatarStorageKey(uid));
      }
    } catch {
      // ignore
    }
    set({ avatar: value });
    const p = get().profile;
    if (uid) persistProfile(uid, { ...p, avatar: value || "" });
  },
}));
