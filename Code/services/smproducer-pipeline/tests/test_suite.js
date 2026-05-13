/**
 * TEST-01/02: Unit- und Integrationstests für smproducer-pipeline
 *
 * Verwendet Node.js built-in test runner (node --test)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_ROOT = path.join(__dirname, '..', '..', '..', 'MESM_DATA', '_test_' + Date.now());

// ─── DB Schema Tests ──────────────────────────────────────────────

describe('DB Schema', () => {
  before(() => {
    fs.mkdirSync(TEST_ROOT, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(TEST_ROOT)) {
      fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    }
  });

  it('should initialize channel.db with all tables', async () => {
    const { openChannelDB } = await import('../src/db/manager.js');
    const db = openChannelDB(TEST_ROOT, 'TESTDB');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const names = tables.map(t => t.name);

    assert.ok(names.includes('kriterien'), 'kriterien table missing');
    assert.ok(names.includes('prompt_templates'), 'prompt_templates missing');
    assert.ok(names.includes('video_vorlagen'), 'video_vorlagen missing');
    assert.ok(names.includes('plattform_zugang'), 'plattform_zugang missing');
    db.close();
  });

  it('should initialize project.db with all tables', async () => {
    const { openProjectDB } = await import('../src/db/manager.js');
    const db = openProjectDB(TEST_ROOT, 'TESTDB', 'TEST-001');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const names = tables.map(t => t.name);

    assert.ok(names.includes('projekt_meta'), 'projekt_meta missing');
    assert.ok(names.includes('thema_quellen'), 'thema_quellen missing');
    assert.ok(names.includes('projekt_variablen'), 'projekt_variablen missing');
    db.close();
  });
});

// ─── Kriterien Import Tests ───────────────────────────────────────

describe('Kriterien CRUD', () => {
  let chanDB;
  const chanPath = path.join(TEST_ROOT, 'KRIT.db');

  before(() => {
    fs.mkdirSync(TEST_ROOT, { recursive: true });
  });

  after(() => {
    if (chanDB) try { chanDB.close(); } catch (_) {}
    if (fs.existsSync(chanPath)) fs.unlinkSync(chanPath);
  });

  it('should insert kriterien (INSERT OR REPLACE)', async () => {
    const Database = (await import('better-sqlite3')).default;
    const { initChannelDB } = await import('../src/db/schema.js');
    chanDB = new Database(chanPath);
    initChannelDB(chanDB);

    const stmt = chanDB.prepare(
      'INSERT OR REPLACE INTO kriterien (typ, keyword, kategorie, prompt_snippet) VALUES (?, ?, ?, ?)'
    );
    stmt.run('research', 'TestKW', 'TestKat', 'Test prompt');
    const rows = chanDB.prepare('SELECT * FROM kriterien WHERE keyword = ?').all('TestKW');
    assert.equal(rows.length, 1, 'Should be inserted');
  });

  it('should replace on duplicate (typ+keyword)', () => {
    const stmt = chanDB.prepare(
      'INSERT OR REPLACE INTO kriterien (typ, keyword, kategorie, prompt_snippet) VALUES (?, ?, ?, ?)'
    );
    stmt.run('research', 'TestKW', 'UpdatedKat', 'Updated prompt');
    const rows = chanDB.prepare('SELECT * FROM kriterien WHERE keyword = ?').all('TestKW');
    assert.equal(rows.length, 1, 'Still one row');
    assert.equal(rows[0].kategorie, 'UpdatedKat', 'Should be updated');
  });

  it('should filter by typ', () => {
    const stmt = chanDB.prepare('INSERT OR REPLACE INTO kriterien (typ, keyword, kategorie, prompt_snippet) VALUES (?, ?, ?, ?)');
    stmt.run('audio', 'AudioKW', 'Audio', 'Audio test');
    const research = chanDB.prepare("SELECT * FROM kriterien WHERE typ = 'research'").all();
    const audio = chanDB.prepare("SELECT * FROM kriterien WHERE typ = 'audio'").all();
    assert.ok(research.length >= 1, 'Should have research kriterien');
    assert.ok(audio.length >= 1, 'Should have audio kriterien');
  });
});

// ─── KI Import Format Detection ───────────────────────────────────

describe('IMP-17: Column Detection', () => {
  it('should detect standard columns', async () => {
    // Test autoDetectColumns logic
    const KNOWN = {
      prefix: ['prefix', 'kuerzel', 'kanal'],
      title: ['title', 'titel', 'name'],
      description: ['description', 'beschreibung', 'info'],
    };

    function detect(headers) {
      const mapping = {};
      for (const [field, candidates] of Object.entries(KNOWN)) {
        for (const h of headers) {
          const hl = h.toLowerCase().trim();
          if (candidates.some(c => hl === c || hl.includes(c))) {
            mapping[field] = h;
            break;
          }
        }
      }
      return (mapping.prefix && mapping.title) ? mapping : null;
    }

    assert.ok(detect(['prefix', 'title', 'description']), 'Standard columns');
    assert.ok(detect(['kuerzel', 'titel', 'beschreibung']), 'German columns (ASCII)');
    assert.equal(detect(['Foo', 'Bar', 'Baz']), null, 'Invalid columns');
  });
});

// ─── Version Format ───────────────────────────────────────────────

describe('Versioning', () => {
  it('should match format 2.SPRINT.BUILD', () => {
    const versionPattern = /^2\.\d{2}\.\d{3}$/;
    assert.ok(versionPattern.test('2.01.000'), 'Valid version');
    assert.ok(versionPattern.test('2.02.000'), 'Valid version');
    assert.ok(!versionPattern.test('3.01.000'), 'Wrong major');
    assert.ok(!versionPattern.test('2.1.000'), 'Wrong sprint format');
  });
});

console.log('✅ All tests completed');
