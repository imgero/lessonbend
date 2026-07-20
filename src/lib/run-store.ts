import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.LESSONBEND_DB_URL ?? "file:lessonbend.db" });
let initialized: Promise<void> | undefined;

async function init() {
  if (!initialized) initialized = (async () => {
    await db.batch([
      "CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, lesson_text TEXT NOT NULL, profiles_json TEXT NOT NULL, lesson_spec_json TEXT, status TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS run_events (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, status TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS model_calls (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, stage TEXT NOT NULL, model TEXT NOT NULL, input_tokens INTEGER, output_tokens INTEGER, total_tokens INTEGER, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, run_id TEXT NOT NULL, profile_id TEXT NOT NULL, html TEXT, screenshot_path TEXT, validation_json TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS support_profiles (id TEXT PRIMARY KEY, label TEXT NOT NULL, supports_json TEXT NOT NULL, constraints_json TEXT NOT NULL, created_at TEXT NOT NULL)",
    ], "write");
    for (const column of ["emoji TEXT", "accent TEXT"]) { try { await db.execute(`ALTER TABLE support_profiles ADD COLUMN ${column}`); } catch { /* existing local database already has it */ } }
  })();
  return initialized;
}
export async function listProfiles() {
  await init();
  await db.batch([
    { sql: "INSERT OR IGNORE INTO support_profiles (id,label,supports_json,constraints_json,created_at) VALUES (?,?,?,?,?)", args: ["short-concrete-loops", "Pineapple", '["one action per screen","instant feedback"]', '["short loops"]', new Date().toISOString()] },
    { sql: "INSERT OR IGNORE INTO support_profiles (id,label,supports_json,constraints_json,created_at) VALUES (?,?,?,?,?)", args: ["audio-first", "Blueberry", '["spoken directions","replay"]', '["minimal text"]', new Date().toISOString()] },
    { sql: "INSERT OR IGNORE INTO support_profiles (id,label,supports_json,constraints_json,created_at) VALUES (?,?,?,?,?)", args: ["math-language-support", "Mango", '["worked example","vocabulary"]', '[]', new Date().toISOString()] },
  ], "write");
  const rows = await db.execute("SELECT id,label,supports_json,constraints_json,emoji,accent FROM support_profiles ORDER BY created_at");
  return rows.rows.map((row) => ({ id: String(row.id), label: String(row.label), supports: JSON.parse(String(row.supports_json)), constraints: JSON.parse(String(row.constraints_json)), emoji: row.emoji ? String(row.emoji) : undefined, accent: row.accent ? String(row.accent) : undefined }));
}
export async function saveProfile(profile: { id: string; label: string; supports: string[]; constraints: string[]; emoji?: string; accent?: string }) { await init(); await db.execute({ sql: "INSERT OR REPLACE INTO support_profiles (id,label,supports_json,constraints_json,emoji,accent,created_at) VALUES (?,?,?,?,?,?,?)", args: [profile.id, profile.label, JSON.stringify(profile.supports), JSON.stringify(profile.constraints), profile.emoji ?? null, profile.accent ?? null, new Date().toISOString()] }); }

export async function createRun(input: { id: string; lessonText: string; profilesJson: string }) {
  await init();
  await db.execute({ sql: "INSERT INTO runs (id, lesson_text, profiles_json, status, created_at) VALUES (?, ?, ?, ?, ?)", args: [input.id, input.lessonText, input.profilesJson, "created", new Date().toISOString()] });
}
export async function getActiveRun() {
  await init();
  const result = await db.execute("SELECT id, status FROM runs WHERE status NOT IN ('failed', 'approved', 'ready_for_approval') ORDER BY created_at DESC LIMIT 1");
  return result.rows[0] ?? null;
}
export async function event(runId: string, status: string, detail?: string) {
  await init();
  await db.execute({ sql: "INSERT INTO run_events (run_id, status, detail, created_at) VALUES (?, ?, ?, ?)", args: [runId, status, detail ?? null, new Date().toISOString()] });
  await db.execute({ sql: "UPDATE runs SET status = ? WHERE id = ?", args: [status, runId] });
}
export async function fail(runId: string, message: string) {
  await event(runId, "failed", message);
  await db.execute({ sql: "UPDATE runs SET error = ? WHERE id = ?", args: [message, runId] });
}
export async function saveSpec(runId: string, spec: unknown) {
  await init(); await db.execute({ sql: "UPDATE runs SET lesson_spec_json = ? WHERE id = ?", args: [JSON.stringify(spec), runId] });
}
export async function modelCall(runId: string, stage: string, model: string, usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }) {
  await init(); await db.execute({ sql: "INSERT INTO model_calls (run_id, stage, model, input_tokens, output_tokens, total_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", args: [runId, stage, model, usage?.input_tokens ?? null, usage?.output_tokens ?? null, usage?.total_tokens ?? null, new Date().toISOString()] });
}
export async function saveArtifact(input: { id: string; runId: string; profileId: string; html?: string; screenshotPath?: string; validation?: unknown; status: string }) {
  await init(); await db.execute({ sql: "INSERT OR REPLACE INTO artifacts (id, run_id, profile_id, html, screenshot_path, validation_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [input.id, input.runId, input.profileId, input.html ?? null, input.screenshotPath ?? null, input.validation ? JSON.stringify(input.validation) : null, input.status, new Date().toISOString()] });
}
export async function getRun(id: string) {
  await init();
  const [run, events, calls, artifacts] = await Promise.all([
    db.execute({ sql: "SELECT * FROM runs WHERE id = ?", args: [id] }),
    db.execute({ sql: "SELECT status, detail, created_at FROM run_events WHERE run_id = ? ORDER BY id", args: [id] }),
    db.execute({ sql: "SELECT stage, model, input_tokens, output_tokens, total_tokens, created_at FROM model_calls WHERE run_id = ? ORDER BY id", args: [id] }),
    db.execute({ sql: "SELECT id, profile_id, html, screenshot_path, validation_json, status FROM artifacts WHERE run_id = ? ORDER BY created_at", args: [id] }),
  ]);
  return { run: run.rows[0] ?? null, events: events.rows, modelCalls: calls.rows, artifacts: artifacts.rows };
}
export async function getArtifact(id: string) { await init(); const result = await db.execute({ sql: "SELECT * FROM artifacts WHERE id = ?", args: [id] }); return result.rows[0] ?? null; }
/** Restores the latest complete comparison set instead of a later one-profile repair run. */
export async function getLatestComparisonRun() {
  await init();
  const result = await db.execute("SELECT r.id FROM runs r WHERE (SELECT COUNT(*) FROM artifacts a WHERE a.run_id = r.id) >= 2 ORDER BY r.created_at DESC LIMIT 1");
  return result.rows[0]?.id ? getRun(String(result.rows[0].id)) : null;
}
export async function listGalleryRuns() {
  await init();
  const rows = await db.execute("SELECT r.id, r.lesson_text, r.created_at FROM runs r WHERE (SELECT COUNT(*) FROM artifacts a WHERE a.run_id = r.id) >= 3 ORDER BY r.created_at DESC LIMIT 20");
  return rows.rows;
}
export async function approveRun(id: string) { await event(id, "approved", "Teacher approved this artifact set."); }
