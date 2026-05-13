/**
 * NotebookLM Agent v2 – Verbindet sich mit deinem LAUFENDEN Chrome
 * 
 * Setup: npm install playwright
 * Chrome muss mit Remote-Debugging gestartet sein:
 *   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
 */

import { chromium } from 'playwright';

const TITLE = process.argv[2] || 'SMproducer Research';
const CONTENT = process.argv[3] || 'Standard-Inhalt';

async function main() {
  console.log('🚀 NotebookLM Agent v2');
  console.log('📎 Verbinde mit Chrome auf Port 9222...');
  
  let browser;
  try {
    // Mit bereits laufendem Chrome verbinden
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch (e) {
    console.log('❌ Chrome nicht erreichbar auf Port 9222.');
    console.log('   Starte Chrome so:');
    console.log('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
    process.exit(1);
  }

  const contexts = browser.contexts();
  const page = contexts[0]?.pages()[0] || await browser.newPage();

  try {
    // NotebookLM öffnen (längeres Timeout, Seite ist schwer)
    console.log('📓 Öffne NotebookLM...');
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'load', timeout: 60000 });
    console.log('   Seite geladen, warte 5s...');
    await page.waitForTimeout(5000);

    // Screenshot zum Debuggen
    await page.screenshot({ path: 'notebooklm-debug.png' });
    console.log('   Screenshot gespeichert: notebooklm-debug.png');

    // Neues Notebook erstellen
    console.log('➕ Erstelle neues Notebook...');
    
    // Mehrere Strategien versuchen
    const clicked = await tryClick(page, [
      'button:has-text("Neues Notizbuch")',
      'button:has-text("New notebook")',
      'text=Neues Notizbuch',
      'text=New notebook',
      '[aria-label*="new" i]',
      '[aria-label*="notebook" i]',
      'button:has-text("Create")',
    ]);

    if (clicked) {
      await page.waitForTimeout(2000);
      
      // Titel eingeben
      console.log('📝 Titel:', TITLE);
      await page.keyboard.type(TITLE);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // Inhalt einfügen  
      console.log('📄 Inhalt einfügen...');
      await page.keyboard.type(CONTENT);
    } else {
      console.log('⚠ Konnte Button nicht finden.');
      console.log('   Prüfe den Screenshot: notebooklm-debug.png');
      console.log('   NotebookLM-URL hat sich möglicherweise geändert.');
    }

    console.log('✅ Fertig!');
    console.log('   Browser bleibt offen – prüfe und schließe manuell.');
    
  } catch (err) {
    console.error('❌', err.message);
  }
  // Nicht schließen - User soll Ergebnis sehen
}

async function tryClick(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        console.log('   Button gefunden:', sel);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

main();
