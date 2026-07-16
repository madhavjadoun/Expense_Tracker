const express = require("express");
const router = express.Router();

let cachedRates = {
  INR: { INR: 1, USD: 0.012, EUR: 0.011 },
  USD: { INR: 83.5, USD: 1, EUR: 0.92 },
  EUR: { INR: 91.0, USD: 1.09, EUR: 1 }
};

let lastFetched = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) throw new Error("Failed to fetch rates from open.er-api.com");
    const data = await response.json();
    const rates = data.rates;
    if (rates && rates.USD && rates.INR && rates.EUR) {
      const usd = rates.USD; // 1
      const inr = rates.INR;
      const eur = rates.EUR;
      
      cachedRates = {
        INR: {
          INR: 1,
          USD: 1 / inr,
          EUR: eur / inr
        },
        USD: {
          INR: inr,
          USD: 1,
          EUR: eur
        },
        EUR: {
          INR: inr / eur,
          USD: 1 / eur,
          EUR: 1
        }
      };
      lastFetched = Date.now();
      console.log("[CURRENCY] Exchange rates updated successfully from market");
    }
  } catch (error) {
    console.error("[CURRENCY] Error fetching exchange rates, using fallback:", error.message);
  }
}

// Initial fetch on start
fetchRates();

router.get("/rates", async (req, res) => {
  if (Date.now() - lastFetched > CACHE_DURATION) {
    // Trigger background fetch if cache expired
    fetchRates();
  }
  res.json({
    success: true,
    rates: cachedRates,
    timestamp: lastFetched
  });
});

module.exports = router;
