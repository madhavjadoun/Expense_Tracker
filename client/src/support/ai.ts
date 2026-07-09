import { ChatMessage } from "../types";
import { FAQ_ITEMS } from "./faqs";

/**
 * Normalizes text by converting it to lowercase, removing punctuation,
 * collapsing multiple spaces into one, and trimming leading/trailing whitespace.
 * 
 * @param text The input string to normalize.
 * @returns The normalized string.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // ignore punctuation
    .replace(/\s+/g, " ")    // collapse extra spaces
    .trim();
}

/**
 * Sends a user message to the AI support service.
 * Before calling the Express endpoint, it checks for an exact normalized match
 * in the local FAQ data to avoid unnecessary Gemini API calls.
 * 
 * @param userMessage The message input string from the user.
 * @returns A promise resolving to the assistant's response string.
 */
export async function sendChatMessage(userMessage: string): Promise<string> {
  const normalizedUser = normalizeText(userMessage);

  // Check local FAQs for an exact match
  const matchedFaq = FAQ_ITEMS.find(
    (faq) => normalizeText(faq.question) === normalizedUser
  );

  if (matchedFaq) {
    // Exact match found; return immediately without triggering backend/Gemini requests
    return matchedFaq.answer;
  }

  // Fallback to Express backend `/api/support` if no exact local match exists
  const baseUrl = import.meta.env.VITE_API_URL || "https://expense-tracker-rouge-chi-43.vercel.app";
  const response = await fetch(`${baseUrl}/api/support`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
  });

  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data.reply !== "string") {
    throw new Error("Invalid reply format from support assistant");
  }

  return data.reply;
}
