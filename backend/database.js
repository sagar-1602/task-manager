const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "taskmanager.db");
let db = null;

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error("saveDb error:", err);
  }
}

function query(sql, params = []) {
  if (!db) throw new Error("DB not ready");
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error("query error:", sql, params, err);
    throw err;
  }
}

function run(sql, params = []) {
  if (!db) throw new Error("DB not ready");
  try {
    db.run(sql, params);
    const res = db.exec("SELECT last_insert_rowid() as id");
    const lastInsertRowid = res && res[0] ? res[0].values[0][0] : null;
    saveDb();
    return { lastInsertRowid };
  } catch (err) {
    console.error("run error:", sql, params, err);
    throw err;
  }
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

async function initDb() {
  try {
    const SQL = await initSqlJs();
    console.log("sql.js loaded");

    if (fs.existsSync(DB_PATH)) {
      console.log("Loading existing DB from disk");
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      console.log("Creating new DB");
      db = new SQL.Database();
    }

    db.run(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'member', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, owner_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS project_members (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role TEXT DEFAULT 'member', UNIQUE(project_id, user_id))",
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'todo', priority TEXT DEFAULT 'medium', project_id INTEGER NOT NULL, assigned_to INTEGER, created_by INTEGER NOT NULL, due_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    );

    saveDb();
    console.log("DB initialized successfully");

    // Test the DB works
    const test = db.exec("SELECT COUNT(*) as c FROM users");
    console.log("DB test - user count:", test[0]?.values[0][0]);
  } catch (err) {
    console.error("initDb failed:", err);
    throw err;
  }
}

module.exports = { initDb, query, run, get };
