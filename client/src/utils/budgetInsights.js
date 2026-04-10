const CATEGORY_LABELS = {
  food: "Food",
  travel: "Travel",
  shopping: "Shopping",
  other: "Other",
};

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Week starts on Monday.
function startOfWeekMonday(d) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // how many days since Monday
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endExclusive(d) {
  // We treat period end as exclusive (>= start and < end)
  return new Date(d);
}

function parseExpenseDate(d) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function filterExpensesByRange(expenses, start, endExcl) {
  const s = start.getTime();
  const e = endExcl.getTime();
  return (expenses || []).filter((x) => {
    const dt = parseExpenseDate(x?.date);
    if (!dt) return false;
    const t = dt.getTime();
    return t >= s && t < e;
  });
}

function totalsByCategory(expenses) {
  const totals = { food: 0, travel: 0, shopping: 0, other: 0 };
  for (const e of expenses || []) {
    const cat = (e?.category || "other").toLowerCase();
    const amount = safeNumber(e?.amount);
    if (totals[cat] === undefined) totals.other += amount;
    else totals[cat] += amount;
  }
  return totals;
}

function highestCategory(totals) {
  let maxCat = "other";
  let maxVal = -Infinity;
  for (const cat of Object.keys(totals)) {
    if (totals[cat] > maxVal) {
      maxVal = totals[cat];
      maxCat = cat;
    }
  }
  return { category: maxCat, amount: maxVal === -Infinity ? 0 : maxVal };
}

/**
 * calculateBudget()
 * - current month spent
 * - remaining budget
 * - ratio and status (safe / near / exceeded)
 */
export function calculateBudget(expenses, monthlyBudget) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const budget = safeNumber(monthlyBudget);
  const monthExpenses = filterExpensesByRange(expenses, monthStart, nextMonthStart);
  const spent = monthExpenses.reduce((sum, e) => sum + safeNumber(e?.amount), 0);
  const remaining = budget - spent;

  if (budget <= 0) {
    return {
      budget,
      spent,
      remaining,
      ratio: 0,
      status: "unknown", // no budget set
    };
  }

  const ratio = spent / budget;
  const status = ratio >= 1 ? "exceeded" : ratio >= 0.8 ? "near" : "safe";

  return { budget, spent, remaining, ratio, status };
}

/**
 * comparePeriods()
 * Compares current period totals vs previous period totals.
 * - period: 'week' | 'month'
 * - category: optional (e.g. 'travel')
 */
export function comparePeriods(expenses, period, category) {
  const now = new Date();
  const today = startOfDay(now);

  let currentStart;
  let currentEndExcl;
  let previousStart;
  let previousEndExcl;

  if (period === "month") {
    currentStart = startOfMonth(now);
    currentEndExcl = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEndExcl = currentStart;
  } else {
    // week
    currentStart = startOfWeekMonday(today);
    currentEndExcl = endExclusive(new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000));
    previousStart = endExclusive(new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000));
    previousEndExcl = currentStart;
  }

  const current = filterExpensesByRange(expenses, currentStart, currentEndExcl);
  const previous = filterExpensesByRange(expenses, previousStart, previousEndExcl);

  const pickCat = (arr) => {
    if (!category || category === "all") {
      return arr.reduce((sum, e) => sum + safeNumber(e?.amount), 0);
    }
    const cat = category.toLowerCase();
    return arr
      .filter((e) => (e?.category || "other").toLowerCase() === cat)
      .reduce((sum, e) => sum + safeNumber(e?.amount), 0);
  };

  const currentTotal = pickCat(current);
  const previousTotal = pickCat(previous);

  if (!previousTotal) {
    return {
      currentTotal,
      previousTotal,
      pctChange: 0,
      direction: currentTotal ? "up" : "flat",
    };
  }

  const pctChange = ((currentTotal - previousTotal) / previousTotal) * 100;
  const rounded = Math.round(pctChange);
  return {
    currentTotal,
    previousTotal,
    pctChange: rounded,
    direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
  };
}

/**
 * generateInsights()
 * Produces human-friendly insights for the dashboard.
 */
export function generateInsights(expenses, monthlyBudget) {
  const budgetCalc = calculateBudget(expenses, monthlyBudget);
  const now = new Date();

  // Week ranges
  const today = startOfDay(now);
  const curWeekStart = startOfWeekMonday(today);
  const curWeekEndExcl = new Date(curWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Month ranges
  const curMonthStart = startOfMonth(now);
  const curMonthEndExcl = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const curWeek = filterExpensesByRange(expenses, curWeekStart, curWeekEndExcl);
  const curMonth = filterExpensesByRange(expenses, curMonthStart, curMonthEndExcl);

  const weekTotals = totalsByCategory(curWeek);
  const monthTotals = totalsByCategory(curMonth);

  const topWeek = highestCategory(weekTotals);
  const travelMonthChange = comparePeriods(expenses, "month", "travel");
  const weekTotalChange = comparePeriods(expenses, "week", "all");
  const monthTotalChange = comparePeriods(expenses, "month", "all");

  const lines = [];

  // Top category this week
  if (topWeek.amount > 0) {
    const topCat = CATEGORY_LABELS[topWeek.category] || topWeek.category;
    const topCatWeekChange = comparePeriods(expenses, "week", topWeek.category);
    if (topCatWeekChange.previousTotal > 0) {
      const dir = topCatWeekChange.direction === "up" ? "↑" : topCatWeekChange.direction === "down" ? "↓" : "→";
      lines.push(
        `${dir} You spent most on ${topCat} this week (${Math.abs(topCatWeekChange.pctChange)}% vs last week)`
      );
    } else {
      lines.push(`Top spending category this week: ${topCat}`);
    }
  } else {
    lines.push("Add a few expenses to unlock insights.");
  }

  // Travel month change
  if (travelMonthChange.previousTotal > 0) {
    const pct = Math.abs(travelMonthChange.pctChange);
    if (pct >= 5) {
      const arrow = travelMonthChange.direction === "up" ? "↑" : "↓";
      lines.push(`${arrow} Your travel expenses changed by ${pct}% vs last month`);
    }
  }

  // Budget line
  if (budgetCalc.budget > 0) {
    if (budgetCalc.status === "exceeded") {
      lines.push("You have exceeded your monthly budget!");
    } else if (budgetCalc.status === "near") {
      lines.push("You are close to your budget limit.");
    } else {
      lines.push("Your spending is within the monthly budget.");
    }
  }

  // Period comparisons
  const weekArrow =
    weekTotalChange.direction === "up" ? "↑" : weekTotalChange.direction === "down" ? "↓" : "→";
  const monthArrow =
    monthTotalChange.direction === "up"
      ? "↑"
      : monthTotalChange.direction === "down"
        ? "↓"
        : "→";

  lines.push(
    `${weekArrow} This week is ${weekTotalChange.pctChange ? `${Math.abs(weekTotalChange.pctChange)}%` : "0%"} vs last week`
  );
  lines.push(
    `${monthArrow} This month is ${monthTotalChange.pctChange ? `${Math.abs(monthTotalChange.pctChange)}%` : "0%"} vs last month`
  );

  return {
    lines,
    budgetStatus: budgetCalc.status,
    budgetCalc,
    topCategoryThisWeek: topWeek.category,
    curMonthSpent: monthTotals.food + monthTotals.travel + monthTotals.shopping + monthTotals.other,
  };
}

