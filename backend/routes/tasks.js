const express = require("express");
const router = express.Router();
const db = require("../database");
const auth = require("../middleware/auth");

// GET tasks for a project
router.get("/project/:projectId", auth, (req, res) => {
  const isMember = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(req.params.projectId, req.user.id);

  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const tasks = db
    .prepare(
      `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `,
    )
    .all(req.params.projectId);

  res.json(tasks);
});

// GET my tasks (across all projects)
router.get("/my", auth, (req, res) => {
  const tasks = db
    .prepare(
      `
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.assigned_to = ?
    ORDER BY t.due_date ASC
  `,
    )
    .all(req.user.id);

  res.json(tasks);
});

// CREATE task
router.post("/", auth, (req, res) => {
  const { title, description, project_id, assigned_to, due_date, priority } =
    req.body;

  if (!title || !project_id) {
    return res.status(400).json({ error: "Title and project are required" });
  }

  const isMember = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(project_id, req.user.id);

  if (!isMember)
    return res.status(403).json({ error: "Not a member of this project" });

  const result = db
    .prepare(
      `
    INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      title,
      description || "",
      project_id,
      assigned_to || null,
      req.user.id,
      due_date || null,
      priority || "medium",
    );

  const task = db
    .prepare(
      `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `,
    )
    .get(result.lastInsertRowid);

  res.status(201).json(task);
});

// UPDATE task status
router.patch("/:id/status", auth, (req, res) => {
  const { status } = req.body;
  const validStatuses = ["todo", "in-progress", "done"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const isMember = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(task.project_id, req.user.id);

  if (!isMember) return res.status(403).json({ error: "Not authorized" });

  db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(
    status,
    req.params.id,
  );
  res.json({ message: "Status updated", status });
});

// UPDATE full task
router.put("/:id", auth, (req, res) => {
  const { title, description, assigned_to, due_date, priority, status } =
    req.body;

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const memberRole = db
    .prepare(
      "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(task.project_id, req.user.id);

  if (!memberRole) return res.status(403).json({ error: "Not authorized" });

  db.prepare(
    `
    UPDATE tasks SET title = ?, description = ?, assigned_to = ?, due_date = ?, priority = ?, status = ?
    WHERE id = ?
  `,
  ).run(
    title || task.title,
    description !== undefined ? description : task.description,
    assigned_to !== undefined ? assigned_to : task.assigned_to,
    due_date !== undefined ? due_date : task.due_date,
    priority || task.priority,
    status || task.status,
    req.params.id,
  );

  const updated = db
    .prepare(
      `
    SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `,
    )
    .get(req.params.id);

  res.json(updated);
});

// DELETE task
router.delete("/:id", auth, (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const memberRole = db
    .prepare(
      "SELECT role FROM project_members WHERE project_id = ? AND user_id = ?",
    )
    .get(task.project_id, req.user.id);

  if (
    !memberRole ||
    (memberRole.role !== "admin" && task.created_by !== req.user.id)
  ) {
    return res
      .status(403)
      .json({ error: "Only admins or task creators can delete tasks" });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  res.json({ message: "Task deleted" });
});

// Dashboard stats
router.get("/stats/dashboard", auth, (req, res) => {
  const myTasks = db
    .prepare("SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?")
    .get(req.user.id);
  const doneTasks = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'done'",
    )
    .get(req.user.id);
  const inProgressTasks = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = 'in-progress'",
    )
    .get(req.user.id);
  const overdueTasks = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND due_date < date('now') AND status != 'done'",
    )
    .get(req.user.id);
  const myProjects = db
    .prepare("SELECT COUNT(*) as count FROM project_members WHERE user_id = ?")
    .get(req.user.id);

  res.json({
    totalTasks: myTasks.count,
    doneTasks: doneTasks.count,
    inProgressTasks: inProgressTasks.count,
    overdueTasks: overdueTasks.count,
    totalProjects: myProjects.count,
  });
});

module.exports = router;
