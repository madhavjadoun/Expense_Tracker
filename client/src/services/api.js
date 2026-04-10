import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase";

// Central API utility (frontend ↔ backend)
// Base URL: from env or fallback
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await getIdToken(currentUser);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore auth token attach errors
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

function normalizeExpense(e) {
  return {
    id: e?._id || e?.id,
    amount: Number(e?.amount) || 0,
    category: (e?.category || "other").toLowerCase(),
    date: e?.date || new Date().toISOString(),
    note: e?.note || "",
  };
}

function pickData(res) {
  if (!res?.data) return null;
  if (res.data.success === false) {
    throw new Error(res.data.message || "Request failed.");
  }
  return res.data.data;
}

export const api = {
  async fetchProfile() {
    const res = await client.get("/profile");
    return pickData(res);
  },

  async saveProfile(payload) {
    const res = await client.put("/profile", payload);
    return pickData(res);
  },

  async fetchAnalyticsSummary() {
    const res = await client.get("/analytics/summary");
    return pickData(res);
  },

  async fetchExpenses() {
    const res = await client.get("/expenses");
    const data = pickData(res) || [];
    return Array.isArray(data) ? data.map(normalizeExpense) : [];
  },

  async addExpense(expense) {
    const res = await client.post("/expenses/add", {
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      date: expense.date,
    });
    const data = pickData(res);
    return normalizeExpense(data);
  },

  async deleteExpense(id) {
    const res = await client.delete(`/expenses/${id}`);
    const data = pickData(res);
    return normalizeExpense(data);
  },

  async updateExpense(id, expense) {
    const res = await client.put(`/expenses/${id}`, {
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      date: expense.date,
    });
    const data = pickData(res);
    return normalizeExpense(data);
  },
};
