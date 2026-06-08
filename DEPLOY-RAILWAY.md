# 🚀 Flowtiq Agent 24/7 auf Railway

Ziel: Dein Agent läuft **rund um die Uhr** auf einem Server (nicht auf dem Schullaptop).
Er liest dann selbstständig Mails und **antwortet automatisch** auf echte Kundenanfragen.

Railway läuft komplett im **Browser** (Port 443) – das geht sogar im Schulnetz.

---

## Was der Agent auf dem Server tut

- alle 60 Sekunden den Posteingang prüfen
- Newsletter / Spam / Google-Warnungen **ignorieren** (zwei Sicherheits-Filter)
- auf **echte** Kundenanfragen mit der KI antworten
- im Modus `AUTO_SEND=true`: die Antwort **direkt senden**
- jede Anfrage als Lead in `leads.md` notieren

---

## Schritt 1 — Code zu GitHub bringen

1. Konto erstellen auf **https://github.com** (gratis).
2. Oben rechts **+** → **New repository** → Name z. B. `flowtiq` → **Private** wählen → **Create**.
3. Auf der neuen Seite: **„uploading an existing file"** anklicken.
4. Aus dem Ordner `flowtiq` ALLE Dateien hineinziehen –
   **AUSSER** `config.txt`, `.env`, `node_modules`, `data` (die enthalten Geheimnisse
   bzw. sind unnötig; sie sind durch `.gitignore` ohnehin geschützt).
   Wichtig sind: `index.js`, `lib/`, `package.json`, `system-prompt.md`, `.gitignore`.
5. **Commit changes**.

> ⚠️ Deine Schlüssel kommen NICHT in GitHub. Die trägst du in Schritt 3 direkt bei
> Railway ein. So bleiben Passwörter geheim.

---

## Schritt 2 — Railway-Projekt erstellen

1. **https://railway.app** öffnen → **Login** → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo** → dein `flowtiq`-Repo auswählen.
3. Railway erkennt Node.js automatisch und startet `npm start`
   (das ist `node index.js watch` – der Dauerbetrieb).

---

## Schritt 3 — Schlüssel als „Variables" eintragen

Im Railway-Projekt → Tab **Variables** → **New Variable**. Trage diese ein
(rechts deine echten Werte – genau wie in deiner `config.txt`):

| Variable | Wert |
|----------|------|
| `GEMINI_API_KEY` | dein Gemini-Key (AQ.…) |
| `GMAIL_USER` | flowtiq@gmail.com |
| `GMAIL_APP_PASSWORD` | dein 16-Zeichen App-Passwort |
| `AUTO_SEND` | `true` |
| `WATCH_INTERVAL` | `60` |
| `BUSINESS_NAME` | `Flowtiq` |

Speichern → Railway startet den Agenten neu.

> 🔒 Tipp Auto-Send: Lass den Agenten am ANFANG ein paar Tage mit `AUTO_SEND=false`
> laufen (er macht dann nur Entwürfe). Wenn die Antworten gut sind, auf `true` stellen.

---

## Schritt 4 — Läuft es?

Railway → Tab **Deployments** → **View Logs**. Du solltest sehen:

```
📬  Flowtiq Posteingang-Wächter läuft. Prüfung alle 60s.
…  –  keine neuen Mails.
```

Schick eine Test-Mail an flowtiq@gmail.com → nach max. 60 s erscheint im Log
`📨 Antwort automatisch GESENDET` und der Absender bekommt die KI-Antwort.

Fertig – der Agent arbeitet jetzt 24/7, auch wenn dein Laptop aus ist. 🎉

---

## Kosten

Railway: ~5 $/Monat (Hobby-Plan). Gemini: gratis-Kontingent reicht für den Start.

## Später erweitern

- **Akquise:** `companies.csv` befüllen → `node index.js outreach` (oder als zweiten
  Dienst/Cron auf Railway). Erstellt Akquise-Mails.
- **Instagram:** `node index.js instagram 5` generiert Posts nach
  `content/instagram-queue.md` → in der gratis Meta Business Suite einplanen.
