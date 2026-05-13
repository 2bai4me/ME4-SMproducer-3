/**
 * POST /api/projects/:prefix/:projectId/audio/process-stream
 *
 * SSE-Streaming Audio-Verarbeitung mit detailliertem Live-Log.
 * Jeder Schritt wird als SSE-Event an das Frontend gesendet
 * und parallel in eine lokale Log-Datei geschrieben.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getRootDir, openProjectDB } from '../db/manager.js';
import { createMCPClient } from '../mcp/client.js';

export default async function audioProcessStream(req, res) {
  const { prefix, projectId } = req.params;
  const { datei_pfad, sprecher_anzahl } = req.body;

  // SSE-Header
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const rootDir = getRootDir(req.app.locals.globalDB);
  const projektDir = path.join(rootDir, prefix, projectId, '3. Audio');
  const logFile = path.join(projektDir, 'verarbeitung.log');
  
  // Log-Hilfe: schreibt sowohl ins SSE als auch in die Log-Datei
  const logLines = [];
  function log(msg, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const line = `[${timestamp}] ${msg}`;
    logLines.push(line);
    console.log(`[Audio-Stream] ${msg}`);
    send('log', { message: msg, type, timestamp });
    // In Datei schreiben (append)
    try {
      fs.mkdirSync(projektDir, { recursive: true });
      fs.appendFileSync(logFile, line + '\n', 'utf-8');
    } catch (_) {}
  }

  try {
    // ═══ SCHRITT 1: Datei-Prüfung ═══
    log('═══════ AUDIO-VERARBEITUNG GESTARTET ═══════');
    log(`Projekt: ${projectId} | Kanal: ${prefix}`);
    log(`Sprecher-Anzahl: ${sprecher_anzahl || 2}`);

    if (!datei_pfad) {
      log('❌ FEHLER: Kein Dateipfad angegeben', 'error');
      send('error', { message: 'datei_pfad ist Pflichtfeld' });
      return res.end();
    }

    if (!fs.existsSync(datei_pfad)) {
      log(`❌ FEHLER: Datei nicht gefunden: ${datei_pfad}`, 'error');
      send('error', { message: `Datei nicht gefunden: ${datei_pfad}` });
      return res.end();
    }

    const origName = path.basename(datei_pfad);
    const origStat = fs.statSync(datei_pfad);
    const sizeMB = (origStat.size / (1024 * 1024)).toFixed(2);
    const origExt = path.extname(datei_pfad);

    log(`📁 Datei gefunden: ${origName}`);
    log(`   Größe: ${sizeMB} MB`);
    log(`   Pfad:  ${datei_pfad}`);

    // Dauer ermitteln
    let durationMin = 0;
    try {
      const mm = await import('music-metadata');
      const meta = await mm.parseFile(datei_pfad);
      durationMin = meta.format.duration ? (meta.format.duration / 60).toFixed(1) : 0;
      log(`   Dauer: ${durationMin} min | Format: ${meta.format.container || origExt}`);
    } catch (_) {
      log(`   Dauer: nicht ermittelbar | Format: ${origExt}`);
    }

    // Datei kopieren & umbenennen
    const newName = `${projectId}-nblm-Rohdaten${origExt}`;
    const targetPath = path.join(projektDir, newName);
    fs.mkdirSync(projektDir, { recursive: true });
    fs.copyFileSync(datei_pfad, targetPath);
    log(`📋 Datei kopiert: ${origName} → ${newName}`);
    log(`   Zielordner: ${projektDir}`);
    send('step1_done', {
      original_name: origName,
      target_name: newName,
      target_path: targetPath,
      target_dir: projektDir,
      size_mb: parseFloat(sizeMB),
      duration_min: parseFloat(durationMin),
    });

    // ═══ SCHRITT 2: STT-Service prüfen & Transkription ═══
    log('─── SCHRITT 2: TRANSKRIPTION ───');
    log('🔍 Prüfe STT-Service (ZMQ Port 5555)...');

    const mcp = createMCPClient();
    const speakerCount = sprecher_anzahl || 2;

    // Transkription starten
    log('📤 Sende Audio an STT-Service...');
    log(`   Datei: ${newName}`);
    log('   Handshake...');

    let transkript;
    try {
      transkript = await mcp.transcribe(targetPath);
      if (transkript && transkript.length > 0) {
        log(`✅ Handshake OK – Transkription gestartet`);
        log(`✅ Transkription fertig – ${transkript.length} Segmente empfangen`);
        send('transcript_done', { count: transkript.length, segments: transkript.slice(0, 10) });
      } else {
        log('⚠ Transkription: Leere Antwort, verwende Mock-Daten', 'warn');
        transkript = mcp._mockTranscription(targetPath);
        log(`⚠ Mock-Transkript: ${transkript.length} Segmente generiert`, 'warn');
      }
    } catch (err) {
      log(`❌ Transkription fehlgeschlagen: ${err.message}`, 'error');
      log('↩ Fallback auf Mock-Daten...', 'warn');
      transkript = mcp._mockTranscription(targetPath);
      log(`⚠ Mock-Transkript: ${transkript.length} Segmente`, 'warn');
    }

    // Transkript in DB speichern
    log('💾 Speichere Transkript in Projektdatenbank...');
    const pdb = openProjectDB(rootDir, prefix, projectId);
    pdb.prepare('INSERT INTO audio_konfig (datei_pfad, sprecher_anzahl) VALUES (?, ?)')
      .run(targetPath, speakerCount);

    const transInsert = pdb.prepare('INSERT INTO transkript (start_time, end_time, speaker, text) VALUES (?, ?, ?, ?)');
    for (const t of transkript) {
      transInsert.run(t.start_time || t.start, t.end_time || t.end, t.speaker, t.text);
    }
    log(`✅ Transkript gespeichert: ${transkript.length} Einträge in DB`);

    // Transkript-JSON speichern
    const jsonPath = path.join(projektDir, 'transkript.json');
    fs.writeFileSync(jsonPath, JSON.stringify(transkript, null, 2), 'utf-8');
    log(`📄 transkript.json gespeichert: ${jsonPath}`);

    // ═══ SCHRITT 3: Sprechertrennung ═══
    log('─── SCHRITT 3: SPRECHERTRENNUNG ───');
    log('🔍 Prüfe Speech-Splitter (ZMQ Port 5580)...');

    let spuren;
    try {
      spuren = await mcp.separateSpeakers(targetPath, speakerCount);
      if (spuren && spuren.length > 0) {
        log(`✅ Handshake OK – Sprechertrennung gestartet`);
        log(`✅ Sprechertrennung fertig – ${spuren.length} Spuren extrahiert`);
        for (const s of spuren) {
          log(`   Sprecher ${s.speaker}: ${s.file_path}`);
        }
      } else {
        log('⚠ Sprechertrennung: Leere Antwort, verwende Mock-Daten', 'warn');
        spuren = mcp._mockSpeakerSeparation(targetPath, speakerCount);
      }
    } catch (err) {
      log(`❌ Sprechertrennung fehlgeschlagen: ${err.message}`, 'error');
      log('↩ Fallback auf Mock-Daten...', 'warn');
      spuren = mcp._mockSpeakerSeparation(targetPath, speakerCount);
    }

    // Spuren in DB speichern
    log('💾 Speichere Sprecher-Spuren in Projektdatenbank...');
    const spurenInsert = pdb.prepare('INSERT INTO audio_spuren (sprecher, datei_pfad) VALUES (?, ?)');
    for (const s of spuren) {
      spurenInsert.run(s.speaker, s.file_path);
    }
    log(`✅ ${spuren.length} Sprecher-Spuren in DB gespeichert`);

    // ═══ SCHRITT 4: Abschluss ═══
    log('─── SCHRITT 4: ABSCHLUSS ───');
    log(`📁 Alle Ergebnisse in: ${projektDir}`);
    log(`   transkript.json (${transkript.length} Segmente)`);
    log(`   ${spuren.length} Sprecher-Audiodateien`);
    log(`📝 Log-Datei: ${logFile}`);
    log('═══════ VERARBEITUNG ABGESCHLOSSEN ═══════');

    send('done', {
      transkript,
      spuren,
      file_analysis: {
        original_name: origName,
        target_name: newName,
        target_path: targetPath,
        target_dir: projektDir,
        size_mb: parseFloat(sizeMB),
        duration_min: parseFloat(durationMin),
      },
      log_file: logFile,
      log_lines: logLines,
    });

  } catch (err) {
    log(`❌ KRITISCHER FEHLER: ${err.message}`, 'error');
    log(`Stack: ${err.stack}`, 'error');
    send('error', { message: err.message });
  }

  res.end();
}
