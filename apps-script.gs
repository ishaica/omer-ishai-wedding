// הסעות → Google Sheets · עומר וישי

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["תאריך", "שם", "טלפון", "וואטסאפ", "כמה", "הסעה", "עמוד"]);
    }
    const p = e.parameter || {};
    const phone = String(p.phone || "").replace(/\D/g, "");
    const wa = phone ? "https://wa.me/972" + phone.replace(/^0/, "") : "";
    sheet.appendRow([
      new Date(),
      String(p.name || "").slice(0, 100),
      "'" + phone,               // keeps the leading 0
      wa,
      String(p.count || ""),
      String(p.shuttle || ""),
      String(p.page || ""),
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("OK");
}
