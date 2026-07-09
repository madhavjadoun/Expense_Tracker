import { AIConfig } from "../types";

export const AI_CONFIG: AIConfig = {
  provider: "placeholder",
  webhookUrl: "",
  timeout: 10000, // 10 seconds timeout limit
  maxMessages: 20 // limit context memory to 20 messages
};
