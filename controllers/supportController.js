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

function getSmartLocalResponse(userQuestion, faqs, knowledge) {
  const text = userQuestion.toLowerCase();
  
  // 1. Exact or close FAQ match
  for (const item of faqs) {
    if (text.includes(item.question.toLowerCase()) || item.question.toLowerCase().includes(text)) {
      return item.answer;
    }
  }
  
  // 2. Keyword-based matching
  if (text.includes("split") || text.includes("share") || text.includes("bill") || text.includes("friend") || text.includes("debt")) {
    return "With Fintra, you can split expenses inside any workspace. Just go to the 'Split' page in your sidebar. Add members to your workspace first, then click 'Add Split Expense' to enter details. The system will automatically calculate balances and simplify debts between members!";
  }
  
  if (text.includes("budget") || text.includes("limit") || text.includes("set budget")) {
    return "To set a budget, navigate to the main 'Dashboard' or 'Expenses' page. You can set a monthly spending limit there. The progress indicator will show you how much of your budget you have spent and how much remains safe for spending.";
  }
  
  if (text.includes("add expense") || text.includes("new expense") || text.includes("record")) {
    return "You can add a normal expense by clicking the 'Add Expense' button on the Dashboard or Expenses page. Choose the category (Food, Travel, Utilities, etc.), enter the amount, and write a quick note. The dashboard charts will update in real-time!";
  }

  if (text.includes("delete") || text.includes("remove") || text.includes("clear")) {
    return "To delete an expense or settlement, go to the corresponding history tab or expense list and click the 'Trash' icon. For split bills, deleting a settlement will restore the original balances automatically.";
  }

  if (text.includes("workspace") || text.includes("group") || text.includes("invite")) {
    return "Workspaces let you isolate your personal expenses from group bills. You can create a new workspace in the sidebar, or generate an invite link to invite friends to join your active workspace. Once they click the link, they'll be added!";
  }
  
  if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("help")) {
    return `Hello! I'm your Fintra AI Support Assistant. I can help you with:\n• Splitting group expenses & settling balances\n• Setting budgets & tracking limits\n• Managing workspaces & inviting friends\n\nWhat can I help you with today?`;
  }

  // 3. Fallback contextual generic answer
  return `I've recorded your question: "${userQuestion}". Fintra supports personal budgets, real-time bill splitting, custom workspace isolation, and automated recurring expenses. You can navigate the app using the sidebar options. If you need further help, please check our FAQ section in the Help panel!`;
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
    const isLocalAddress = n8nWebhookUrl && (n8nWebhookUrl.includes("localhost") || n8nWebhookUrl.includes("127.0.0.1") || n8nWebhookUrl.includes("192.168."));
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

    if (!n8nWebhookUrl) {
      console.warn("[SUPPORT] n8n webhook URL is not configured (N8N_SUPPORT_WEBHOOK is missing). Falling back to local assistant.");
      const reply = getSmartLocalResponse(userQuestion, faqs, knowledge);
      return res.json({ reply });
    }

    if (isLocalAddress && isProduction) {
      console.warn(`[SUPPORT] n8n webhook URL (${n8nWebhookUrl}) is a localhost address in production. Webhooks must be public in production. Falling back to local assistant.`);
      const reply = getSmartLocalResponse(userQuestion, faqs, knowledge);
      return res.json({ reply });
    }

    try {
      // Call n8n webhook
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: combinedPrompt })
      });

      if (response.ok) {
        const rawText = await response.text();
        let n8nData;
        try {
          n8nData = JSON.parse(rawText);
          if (Array.isArray(n8nData)) {
            n8nData = n8nData[0];
          }
          if (n8nData && typeof n8nData.text === "string") {
            return res.json({
              reply: n8nData.text
            });
          }
        } catch (parseErr) {
          console.warn("[SUPPORT] Failed to parse n8n webhook response as JSON, using local assistant fallback. Error:", parseErr.message);
        }
      } else {
        console.warn(`[SUPPORT] n8n webhook at ${n8nWebhookUrl} returned non-200 status (${response.status}), using local assistant fallback.`);
      }
      
      const reply = getSmartLocalResponse(userQuestion, faqs, knowledge);
      return res.json({ reply });
    } catch (fetchError) {
      console.error(`[SUPPORT] Failed to connect to n8n support webhook at ${n8nWebhookUrl}, falling back to local assistant:`, fetchError.message);
      const reply = getSmartLocalResponse(userQuestion, faqs, knowledge);
      return res.json({ reply });
    }
  } catch (error) {
    console.error("Error in postSupportMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + (error.message || "Unknown error")
    });
  }
};
