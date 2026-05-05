const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, run, get } = require("../database");

// SIGNUP
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  const existingUser = get("SELECT id FROM users WHERE email = ?", [email]);
  if (existingUser)
    return res.status(400).json({ error: "Email already in use" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  const userCount = get("SELECT COUNT(*) as count FROM users", []);
  const role = userCount.count === 0 ? "admin" : "member";

  const result = run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role],
  );

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, name, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({ token, user: { id: result.lastInsertRowid, name, email, role } });
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const user = get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user)
    return res.status(400).json({ error: "Invalid email or password" });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid)
    return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET current user
router.get("/me", require("../middleware/auth"), (req, res) => {
  const user = get("SELECT id, name, email, role FROM users WHERE id = ?", [
    req.user.id,
  ]);
  res.json(user);
});

module.exports = router;
