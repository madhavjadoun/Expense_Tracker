import { FAQItem } from "../types";

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "add-expense",
    category: "expenses",
    question: "How do I add a new expense?",
    answer: "Navigate to the 'Expenses' page from the sidebar, click the primary 'Add Expense' button, fill in the details such as Amount, Category, and Date, and click 'Save'. The expense will be immediately saved to your active workspace.",
    keywords: ["add", "new", "expense", "save", "create", "enter", "nawa", "kharcha"]
  },
  {
    id: "edit-delete-expense",
    category: "expenses",
    question: "Can I edit or delete an existing expense?",
    answer: "Yes, you can. In the 'Expenses' list view, click on the expense you wish to modify. A modal will open where you can update any detail or click the red 'Delete' button at the bottom to remove the expense permanently.",
    keywords: ["edit", "delete", "remove", "update", "modify", "change", "cancel", "galat"]
  },
  {
    id: "workspace-info",
    category: "workspaces",
    question: "What are workspaces and how do they work?",
    answer: "Workspaces allow you to categorize and isolate your finances (e.g., Personal, Family, Business). Each workspace has its own set of expenses, categories, members, and monthly budget configurations.",
    keywords: ["workspace", "what", "workspaces", "isolate", "explain", "multi", "personal", "business"]
  },
  {
    id: "create-workspace",
    category: "workspaces",
    question: "How do I create a new workspace?",
    answer: "Click the workspace selector dropdown in the top-left corner of the sidebar, select 'Create Workspace', choose a name and currency for your workspace, and save. You can switch between your workspaces instantly using the same dropdown.",
    keywords: ["create", "new", "workspace", "add", "make", "dropdown", "setup", "naya"]
  },
  {
    id: "invite-members",
    category: "collaboration",
    question: "How do I invite other users to my workspace?",
    answer: "Open the workspace selector in the top-left, click 'Workspace Settings' next to your active workspace, and click the 'Invite Member' button. A unique invitation link will be generated for you to copy and share.",
    keywords: ["invite", "share", "member", "add user", "collaboration", "friend", "link", "join"]
  },
  {
    id: "split-info",
    category: "collaboration",
    question: "How does the Split page work?",
    answer: "The 'Split' feature lets you divide expenses among members of a workspace. You can choose to split equally or enter custom amounts. The app automatically calculates the net balances to show who owes whom.",
    keywords: ["split", "divide", "bill", "share", "calculation", "balance", "owe", "group"]
  },
  {
    id: "spending-score",
    category: "analytics",
    question: "How is the spending score calculated?",
    answer: "Your spending score is calculated dynamically based on your monthly budget utilization, saving rate, daily spending frequency, and consistency. A score above 80 points represents excellent financial discipline!",
    keywords: ["spending score", "score", "grade", "rating", "health", "calculate", "budget"]
  },
  {
    id: "export-data",
    category: "expenses",
    question: "Can I export my expenses?",
    answer: "Yes, you can export your data. Go to the 'Expenses' page, and in the top-right header section of your table list, click the 'Export CSV' button to download a spreadsheet containing all filtered expenses.",
    keywords: ["export", "csv", "download", "excel", "sheet", "spreadsheet", "save data"]
  },
  {
    id: "safe-status",
    category: "analytics",
    question: "What does the 'Safe' status mean under budget?",
    answer: "The 'Safe' status means your projected spending for the rest of the month is well within your defined monthly budget limit. If your spending rate increases, the status will shift to 'Warning'.",
    keywords: ["safe", "status", "warning", "budget", "dashboard", "indicator", "limit"]
  },
  {
    id: "recurring-budget",
    category: "workspaces",
    question: "Can I set a recurring monthly budget?",
    answer: "Yes. From the 'Dashboard', you can set or adjust your target monthly budget. This budget will automatically rollover and serve as your monthly reference limit unless you manually change it.",
    keywords: ["recurring", "monthly", "budget", "limit", "rollover", "target"]
  },
  {
    id: "change-currency",
    category: "workspaces",
    question: "How do I change the currency of my workspace?",
    answer: "You can switch the display currency at the top navbar. To change the default currency of a workspace, go to the workspace dropdown settings, edit the workspace details, and select your preferred currency.",
    keywords: ["currency", "inr", "usd", "eur", "change", "symbol", "money", "rupee", "dollar"]
  },
  {
    id: "delete-workspace",
    category: "workspaces",
    question: "What happens when I delete a workspace?",
    answer: "Deleting a workspace permanently deletes all expenses, custom categories, invites, and split records associated with it. This action is irreversible, so please proceed with caution.",
    keywords: ["delete", "remove", "workspace", "irreversible", "erase", "danger"]
  },
  {
    id: "offline-support",
    category: "security",
    question: "Can I track my spending offline?",
    answer: "The Expense Tracker requires a live internet connection to synchronize data and keep shared workspaces up-to-date with other members. Offline changes are not supported currently.",
    keywords: ["offline", "no internet", "sync", "connection", "wifi", "network"]
  },
  {
    id: "budget-sync",
    category: "workspaces",
    question: "Why does my budget not update immediately?",
    answer: "Ensure that the expense you just added belongs to the current calendar month and active workspace. Budget calculations are isolated by workspace and specific to the selected month.",
    keywords: ["sync", "update", "delay", "budget", "mismatch", "month", "wrong date"]
  },
  {
    id: "data-security",
    category: "security",
    question: "Is my financial data secure?",
    answer: "Absolutely. We secure all communication using standard TLS/SSL encryption and leverage Firebase's enterprise-grade security rules to ensure only authenticated workspace members can access the workspace data.",
    keywords: ["security", "safe", "secure", "private", "firebase", "encryption", "data", "privacy"]
  },
  {
    id: "reset-password",
    category: "account",
    question: "How do I reset my account password?",
    answer: "If you want to change your password, click 'Logout' in the top-right, go to the Login screen, click the 'Forgot Password' link, and enter your email address to receive a secure password reset link.",
    keywords: ["reset", "password", "forgot", "change", "login", "auth", "email"]
  },
  {
    id: "currency-conversion",
    category: "workspaces",
    question: "How does currency conversion work in Arthaa?",
    answer: "Arthaa automatically pulls real-time exchange rates (USD, EUR, INR) from a live market API in the backend. When you switch your display currency in the top navbar, your expense history, category breakdowns, and monthly budget limits convert instantly using these latest rates, allowing you to see your finances in your preferred currency.",
    keywords: ["currency", "conversion", "rate", "exchange", "market", "conversion rate", "live rates", "usd", "inr", "eur"]
  }
];
