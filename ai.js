// ============================================================
//  lib/ai.js – Verbindung zur KI (Google Gemini)
//  Das ist das "Gehirn": Hier wird der Text generiert.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Lädt den System-Prompt (Verhalten/Persönlichkeit) aus system-prompt.md
export function loadSystemPrompt() {
  try {
    return fs.readFileSync(path.join(ROOT, 'system-prompt.md'), 'utf8');
  } catch {
    return 'Du bist der virtuelle Assistent von Flowtiq. Antworte professionell auf Hochdeutsch (Schweizer Stil, nutze "ss" statt "ß", echte Umlaute ä ö ü).';
  }
}

// Stellt der KI eine Anfrage und gibt den Text zurück.
// Ohne gültigen GEMINI_API_KEY wird eine einfache Demo-Antwort genutzt,
// damit man die Engine auch ohne Einrichtung sofort ausprobieren kann.
export async function ask(userPrompt, { system } = {}) {
  const key = process.env.GEMINI_API_KEY;
  const systemPrompt = system || loadSystemPrompt();

  const noKey = !key || key.includes('dein_') || key === 'PLATZHALTER';
  if (noKey) return fallbackAnswer();

  // Die KI-Bibliothek wird erst hier geladen (so läuft die Demo auch ohne npm install).
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text().trim();
}

// Ersatz-Antwort, wenn (noch) kein API-Key gesetzt ist.
function fallbackAnswer() {
  return [
    '[DEMO-Modus – ohne KI. Trage GEMINI_API_KEY in .env ein für echte, individuelle Antworten.]',
    '',
    'Guten Tag',
    '',
    'vielen Dank für Ihre Nachricht! Gerne kümmern wir uns darum und melden uns',
    'innerhalb von 24 Stunden mit allen Details bei Ihnen.',
    '',
    'Freundliche Grüsse',
    'Flowtiq',
  ].join('\n');
}
