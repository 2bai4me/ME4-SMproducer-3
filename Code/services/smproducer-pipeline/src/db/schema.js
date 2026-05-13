/**
 * Database Schema – ME4-SMproducer 3.0
 *
 * Three-level SQLite architecture:
 *   global.db  – System-wide settings, API keys, channel registry
 *   <prefix>.db – Per-channel templates, criteria, variables, media templates
 *   <projekt-id>.db – Per-project metadata, artifacts, transcripts
 */

/**
 * Initialize global.db with all required tables.
 * @param {import('better-sqlite3').Database} db
 */
export function initGlobalDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS llm_providers (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 3),
      provider TEXT NOT NULL,
      api_key  TEXT NOT NULL DEFAULT '',
      endpoint TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tts_profiles (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      voice TEXT NOT NULL,
      speed REAL DEFAULT 1.0 CHECK(speed BETWEEN 0.5 AND 2.0),
      mood  TEXT DEFAULT 'neutral'
    );

    CREATE TABLE IF NOT EXISTS channels (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      prefix      TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'active',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- Unified Variables Table
    CREATE TABLE IF NOT EXISTS global_variablen (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      tech_name       TEXT NOT NULL UNIQUE,
      placeholder     TEXT NOT NULL,
      table_name      TEXT DEFAULT 'global_variablen',
      bereich         TEXT DEFAULT 'Global',
      beschreibung    TEXT DEFAULT '',
      var_typ         TEXT DEFAULT 'string' CHECK(var_typ IN ('string','integer','number','boolean','date')),
      wert            TEXT DEFAULT '',
      created_at      TEXT DEFAULT (datetime('now'))
    );


  `);

  // Seed default TTS profiles if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM tts_profiles').get();
  if (count.c === 0) {
    const insert = db.prepare('INSERT INTO tts_profiles (voice, speed, mood) VALUES (?, ?, ?)');
    insert.run('Google Deutsch', 1.0, 'neutral');
    insert.run('Google English', 1.0, 'neutral');
    insert.run('Microsoft Azure', 1.0, 'neutral');
  }

  // Seed global variables
  const varCount = db.prepare('SELECT COUNT(*) as c FROM global_variablen').get();
  if (varCount.c === 0) {
    const vi = db.prepare('INSERT INTO global_variablen (tech_name, placeholder, table_name, bereich, beschreibung, var_typ, wert) VALUES (?,?,?,?,?,?,?)');
    vi.run('app_name', '{{app_name}}', 'global_variablen', 'Global', 'Name der Anwendung', 'string', 'ME4-SMproducer');
    vi.run('app_version', '{{app_version}}', 'global_variablen', 'Global', 'Aktuelle Version', 'string', '2.02.000');
    vi.run('data_dir', '{{data_dir}}', 'global_variablen', 'Global', 'Datenverzeichnis', 'string', '');
    vi.run('active_provider', '{{active_provider}}', 'global_variablen', 'Global', 'Aktiver KI-Provider', 'string', 'DeepSeek');
  }

  // Migration: ensure status column exists (for DBs created before 3.0.1)
  try {
    db.exec('ALTER TABLE channels ADD COLUMN status TEXT NOT NULL DEFAULT \'active\'');
  } catch (_) {
    // column already exists – safe to ignore
  }
}

/**
 * Initialize a channel database.
 * @param {import('better-sqlite3').Database} db
 */
export function initChannelDB(db) {
  db.exec(`
    -- KON-01: Konsolidierte Kriterien-Tabelle (statt 3 getrennten)
    CREATE TABLE IF NOT EXISTS kriterien (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      typ            TEXT NOT NULL CHECK(typ IN ('audio','research','slides')),
      keyword        TEXT NOT NULL,
      kategorie      TEXT NOT NULL DEFAULT '',
      prompt_snippet TEXT NOT NULL DEFAULT '',
      created_at     TEXT DEFAULT (datetime('now')),
      UNIQUE(typ, keyword)
    );

  `);

  // Migration: Alte Kriterien-Tabellen uebernehmen (nur falls vorhanden)
  const legacyTables = [
    { table: 'kriterien_research', typ: 'research' },
    { table: 'kriterien_audio', typ: 'audio' },
    { table: 'kriterien_slides', typ: 'slides' },
  ];
  for (const { table, typ } of legacyTables) {
    const exists = db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?"
    ).get(table);
    if (exists) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO kriterien (typ, keyword, kategorie, prompt_snippet)
          SELECT ?, keyword, category, promptteil FROM ${table} WHERE keyword IS NOT NULL
        `).run(typ);
      } catch (_) { /* Migration fehlgeschlagen – ignorieren */ }
    }
  }

  db.exec(`

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id        TEXT PRIMARY KEY,
      section   TEXT NOT NULL,
      template  TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kanal_variablen (
      id          TEXT PRIMARY KEY,
      tech_name   TEXT NOT NULL,
      placeholder TEXT NOT NULL DEFAULT '',
      table_name  TEXT DEFAULT 'kanal_variablen',
      bereich     TEXT DEFAULT 'Kanal',
      beschreibung TEXT DEFAULT '',
      var_typ     TEXT DEFAULT 'string' CHECK(var_typ IN ('string','integer','number','boolean','date')),
      wert        TEXT NOT NULL DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS video_vorlagen (
      id           TEXT PRIMARY KEY,
      type         TEXT NOT NULL CHECK(type IN ('intro','hauptteil','outro')),
      kategorie    TEXT DEFAULT '',
      label        TEXT NOT NULL,
      file_path    TEXT NOT NULL,
      media_type   TEXT CHECK(media_type IN ('image','video','audio')),
      aspect       TEXT DEFAULT '16:9',
      datei_groesse INTEGER DEFAULT 0,
      datei_format TEXT DEFAULT '',
      dauer_sekunden REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS marketing_kontakte (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      channel      TEXT NOT NULL,
      contact_info TEXT DEFAULT '',
      status       TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS channel_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    -- PLAT-01: Plattform-Zugangsdaten
    CREATE TABLE IF NOT EXISTS plattform_zugang (
      id           TEXT PRIMARY KEY,
      plattform    TEXT NOT NULL CHECK(plattform IN ('YouTube','Instagram','TikTok','LinkedIn','Xing','Facebook')),
      label        TEXT NOT NULL DEFAULT '',
      api_key      TEXT DEFAULT '',
      api_secret   TEXT DEFAULT '',
      access_token TEXT DEFAULT '',
      username     TEXT DEFAULT '',
      is_active    INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: Spalten fuer IMP-21 hinzufuegen (ignorieren wenn schon da)
  const migrateCols = [
    "ALTER TABLE video_vorlagen ADD COLUMN kategorie TEXT DEFAULT ''",
    "ALTER TABLE video_vorlagen ADD COLUMN datei_groesse INTEGER DEFAULT 0",
    "ALTER TABLE video_vorlagen ADD COLUMN datei_format TEXT DEFAULT ''",
    "ALTER TABLE video_vorlagen ADD COLUMN dauer_sekunden REAL DEFAULT 0",
  ];
  for (const sql of migrateCols) {
    try { db.exec(sql); } catch (_) { /* Spalte existiert bereits */ }
  }
}

/**
 * Initialize a project database.
 * @param {import('better-sqlite3').Database} db
 */
export function initProjectDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projekt_meta (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '',
      kanal_prefix TEXT NOT NULL,
      status      TEXT DEFAULT 'active',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thema_quellen (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      content    TEXT DEFAULT '',
      analysed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS thema_ergebnisse (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      category    TEXT DEFAULT '',
      selected    INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS research_notizen (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      notebook_title     TEXT DEFAULT '',
      notebook_description TEXT DEFAULT '',
      content            TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS research_kriterien_selected (
      kriterium_id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS audio_konfig (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      datei_pfad      TEXT DEFAULT '',
      sprecher_anzahl INTEGER DEFAULT 2
    );

    CREATE TABLE IF NOT EXISTS audio_spuren (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      sprecher  TEXT NOT NULL,
      datei_pfad TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS transkript (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      speaker    TEXT NOT NULL,
      text       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slides_ergebnisse (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      zip_pfad    TEXT DEFAULT '',
      slide_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS slides_timing (
      slide_id   INTEGER,
      file_name  TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time   TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS video_konfig (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      format    TEXT NOT NULL DEFAULT '16:9',
      plattform TEXT NOT NULL DEFAULT 'YouTube'
    );

    CREATE TABLE IF NOT EXISTS video_timeline (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      element_type   TEXT NOT NULL,
      element_id     TEXT DEFAULT '',
      datei_pfad     TEXT DEFAULT '',
      start_seconds  REAL DEFAULT 0,
      duration_seconds REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS upload_daten (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      titel                   TEXT NOT NULL DEFAULT '',
      beschreibung            TEXT DEFAULT '',
      video_pfad              TEXT DEFAULT '',
      thumbnail_pfad          TEXT DEFAULT '',
      upload_zeit             TEXT,
      veroeffentlichung_zeit  TEXT,
      status                  TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS prompt_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      step      TEXT NOT NULL,
      prompt    TEXT NOT NULL,
      response  TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS error_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      service   TEXT NOT NULL,
      message   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- IMP-18: Projekt-Variablen (werden im Prompt-Engineer verwendet)
    CREATE TABLE IF NOT EXISTS projekt_variablen (
      id          TEXT PRIMARY KEY,
      tech_name   TEXT NOT NULL,
      placeholder TEXT NOT NULL DEFAULT '',
      table_name  TEXT DEFAULT 'projekt_variablen',
      bereich     TEXT NOT NULL DEFAULT 'Audio' CHECK(bereich IN ('Thema','Research','Audio','Slides','Thumbnail','Global')),
      beschreibung TEXT DEFAULT '',
      var_typ     TEXT DEFAULT 'string' CHECK(var_typ IN ('string','integer','number','boolean','date')),
      wert        TEXT NOT NULL DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);
}
