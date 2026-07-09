export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface KnowledgeFeature {
  name: string;
  description: string;
  workflows?: string[];
}

export interface KnowledgeWorkflow {
  goal: string;
  steps: string[];
}

export interface TroubleshootingGuide {
  issue: string;
  solution: string;
}

export interface TermDefinition {
  term: string;
  definition: string;
}

export interface AppKnowledge {
  appName: string;
  description: string;
  supportedFeatures: KnowledgeFeature[];
  unsupportedFeatures: string[];
  commonWorkflows: KnowledgeWorkflow[];
  troubleshooting: TroubleshootingGuide[];
  limitations: string[];
  frequentlyUsedTerms: TermDefinition[];
}

export interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
}

export interface AIConfig {
  provider: "placeholder" | "n8n" | "openai" | "gemini";
  webhookUrl: string;
  timeout: number;
  maxMessages: number;
}
