const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, run, get } = require("../database");

router.post("/signup", async (req, res) => {
  console.log("Signup body:", req.body);
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = get("SELECT id FROM users WHERE email = ?", [email]);
    console.log("Existing user check:", existingUser);

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userCount = get("SELECT COUNT(*) as count FROM users", []);
    console.log("User count:", userCount);
    const role = !userCount || userCount.count === 0 ? "admin" : "member";

    console.log("Inserting user with role:", role);
    const result = run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );
    console.log("Insert result:", result);

    if (!result || !result.lastInsertRowid) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, name, role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: { id: result.lastInsertRowid, name, email, role },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Server error during signup" });
  }
});

router.post("/login", async (req, res) => {
  console.log("Login body:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Server error during login" });
  }
});

router.get("/me", require("../middleware/auth"), (req, res) => {
  try {
    const user = get("SELECT id, name, email, role FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
