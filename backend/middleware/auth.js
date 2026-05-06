const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Token format invalid" });
    }

    const token = parts[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallbacksecret",
    );
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
