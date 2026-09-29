# Deploy brief: Omer & Yishai wedding site

You are finishing the deployment of a static two-page wedding site. **The site is built and approved by the client.** Your job is only to wire up the sign-up form and publish it. Do not change copy, layout, colors, fonts or images.

## 1. Context

| Item | Value |
|---|---|
| Couple | עומר וישי (Omer & Yishai) |
| Event | Mon 12.10.2026, קו המים, שולמית 3, נתניה |
| Owner | Ishai, Google account `ishaicahila@gmail.com`, GitHub user `ishaica` |
| Language | Hebrew, RTL |
| Hosting target | GitHub Pages (free, public repo) |
| Form backend | Google Apps Script web app that appends rows to a Google Sheet |
| Google Sheet (already created, has header row) | `198WNfoCeTpnD3oGZiDF5AMtN6HGAGVH9L0cp515PtlM`<br>https://docs.google.com/spreadsheets/d/198WNfoCeTpnD3oGZiDF5AMtN6HGAGVH9L0cp515PtlM/edit |
| Sheet title | הסעות – החתונה של עומר וישי |
| Target repo | `ishaica/omer-yishai-wedding` (does **not** exist yet) |
| Expected site URL | `https://ishaica.github.io/omer-yishai-wedding` |

## 2. Files in this folder

| File | Purpose |
|---|---|
| `index.html` | General guests page: schedule, location + parking, **shuttle sign-up form**, Google Calendar button |
| `friends.html` | Close-friends page: 2-day schedule, location, calendar. No form. `noindex`. Not linked from `index.html` on purpose |
| `style.css` | Shared styles (palette taken from the printed invitation; square corners by design) |
| `main.js` | Countdown, Google Calendar link builder, shuttle form submit. **Line 5 holds `SHEET_URL` placeholder** |
| `apps-script.gs` | Server code to paste into the Sheet's bound Apps Script project |
| `configure.sh` | Replaces the two placeholders (see §4) |
| `img/` | `dog-logo.jpg` (hero circle), `dog-full.jpg` (footer circle + share image), `leaf-*.png` (decorations) |
| `DEPLOY.md` | This brief. Do **not** publish it (see §5) |

### Placeholders that must be replaced before publishing
1. `main.js` → `const SHEET_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";`
2. `index.html` and `friends.html` → `__SITE_URL__` in `og:image` / `og:url` meta tags (needed for the WhatsApp link preview, which requires absolute URLs)

## 3. Step A: Deploy the Apps Script web app

Requires being signed in to Google as `ishaicahila@gmail.com` (browser automation, or the user does it).

1. Open the Sheet URL above.
2. Menu **Extensions → Apps Script**. A bound project opens.
3. Replace all contents of `Code.gs` with the full contents of `apps-script.gs`. Save (Ctrl/Cmd+S). Optionally rename the project to `Omer-Yishai shuttle`.
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Description: `v1`
   - Execute as: **Me (ishaicahila@gmail.com)**
   - Who has access: **Anyone** ← required. Anything else makes the site's anonymous POST fail silently.
5. Click **Deploy** → **Authorize access** → choose the account → "Google hasn't verified this app" → **Advanced** → **Go to … (unsafe)** → **Allow**. (Expected: it is the owner's own script. The scopes are Sheets access only.)
6. Copy the **Web app URL**. Format: `https://script.google.com/macros/s/<ID>/exec`. Call it `EXEC_URL`.
7. Sanity check: `curl -sL "$EXEC_URL"` should print `OK` (served by `doGet`).
8. Smoke test the write path:
   ```bash
   curl -sL -X POST "$EXEC_URL" \
     --data-urlencode "name=בדיקה" --data-urlencode "phone=0500000000" \
     --data-urlencode "count=2" --data-urlencode "shuttle=כן" --data-urlencode "page=test"
   ```
   Expect `{"ok":true}` and a new row in the Sheet's **first tab**. Then **delete that test row** (row 2 only, keep the header row 1).

Notes on the backend:
- The site posts `application/x-www-form-urlencoded` with `mode: "no-cors"`. That is intended: Apps Script does not return CORS headers, so the browser gets an opaque response and the page shows success once the request is sent. Do not "fix" this by switching to JSON or `cors` mode, because that triggers a preflight Apps Script can't answer.
- Fields sent: `name`, `phone` (normalized to `05XXXXXXXX`), `count` (`1`–`5` or `6+`), `shuttle` (`כן`), `page` (`כללי`), `ts`.
- Columns written: תאריך | שם | טלפון | וואטסאפ (wa.me link) | כמה | הסעה | עמוד.
- If `apps-script.gs` is edited later: **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same `EXEC_URL`. Creating a *new deployment* instead would change the URL.

## 4. Step B: Configure the site

```bash
cd <this folder>
chmod +x configure.sh
./configure.sh "$EXEC_URL" "https://ishaica.github.io/omer-yishai-wedding"
```
The script refuses to finish if either placeholder remains.

## 5. Step C: Create the repo and publish on GitHub Pages

Requires GitHub auth as `ishaica` with permission to create repos (e.g. `gh auth login`, or a PAT with `repo` scope, or the web UI).

With `gh`:
```bash
cd <this folder>
git init -b main
printf 'DEPLOY.md\nconfigure.sh\n.DS_Store\n' > .gitignore
git add -A
git commit -m "Omer & Yishai wedding site"
gh repo create ishaica/omer-yishai-wedding --public --source=. --remote=origin --push \
  --description "Omer & Yishai · 12.10.2026"
# enable Pages from main / root
gh api -X POST repos/ishaica/omer-yishai-wedding/pages \
  -f "source[branch]=main" -f "source[path]=/"
# wait for the first build
gh api repos/ishaica/omer-yishai-wedding/pages/builds/latest --jq .status   # repeat until "built"
```

Without `gh` (web UI):
1. https://github.com/new → name `omer-yishai-wedding` → **Public** → no README/license/.gitignore → Create.
2. "uploading an existing file" → drag **the contents** of this folder (`index.html`, `friends.html`, `style.css`, `main.js`, `apps-script.gs`, `img/`). Not the parent folder, and not `DEPLOY.md` / `configure.sh`. → Commit.
3. Settings → Pages → Source: **Deploy from a branch** → Branch **main**, folder **/ (root)** → Save. Wait 1–2 min.

The repo must be public: GitHub Pages is free only for public repos. `apps-script.gs` is safe to publish because it contains no secrets or IDs. The `EXEC_URL` in `main.js` is public by nature.

If the repo name is taken or different, rerun `configure.sh` with the matching site URL **before** pushing. The og tags must match the real URL.

## 6. Step D: Verify (all must pass)

Final URLs:
- General: `https://ishaica.github.io/omer-yishai-wedding/`
- Close friends: `https://ishaica.github.io/omer-yishai-wedding/friends.html`

Checklist:
- [ ] Both URLs return 200 and render (check at ~390px mobile width too). Hebrew title "עומר וישי" in the green display font (Secular One), dog in a circle at top and bottom, leaf decorations, fixed thin frame.
- [ ] Countdown ticks, reads left→right: days · hours · minutes · seconds, seconds in green. General counts to 12.10.2026 18:00 IDT; friends counts to 12.10.2026 10:00 IDT.
- [ ] `index.html`: "לפרטים והרשמה תלחצו" link under 17:00 scrolls to the shuttle section.
- [ ] Shuttle form: "כן, בטח" reveals name / phone / "כמה תהיו?" dropdown. Invalid phone shows a Hebrew error. A valid submit shows "נרשמתם להסעה!" and **a row lands in the Sheet** with the right count. Delete the test row afterwards.
- [ ] "לא, מגיעים עצמאית" shows the "מעולה, נתראה שם" message.
- [ ] Google Calendar button opens a prefilled event. General: 12.10.2026 18:00–00:00. Friends: 12.10 10:00 → 13.10 11:30. Location "קו המים, שולמית 3, נתניה".
- [ ] Waze and Google Maps buttons open the venue.
- [ ] `view-source` shows no `PASTE_YOUR_APPS_SCRIPT` and no `__SITE_URL__`.
- [ ] Link preview: `curl -s <url> | grep og:image` shows the absolute URL, and that image URL returns 200.
- [ ] `DEPLOY.md` and `configure.sh` are **not** served (404).

## 7. Report back to the user
Send Ishai:
1. The two final URLs (general / close friends).
2. The Sheet link (sign-ups appear there).
3. A reminder that `friends.html` is unlisted, not password-protected: anyone with the link can open it.

## 8. Known open items (do not act on, just mention)
- Parking copy is based on public info: the venue site only says "חניה בשפע", and the Poleg beach lot details come from the Netanya municipality site. The couple should confirm with the venue (073-7755554).
- The title font was matched by eye to the printed invitation (Secular One). If the couple names a different font, change `font-family` on `h1, .see-you` in `style.css` and add it to the Google Fonts `<link>` in both HTML files.

## 9. Don'ts
- Don't restyle, reword, or "improve" the pages.
- Don't add analytics, cookies, or third-party scripts.
- Don't make the repo private (breaks free Pages).
- Don't create a second Apps Script *deployment* for code updates. Use *Manage deployments → New version*.
- Don't commit anything containing personal data from the Sheet.
