const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const SECRET = () => process.env.JWT_SECRET;

// Backend URL (this server) — used for the shareable /join/:token OG page
const BACKEND_URL = (req) =>
  process.env.BACKEND_URL || (req ? `${req.protocol}://${req.get("host")}` : "https://arthaa.live");

// Frontend URL — where the React app is deployed
const CLIENT_ORIGIN = (req) =>
  process.env.CLIENT_ORIGIN || (req ? `${req.protocol}://${req.get("host")}` : "https://arthaa.live");

// ── GET /join/:token ──────────────────────────────────────────────────────────
// Mounted at /join in server.js → full path: GET /join/:token
// Serves OG meta HTML for social crawlers; redirects real users to React app.
router.get("/:token", (req, res) => {
  const { token } = req.params;

  let expired = false;
  try {
    if (SECRET()) jwt.verify(token, SECRET());
  } catch (err) {
    expired = err.name === "TokenExpiredError";
  }

  const title = expired
    ? "Invite Expired — Expense Tracker"
    : "Join my workspace on Expense Tracker 🚀";
  const description = expired
    ? "This invite link has expired. Ask for a new one."
    : "You've been invited to collaborate and manage expenses together.";
  const redirectUrl = `${CLIENT_ORIGIN(req)}/app/join/${token}`;
  const imageUrl = `${BACKEND_URL(req)}/preview.png`;
  const canonicalUrl = `${BACKEND_URL(req)}/join/${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Expense Tracker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <script>window.location.replace("${redirectUrl}");</script>
</head>
<body style="background:#020617;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Redirecting to Expense Tracker...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.send(html);
});

module.exports = router;
