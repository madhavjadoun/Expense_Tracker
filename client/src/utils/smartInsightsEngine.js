/**
 * smartInsightsEngine.js
 *
 * Generates dynamic, priority-ranked, non-repetitive financial insights
 * from raw expense data. Designed to feel intelligent and personalized.
 *
 * Rules:
 *  - Every insight is CONDITIONAL on real data signals.
 *  - Each insight type has 2–4 message variants; one is picked via a
 *    deterministic seed so the output is stable within a session but
 *    varies meaningfully across data changes.
 *  - Insights are sorted by priority (high → medium → low) then
 *    shuffled WITHIN each priority tier before the final slice.
 *  - Max 4 insights are returned.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seeded pseudo-random number in [0,1) — gives stable but non-trivial output. */
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** Pick one message from an array using a numeric seed. */
function pick(messages, seed) {
  const idx = Math.floor(seededRand(seed) * messages.length);
  return messages[idx];
}

/**
 * Shuffle an array within the same priority group using a seed-based comparator.
 * This is deterministic (same data → same order) but looks random to the user.
 */
function stableShuffleGroup(arr, seed) {
  return [...arr].sort((a, b) => seededRand(seed + a.type.charCodeAt(0)) - seededRand(seed + b.type.charCodeAt(0)));
}

// ── Style token maps ──────────────────────────────────────────────────────────

const STYLES = {
  danger:  { border: "border-red-400/20",     bg: "bg-red-500/9",      text: "text-red-200/85",     icon: "text-red-300"     },
  warn:    { border: "border-amber-400/20",   bg: "bg-amber-500/8",    text: "text-amber-200/80",   icon: "text-amber-300"   },
  success: { border: "border-emerald-400/18", bg: "bg-emerald-500/8",  text: "text-emerald-200/80", icon: "text-emerald-300" },
  info:    { border: "border-blue-400/18",    bg: "bg-blue-500/8",     text: "text-blue-200/80",    icon: "text-blue-300"    },
  neutral: { border: "border-white/10",       bg: "bg-white/[0.025]",  text: "text-white/55",       icon: "text-white/45"    },
  rose:    { border: "border-rose-400/18",    bg: "bg-rose-500/8",     text: "text-rose-200/80",    icon: "text-rose-300"    },
  violet:  { border: "border-violet-400/18",  bg: "bg-violet-500/8",   text: "text-violet-200/80",  icon: "text-violet-300"  },
};

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {Array}  params.expenses        — workspace-filtered expense list
 * @param {number} params.effectiveBudget — monthly budget (0 = unset)
 * @param {object} params.monthTotals     — { total, totals: { food, travel, … } }
 * @param {number} params.previousMonthTotal
 * @param {object} params.budgetCalc      — { ratio, status, spent, remaining }
 * @param {object} params.controlPanel    — from existing controlPanel useMemo
 * @param {object} params.dayOfWeekSpend  — [{value, pct}] indexed Sun–Sat
 * @param {function} params.formatMoney   — (n) => string
 * @returns {Array} up to 4 insight objects
 */
export function generateSmartInsights({
  expenses,
  effectiveBudget,
  monthTotals,
  previousMonthTotal,
  budgetCalc,
  controlPanel,
  dayOfWeekSpend,
  formatMoney,
}) {
  // ── Seed: stable per data state, different across sessions/days ──────────────
  const today = new Date();
  const seed = (expenses.length * 7) + today.getDate() + today.getMonth() * 31;

  const HIGH = [], MEDIUM = [], LOW = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 1: Budget breach risk (HIGH priority)
  // ─────────────────────────────────────────────────────────────────────────────
  if (effectiveBudget > 0 && budgetCalc.ratio > 1) {
    const over = formatMoney(Math.round(Math.abs(budgetCalc.remaining)));
    HIGH.push({
      type: "budget_exceeded",
      title: "Budget Exceeded",
      body: pick([
        `You're ${over} over budget this month — time to pause spending.`,
        `Monthly budget breached by ${over}. Review your top categories now.`,
        `Overspent by ${over}. Cutting one category could get you back on track.`,
      ], seed + 1),
      style: STYLES.danger,
      iconName: "AlertTriangle",
    });
  } else if (effectiveBudget > 0 && budgetCalc.ratio >= 0.85) {
    HIGH.push({
      type: "budget_near",
      title: "Budget Alert",
      body: pick([
        `${Math.round(budgetCalc.ratio * 100)}% of your budget used — only ${formatMoney(Math.round(budgetCalc.remaining))} left.`,
        `You're close to your limit with ${formatMoney(Math.round(budgetCalc.remaining))} remaining this month.`,
        `Nearly at your budget cap. ${formatMoney(Math.round(budgetCalc.remaining))} to go — spend carefully.`,
      ], seed + 2),
      style: STYLES.warn,
      iconName: "AlertTriangle",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 2: Spending spike today (HIGH priority)
  // ─────────────────────────────────────────────────────────────────────────────
  const dayOfMonth = today.getDate();
  const dailyAvg   = dayOfMonth > 1 ? monthTotals.total / (dayOfMonth - 1) : 0;
  const todayTotal = controlPanel.todayTotal;
  const isSpikeDay = dailyAvg > 0 && todayTotal > dailyAvg * 2 && todayTotal > 0;

  if (isSpikeDay) {
    HIGH.push({
      type: "spike",
      title: "Spending Spike Detected",
      body: pick([
        `Today's spend (${formatMoney(Math.round(todayTotal))}) is 2× your daily average — unusually high.`,
        `Today looks like a high-spend day at ${formatMoney(Math.round(todayTotal))}. That's over twice your usual pace.`,
        `Heads up: ${formatMoney(Math.round(todayTotal))} spent today — more than double your average day.`,
      ], seed + 3),
      style: STYLES.danger,
      iconName: "Flame",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 3: Daily limit risk from Spending Control Panel (HIGH)
  // ─────────────────────────────────────────────────────────────────────────────
  if (controlPanel.dailyLimit > 0 && controlPanel.dailyStatus === "risk" && !isSpikeDay) {
    MEDIUM.push({
      type: "daily_limit_risk",
      title: "Daily Limit Warning",
      body: pick([
        `You've used ${Math.round((todayTotal / controlPanel.dailyLimit) * 100)}% of today's daily allowance.`,
        `Today's spending is approaching your daily limit of ${formatMoney(Math.round(controlPanel.dailyLimit))}.`,
        `At ${formatMoney(Math.round(todayTotal))} today vs a ${formatMoney(Math.round(controlPanel.dailyLimit))} limit — watch your pace.`,
      ], seed + 4),
      style: STYLES.warn,
      iconName: "Clock",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 4: Budget projection (MEDIUM)
  // ─────────────────────────────────────────────────────────────────────────────
  const projected = dailyAvg * new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysUntilBreached = effectiveBudget > 0 && dailyAvg > 0
    ? Math.max(0, Math.floor((effectiveBudget - monthTotals.total) / dailyAvg))
    : null;

  if (effectiveBudget > 0 && projected > effectiveBudget && budgetCalc.ratio <= 1) {
    MEDIUM.push({
      type: "projection",
      title: "Projected Overspend",
      body: pick([
        `At your current pace you'll spend ${formatMoney(Math.round(projected))} — ${formatMoney(Math.round(projected - effectiveBudget))} over budget by month-end.`,
        `Month-end projection: ${formatMoney(Math.round(projected))}. That exceeds your ${formatMoney(effectiveBudget)} budget.`,
        `Your daily rate suggests a ${formatMoney(Math.round(projected))} month — consider slowing down to stay under ${formatMoney(effectiveBudget)}.`,
      ], seed + 5),
      style: STYLES.warn,
      iconName: "Activity",
    });
  } else if (effectiveBudget > 0 && daysUntilBreached !== null && daysUntilBreached <= 5 && daysUntilBreached > 0) {
    MEDIUM.push({
      type: "days_left",
      title: "Budget Runway",
      body: pick([
        `At this rate your budget runs out in ${daysUntilBreached} day${daysUntilBreached === 1 ? "" : "s"}.`,
        `Only ${daysUntilBreached} day${daysUntilBreached === 1 ? "" : "s"} of budget remaining at your current spend rate.`,
        `Budget countdown: ${daysUntilBreached} more day${daysUntilBreached === 1 ? "" : "s"} before you hit the limit.`,
      ], seed + 6),
      style: daysUntilBreached <= 2 ? STYLES.danger : STYLES.warn,
      iconName: "Clock",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 5: Month-over-month category spike (MEDIUM)
  // ─────────────────────────────────────────────────────────────────────────────
  const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
  const prevEnd   = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const prevCats  = {};
  for (const e of expenses || []) {
    const t = new Date(e?.date).getTime();
    if (t >= prevStart && t < prevEnd) {
      const cat = (e?.category || "other").toLowerCase();
      prevCats[cat] = (prevCats[cat] || 0) + (Number(e?.amount) || 0);
    }
  }

  let biggestIncreaseCat = null, biggestIncreasePct = 0;
  let biggestDecreaseCat = null, biggestDecreasePct = 0;
  for (const [cat, curr] of Object.entries(monthTotals.totals)) {
    const prev = prevCats[cat] || 0;
    if (prev > 0 && curr > 0) {
      const pct = Math.round(((curr - prev) / prev) * 100);
      if (pct > biggestIncreasePct) { biggestIncreasePct = pct; biggestIncreaseCat = cat; }
      if (pct < biggestDecreasePct) { biggestDecreasePct = pct; biggestDecreaseCat = cat; }
    }
  }

  if (biggestIncreaseCat && biggestIncreasePct >= 20) {
    const label = biggestIncreaseCat.charAt(0).toUpperCase() + biggestIncreaseCat.slice(1);
    MEDIUM.push({
      type: "cat_increase",
      title: "Category Spike",
      body: pick([
        `${label} spending jumped ${biggestIncreasePct}% vs last month.`,
        `You spent ${biggestIncreasePct}% more on ${label} compared to last month.`,
        `${label} expenses rose by ${biggestIncreasePct}% — your biggest MoM increase.`,
      ], seed + 7),
      style: STYLES.rose,
      iconName: "TrendingUp",
    });
  } else if (biggestDecreaseCat && Math.abs(biggestDecreasePct) >= 20) {
    const label = biggestDecreaseCat.charAt(0).toUpperCase() + biggestDecreaseCat.slice(1);
    LOW.push({
      type: "cat_decrease",
      title: "Good Progress",
      body: pick([
        `${label} spending dropped ${Math.abs(biggestDecreasePct)}% vs last month — great discipline.`,
        `You cut ${label} by ${Math.abs(biggestDecreasePct)}%. Keep the momentum going.`,
        `${label} down ${Math.abs(biggestDecreasePct)}% compared to last month — well done.`,
      ], seed + 8),
      style: STYLES.success,
      iconName: "TrendingDown",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 6: Weekend spending pattern (MEDIUM/LOW)
  // ─────────────────────────────────────────────────────────────────────────────
  const weekendSpend  = (dayOfWeekSpend[0]?.value || 0) + (dayOfWeekSpend[6]?.value || 0);
  const weekdayTotal  = [1, 2, 3, 4, 5].reduce((s, i) => s + (dayOfWeekSpend[i]?.value || 0), 0);
  const weekdayCount  = 5;
  const avgWeekday    = weekdayTotal / weekdayCount;
  const avgWeekend    = weekendSpend / 2;

  if (avgWeekend > avgWeekday * 1.5 && weekendSpend > 0) {
    MEDIUM.push({
      type: "weekend_spender",
      title: "Weekend Spending Pattern",
      body: pick([
        "You spend significantly more on weekends than weekdays.",
        "Weekend expenses are running higher than your weekday average.",
        "Your spending peaks on weekends — consider setting a weekend limit.",
      ], seed + 9),
      style: STYLES.violet,
      iconName: "Zap",
    });
  } else if (avgWeekday > avgWeekend * 1.5 && weekdayTotal > 0) {
    LOW.push({
      type: "weekday_spender",
      title: "Weekday Spending Pattern",
      body: pick([
        "Most of your spending happens on weekdays — work-related costs may be driving this.",
        "Weekday expenses outpace weekends. Consider meal-prepping to cut daily costs.",
        "You're a weekday spender — lunches and commutes add up fast.",
      ], seed + 10),
      style: STYLES.info,
      iconName: "Activity",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 7: No-spend streak (LOW — positive reinforcement)
  // ─────────────────────────────────────────────────────────────────────────────
  if (controlPanel.streak >= 2) {
    LOW.push({
      type: "no_spend_streak",
      title: "No-Spend Streak",
      body: pick([
        `${controlPanel.streak} consecutive days without spending — excellent self-control!`,
        `You've gone ${controlPanel.streak} days without an expense. Keep the streak alive!`,
        `${controlPanel.streak}-day no-spend streak 🔥 — you're building great habits.`,
      ], seed + 11),
      style: STYLES.success,
      iconName: "ShieldCheck",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 8: Spending vs previous month (LOW)
  // ─────────────────────────────────────────────────────────────────────────────
  if (previousMonthTotal > 0 && monthTotals.total > 0) {
    const deltaPct = Math.round(((monthTotals.total - previousMonthTotal) / previousMonthTotal) * 100);
    if (deltaPct > 15) {
      LOW.push({
        type: "mom_increase",
        title: "Monthly Trend",
        body: pick([
          `You're spending ${Math.abs(deltaPct)}% more than last month overall.`,
          `Month-over-month spending is up ${Math.abs(deltaPct)}% — worth reviewing.`,
          `Total expenses ${Math.abs(deltaPct)}% higher vs last month. Check what changed.`,
        ], seed + 12),
        style: STYLES.warn,
        iconName: "TrendingUp",
      });
    } else if (deltaPct < -10) {
      LOW.push({
        type: "mom_decrease",
        title: "Monthly Trend",
        body: pick([
          `Total spending down ${Math.abs(deltaPct)}% vs last month. You're doing great!`,
          `${Math.abs(deltaPct)}% lower than last month — discipline is paying off.`,
          `Month-over-month savings of ${Math.abs(deltaPct)}%. Keep it up!`,
        ], seed + 13),
        style: STYLES.success,
        iconName: "TrendingDown",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 9: Smart savings suggestion (LOW)
  // ─────────────────────────────────────────────────────────────────────────────
  const topCat    = Object.entries(monthTotals.totals).sort((a, b) => b[1] - a[1])[0];
  const topCatAmt = topCat?.[1] ?? 0;
  const topCatLbl = topCat ? topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1) : null;

  if (topCatLbl && topCatAmt > 0) {
    const saveable = formatMoney(Math.ceil(topCatAmt * 0.15));
    LOW.push({
      type: "suggestion",
      title: "Smart Suggestion",
      body: pick([
        `Cutting ${topCatLbl} by 15% (${saveable}) would be your biggest monthly saving.`,
        `${topCatLbl} is your top spend. Reduce it by 15% to save ${saveable} this month.`,
        `Your highest outflow is ${topCatLbl}. Trim just 15% and keep ${saveable} in your pocket.`,
      ], seed + 14),
      style: STYLES.neutral,
      iconName: "Lightbulb",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 10: Recurring pattern detection (LOW)
  // ─────────────────────────────────────────────────────────────────────────────
  const patternMap = {};
  for (const e of expenses || []) {
    const key = `${e.category}-${Math.round(Number(e.amount))}`;
    patternMap[key] = (patternMap[key] || 0) + 1;
  }
  const recurringCount = Object.values(patternMap).filter(c => c >= 2).length;
  if (recurringCount >= 1) {
    LOW.push({
      type: "recurring",
      title: "Recurring Patterns",
      body: pick([
        `${recurringCount} recurring expense pattern${recurringCount > 1 ? "s" : ""} detected — check for subscriptions to cancel.`,
        `You have ${recurringCount} repeated transaction pattern${recurringCount > 1 ? "s" : ""}. Review if all are necessary.`,
        `${recurringCount} expense${recurringCount > 1 ? "s" : ""} appear multiple times — possible subscription or habit.`,
      ], seed + 15),
      style: STYLES.neutral,
      iconName: "RefreshCw",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNAL 11: Healthy budget (LOW — only when nothing is alarming)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    effectiveBudget > 0 &&
    budgetCalc.ratio > 0 &&
    budgetCalc.ratio < 0.6 &&
    HIGH.length === 0
  ) {
    LOW.push({
      type: "healthy_budget",
      title: "On Track",
      body: pick([
        `You've used ${Math.round(budgetCalc.ratio * 100)}% of your budget — well within limits.`,
        `Budget health looks good — ${Math.round(budgetCalc.ratio * 100)}% used with plenty of room left.`,
        `Solid month so far: only ${Math.round(budgetCalc.ratio * 100)}% of budget spent.`,
      ], seed + 16),
      style: STYLES.success,
      iconName: "ShieldCheck",
    });
  }

  // ── Assemble: sort by priority, shuffle within tier, cap at 4 ────────────────
  const shuffledHigh   = stableShuffleGroup(HIGH,   seed);
  const shuffledMedium = stableShuffleGroup(MEDIUM, seed + 100);
  const shuffledLow    = stableShuffleGroup(LOW,    seed + 200);

  return [...shuffledHigh, ...shuffledMedium, ...shuffledLow].slice(0, 4);
}
