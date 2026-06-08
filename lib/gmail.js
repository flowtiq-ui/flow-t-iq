// ============================================================
//  lib/gmail.js – Gmail lesen (IMAP) und Entwürfe erstellen
//  Es wird NICHTS automatisch gesendet. Flowtiq legt nur
//  ENTWÜRFE an – du gibst sie in Gmail frei (klick auf Senden).
// ============================================================
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

function imapConfig() {
  return {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    },
    logger: false,
  };
}

// Verbindet mit Gmail, führt die Funktion aus und trennt sauber wieder.
export async function withImap(fn) {
  const client = new ImapFlow(imapConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

// Holt die neuesten ungelesenen Mails aus dem Posteingang.
export async function fetchUnseen(client, limit = 10) {
  const lock = await client.getMailboxLock('INBOX');
  const out = [];
  try {
    const uids = await client.search({ seen: false }, { uid: true });
    for (const uid of uids.slice(-limit)) {
      const msg = await client.fetchOne(uid, { source: true }, { uid: true });
      if (!msg || !msg.source) continue;
      const p = await simpleParser(msg.source);
      out.push({
        uid,
        from: p.from?.value?.[0]?.address || '',
        fromName: p.from?.value?.[0]?.name || '',
        subject: p.subject || '(kein Betreff)',
        text: (p.text || '').trim().slice(0, 4000),
        messageId: p.messageId || '',
      });
    }
  } finally {
    lock.release();
  }
  return out;
}

// Markiert eine Mail als gelesen (\Seen). So wird sie nicht erneut bearbeitet –
// auch nach einem Neustart/Redeploy des Servers.
export async function markSeen(client, uid) {
  const lock = await client.getMailboxLock('INBOX');
  try {
    await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
  } catch {} finally {
    lock.release();
  }
}

// Baut eine echte E-Mail (MIME) – ohne sie zu senden.
async function buildRaw({ from, to, subject, text, inReplyTo, references }) {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'crlf' });
  const info = await transport.sendMail({
    from, to, subject, text,
    inReplyTo: inReplyTo || undefined,
    references: references || undefined,
  });
  return info.message; // Buffer mit der kompletten Nachricht
}

// Findet den Entwürfe-Ordner (sprachunabhängig: \Drafts).
async function findDraftsMailbox(client) {
  try {
    const list = await client.list();
    const d = list.find((m) => m.specialUse === '\\Drafts');
    if (d) return d.path;
  } catch {}
  return '[Gmail]/Drafts';
}

// Legt einen Entwurf in Gmail ab. Gibt den Ordnernamen zurück.
export async function createDraft(client, mail) {
  const raw = await buildRaw({ from: process.env.GMAIL_USER, ...mail });
  const box = await findDraftsMailbox(client);
  await client.append(box, raw, ['\\Draft']);
  return box;
}

// ----- Senden (SMTP) -----
// Versendet eine E-Mail wirklich über Gmail (Port 465).
// Wird nur genutzt, wenn AUTO_SEND aktiv ist.
let _smtp = null;
function smtp() {
  if (_smtp) return _smtp;
  _smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    },
  });
  return _smtp;
}

export async function sendMail({ to, subject, text, inReplyTo, references }) {
  const fromName = process.env.BUSINESS_NAME || 'Flowtiq';
  const info = await smtp().sendMail({
    from: `${fromName} <${process.env.GMAIL_USER}>`,
    to, subject, text,
    inReplyTo: inReplyTo || undefined,
    references: references || undefined,
  });
  // Kopie der gesendeten Mail in den Gesendet-Ordner legen wäre optional;
  // Gmail macht das bei SMTP automatisch.
  return info.messageId;
}
