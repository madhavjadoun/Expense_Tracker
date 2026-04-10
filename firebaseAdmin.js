const admin = require("firebase-admin");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error(
      "❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON. Add your Firebase service account JSON (single line) from Project settings → Service accounts."
    );
    return false;
  }
  try {
    const cred = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
    initialized = true;
    return true;
  } catch (err) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON parse/init failed:", err.message);
    return false;
  }
}

function isFirebaseAdminReady() {
  return initialized && admin.apps.length > 0;
}

/**
 * Express middleware: Authorization: Bearer <Firebase ID token>
 * Sets req.userId to the Firebase uid.
 */
async function requireFirebaseUser(req, res, next) {
  if (!isFirebaseAdminReady()) {
    return res.status(503).json({
      success: false,
      message: "Server auth is not configured.",
    });
  }

  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization header.",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.userId = decoded.uid;
    req.tokenEmail = decoded.email || "";
    req.tokenName = decoded.name || "";
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

/** Alias for route modules (same as requireFirebaseUser). */
const requireAuth = requireFirebaseUser;

module.exports = {
  initFirebaseAdmin,
  isFirebaseAdminReady,
  requireFirebaseUser,
  requireAuth,
};
