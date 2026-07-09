import { ChatMessage } from "../../types";
import { AI_CONFIG } from "../config/ai";

/**
 * Sends a user message to the AI support service and returns the assistant's response text.
 * The behavior adapts based on the active configuration in AI_CONFIG.
 * 
 * @param userMessage The message input string from the user.
 * @returns The response string from the assistant.
 */
export async function sendChatMessage(userMessage: string): Promise<string> {
  if (AI_CONFIG.provider === "placeholder") {
    // Simulate network latency (e.g., 1000ms delay)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "AI support will be available soon.";
  }

  // Future providers (like n8n webhook) will be implemented here
  throw new Error(`Unsupported AI provider: ${AI_CONFIG.provider}`);
}
