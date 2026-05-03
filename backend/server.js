require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // 👈 YE ADD KARNA HAI

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 API Routes (same rehne do)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks", require("./routes/tasks"));

// 🔥 Serve frontend in production (YAHI NAYA PART HAI)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Health check (optional but useful)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
