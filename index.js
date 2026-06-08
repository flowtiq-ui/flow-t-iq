// ============================================================
//  Flowtiq Engine – das laufende Programm
//
//  Befehle:
//    node index.js demo        -> zeigt sofort, wie eine Antwort entsteht (ohne Setup)
//    node index.js watch       -> überwacht den Posteingang, erstellt Antwort-Entwürfe
//    node index.js outreach    -> erstellt Akquise-Entwürfe aus companies.csv
//    node index.js instagram 5 -> generiert 5 Instagram-Posts in die Warteschlange
//
//  Sicherheit: Es wird NICHTS automatisch gesendet oder gepostet.
//  Flowtiq erstellt nur ENTWÜRFE / Inhalte – du gibst frei.
// ============================================================

// .env laden (optional – stürzt nicht ab, falls dotenv noch nicht installiert ist)
try { await import('dotenv/config'); } catch {}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask } from './lib/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// config.txt laden – eine einfache, sichtbare Schlüsseldatei (Alternative zur .env).
// Werte daraus landen in process.env, sofern dort nicht schon gesetzt.
try {
  const cfgPath = path.join(__dirname, 'config.txt');
  if (fs.existsSync(cfgPath)) {
    for (const raw of fs.readFileSync(cfgPath, 'utf8').split(/\r?\n/)) {
      const l = raw.trim();
      if (!l || l.startsWith('#')) continue;
      const eq = l.indexOf('=');
      if (eq < 0) continue;
      const k = l.slice(0, eq).trim();
      const v = l.slice(eq + 1).trim();
      if (!v || v.startsWith('hier_')) continue; // Platzhalter ignorieren
      process.env[k] = v; // config.txt hat Vorrang vor .env
    }
  }
} catch {}

const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });

const BIZ = process.env.BUSINESS_NAME || 'Flowtiq';
const log = (...a) => console.log(...a);
const line = () => log('─'.repeat(52));

// ---------------- Hilfsfunktionen ----------------
function requireGmail() {
  const u = process.env.GMAIL_USER;
  const p = process.env.GMAIL_APP_PASSWORD || '';
  if (!u || !p || p.includes('dein_') || p === 'PLATZHALTER') {
    log('⚠️  Gmail-Zugang fehlt in .env (GMAIL_USER + GMAIL_APP_PASSWORD).');
    log('    Siehe README, Schritt 3 & 4. Ohne diese Daten kann Flowtiq keine Mails lesen.');
    process.exit(1);
  }
}

function loadProcessed() {
  try { return new Set(JSON.parse(fs.readFileSync(path.join(DATA, 'processed.json'), 'utf8'))); }
  catch { return new Set(); }
}
function saveProcessed(set) {
  fs.writeFileSync(path.join(DATA, 'processed.json'), JSON.stringify([...set], null, 2));
}

// Lead in leads.md eintragen (oben, unter der Markierung)
function saveLead({ name, contact, note }) {
  const file = path.join(__dirname, 'leads.md');
  let cur = '';
  try { cur = fs.readFileSync(file, 'utf8'); } catch {}
  const today = new Date().toLocaleDateString('de-CH');
  const block = `\n## ${today} – ${name}\n` +
    `- **Name:** ${name}\n` +
    `- **Kontakt:** ${contact}\n` +
    `- **Status:** 🟡 (automatisch erfasst)\n` +
    `- **Notiz:** ${note}\n`;
  const idx = cur.indexOf('Neue Leads werden ab hier');
  if (idx >= 0) {
    const nl = cur.indexOf('\n', idx);
    cur = cur.slice(0, nl + 1) + block + cur.slice(nl + 1);
  } else {
    cur += block;
  }
  fs.writeFileSync(file, cur);
}

// Einfacher CSV-Leser (Spalten: firma,branche,email)
function parseCsv(txt) {
  const lines = txt.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const head = lines.shift().split(',').map((s) => s.trim().toLowerCase());
  return lines.map((l) => {
    const cells = l.split(',');
    const o = {};
    head.forEach((h, i) => (o[h] = (cells[i] || '').trim()));
    return o;
  });
}

// ---------------- Befehl: demo ----------------
async function demo() {
  log('\n🎬  FLOWTIQ DEMO – so entsteht eine automatische Antwort\n');
  const sample = {
    fromName: 'Marco',
    from: 'marco@maler-ag.ch',
    subject: 'Anfrage Offerte',
    text: 'Guten Tag, ich brauche eine Offerte für Malerarbeiten, ca. 80m², 2 Zimmer. Wann hätten Sie Zeit?',
  };
  log('📥  Eingehende E-Mail');
  log('    Von:     ' + sample.from);
  log('    Betreff: ' + sample.subject);
  log('    Text:    ' + sample.text + '\n');
  log('🧠  Flowtiq fragt die KI...\n');

  const reply = await ask(
    `Eine Kundenmail ist eingegangen.\nVon: ${sample.fromName} <${sample.from}>\n` +
    `Betreff: ${sample.subject}\n\n${sample.text}\n\n` +
    `Schreibe eine professionelle, freundliche Antwort als ${BIZ}. Nur den E-Mail-Text.`
  );

  log('✍️   Generierter Antwort-ENTWURF:');
  line(); log(reply); line();
  log('\n➡️   Im echten Betrieb landet dieser Text als ENTWURF in deinem Gmail.');
  log('     Du prüfst kurz und klickst auf Senden. (Modus: "Schreibt, ich gebe frei")\n');
}

// Erkennt automatische/unpassende Absender, auf die NIE geantwortet wird.
function isNoReply(addr = '') {
  const a = addr.toLowerCase();
  return /(no-?reply|do-?not-?reply|noreply|mailer-daemon|postmaster|notifications?@|bounce|newsletter|automated|accounts\.google)/.test(a);
}

// Fragt die KI, ob es sich um eine echte Kundenanfrage handelt, die eine
// Antwort verdient. Schutz vor Auto-Antwort auf Spam/Newsletter/Systemmails.
async function isRealInquiry(m) {
  try {
    const verdict = await ask(
      `Du bist ein Filter. Entscheide, ob die folgende E-Mail eine ECHTE Anfrage ` +
      `eines Menschen/Kunden ist, die eine persönliche Antwort verdient. ` +
      `Newsletter, Werbung, Spam, automatische Benachrichtigungen, Sicherheitswarnungen, ` +
      `Rechnungen und Systemmails sind KEINE Anfragen.\n\n` +
      `Von: ${m.fromName} <${m.from}>\nBetreff: ${m.subject}\n\n${m.text}\n\n` +
      `Antworte mit EINEM Wort: JA oder NEIN.`
    );
    return /^\s*ja/i.test(verdict);
  } catch { return false; }
}

// ---------------- Posteingang: ein Durchlauf ----------------
async function inboxPass(limit = 10) {
  const autoSend = /^(1|true|ja|yes|on)$/i.test(process.env.AUTO_SEND || '');
  const { withImap, fetchUnseen, createDraft, sendMail, markSeen } = await import('./lib/gmail.js');
  await withImap(async (client) => {
    const processed = loadProcessed();
    const mails = await fetchUnseen(client, limit);
    const fresh = mails.filter((m) => !processed.has(String(m.uid)));
    if (!fresh.length) {
      log(`${new Date().toLocaleTimeString('de-CH')}  –  keine neuen Mails.`);
      return;
    }
    for (const m of fresh) {
      log(`\n📥  Neue Mail von ${m.from}  –  "${m.subject}"`);

      // Sicherheits-Filter 1: automatische Absender immer überspringen
      if (isNoReply(m.from)) {
        log('    ⏭️   Automatischer Absender – übersprungen (keine Antwort).');
        await markSeen(client, m.uid);
        processed.add(String(m.uid));
        continue;
      }
      // Sicherheits-Filter 2: bei Auto-Send nur auf echte Anfragen antworten
      if (autoSend && !(await isRealInquiry(m))) {
        log('    ⏭️   Keine echte Kundenanfrage (Newsletter/Spam/System) – übersprungen.');
        await markSeen(client, m.uid);
        processed.add(String(m.uid));
        continue;
      }

      const reply = await ask(
        `Eine Kundenmail ist eingegangen.\nVon: ${m.fromName} <${m.from}>\n` +
        `Betreff: ${m.subject}\n\n${m.text}\n\n` +
        `Schreibe eine professionelle, freundliche Antwort als ${BIZ}. Nur den E-Mail-Text.`
      );
      const subject = /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`;

      if (autoSend) {
        await sendMail({ to: m.from, subject, text: reply, inReplyTo: m.messageId, references: m.messageId });
        log(`    📨  Antwort automatisch GESENDET an ${m.from}.`);
      } else {
        const box = await createDraft(client, {
          to: m.from, subject, text: reply,
          inReplyTo: m.messageId, references: m.messageId,
        });
        log(`    ✅  Entwurf in "${box}" erstellt – bereit zur Freigabe in Gmail.`);
      }

      saveLead({ name: m.fromName || m.from, contact: m.from, note: 'Anfrage: ' + m.subject });
      await markSeen(client, m.uid);
      processed.add(String(m.uid));
    }
    saveProcessed(processed);
  });
}

// ---------------- Befehl: once (ein Durchlauf, dann Ende) ----------------
async function once() {
  requireGmail();
  const limit = Number(process.argv[3]) || 10;
  log('\n📬  Einmaliger Durchlauf des Posteingangs...\n');
  try { await inboxPass(limit); } catch (e) { log('⚠️   Fehler:', e.message); }
  log('\n✓  Fertig.\n');
  process.exit(0);
}

// ---------------- Befehl: watch (Dauerbetrieb) ----------------
async function watch() {
  requireGmail();
  const intervalSec = Number(process.env.WATCH_INTERVAL || 60);
  log(`\n📬  Flowtiq Posteingang-Wächter läuft. Prüfung alle ${intervalSec}s.`);
  log('    (Laufen lassen. Mit Strg + C beenden.)\n');
  const tick = async () => { try { await inboxPass(); } catch (e) { log('⚠️   Fehler:', e.message); } };
  await tick();
  setInterval(tick, intervalSec * 1000);
}

// ---------------- Befehl: outreach ----------------
async function outreach() {
  const file = path.join(__dirname, 'companies.csv');
  if (!fs.existsSync(file)) {
    log('\n⚠️   companies.csv fehlt.');
    log('     Kopiere companies.example.csv zu companies.csv und trage Betriebe ein.\n');
    return;
  }
  requireGmail();
  const { withImap, createDraft } = await import('./lib/gmail.js');
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  log(`\n📤  Erstelle Akquise-ENTWÜRFE für ${rows.length} Betriebe...\n`);

  await withImap(async (client) => {
    for (const r of rows) {
      if (!r.email) { log(`    ⏭️   ${r.firma || '???'}: keine E-Mail, übersprungen.`); continue; }
      const body = await ask(
        `Schreibe eine KURZE, freundliche Kaltakquise-E-Mail (Schweizer Hochdeutsch, echte Umlaute, kein "ß") ` +
        `an den Betrieb "${r.firma}" (Branche: ${r.branche || 'unbekannt'}). Stelle ${BIZ} vor ` +
        `(KI-Automatisierung für E-Mails & Offerten, Setup in 48h, ab CHF 500) und biete eine kostenlose ` +
        `15-Minuten-Demo an. Ende mit einer konkreten Frage. Unterschrift "${BIZ}". Nur der E-Mail-Text.`
      );
      const box = await createDraft(client, { to: r.email, subject: `Mehr Zeit für ${r.firma}?`, text: body });
      log(`    ✅  Entwurf für ${r.firma} <${r.email}> in "${box}".`);
    }
  });

  log('\n➡️   Alle Entwürfe liegen in Gmail. Prüfen, anpassen, senden – du gibst frei.');
  log('⚖️   Bitte nur Betriebe mit Bezug anschreiben und dosiert senden (UWG / Gmail-Limits).\n');
}

// ---------------- Befehl: instagram ----------------
async function instagram() {
  const n = Math.max(1, Math.min(10, Number(process.argv[3] || 3)));
  log(`\n📸  Generiere ${n} Instagram-Post(s)...\n`);
  const queueFile = path.join(__dirname, 'content', 'instagram-queue.md');
  fs.mkdirSync(path.dirname(queueFile), { recursive: true });

  let out = `\n## Generiert am ${new Date().toLocaleString('de-CH')}\n\n`;
  for (let i = 0; i < n; i++) {
    const post = await ask(
      `Schreibe einen Instagram-Post für ${BIZ} (Zielgruppe: Schweizer KMU, Handwerker, Dienstleister; ` +
      `Hochdeutsch, echte Umlaute, kein "ß"). Format: Emoji-Headline, kurzer Text (max. 120 Wörter), ` +
      `dann 12 Hashtags. Wähle ein abwechslungsreiches Thema (KI-Tipp, Zeitsparen, KMU-Problem, ` +
      `Erfolgsgeschichte oder Behind-the-Scenes).`
    );
    out += `### Post ${i + 1}\n\n${post}\n\n---\n\n`;
    log(`    ✅  Post ${i + 1} generiert.`);
  }
  fs.appendFileSync(queueFile, out);
  log(`\n📝  Gespeichert in content/instagram-queue.md`);
  log('➡️   Diese Posts in die GRATIS Meta Business Suite einplanen –');
  log('     dann postet Instagram sie automatisch zur geplanten Zeit.\n');
}

// ---------------- Start ----------------
const cmd = (process.argv[2] || 'demo').toLowerCase();
const commands = { demo, watch, once, outreach, instagram };
const fn = commands[cmd];
if (!fn) {
  log('Unbekannter Befehl. Möglich: demo | watch | outreach | instagram');
  process.exit(0);
}
fn().catch((e) => { console.error('Fehler:', e.message); process.exit(1); });
