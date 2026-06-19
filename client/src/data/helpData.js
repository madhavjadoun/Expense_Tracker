// ─────────────────────────────────────────────────────────────
//  helpData.js
//  UI language: English
//  Keywords: Hinglish + English (for broad query matching)
// ─────────────────────────────────────────────────────────────

export const FAQ_ITEMS = [

  // ─── 🔐 LOGIN / ACCOUNT ───────────────────────────────────
  {
    keywords: [
      "login nahi", "login problem", "sign in nahi", "cant login", "login ho nahi raha",
      "password bhool", "forgot password", "login fail", "login issue",
      "password wrong", "email wrong", "credentials",
    ],
    question: "Unable to login",
    answer:
      "Double-check your email and password — a small typo is the most common culprit! If you've forgotten your password, hit 'Forgot Password' and a reset link will be sent to your inbox. Still stuck? Try clearing your browser cache and logging in again.",
  },
  {
    keywords: [
      "otp nahi aaya", "otp nahi mila", "verification code", "code nahi mila",
      "email verification", "otp", "email not received", "confirmation email",
    ],
    question: "Didn't receive OTP or verification email",
    answer:
      "Check your Spam / Junk folder first — it lands there 90% of the time! Using Gmail? Also peek into the Promotions tab. If it's been more than 2 minutes, wait a bit and request a new OTP. Make sure the email address you entered is correct.",
  },
  {
    keywords: [
      "logout", "sign out", "bahar nikalna", "account se nikalna", "log out karna", "how to logout",
    ],
    question: "How to logout",
    answer:
      "Click your profile icon in the top-right corner of the screen, then select 'Logout' from the dropdown. That's all it takes!",
  },
  {
    keywords: [
      "bar bar login", "session expire", "baar baar login", "automatically logout",
      "auto logout", "dobara login", "keeps logging out", "session expired",
    ],
    question: "App keeps logging me out",
    answer:
      "This happens when your session expires — it's completely normal behaviour. Simply log in again. If it happens repeatedly, try clearing your browser cache or switching to a different browser.",
  },

  // ─── 💰 ADD / MANAGE EXPENSE ─────────────────────────────
  {
    keywords: [
      "expense add nahi", "expense nahi add ho raha", "add expense problem",
      "expense save nahi", "required fields", "expense nahi bana",
      "cannot add expense", "expense not saving", "add expense",
    ],
    question: "Can't add an expense",
    answer:
      "Make sure all required fields are filled in — Amount and Category are mandatory. Leave any field blank and the form won't save. Fill everything in and hit Save. If it still fails, try refreshing the page and adding again.",
  },
  {
    keywords: [
      "expense dikh nahi", "expense show nahi", "add kiya but visible nahi",
      "expense missing", "expense nazar nahi aa raha", "expense gayab",
      "expense not showing", "expense disappeared", "added expense not visible",
    ],
    question: "Added expense isn't showing up",
    answer:
      "First, do a quick page refresh (Ctrl+R / Cmd+R). If it's still missing, check that you're in the correct workspace — expenses are workspace-specific and won't appear in other workspaces.",
  },
  {
    keywords: [
      "galat expense", "wrong expense", "edit expense", "expense edit karna",
      "expense change", "modify expense", "update expense",
    ],
    question: "Added wrong expense — how to edit it",
    answer:
      "Go to your Expenses list, find the entry and click on it. Use the Edit option to update the amount, category, description or date. Save when you're done — the change reflects immediately.",
  },
  {
    keywords: [
      "expense delete", "delete expense", "remove expense", "expense hatana",
      "expense mitana", "how to delete expense",
    ],
    question: "How to delete an expense",
    answer:
      "Open the expense you want to remove and press the Delete button. You'll be asked to confirm — once deleted, it cannot be recovered, so double-check before confirming.",
  },
  {
    keywords: [
      "past date", "purani date", "previous date", "pichli date",
      "backdated expense", "purana expense", "add old expense", "old date",
    ],
    question: "How to add an expense with a past date",
    answer:
      "When adding an expense, click the date field — a calendar picker will appear. You can select any previous date freely. No restrictions on backdating!",
  },
  {
    keywords: [
      "duplicate", "do baar add", "same expense twice", "double entry",
      "do baar expense", "duplicate expense",
    ],
    question: "Same expense got added twice",
    answer:
      "Open your Expenses list, find the duplicate entry and delete it. Going forward, give your list a quick glance before hitting Save to catch duplicates early.",
  },

  // ─── 📊 BUDGET / DASHBOARD ───────────────────────────────
  {
    keywords: [
      "budget galat", "remaining budget", "budget wrong", "budget match nahi",
      "budget sahi nahi", "budget calculate galat", "budget incorrect",
      "remaining amount wrong", "budget not correct",
    ],
    question: "Remaining budget looks incorrect",
    answer:
      "Head to Dashboard → Budget section and verify the monthly amount. If some expenses were added to a different workspace, they won't count towards this budget — that's the most common reason for a mismatch. Confirm all expenses are in the right workspace.",
  },
  {
    keywords: [
      "budget set nahi", "budget kaise set", "monthly budget", "set budget",
      "budget lagana", "how to set budget", "budget setup",
    ],
    question: "How to set a monthly budget",
    answer:
      "Go to the Dashboard → find the Budget section → enter your monthly limit and save. You can set a different budget for each month and each workspace independently.",
  },
  {
    keywords: [
      "spending score", "score kya hai", "score samajh nahi", "score explain",
      "score matlab", "what is spending score", "score calculation",
    ],
    question: "What is the Spending Score?",
    answer:
      "The Spending Score is a 0–100 rating of your financial health. It factors in: budget usage (are you staying within limits?), no-spend days, and spending consistency over the month. A score above 80 means you're doing great — keep it up!",
  },
  {
    keywords: [
      "safe status", "status safe", "budget safe", "safe dikha", "safe mode",
      "what does safe mean", "status meaning",
    ],
    question: "What does the 'Safe' status mean?",
    answer:
      "Good news — 'Safe' means you're well within your monthly budget! Keep spending at this pace and you'll finish the month in the green. If it turns to 'Warning', it's a nudge to cut back a little.",
  },
  {
    keywords: [
      "budget update nahi", "budget reflect nahi", "expense add kiya budget nahi",
      "budget change nahi", "budget update nahi hua", "budget not updating",
    ],
    question: "Added expense but budget didn't update",
    answer:
      "The most likely cause: the expense was added to a different workspace or a different month. Budget tracking is workspace-and-month specific. Verify that the expense's workspace and date match where you're checking the budget.",
  },
  {
    keywords: [
      "no spend", "streak break", "streak tod", "streak khatam",
      "no spend streak", "streak broken", "streak lost",
    ],
    question: "My no-spend streak got broken",
    answer:
      "Any expense — even a tiny one — resets the streak. That's just how it works! Don't worry though, streaks reset to Day 1 and you can start building again right away. Consistency is the goal.",
  },

  // ─── 💼 WORKSPACE ────────────────────────────────────────
  {
    keywords: [
      "workspace nahi dikh", "workspace missing", "workspace create kiya dikh nahi",
      "workspace show nahi", "naya workspace", "workspace not showing",
      "workspace not visible", "created workspace",
    ],
    question: "Created a workspace but it's not showing",
    answer:
      "Refresh the page first. Then check the top-left workspace dropdown — your new workspace should appear in the list. It can take a second or two to reflect after creation.",
  },
  {
    keywords: [
      "wrong workspace", "galat workspace", "dusre workspace mein expense",
      "workspace mistake", "expense in wrong workspace",
    ],
    question: "Expense added to the wrong workspace",
    answer:
      "Switch to the correct workspace using the top-left dropdown, then add the expense again. Don't forget to delete the entry from the wrong workspace to keep things clean.",
  },
  {
    keywords: [
      "workspace switch", "workspace change", "workspace badalna",
      "workspace select karna", "how to switch workspace", "change workspace",
    ],
    question: "How to switch workspaces",
    answer:
      "Click the workspace name in the top-left dropdown. Select the workspace you want — all data updates instantly. It's the central hub for navigating between different tracking spaces.",
  },
  {
    keywords: [
      "dusre user expenses", "shared workspace", "others expenses",
      "dono dikh rahe", "sab dikh raha", "seeing other people expenses",
      "other members expenses",
    ],
    question: "I can see other users' expenses",
    answer:
      "You're in a shared workspace — that's by design. In shared workspaces, all members' expenses are visible to everyone. If you want to track personal expenses privately, create a separate workspace just for yourself.",
  },
  {
    keywords: [
      "workspace data missing", "data nahi dikh raha workspace",
      "workspace empty", "sab data gaya", "workspace data gone",
    ],
    question: "Workspace data appears to be missing",
    answer:
      "Don't panic — data rarely gets deleted on its own. First, confirm you're in the correct workspace (top-left dropdown). Switching to the wrong workspace makes it look like data is missing, but it's actually right there in the correct one.",
  },

  // ─── 🔗 INVITE / COLLABORATION ──────────────────────────
  {
    keywords: [
      "invite link", "link kaam nahi", "invite fail", "link expired",
      "link nahi chala", "invite link not working", "invite broken",
    ],
    question: "Invite link isn't working",
    answer:
      "Invite links can expire. Go to Workspace Settings, generate a fresh invite link, and share that. Discard the old one — it won't work anymore.",
  },
  {
    keywords: [
      "user join nahi", "join nahi ho raha", "member join",
      "dost join nahi kar pa raha", "friend cant join", "user not joining",
    ],
    question: "Someone can't join my workspace",
    answer:
      "Two things to check: (1) They must be logged into the app before following the link. (2) Make sure the full link was shared — copy-paste sometimes cuts it short. Sending the link via the app's share button is the safest option.",
  },
  {
    keywords: [
      "invite accept kiya data nahi", "join kiya workspace nahi dikh",
      "accepted invite but nothing", "joined but no data",
    ],
    question: "Accepted invite but workspace data isn't visible",
    answer:
      "After joining, you need to manually select the new workspace from the top-left dropdown. It won't switch automatically — just open the dropdown, find the workspace you joined, and click it.",
  },
  {
    keywords: [
      "total mismatch", "multiple users mismatch", "sab ka total",
      "shared total galat", "group total wrong",
    ],
    question: "Total amounts don't match across members",
    answer:
      "This usually happens when someone adds expenses to a different workspace than the rest of the group. Ask everyone to confirm they're all using the same workspace — the name should match exactly.",
  },

  // ─── 💸 SPLIT FEATURE ────────────────────────────────────
  {
    keywords: [
      "split galat", "split wrong", "split amount", "split sahi nahi",
      "split calculation", "split incorrect", "wrong split",
    ],
    question: "Split amount looks wrong",
    answer:
      "Open the expense and check the Split section. It shows exactly how the amount was divided. Verify whether it's an equal split or a manual one — if the total expense amount changed, that would affect the split too.",
  },
  {
    keywords: [
      "unequal split", "manual split", "alag alag split", "custom split",
      "different amounts split", "uneven split",
    ],
    question: "How to do an unequal / custom split",
    answer:
      "Edit the expense and navigate to the Split section. From there you can manually enter each member's share rather than splitting equally. Set the amounts and save.",
  },
  {
    keywords: [
      "split details", "split nahi dikh", "split section", "breakdown nahi",
      "split not visible", "where is split",
    ],
    question: "Split details are not visible",
    answer:
      "Click on the expense to open it. Inside, scroll down to find the Split / Breakdown section. It lists each member's contribution clearly.",
  },
  {
    keywords: [
      "kisne pay kiya", "who paid", "payment confusion", "kaun diya",
      "payment breakdown", "who paid how much",
    ],
    question: "Confused about who paid what",
    answer:
      "Open the expense → go to the Split section. You'll see a clear breakdown: who paid the full amount upfront and how much each person owes. No guesswork needed.",
  },

  // ─── 📈 ANALYTICS ────────────────────────────────────────
  {
    keywords: [
      "analytics empty", "analytics khaali", "no data analytics",
      "graph nahi dikh", "analytics nahi", "charts empty", "graphs not showing",
    ],
    question: "Analytics page is empty",
    answer:
      "Analytics needs data to display charts. Add at least 3–5 expenses and the graphs will populate automatically. The more data you have, the more meaningful the insights become.",
  },
  {
    keywords: [
      "last month", "comparison nahi", "month comparison", "previous month data",
      "purana month", "month over month", "no comparison data",
    ],
    question: "Month-over-month comparison isn't showing",
    answer:
      "The comparison feature requires data from the previous month. Once you've tracked at least one full month, the comparison view will unlock and display trends automatically.",
  },
  {
    keywords: [
      "graph samajh nahi", "chart samajh nahi", "graphs kya dikhate",
      "chart explain", "pie chart", "what do graphs mean", "understand charts",
    ],
    question: "Can't understand what the graphs mean",
    answer:
      "Here's a quick guide: Bar chart = total spending per month, Pie / Donut chart = spending broken down by category (Food, Travel, etc.), Line chart = spending trend over time. Hover over any bar or slice to see exact figures.",
  },

  // ─── ⚠️ ERRORS / TECHNICAL ISSUES ───────────────────────
  {
    keywords: [
      "data update nahi", "changes nahi dikh", "page update nahi",
      "sync nahi", "data not updating", "changes not reflecting",
    ],
    question: "Changes / data not updating",
    answer:
      "Try a hard refresh — Ctrl+Shift+R on Windows or Cmd+Shift+R on Mac. If the issue persists, log out and log back in. That clears stale session data and usually fixes sync problems.",
  },
  {
    keywords: [
      "app slow", "slow chal raha", "lag", "hang", "freeze",
      "app slow loading", "app hanging", "performance issue",
    ],
    question: "App is running slowly",
    answer:
      "Check your internet connection first — a weak connection is the most common cause. Close unused browser tabs, refresh the page, or clear your browser cache. If you're on mobile, try switching between Wi-Fi and mobile data.",
  },
  {
    keywords: [
      "save nahi ho raha", "changes save nahi", "save button",
      "data nahi save", "form save nahi", "not saving", "save failed",
    ],
    question: "Changes are not saving",
    answer:
      "Did you click the Save / Submit button? Sometimes forms close silently without saving. Try again and wait for the green success notification to confirm the save. If you see an error message, check your internet connection.",
  },
  {
    keywords: [
      "data missing", "data chala gaya", "account data gone",
      "sab data gaya", "data lost", "my data is gone",
    ],
    question: "My data seems to be missing",
    answer:
      "Before worrying, verify two things: (1) You're logged into the correct account, and (2) The correct workspace is selected in the top-left dropdown. Data is account and workspace specific — the wrong combination will make it look like data is missing.",
  },

  // ─── 🎯 REAL CONFUSION CASES ─────────────────────────────
  {
    keywords: [
      "total match nahi", "expense add kiya total nahi", "amount wrong mismatch",
      "totals don't match", "sum wrong",
    ],
    question: "Expense added but totals still don't match",
    answer:
      "The likely cause: some expenses were added to a different workspace. Filter your expenses by workspace and verify each one is in the right place. Expenses from other workspaces won't appear in your current total.",
  },
  {
    keywords: [
      "budget set kiya effect nahi", "budget kaam nahi", "budget apply nahi",
      "budget set but nothing changed", "budget not working",
    ],
    question: "Set a budget but nothing changed",
    answer:
      "Check three things: (1) Is the correct month selected? (2) Is the correct workspace selected? (3) Did you save the budget? Budget settings are per-workspace and per-month — setting it in one place won't affect others.",
  },
  {
    keywords: [
      "workspace delete", "workspace chala gaya", "accidental delete",
      "galti se delete workspace", "deleted workspace by mistake",
    ],
    question: "Accidentally deleted a workspace",
    answer:
      "Unfortunately, deleted workspaces and their data cannot be recovered. You'll need to create a new workspace and start fresh. Going forward, always double-confirm before deleting a workspace.",
  },
  {
    keywords: [
      "data mix", "data mix ho raha", "mix up", "confusion workspace data",
      "sab mix", "data getting mixed", "data confusion",
    ],
    question: "Data seems to be getting mixed up",
    answer:
      "This is a common issue when using multiple workspaces. Each workspace holds completely separate data — they don't overlap. The fix: always verify the correct workspace is selected (top-left dropdown) before adding or reviewing expenses.",
  },
  {
    keywords: [
      "category galat", "wrong category", "category change karna",
      "galat category select", "wrong category selected", "change category",
    ],
    question: "Selected the wrong category for an expense",
    answer:
      "Easy fix — go to your Expenses list, open the entry, hit Edit, pick the correct category, and save. Your Analytics will automatically update to reflect the corrected category.",
  },
];

// ─────────────────────────────────────────────────────────────
//  Quick FAQ chips shown in the panel
// ─────────────────────────────────────────────────────────────
export const QUICK_FAQS = [
  "Can't add an expense",
  "Expense not showing up",
  "Invite link not working",
  "Budget not updating",
  "Wrong workspace selected",
  "Data mismatch issue",
];

// ─────────────────────────────────────────────────────────────
//  Greeting / Closing triggers (Hinglish + English — for detection)
// ─────────────────────────────────────────────────────────────
export const GREETING_TRIGGERS = [
  "hi", "hello", "hey", "hii", "helo", "helloo", "hiii",
  "namaste", "namaskar", "hola", "kya haal", "kaise ho", "sup", "good morning",
  "good afternoon", "good evening",
];

export const CLOSING_TRIGGERS = [
  "thanks", "thank you", "thankyou", "shukriya", "dhanyawad",
  "bye", "goodbye", "alvida", "ok bye", "ok thanks",
  "bas itna", "ho gaya", "kaam ban gaya", "that's all", "done",
];

// ─────────────────────────────────────────────────────────────
//  Bot response messages — English
// ─────────────────────────────────────────────────────────────
export const GREETING_RESPONSE =
  "Hey there! 👋 Welcome to the Expense Tracker Help Centre. What can I help you with today? Pick a question below or type your own!";

export const CLOSING_RESPONSE =
  "Happy to help! 😊 Feel free to come back anytime you need assistance. Happy tracking! 💸";

export const FALLBACK_RESPONSE =
  "Sorry, I couldn't find an answer for that. Try rephrasing your question, or browse the FAQ list above — your answer might be there!";

// ─────────────────────────────────────────────────────────────
//  UI copy — English
// ─────────────────────────────────────────────────────────────
export const UI_COPY = {
  panelTitle: "Help Centre🛠️",
  panelSubtitle: "Frequently Asked Questions",
  searchPlaceholder: "Search help articles...",
  commonIssuesLabel: "Common Issues",
  allTopicsLabel: "All Topics",
  noResultsText: "No results found. Try chatting with the AI below!",
  chatCtaBtn: "Still need help? Chat with AI",
  chatBackBtn: "← Back",
  chatHeaderTitle: "AI Help Assistant",
  chatHeaderSubtitle: "English & Hinglish supported",
  chatInputPlaceholder: "Type your question here...",
  typingText: "Thinking...",
  activeStatus: "Online",
};
