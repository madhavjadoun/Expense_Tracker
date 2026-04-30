// helpData.js — English UI, Hinglish+English keywords for matching

export const FAQ_ITEMS = [

  // ─── LOGIN / ACCOUNT ─────────────────────────────────────
  { keywords: ["login nahi","cant login","login fail","sign in nahi","login problem","login ho nahi raha"],
    question: "Unable to login",
    answer: "Double-check your email and password — a small typo is the most common cause. Use 'Forgot Password' to get a reset link sent to your inbox." },

  { keywords: ["otp nahi","otp nahi aaya","verification code","email nahi aaya","code nahi mila","otp"],
    question: "Didn't receive OTP or email",
    answer: "Check your Spam / Junk folder first. Using Gmail? Also check the Promotions tab. Wait 2 minutes then request a new OTP if still missing." },

  { keywords: ["logout","sign out","log out karna","bahar nikalna","how to logout"],
    question: "How to logout",
    answer: "Click your profile icon in the top-right corner and select 'Logout' from the dropdown menu." },

  { keywords: ["bar bar login","session expire","auto logout","keeps logging out","baar baar login"],
    question: "App keeps logging me out",
    answer: "Your session expired — this is normal. Log in again. If it repeats daily, clear your browser cache or try a different browser." },

  { keywords: ["account delete","delete account","account band karna","remove account","deactivate"],
    question: "How to delete my account",
    answer: "Go to Profile → Account Settings → scroll to the bottom and look for 'Delete Account'. Confirm your password to proceed. This action is permanent and cannot be undone." },

  { keywords: ["password change","change password","update password","password update karna"],
    question: "How to change my password",
    answer: "Go to Profile → Account Settings → 'Change Password'. Enter your current password then your new one. Save to apply." },

  { keywords: ["email change","update email","change email","email badalna"],
    question: "Can I change my email address?",
    answer: "Email changes are handled via Firebase. Go to Profile settings — if not available, log out and use 'Forgot Password' with your new email to re-register." },

  { keywords: ["signup","register","create account","account banao","sign up nahi ho raha"],
    question: "How to create an account",
    answer: "Open the app and click 'Sign Up'. Enter your name, email, and password. Verify your email via the link sent to your inbox, then log in." },

  { keywords: ["name change","display name","profile name","naam change karna","update name"],
    question: "How to update my profile name",
    answer: "Go to Profile → edit the Name field → click Save. Your display name will update across the app immediately." },

  // ─── ADD / MANAGE EXPENSES ────────────────────────────────
  { keywords: ["expense add nahi","expense save nahi","cannot add expense","expense nahi bana","add expense problem"],
    question: "Can't add an expense",
    answer: "Make sure Amount and Category are filled in — both are required. If it still fails, refresh the page and try again." },

  { keywords: ["expense dikh nahi","expense missing","added but not visible","expense nazar nahi","expense gayab","expense show nahi"],
    question: "Added expense isn't showing up",
    answer: "Refresh the page (Ctrl+R / Cmd+R). Then confirm you're in the correct workspace — expenses only appear in the workspace they were added to." },

  { keywords: ["edit expense","galat expense","expense edit karna","wrong expense","modify expense"],
    question: "How to edit an expense",
    answer: "Go to Expenses page → click the expense → press Edit. You can change the amount, category, date, or note. Click Save when done." },

  { keywords: ["delete expense","expense delete karna","expense hatana","remove expense"],
    question: "How to delete an expense",
    answer: "Open the expense from your list and click Delete. Confirm when prompted — deleted expenses cannot be recovered." },

  { keywords: ["past date","previous date","backdated","purani date","old expense","purana expense add"],
    question: "How to add an expense with a past date",
    answer: "When adding an expense, click the date field and choose any previous date from the calendar picker. No restrictions apply." },

  { keywords: ["duplicate expense","do baar add","same expense twice","double entry"],
    question: "Same expense added twice",
    answer: "Go to your Expenses list, find the duplicate and delete it. In future, scan your list before saving to avoid duplicates." },

  { keywords: ["recurring expense","recurring kya hai","repeat expense","auto expense","recurring add karna"],
    question: "What is a recurring expense?",
    answer: "Enable the '🔁 Recurring expense' toggle when adding an expense. Choose Weekly or Monthly. The system will auto-add this expense on schedule — useful for rent, subscriptions, etc." },

  { keywords: ["recurring stop","cancel recurring","recurring band karna","stop recurring"],
    question: "How to stop a recurring expense",
    answer: "Find the recurring expense in your list (it shows a '🔁 Recurring' badge). Delete it to stop future auto-additions." },

  { keywords: ["category change","wrong category","galat category","category select galat","category edit"],
    question: "Changed wrong category on an expense",
    answer: "Open the expense → click Edit → pick the correct category from the dropdown → Save. Analytics will update automatically." },

  { keywords: ["expense note","add note","note kya hai","description expense","note add karna"],
    question: "What is the Note field in expenses?",
    answer: "The Note field is a short description for your expense — like 'Lunch at Zomato' or 'Netflix subscription'. It helps you search and identify expenses later." },

  { keywords: ["search expense","expense dhundna","find expense","expense search karna","filter expense"],
    question: "How to search or filter expenses",
    answer: "On the Expenses page, use the Search bar to find by note or category. Use the Category, Date, and Sort dropdowns to filter your list further." },

  { keywords: ["export csv","download expenses","expense export","csv download","export data"],
    question: "How to export expenses to CSV",
    answer: "On the Expenses page, click '↓ Export CSV' in the top-right. This downloads all currently visible (filtered) expenses as a spreadsheet file." },

  { keywords: ["custom date range","date filter","custom range","date se date","filter by date"],
    question: "How to filter expenses by custom date range",
    answer: "On the Expenses page → Date filter dropdown → select 'Custom range'. Two date pickers will appear — set your start and end date." },

  { keywords: ["sort expenses","expense sort karna","sort by amount","sort by date","highest expense"],
    question: "How to sort expenses",
    answer: "Use the Sort dropdown on the Expenses page. Options: Latest, Oldest, Highest amount, Lowest amount." },

  // ─── BUDGET / DASHBOARD ───────────────────────────────────
  { keywords: ["budget set kaise","how to set budget","monthly budget set","budget lagana","budget kahan se set"],
    question: "How to set a monthly budget",
    answer: "Go to Dashboard → find the 'Monthly budget' section → enter your limit → the value saves automatically as you type." },

  { keywords: ["budget galat","remaining budget wrong","budget match nahi","budget sahi nahi","budget incorrect"],
    question: "Remaining budget looks wrong",
    answer: "Check that all expenses are in the correct workspace and month. Expenses from other workspaces or months won't affect the current budget display." },

  { keywords: ["budget update nahi","budget reflect nahi","expense add kiya budget nahi","budget not updating"],
    question: "Budget didn't update after adding expense",
    answer: "The expense must be in the same workspace and current month. Verify the expense date and workspace match where you're viewing the budget." },

  { keywords: ["budget exceeded","budget khatam","overspent","budget exceed ho gaya","budget cross"],
    question: "What happens when budget is exceeded?",
    answer: "The budget bar turns red and you'll see an 'Exceeded' alert on the Dashboard. Review your categories to see where you can cut back." },

  { keywords: ["daily limit","daily budget","daily spending","din ka budget","per day limit"],
    question: "What is the daily limit shown on Dashboard?",
    answer: "The daily limit = your monthly budget ÷ days in the month. If today's spending crosses 70% of that limit, the status shows 'Risk'. Crossing it shows 'Exceeded'." },

  { keywords: ["spending score","score kya hai","score samajh nahi","what is score","score explain"],
    question: "What is the Spending Score?",
    answer: "A 0–100 rating of your financial health. It factors in budget usage, no-spend days, and month-over-month trend. 80+ = Excellent, 65+ = Good, 50+ = Average, below = At Risk." },

  { keywords: ["score grade","grade A B C","score grade kya","spending grade"],
    question: "What do the Spending Score grades mean?",
    answer: "A = 80–100 (Excellent), B = 65–79 (Good), C = 50–64 (Average), D = 35–49 (At Risk), F = below 35 (Critical). Aim for A or B!" },

  { keywords: ["safe status","status safe","budget safe","safe matlab kya","status meaning"],
    question: "What does 'Safe' status mean?",
    answer: "'Safe' means your spending is within the monthly budget. 'Near limit' = approaching 80%. 'Exceeded' = over budget. Keep it on Safe!" },

  { keywords: ["no spend streak","streak kya hai","streak break","streak khatam","flame streak"],
    question: "What is the No-Spend Streak?",
    answer: "It counts consecutive days with zero expenses. Even one small expense resets the streak to 0. The 🔥 animation shows your current streak count." },

  { keywords: ["streak break ho gaya","streak reset","streak tod","streak chala gaya"],
    question: "My no-spend streak got broken",
    answer: "Any expense — even ₹1 — resets the streak. Don't worry, start fresh today! The streak rebuilds automatically for every day you don't spend." },

  { keywords: ["month comparison","vs last month","previous month","last month comparison nahi","monthly trend"],
    question: "What is the 'vs Last Month' card?",
    answer: "It compares this month's total spending to last month's. Green/down % = spending less (good), Red/up % = spending more. Needs previous month data to show." },

  { keywords: ["smart insights","insights kya hai","insights explain","dashboard insights","financial insights"],
    question: "What are Smart Insights on the Dashboard?",
    answer: "Auto-generated observations about your spending — budget risk alerts, category spikes, recurring pattern detection, and suggestions to reduce spending. They update as your data changes." },

  { keywords: ["quick add expense","dashboard se add","add from dashboard","quick add kya hai"],
    question: "How to quickly add an expense from Dashboard",
    answer: "Click the '+ Add Expense' button in the top-right of the Dashboard. Fill in Amount, Category, and Note, then click Add." },

  { keywords: ["projected spend","projection","burn rate","spending projection","kitna kharchega"],
    question: "What is the projected spend shown on Dashboard?",
    answer: "It's your estimated end-of-month spending based on your current daily average. If it's above your budget, the Smart Insights panel shows a warning." },

  // ─── WORKSPACE ────────────────────────────────────────────
  { keywords: ["workspace kya hai","what is workspace","workspace explain","workspace meaning"],
    question: "What is a Workspace?",
    answer: "A workspace is a separate budget environment. You can have a personal workspace and shared workspaces with friends or family. Data is fully isolated between workspaces." },

  { keywords: ["workspace create","new workspace","workspace banana","create workspace kaise"],
    question: "How to create a new workspace",
    answer: "Click the workspace dropdown in the top-left → 'New Workspace' or the + icon → enter a name and save." },

  { keywords: ["workspace switch","change workspace","workspace badalna","workspace select karna"],
    question: "How to switch workspaces",
    answer: "Click the workspace name in the top-left dropdown and select the one you want. All data — expenses, budget, split — updates instantly." },

  { keywords: ["workspace nahi dikh","workspace missing","workspace show nahi","workspace not visible"],
    question: "Created workspace but it's not showing",
    answer: "Refresh the page and check the top-left dropdown. New workspaces can take a moment to appear after creation." },

  { keywords: ["wrong workspace expense","galat workspace","expense wrong workspace","dusre workspace mein add"],
    question: "Expense added to wrong workspace",
    answer: "Switch to the correct workspace, add the expense again, then delete the wrong entry from the other workspace." },

  { keywords: ["workspace delete","delete workspace","workspace hatana","workspace remove karna"],
    question: "How to delete a workspace",
    answer: "Go to workspace settings in the dropdown. Select the workspace → Delete. Warning: all data in that workspace is permanently lost." },

  { keywords: ["workspace data missing","workspace empty","data nahi dikh","sab chala gaya workspace"],
    question: "Workspace data looks missing",
    answer: "Confirm the correct workspace is selected in the top-left dropdown. Each workspace holds its own independent data." },

  { keywords: ["shared workspace","dusre user expenses dikh rahe","shared expenses","others data visible"],
    question: "I can see other users' expenses",
    answer: "You're in a shared workspace — all members' expenses are visible to everyone by design. Create a private workspace for personal tracking." },

  { keywords: ["data mix ho raha","data mixed","data confusion","workspace confusion","multiple workspace"],
    question: "Data is getting mixed up between workspaces",
    answer: "Each workspace is fully isolated. Always check the workspace indicator (top-left) before adding expenses. Set a habit of verifying before you log anything." },

  // ─── INVITE / COLLABORATION ──────────────────────────────
  { keywords: ["invite link","link kaam nahi","invite fail","link expired","invite link not working"],
    question: "Invite link isn't working",
    answer: "Invite links can expire. Go to Workspace Settings → generate a fresh invite link → share that. Old links won't work." },

  { keywords: ["user join nahi","member join nahi","friend cant join","join nahi ho raha"],
    question: "Someone can't join my workspace",
    answer: "Ensure they are logged into the app first, then open the full invite link in a browser. Incomplete links (cut off during copy-paste) are the most common reason." },

  { keywords: ["invite accept kiya data nahi","joined workspace nothing visible","workspace nahi dikh after join"],
    question: "Accepted invite but workspace isn't visible",
    answer: "After joining, manually select the new workspace from the top-left dropdown — it doesn't switch automatically." },

  { keywords: ["total mismatch members","shared total wrong","group total galat","multiple users mismatch"],
    question: "Group total amounts don't match",
    answer: "Everyone must be using the exact same workspace. Confirm all members have selected the correct workspace name — expenses added elsewhere won't appear in shared totals." },

  // ─── SPLIT FEATURE ────────────────────────────────────────
  { keywords: ["split kya hai","what is split","split feature explain","split page kya hai"],
    question: "What is the Split feature?",
    answer: "Split lets you track shared expenses between group members, calculate who owes whom, and record settlements — like Splitwise. Go to the Split page from the sidebar." },

  { keywords: ["split member add","add member split","member kaise add kare","member add in split"],
    question: "How to add members for splitting",
    answer: "Go to Split page → Members panel on the left → type a name in the input field → press Enter or click the + button. Add at least 2 members to start." },

  { keywords: ["split expense add","add split expense","expense split karna","split mein expense add"],
    question: "How to add a split expense",
    answer: "You need at least 2 members first. Click 'Add Split Expense' → fill in description, total amount, category → select participants → enter who paid how much → click 'Distribute equally' for equal splits → Save." },

  { keywords: ["distribute equally","equal split karna","split equally","barabar split","equal distribution"],
    question: "How to split equally between members",
    answer: "In the Add Split Expense form, select all participants → click 'Distribute equally'. It auto-fills each person's payment share." },

  { keywords: ["unequal split","custom split","alag alag amount","manual split","different share"],
    question: "How to do an unequal / custom split",
    answer: "In the Add Split Expense form, select participants then manually enter each person's paid amount instead of using 'Distribute equally'." },

  { keywords: ["settle up","settlement karna","paisa wapas","settle button","owe khatam karna"],
    question: "How to settle a balance",
    answer: "Go to Split → Balances tab → find the debt row → click 'Settle'. Confirm who paid whom and the amount. Optionally add a note (e.g. 'Paid via UPI')." },

  { keywords: ["split balance","who owes whom","kaun kitna deta hai","balance tab","net balance"],
    question: "How to see who owes whom",
    answer: "Go to Split page → Balances tab. You'll see a Settlement Plan: each row shows Person A owes → Person B with the exact amount." },

  { keywords: ["settlement history","past settlements","history tab","purane settlements","settled records"],
    question: "Where to see past settlements",
    answer: "Go to Split → History tab. All recorded settlements with date, names, amount, and note are listed there." },

  { keywords: ["split expense delete","delete split","split hatana","remove split expense"],
    question: "How to delete a split expense",
    answer: "Go to Split → Expenses tab → find the entry → click the trash 🗑️ icon. This removes the expense and adjusts all balances automatically." },

  { keywords: ["split balances wrong","split galat","split amount incorrect","balance mismatch split"],
    question: "Split balances look incorrect",
    answer: "Open the expense in the Expenses tab to verify how the amount was divided. Confirm all participants and paid amounts were entered correctly when the expense was added." },

  { keywords: ["split member remove","remove member split","member delete","member hatana split"],
    question: "How to remove a member from split",
    answer: "In the Members panel, hover over a member's name — a small ✕ button appears. Click it to remove. Note: removing a member may affect existing split balances." },

  // ─── ANALYTICS ────────────────────────────────────────────
  { keywords: ["analytics empty","graph nahi dikh","analytics khaali","charts empty","no data analytics"],
    question: "Analytics page is empty",
    answer: "Add at least 3–5 expenses and charts will populate automatically. The more data you have, the richer the insights." },

  { keywords: ["weekly monthly toggle","analytics period","weekly vs monthly","chart period change"],
    question: "How to switch between Weekly and Monthly analytics",
    answer: "Use the Weekly / Monthly toggle in the top-right of the Analytics page. Weekly shows this week's data; Monthly shows this calendar month." },

  { keywords: ["chart type","pie chart","bar chart","line chart","chart switch karna"],
    question: "How to switch chart types",
    answer: "Click the chart type switcher icons (top-right on Analytics). Line = spending trend, Bar = category totals, Pie = category breakdown by percentage." },

  { keywords: ["pie chart explain","donut chart","category breakdown","category wise spending"],
    question: "What does the Pie/Donut chart show?",
    answer: "The Pie chart shows your spending split by category (Food, Travel, Shopping, Other) as percentages. Hover over a slice to see the exact amount." },

  { keywords: ["line chart explain","trend chart","daily spending chart","spending over time"],
    question: "What does the Line chart show?",
    answer: "The Line chart shows your daily spending trend. Peaks show high-spending days. Hover any point for the exact amount spent that day." },

  { keywords: ["bar chart explain","category bar","category totals chart"],
    question: "What does the Bar chart show?",
    answer: "The Bar chart shows total spending per category side-by-side for easy comparison. Taller bar = more spent in that category." },

  { keywords: ["top category","most spent category","highest spending category","top category kya hai"],
    question: "What is the Top Category?",
    answer: "It's the category where you spent the most in the current period. Shown in the summary cards at the top of Analytics. Use this to identify where to cut back." },

  { keywords: ["trend change","spending trend","vs previous","comparison analytics","up down percentage"],
    question: "What does the trend % mean in Analytics?",
    answer: "It compares current period spending vs the previous period. ↑ % = spending more (reduce it!), ↓ % = spending less (great job!). Needs previous period data to display." },

  { keywords: ["smart insights analytics","analytics insights","spending insight","insight card analytics"],
    question: "What are the Smart Insights on Analytics?",
    answer: "They show auto-generated observations like 'You spent most on Food this week' or 'Spending increased 20% vs last week'. These update as your expense data changes." },

  // ─── PROFILE ──────────────────────────────────────────────
  { keywords: ["profile kahan hai","profile page","account settings","profile kaise open"],
    question: "Where is the Profile / Account Settings page?",
    answer: "Click 'Profile' in the left sidebar. This opens Account Settings where you can update your name, phone, avatar, currency, and more." },

  { keywords: ["currency change","change currency","currency setting","INR USD","currency kaise change"],
    question: "How to change the currency",
    answer: "Go to Profile → find the Currency setting → select your preferred currency from the dropdown → Save. All amounts across the app will display in the new currency." },

  { keywords: ["profile photo","avatar change","photo upload","profile picture","avatar kaise lagayein"],
    question: "How to set a profile photo",
    answer: "Go to Profile → click on the avatar/initials area → upload a photo from your device. Save when done." },

  { keywords: ["phone number","add phone","mobile number","phone verify","phone add karna"],
    question: "How to add a phone number to profile",
    answer: "Go to Profile → Phone Number field → enter your number with country code. Verify if prompted. Save changes." },

  { keywords: ["dark mode","light mode","theme change","theme toggle","dark light switch"],
    question: "How to switch between dark and light mode",
    answer: "Look for the theme toggle button (sun/moon icon) in the top navbar. Clicking it switches between light and dark mode instantly." },

  // ─── PLANS PAGE ───────────────────────────────────────────
  { keywords: ["plans page","subscription","upgrade plan","pro plan","plans kya hai"],
    question: "What is the Plans page?",
    answer: "The Plans page shows available subscription tiers — Free and Pro. Pro unlocks additional features. Access it via 'Plans' in the sidebar or the 'Pro plan' button at the bottom of the sidebar." },

  { keywords: ["pro plan kya milta","pro features","what does pro include","pro upgrade benefits"],
    question: "What extra features does the Pro plan include?",
    answer: "Pro features are listed on the Plans page. Typically includes unlimited workspaces, advanced analytics, priority support, and more. Check the Plans page for the current feature list." },

  // ─── ERRORS / TECHNICAL ───────────────────────────────────
  { keywords: ["app slow","slow chal raha","lag","hang","freeze","performance issue"],
    question: "App is running slowly",
    answer: "Check your internet connection. Close unused browser tabs, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). Clearing browser cache also helps." },

  { keywords: ["data update nahi","changes reflect nahi","sync nahi","not updating","data refresh"],
    question: "Data / changes not updating",
    answer: "Do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If that doesn't work, log out and log back in to force a fresh data sync." },

  { keywords: ["save nahi ho raha","changes save nahi","form save fail","not saving"],
    question: "Changes not saving",
    answer: "Make sure you clicked the Save button and waited for the green success notification. If an error appears, check your internet and try again." },

  { keywords: ["data missing","data chala gaya","my data is gone","data lost","sab data"],
    question: "My data seems to be missing",
    answer: "Before worrying — verify (1) you're in the correct account and (2) the correct workspace is selected. Data is account + workspace specific." },

  { keywords: ["error page","something went wrong","app crash","blank screen","white screen"],
    question: "App showing error or blank screen",
    answer: "Hard refresh the page first. If it persists, clear browser cache and cookies, then reload. Still broken? Try an incognito / private window." },

  { keywords: ["internet nahi","offline","no connection","network error","connection error"],
    question: "App not working — no internet connection",
    answer: "The app requires an active internet connection. Check your Wi-Fi or mobile data. Once connected, refresh the page — data will sync automatically." },
];

// ─── Quick FAQ chips ──────────────────────────────────────────
export const QUICK_FAQS = [
  "Can't add an expense",
  "Expense not showing up",
  "Invite link not working",
  "Budget not updating",
  "How to use Split feature",
  "Analytics page is empty",
];

// ─── Greeting / Closing triggers ─────────────────────────────
export const GREETING_TRIGGERS = [
  "hi","hello","hey","hii","helo","helloo","hiii",
  "namaste","namaskar","hola","kya haal","sup","good morning","good afternoon","good evening",
];

export const CLOSING_TRIGGERS = [
  "thanks","thank you","thankyou","shukriya","dhanyawad",
  "bye","goodbye","alvida","ok bye","ok thanks","that's all","done","ho gaya",
];

// ─── Bot responses ────────────────────────────────────────────
export const GREETING_RESPONSE =
  "Hey there! 👋 Welcome to the Expense Tracker Help Centre. What can I help you with today? Pick a question below or type your own!";

export const CLOSING_RESPONSE =
  "Happy to help! 😊 Come back anytime you need assistance. Happy tracking! 💸";

export const FALLBACK_RESPONSE =
  "Sorry, I couldn't find an answer for that. Try rephrasing your question, or browse the FAQ list above — your answer might be there!";

// ─── UI copy ─────────────────────────────────────────────────
export const UI_COPY = {
  panelTitle: "❓ Help Centre",
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
};
