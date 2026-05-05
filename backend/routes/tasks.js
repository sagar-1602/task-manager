const express = require("express");
const router = express.Router();
const { query, run, get } = require("../database");
const auth = require("../middleware/auth");

// GET tasks for a project
router.get("/project/:projectId", auth, (req, res) => {
  const isMember = get(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    [req.params.projectId, req.user.id],
  );
  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const tasks = query(
    `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `,
    [req.params.projectId],
  );

  res.json(tasks);
});

// GET my tasks
router.get("/my", auth, (req, res) => {
  const tasks = query(
    `
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.assigned_to = ?
    ORDER BY t.due_date ASC
  `,
    [req.user.id],
  );

  res.json(tasks);
});

// Dashboard stats — MUST be before /:id
router.get("/stats/dashboard", auth, (req, res) => {
  const myTasks = get(
    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?",
    [req.user.id],
  );
  const doneTasks = get(
    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'done'",
    [req.user.id],
  );
  const inProgressTasks = get(
    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'in-progress'",
    [req.user.id],
  );
  const overdueTasks = get(
    "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND due_date < date('now') AND status != 'done'",
    [req.user.id],
  );
  const myProjects = get(
    "SELECT COUNT(*) as count FROM project_members WHERE user_id = ?",
    [req.user.id],
  );

  res.json({
    totalTasks: myTasks ? myTasks.count : 0,
    doneTasks: doneTasks ? doneTasks.count : 0,
    inProgressTasks: inProgressTasks ? inProgressTasks.count : 0,
    overdueTasks: overdueTasks ? overdueTasks.count : 0,
    totalProjects: myProjects ? myProjects.count : 0,
  });
});

// CREATE task
router.post("/", auth, (req, res) => {
  const { title, description, project_id, assigned_to, due_date, priority } =
    req.body;

  if (!title || !project_id)
    return res.status(400).json({ error: "Title and project are required" });

  const isMember = get(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    [project_id, req.user.id],
  );
  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const result = run(
    `
    INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      title,
      description || "",
      project_id,
      assigned_to || null,
      req.user.id,
      due_date || null,
      priority || "medium",
    ],
  );

  const task = get(
    `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `,
    [result.lastInsertRowid],
  );

  res.status(201).json(task);
});

// UPDATE task status
router.patch("/:id/status", auth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ["todo", "in-progress", "done"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const task = get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isMember = get(
    "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    [task.project_id, req.user.id],
  );
  if (!isMember) return res.status(403).json({ error: "Not authorized" });

  run("UPDATE tasks SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ message: "Status updated", status });
});

// UPDATE full task
router.put("/:id", auth, (req, res) => {
  const { title, description, assigned_to, due_date, priority, status } =
    req.body;

  const task = get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const memberRole = get(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    [task.project_id, req.user.id],
  );
  if (!memberRole) return res.status(403).json({ error: "Not authorized" });

  run(
    `
    UPDATE tasks SET title = ?, description = ?, assigned_to = ?, due_date = ?, priority = ?, status = ?
    WHERE id = ?
  `,
    [
      title || task.title,
      description !== undefined ? description : task.description,
      assigned_to !== undefined ? assigned_to : task.assigned_to,
      due_date !== undefined ? due_date : task.due_date,
      priority || task.priority,
      status || task.status,
      req.params.id,
    ],
  );

  const updated = get(
    `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `,
    [req.params.id],
  );

  res.json(updated);
});

// DELETE task
router.delete("/:id", auth, (req, res) => {
  const task = get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const memberRole = get(
    "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    [task.project_id, req.user.id],
  );
  if (
    !memberRole ||
    (memberRole.role !== "admin" && task.created_by !== req.user.id)
  )
    return res
      .status(403)
      .json({ error: "Only admins or task creators can delete tasks" });

  run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
  res.json({ message: "Task deleted" });
});

module.exports = router;
