const { requireAuth } = require("../firebaseAdmin");

/**
 * Verifies Firebase ID token (Authorization: Bearer <token>),
 * sets req.userId, req.tokenEmail, req.tokenName.
 */
module.exports = { requireAuth };
