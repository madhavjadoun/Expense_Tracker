const fs = require("fs");
const vm = require("vm");
const path = require("path");

function loadFaqs() {
  const filePath = path.join(__dirname, "../client/src/support/faqs.ts");
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/import\s+[^;]+;/g, "");
  content = content.replace(/:\s*FAQItem\[\]/g, "");
  content = content.replace(/export\s+/g, "");
  content = content.replace("const FAQ_ITEMS", "FAQ_ITEMS");
  
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  return sandbox.FAQ_ITEMS;
}

function loadKnowledge(faqs) {
  const filePath = path.join(__dirname, "../client/src/support/knowledge.ts");
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/import\s+[^;]+;/g, "");
  content = content.replace(/:\s*AppKnowledge\s*&\s*\{\s*faqs:\s*typeof\s*FAQ_ITEMS\s*\}/g, "");
  content = content.replace(/export\s+/g, "");
  content = content.replace("const APP_KNOWLEDGE", "APP_KNOWLEDGE");
  
  const sandbox = { FAQ_ITEMS: faqs };
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  return sandbox.APP_KNOWLEDGE;
}

function loadPrompt(knowledge) {
  const filePath = path.join(__dirname, "../client/src/support/prompt.ts");
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/import\s+[^;]+;/g, "");
  content = content.replace(/export\s+/g, "");
  content = content.replace("const SYSTEM_PROMPT", "SYSTEM_PROMPT");
  
  const sandbox = { APP_KNOWLEDGE: knowledge };
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  return sandbox.SYSTEM_PROMPT;
}

exports.postSupportMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: 'message' is required and must be a non-empty string."
      });
    }

    const userQuestion = message.trim();

    // Dynamically load the client-side support modules
    const faqs = loadFaqs();
    const knowledge = loadKnowledge(faqs);
    const systemPrompt = loadPrompt(knowledge);

    // Format FAQs as readable Q&A
    const formattedFaqs = faqs.map(
      (item) => `Q: ${item.question}\nA: ${item.answer}`
    ).join("\n\n");

    // Build the final combined prompt
    const combinedPrompt = `
${systemPrompt}

=========================================
APPLICATION KNOWLEDGE BASE:
Name: ${knowledge.appName}
Description: ${knowledge.description}
Supported Features:
${knowledge.supportedFeatures.map((f) => `- ${f.name}: ${f.description}`).join("\n")}
Unsupported Features:
${knowledge.unsupportedFeatures.map((f) => `- ${f}`).join("\n")}
Limitations:
${knowledge.limitations.map((l) => `- ${l}`).join("\n")}

=========================================
FREQUENTLY ASKED QUESTIONS (FAQs):
${formattedFaqs}

=========================================
USER QUESTION:
${userQuestion}
`;

    // Retrieve n8n webhook URL
    const n8nWebhookUrl = process.env.N8N_SUPPORT_WEBHOOK;
    if (!n8nWebhookUrl) {
      console.error("Missing N8N_SUPPORT_WEBHOOK in environment variables.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: AI support webhook is not configured."
      });
    }

    // Call n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: combinedPrompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n webhook returned status ${response.status}: ${errorText}`);
      return res.status(502).json({
        success: false,
        message: "Failed to fetch response from AI assistant."
      });
    }

    const n8nData = await response.json();
    if (!n8nData || typeof n8nData.text !== "string") {
      console.error("Invalid response body format from n8n webhook:", n8nData);
      return res.status(502).json({
        success: false,
        message: "Invalid response format from AI assistant."
      });
    }

    // Return the response structured as {"reply": "<AI response>"}
    return res.json({
      reply: n8nData.text
    });
  } catch (error) {
    console.error("Error in postSupportMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + (error.message || "Unknown error")
    });
  }
};
