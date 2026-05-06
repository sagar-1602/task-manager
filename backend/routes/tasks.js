const express = require("express");
const router = express.Router();
const { query, run, get } = require("../database");
const auth = require("../middleware/auth");

// GET tasks for a project
router.get("/project/:projectId", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("get project tasks error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET my tasks (assigned to me)
router.get("/my", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("get my tasks error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats — counts ALL tasks in projects I belong to, not just assigned to me
router.get("/stats/dashboard", auth, (req, res) => {
  try {
    // Total projects I'm in
    const projectRows = query(
      "SELECT project_id FROM project_members WHERE user_id = ?",
      [req.user.id],
    );
    const totalProjects = projectRows.length;

    if (totalProjects === 0) {
      return res.json({
        totalTasks: 0,
        doneTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        totalProjects: 0,
      });
    }

    const projectIds = projectRows.map((r) => r.project_id);
    const placeholders = projectIds.map(() => "?").join(",");

    // All tasks across my projects
    const allTasks = query(
      `SELECT id, status, due_date FROM tasks WHERE project_id IN (${placeholders})`,
      projectIds,
    );

    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => t.status === "done").length;
    const inProgressTasks = allTasks.filter(
      (t) => t.status === "in-progress",
    ).length;
    const overdueTasks = allTasks.filter((t) => {
      if (!t.due_date || t.status === "done") return false;
      return new Date(t.due_date) < new Date();
    }).length;

    console.log("Dashboard stats:", {
      totalProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks,
    });

    res.json({
      totalProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks,
    });
  } catch (err) {
    console.error("dashboard stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE task
router.post("/", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("create task error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE task status
router.patch("/:id/status", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("update status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE full task
router.put("/:id", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("update task error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete("/:id", auth, (req, res) => {
  try {
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
  } catch (err) {
    console.error("delete task error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
