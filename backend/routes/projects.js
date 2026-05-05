const express = require("express");
const router = express.Router();
const { query, run, get } = require("../database");
const auth = require("../middleware/auth");

// GET all projects for logged-in user
router.get("/", auth, (req, res) => {
  const projects = query(
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
    [req.user.id],
  );

  res.json(projects);
});

// GET single project with members
router.get("/:id", auth, (req, res) => {
  const project = get("SELECT * FROM projects WHERE id = ?", [req.params.id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const isMember = get(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    [req.params.id, req.user.id],
  );
  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const members = query(
    `
    SELECT u.id, u.name, u.email, pm.role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `,
    [req.params.id],
  );

  res.json({ ...project, members });
});

// CREATE project
router.post("/", auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  const result = run(
    "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)",
    [name, description || "", req.user.id],
  );

  run(
    "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
    [result.lastInsertRowid, req.user.id, "admin"],
  );

  const project = get("SELECT * FROM projects WHERE id = ?", [
    result.lastInsertRowid,
  ]);
  res.status(201).json(project);
});

// ADD member to project
router.post("/:id/members", auth, (req, res) => {
  const { email } = req.body;

  const memberRole = get(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    [req.params.id, req.user.id],
  );
  if (!memberRole || memberRole.role !== "admin")
    return res
      .status(403)
      .json({ error: "Only project admins can add members" });

  const userToAdd = get("SELECT id, name, email FROM users WHERE email = ?", [
    email,
  ]);
  if (!userToAdd)
    return res.status(404).json({ error: "User with that email not found" });

  const alreadyMember = get(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    [req.params.id, userToAdd.id],
  );
  if (alreadyMember)
    return res.status(400).json({ error: "User is already a member" });

  run(
    "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)",
    [req.params.id, userToAdd.id, "member"],
  );

  res.json({ message: "Member added", user: userToAdd });
});

// DELETE project
router.delete("/:id", auth, (req, res) => {
  const project = get("SELECT * FROM projects WHERE id = ?", [req.params.id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (project.owner_id !== req.user.id && req.user.role !== "admin")
    return res
      .status(403)
      .json({ error: "Only the owner can delete this project" });

  run("DELETE FROM tasks WHERE project_id = ?", [req.params.id]);
  run("DELETE FROM project_members WHERE project_id = ?", [req.params.id]);
  run("DELETE FROM projects WHERE id = ?", [req.params.id]);

  res.json({ message: "Project deleted" });
});

module.exports = router;
