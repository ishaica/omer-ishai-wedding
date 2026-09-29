/* ============================================================
   הגדרות — הדביקו כאן את כתובת ה-Web App של Google Apps Script
   (הוראות בקובץ apps-script.gs)
   ============================================================ */
const SHEET_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

/* ---------- countdown ---------- */
(function () {
  const el = document.querySelector("[data-countdown]");
  if (!el) return;
  const target = new Date(el.dataset.countdown).getTime();
  const parts = el.querySelectorAll("b");
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    [d, h, m, s].forEach((v, i) => (parts[i].textContent = i === 0 ? v : pad(v)));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ---------- add to calendar ---------- */
(function () {
  const c = window.EVENT;
  if (!c) return;
  const g = new URL("https://calendar.google.com/calendar/render");
  g.searchParams.set("action", "TEMPLATE");
  g.searchParams.set("text", c.title);
  g.searchParams.set("dates", c.startUTC + "/" + c.endUTC);
  g.searchParams.set("details", c.details + "\n" + location.href);
  g.searchParams.set("location", c.location);
  document.querySelectorAll("[data-gcal]").forEach((a) => (a.href = g.toString()));
})();

/* ---------- shuttle from Tel Aviv ---------- */
(function () {
  const box = document.querySelector("[data-shuttle]");
  if (!box) return;
  const [yes, no] = box.querySelectorAll(".choice button");
  const form = box.querySelector("form");
  const msgNo = box.querySelector("[data-msg-no]");
  const msgOk = box.querySelector("[data-msg-ok]");
  const err = form.querySelector(".error");

  function choose(isYes) {
    yes.setAttribute("aria-pressed", isYes);
    no.setAttribute("aria-pressed", !isYes);
    form.hidden = !isYes;
    msgNo.hidden = isYes;
    msgOk.hidden = true;
    if (isYes) form.querySelector("input").focus({ preventScroll: true });
  }
  yes.addEventListener("click", () => choose(true));
  no.addEventListener("click", () => choose(false));

  const normPhone = (p) => p.replace(/[\s\-()]/g, "").replace(/^\+?972/, "0");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.elements.fullname.value.trim();
    const phone = normPhone(form.elements.phone.value);
    form.elements.fullname.classList.toggle("err", name.length < 2);
    const phoneOk = /^05\d{8}$/.test(phone);
    form.elements.phone.classList.toggle("err", !phoneOk);
    if (name.length < 2) return (err.textContent = "איך קוראים לך?");
    if (!phoneOk) return (err.textContent = "מספר נייד לא תקין (למשל 050-1234567)");
    err.textContent = "";

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "שולחים…";
    try {
      if (!SHEET_URL.startsWith("https://")) throw new Error("SHEET_URL not set");
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams({
          name, phone, count: form.elements.count.value, shuttle: "כן", page: document.body.dataset.page || "", ts: new Date().toISOString(),
        }),
      });
      form.hidden = true;
      msgOk.hidden = false;
      box.querySelector(".choice").hidden = true;
    } catch (ex) {
      err.textContent = "משהו השתבש, נסו שוב או כתבו לנו בוואטסאפ";
      console.error(ex);
    } finally {
      btn.disabled = false; btn.textContent = "שמרו לי מקום";
    }
  });
})();
