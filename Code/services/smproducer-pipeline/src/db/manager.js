/**
 * Database Manager – Opens and manages the three-level SQLite databases.
 * @module db/manager
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { initGlobalDB, initChannelDB, initProjectDB } from './schema.js';

/** @type {Map<string, Database>} */
const dbCache = new Map();

/**
 * Open or create global.db at the given root directory.
 * @param {string} rootDir
 * @returns {Database}
 */
export function openGlobalDB(rootDir) {
  const dbPath = path.join(rootDir, 'global.db');
  if (dbCache.has(dbPath)) return dbCache.get(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initGlobalDB(db);
  dbCache.set(dbPath, db);
  return db;
}

/**
 * Open or create a channel database.
 * @param {string} rootDir
 * @param {string} prefix
 * @returns {Database}
 */
export function openChannelDB(rootDir, prefix) {
  const chanDir = path.join(rootDir, prefix);
  fs.mkdirSync(chanDir, { recursive: true });

  const dbPath = path.join(chanDir, `${prefix}.db`);
  if (dbCache.has(dbPath)) return dbCache.get(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initChannelDB(db);
  dbCache.set(dbPath, db);
  return db;
}

/**
 * Open or create a project database.
 * @param {string} rootDir
 * @param {string} prefix
 * @param {string} projectId
 * @returns {Database}
 */
export function openProjectDB(rootDir, prefix, projectId) {
  const projDir = path.join(rootDir, prefix, projectId);
  fs.mkdirSync(projDir, { recursive: true });

  const dbPath = path.join(projDir, `${projectId}.db`);
  if (dbCache.has(dbPath)) return dbCache.get(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initProjectDB(db);
  dbCache.set(dbPath, db);
  return db;
}

/**
 * Close all open databases.
 */
export function closeAll() {
  for (const db of dbCache.values()) {
    try { db.close(); } catch (_) { /* ignore */ }
  }
  dbCache.clear();
}

/**
 * Close and remove all cached databases for a channel prefix.
 * Wird beim Löschen eines Kanals aufgerufen.
 */
export function closeChannelCaches(rootDir, prefix) {
  const chanPrefix = path.join(rootDir, prefix);
  const keysToDelete = [];
  for (const [dbPath, db] of dbCache) {
    if (dbPath.startsWith(chanPrefix)) {
      try { db.close(); } catch (_) { /* ignore */ }
      keysToDelete.push(dbPath);
    }
  }
  keysToDelete.forEach(k => dbCache.delete(k));
}

/**
 * Get the current root directory from global settings, or the default.
 * @param {Database} globalDB
 * @returns {string}
 */
export function getRootDir(globalDB) {
  try {
    const row = globalDB.prepare("SELECT value FROM app_settings WHERE key = 'root_dir'").get();
    if (row?.value) return row.value;
  } catch (_) { /* not initialized yet */ }
  // Default: a 'MESM_DATA' folder next to the project
  const fallback = path.resolve(process.cwd(), '..', '..', '..', 'MESM_DATA');
  return fallback;
}

/**
 * Set root directory in global settings.
 * @param {Database} globalDB
 * @param {string} dir
 */
export function setRootDir(globalDB, dir) {
  globalDB.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('root_dir', ?)").run(dir);
}
