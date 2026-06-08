# Flowtiq 🇨🇭

**KI-Automatisierung für KMUs in der Deutschschweiz.**
Automatisiert E-Mails, Offerten und Kundenkommunikation – Setup in 48 Stunden.

Dieses Repository enthält:

| Datei | Zweck |
|-------|-------|
| `index.html` | Die Website (One-Pager) |
| `.env.example` | Vorlage für die Konfiguration |
| `system-prompt.md` | Der System-Prompt für den KI-Assistenten (OpenClaw) |
| `offer-template.html` | Druckbare Angebotsvorlage (A4) |
| `instagram-posts.md` | 15 fertige Instagram-Posts |
| `outreach-templates.md` | Vorlagen für die Kundenakquise |
| `leads.md` | Hier werden Leads gespeichert |
| `sms-templates.md` | Professionelle SMS-Vorlagen (Rückruf, Follow-up, Termin) |

---

## 🚀 Schritt-für-Schritt-Anleitung (für Mac-Anfänger)

> Keine Angst – du brauchst **keine** Programmierkenntnisse. Folge einfach jedem Schritt der Reihe nach. Befehle, die mit `$` beginnen, tippst du ins **Terminal** (öffnen mit `Cmd + Leertaste` → "Terminal" eintippen → Enter).

---

### Schritt 1 – Gmail-Account erstellen ✅ (erledigt)

Du hast den Account **flowtiq@gmail.com** bereits erstellt. 👍

> Falls du später einen weiteren brauchst: [https://accounts.google.com/signup](https://accounts.google.com/signup)

---

### Schritt 2 – Gemini API Key holen

Der API Key ist der "Schlüssel", damit die KI funktioniert.

1. Gehe auf **[https://aistudio.google.com](https://aistudio.google.com)**
2. Melde dich mit **flowtiq@gmail.com** an.
3. Klicke links auf **"Get API Key"** (oder "API-Schlüssel abrufen").
4. Klicke auf **"Create API Key"**.
5. Kopiere den Schlüssel (eine lange Zeichenkette) und bewahre ihn sicher auf.

> ⚠️ Teile diesen Schlüssel mit **niemandem** – er ist wie ein Passwort.

---

### Schritt 3 – Projekt vorbereiten & .env ausfüllen

1. Öffne das Terminal und wechsle in den Projektordner:
   ```bash
   $ cd ~/Desktop/flowtiq
   ```
2. Erstelle aus der Vorlage deine echte Konfigurationsdatei:
   ```bash
   $ cp .env.example .env
   ```
3. Öffne die `.env`-Datei zum Bearbeiten:
   ```bash
   $ open -e .env
   ```
4. Trage deine Werte ein (Gemini API Key aus Schritt 2, App-Passwort folgt in Schritt 4) und speichere mit `Cmd + S`.

> 💡 Die `.env`-Datei enthält geheime Daten und darf **nie** öffentlich geteilt werden.

---

### Schritt 4 – Gmail App-Passwort erstellen

Damit Flowtiq E-Mails über dein Gmail senden darf, brauchst du ein spezielles "App-Passwort".

1. Aktiviere zuerst die **2-Faktor-Authentifizierung** (falls noch nicht aktiv):
   [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Gehe danach auf **[https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
3. Gib einen Namen ein, z. B. **"Flowtiq"**, und klicke auf **"Erstellen"**.
4. Google zeigt dir ein **16-stelliges Passwort** (z. B. `abcd efgh ijkl mnop`).
5. Kopiere es **ohne Leerzeichen** in deine `.env` bei `GMAIL_APP_PASSWORD`.
6. **IMAP aktivieren** (damit Flowtiq Mails auch *lesen* darf): Gmail öffnen → ⚙️ → **"Alle Einstellungen anzeigen"** → Tab **"Weiterleitung und POP/IMAP"** → **IMAP aktivieren** → speichern.

> 💡 Dasselbe App-Passwort gilt für **Lesen (IMAP)** und **Senden (SMTP)** – du brauchst nur eines. Flowtiq holt sich eingehende Anfragen per IMAP und antwortet per SMTP.

---

### Schritt 5 – Telegram-Bot via @BotFather erstellen

So bekommst du Benachrichtigungen über neue Leads direkt aufs Handy.

1. Öffne Telegram und suche nach **@BotFather**.
2. Schreibe ihm `/newbot`.
3. Gib einen Namen ein, z. B. **"Flowtiq Notify"**.
4. Gib einen Benutzernamen ein, der auf `bot` endet, z. B. **"flowtiq_notify_bot"**.
5. BotFather schickt dir ein **Token** (z. B. `123456:ABC-DEF...`). Kopiere es in die `.env` bei `TELEGRAM_BOT_TOKEN`.
6. Deine **Chat-ID** herausfinden: Schreibe deinem neuen Bot eine Nachricht und öffne dann im Browser:
   ```
   https://api.telegram.org/bot<DEIN_TOKEN>/getUpdates
   ```
   Suche im Text nach `"chat":{"id":...}` – diese Zahl ist deine `TELEGRAM_CHAT_ID`.

---

### Schritt 5b – SMS-Versand mit eigener Absenderkennung (optional)

Damit Flowtiq Kunden professionell per SMS erreichen kann – **ohne deine private Nummer** – brauchst du einen SMS-Anbieter. Empfohlen: **Twilio** (einfach, weltweit) oder ein Schweizer Anbieter wie **ASPSMS**.

1. Konto erstellen, z. B. auf **[https://www.twilio.com](https://www.twilio.com)**.
2. Eine **Absenderkennung** wählen:
   - **Alphanumerisch** (empfohlen): Empfänger sehen «Flowtiq» als Absender – ideal für Benachrichtigungen.
   - **Dedizierte Nummer** (+41…): nötig, wenn Kunden direkt zurückschreiben sollen.
3. Zugangsdaten (bei Twilio: *Account SID* + *Auth Token*) in die `.env` eintragen: `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_API_SECRET`, `SMS_SENDER`.
4. Fertige Textvorlagen findest du in **`sms-templates.md`**.

> ⚖️ **Wichtig – Cold-SMS in der Schweiz:** Werbe-SMS an Personen *ohne* vorherige Zustimmung oder bestehenden Kontakt sind laut **UWG (Art. 3 lit. o)** unzulässig. Versende SMS daher nur an **Interessenten, Anrufer und bestehende Kunden** – niemals an gekaufte Listen. In **jeder** SMS Pflicht: klare Absenderkennung + einfache Abmeldung (z. B. «Antwort STOP»). Flowtiq hängt die STOP-Abmeldung automatisch an. Im Zweifel kurz rechtlich absichern.

---

### Schritt 6 – Flowtiq starten

1. Stelle sicher, dass **Node.js** installiert ist:
   ```bash
   $ node -v
   ```
   Falls kein Wert erscheint: Lade Node.js von [https://nodejs.org](https://nodejs.org) (Version "LTS") und installiere es.
2. Installiere die Abhängigkeiten:
   ```bash
   $ npm install
   ```
3. Starte den Assistenten:
   ```bash
   $ npm start
   ```
4. Läuft alles, siehst du eine Bestätigung im Terminal. 🎉

> Zum Stoppen: `Ctrl + C` im Terminal drücken.

---

### Schritt 7 – Website auf Vercel deployen (kostenlos)

So bringst du `index.html` ins Internet.

1. Erstelle ein kostenloses Konto auf **[https://vercel.com](https://vercel.com)** (Login mit GitHub oder E-Mail).
2. **Einfachste Variante:** Auf dem Vercel-Dashboard auf **"Add New… → Project"** klicken und den `flowtiq`-Ordner per Drag & Drop hochladen.
3. **Oder via Terminal:**
   ```bash
   $ npm install -g vercel
   $ cd ~/Desktop/flowtiq
   $ vercel
   ```
   Folge den Fragen (einfach Enter drücken für die Standardwerte).
4. Nach wenigen Sekunden bekommst du eine Live-URL, z. B. `https://flowtiq.vercel.app`.
5. **Eigene Domain** (z. B. `flowtiq.ch`) kannst du später unter *Project → Settings → Domains* hinzufügen.

---

### Schritt 8 – Formspree einrichten (Kontaktformular)

Damit das Kontaktformular auf der Website funktioniert.

1. Erstelle ein kostenloses Konto auf **[https://formspree.io](https://formspree.io)**.
2. Klicke auf **"New Form"**, gib als Empfänger **flowtiq@gmail.com** an.
3. Formspree gibt dir eine Form-ID, z. B. `xyzabcde`. Deine Endpoint-URL sieht dann so aus:
   `https://formspree.io/f/xyzabcde`
4. Öffne `index.html`, suche nach `formspree.io/f/PLATZHALTER` und ersetze `PLATZHALTER` durch deine echte Form-ID.
5. Speichern, neu deployen (`vercel --prod`) – fertig. Test-Anfragen landen jetzt in deinem Postfach.

---

## 🤖 Teil B – Die Flowtiq-Engine (das Programm, das die Arbeit macht)

Die Dateien oben sind **Konfiguration & Inhalte**. Die **Engine** ist das Programm, das wirklich arbeitet: Mails lesen, mit KI beantworten, Akquise- und Instagram-Inhalte erstellen.

> 🧠 **So kannst du es dir vorstellen:** Flowtiq ist ein digitaler Mitarbeiter. Du gibst ihm die Schlüssel (Gmail-App-Passwort + Gemini-Key in der `.env`), dann erledigt er die Routine.
> 🔒 **Sicherheit:** Es wird **nichts** automatisch gesendet oder gepostet. Flowtiq legt **Entwürfe** an – du liest kurz und gibst frei (dein Modus: „Schreibt, ich gebe frei").

### Engine-Dateien
| Datei | Zweck |
|-------|-------|
| `index.js` | Hauptprogramm mit den Befehlen |
| `lib/ai.js` | Verbindung zur KI (Gemini) – das „Gehirn" |
| `lib/gmail.js` | Gmail lesen + Entwürfe anlegen |
| `companies.example.csv` | Beispiel-Liste für die Akquise |
| `package.json` | Liste der benötigten Bausteine |

### Einrichten (einmalig)
1. `.env` ausfüllen (Schritte 2–4 oben: Gemini-Key + Gmail-App-Passwort).
2. Im Terminal in den Ordner wechseln und die Bausteine installieren:
   ```bash
   cd ~/Desktop/flowtiq
   npm install
   ```

### Die 4 Befehle
```bash
# 1) SOFORT ausprobieren – zeigt, wie eine Antwort entsteht (kein Setup nötig)
node index.js demo

# 2) Posteingang überwachen: neue Mail -> KI-Antwort als Entwurf in Gmail
npm start

# 3) Akquise: zuerst companies.csv anlegen, dann Entwürfe für alle Betriebe
cp companies.example.csv companies.csv     # danach eigene Betriebe eintragen
node index.js outreach

# 4) Instagram: z. B. 5 Posts generieren -> content/instagram-queue.md
node index.js instagram 5
```

### Was jeder Befehl macht
- **📥 Mails beantworten (`npm start`):** Flowtiq prüft alle 60 Sekunden den Posteingang. Neue Anfrage → KI schreibt eine Antwort → **Entwurf** in Gmail. Du öffnest Gmail, liest kurz, klickst Senden. Jeder Absender wird automatisch in `leads.md` notiert.
- **📤 KMUs anschreiben (`outreach`):** Trage Betriebe in `companies.csv` ein. Flowtiq erstellt für jeden einen persönlichen **Entwurf**. Du gibst frei. ⚖️ Nur Betriebe mit Bezug – und dosiert (Gmail erlaubt ~500 Mails/Tag, sonst Spam-Sperre).
- **📸 Instagram (`instagram`):** Flowtiq generiert Posts in `content/instagram-queue.md`. Diese planst du in der **gratis Meta Business Suite** ein → Instagram postet automatisch zur geplanten Zeit. (Direktes Auto-Posten erlaubt Instagram nur für Business-Konten über die offizielle API – der Scheduler ist der einfache, erlaubte Weg.)

### Damit es rund um die Uhr läuft
Solange `npm start` läuft, arbeitet Flowtiq – dafür muss dein Mac an sein. Wenn es **24/7** laufen soll (auch wenn dein Mac aus ist), mietet man später einen kleinen Server (z. B. Railway oder Render, ab ca. 5 $/Monat). Dabei helfe ich dir, wenn du so weit bist.

---

## ✏️ Platzhalter, die du noch ersetzen musst

In `index.html`:
- `[PLATZHALTER_EMAIL]` → deine Kontakt-E-Mail (z. B. flowtiq@gmail.com)
- `[PLATZHALTER_WHATSAPP]` → deine WhatsApp-Nummer
- `[PLATZHALTER_TELEGRAM]` → dein Telegram-Handle
- `formspree.io/f/PLATZHALTER` → deine Formspree-ID
- Links für **Impressum**, **Datenschutz**, **Instagram**, **LinkedIn** (aktuell `#`)

---

## 🆘 Häufige Probleme

| Problem | Lösung |
|---------|---------|
| `command not found: npm` | Node.js installieren (Schritt 6) |
| E-Mails werden nicht gesendet | App-Passwort prüfen (Schritt 4), Leerzeichen entfernen |
| Keine Telegram-Nachricht | Token & Chat-ID in `.env` prüfen (Schritt 5) |
| Formular sendet nicht | Formspree-ID in `index.html` korrekt? (Schritt 8) |

---

Made with ❤️ in Switzerland · **Flowtiq** – KI-Automatisierung für die Deutschschweiz
