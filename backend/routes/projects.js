const express = require("express");
const router = express.Router();
const db = require("../database");
const auth = require("../middleware/auth");

// GET all projects for logged-in user
router.get("/", auth, (req, res) => {
  const projects = db
    .prepare(
      `
    SELECT p.*, u.name as owner_name,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `,
    )
    .all(req.user.id);

  res.json(projects);
});

// GET single project with members
router.get("/:id", auth, (req, res) => {
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const isMember = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(req.params.id, req.user.id);

  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const members = db
    .prepare(
      `
    SELECT u.id, u.name, u.email, pm.role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `,
    )
    .all(req.params.id);

  res.json({ ...project, members });
});

// CREATE project (any logged-in user)
router.post("/", auth, (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "Project name is required" });

  const result = db
    .prepare(
      "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)",
    )
    .run(name, description || "", req.user.id);

  // Add creator as admin member
  db.prepare(
    "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
  ).run(result.lastInsertRowid, req.user.id, "admin");

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(project);
});

// ADD member to project
router.post("/:id/members", auth, (req, res) => {
  const { email } = req.body;

  const memberRole = db
    .prepare(
      "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(req.params.id, req.user.id);

  if (!memberRole || memberRole.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only project admins can add members" });
  }

  const userToAdd = db
    .prepare("SELECT id, name, email FROM users WHERE email = ?")
    .get(email);
  if (!userToAdd)
    return res.status(404).json({ error: "User with that email not found" });

  try {
    db.prepare(
      "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
    ).run(req.params.id, userToAdd.id, "member");
    res.json({ message: "Member added", user: userToAdd });
  } catch {
    res.status(400).json({ error: "User is already a member" });
  }
});

// GET all users (for admin to see who to add)
router.get("/:id/available-users", auth, (req, res) => {
  const users = db
    .prepare(
      `
    SELECT id, name, email FROM users
    WHERE id NOT IN (
      SELECT user_id FROM project_members WHERE project_id = ?
    )
  `,
    )
    .all(req.params.id);
  res.json(users);
});

// DELETE project (only owner)
router.delete("/:id", auth, (req, res) => {
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (project.owner_id !== req.user.id && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only the owner can delete this project" });
  }

  db.prepare("DELETE FROM tasks WHERE project_id = ?").run(req.params.id);
  db.prepare("DELETE FROM project_members WHERE project_id = ?").run(
    req.params.id,
  );
  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);

  res.json({ message: "Project deleted" });
});

module.exports = router;
