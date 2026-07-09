import { AppKnowledge } from "../../types";
import { FAQ_ITEMS } from "../../data/faqs";

export const APP_KNOWLEDGE: AppKnowledge & { faqs: typeof FAQ_ITEMS } = {
  appName: "Expense Tracker",
  description: "A premium, collaborative web application designed to track, split, and analyze personal and group expenses in real-time across isolated workspaces.",
  
  supportedFeatures: [
    {
      name: "Expense Management",
      description: "Allows users to add, edit, delete, categorize, and backdate financial transactions within a workspace.",
      workflows: ["Add Expense", "Edit/Delete Expense", "Categorization"]
    },
    {
      name: "Workspaces",
      description: "Isolated environments to segregate transactions (e.g., Personal, Business, Family). Supports base currency configurations and setting individual monthly budgets.",
      workflows: ["Create Workspace", "Switch Workspace", "Set Workspace Budget"]
    },
    {
      name: "Collaboration & Bill Splitting",
      description: "Enables members of a shared workspace to split expense costs either equally or unequally, and automatically calculates outstanding balances.",
      workflows: ["Generate Invite Link", "Join Workspace via Link", "Equal/Uneven Bill Splitting", "Settle Up Balances"]
    },
    {
      name: "Analytics & Reports",
      description: "Visualizes trends, category distributions, monthly budgets, and calculates a financial health index (Spending Score). Supports exporting lists to CSV.",
      workflows: ["View Interactive Charts", "CSV Export", "Review Spending Score"]
    }
  ],

  unsupportedFeatures: [
    "Offline database persistence and transaction synchronization (requires a live internet connection).",
    "Automated bank feed integrations and bank account scraping.",
    "OCR-based receipt text scanning and auto-categorization.",
    "Multi-currency conversion inside a single workspace transaction sheet (all expenses inside a workspace inherit its active base currency)."
  ],

  commonWorkflows: [
    {
      goal: "Share a group lunch bill unevenly",
      steps: [
        "Go to the 'Expenses' page and click 'Add Expense'.",
        "Enter the total amount paid, choose a category, and toggle the Split settings.",
        "Select the members who participated and input their specific contribution shares.",
        "Save the transaction. The 'Split' page will automatically update net balances showing who owes whom."
      ]
    },
    {
      goal: "Download a monthly spreadsheet report",
      steps: [
        "Navigate to the 'Expenses' list view.",
        "Apply date range or category filters if you only want to export specific items.",
        "Click the 'Export CSV' button in the upper-right corner of the data grid.",
        "Save the downloaded CSV spreadsheet locally on your device."
      ]
    },
    {
      goal: "Invite a new member to collaborate",
      steps: [
        "Click the Workspace selector dropdown in the top-left and click 'Workspace Settings'.",
        "Click 'Invite Member' to generate a unique tokenized link.",
        "Copy the link and send it to your teammate/friend.",
        "The recipient must log in first and then open the link to join your workspace automatically."
      ]
    }
  ],

  troubleshooting: [
    {
      issue: "Added expense is missing from my dashboard",
      solution: "Check the top-left dropdown to confirm you are in the correct workspace. If you are, perform a hard browser refresh (Ctrl+F5 / Cmd+Shift+R) to clear any cached data."
    },
    {
      issue: "Invite link returns an error or is invalid",
      solution: "Workspace invite tokens have expiration dates. Request the administrator to open 'Workspace Settings' and generate a fresh invite link, discarding the old one."
    },
    {
      issue: "Budget or Spending Score not reflecting recent transactions",
      solution: "Verify that the date of the expense you added is within the active calendar month you are reviewing. Budget computations are strictly month-specific."
    }
  ],

  limitations: [
    "Workspace deletion is absolute and immediately destroys all connected transactions, categories, and invite links. Data recovery is not possible.",
    "A single workspace can only hold and process one base currency at a time.",
    "Data updates require an active socket connection. Inactive or slow network conditions might delay synchronization with other group members."
  ],

  frequentlyUsedTerms: [
    {
      term: "Workspace",
      definition: "An isolated tracking container separating data (expenses, budgets, members) between groups (e.g., family vs. company)."
    },
    {
      term: "Spending Score",
      definition: "A score from 0 to 100 assessing workspace budget utilization, no-spend days, and savings rate to indicate overall financial health."
    },
    {
      term: "Split Balance",
      definition: "The calculated net outstanding difference showing the money owed between co-members of a workspace."
    }
  ],

  // Reference the existing FAQ database
  faqs: FAQ_ITEMS
};
