/* ===== NEO-CITY · Lưu bảng xếp hạng vào Google Sheets =====
   Cách dùng (chi tiết trong HUONG-DAN-TRIEN-KHAI.md):
   1. Tạo Google Sheet mới → Tiện ích mở rộng → Apps Script
   2. Xóa code mẫu, dán toàn bộ file này → Lưu
   3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web
      Thực thi dưới dạng: Tôi · Người có quyền truy cập: Bất kỳ ai → Triển khai
   4. Copy URL ứng dụng web (…/exec) dán vào config.js → sheets.scriptUrl
   Trang tính "XepHang" sẽ được tạo tự động. */

const SHEET = 'XepHang';
const KEYS = ['room', 'pid', 'name', 'cls', 'avatar', 'score', 'done', 'finished', 'finishedAt', 'updatedAt'];
const HEAD = ['Phiên', 'Mã HS', 'Tên', 'Lớp', 'Avatar', 'Điểm', 'Số ải đã qua', 'Phá đảo', 'Phá đảo lúc (ms)', 'Cập nhật (ms)', 'Cập nhật lúc'];

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#0d0624').setFontColor('#00f0ff');
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Chặn tên bắt đầu bằng = + - @ bị hiểu thành công thức */
function safe_(s, max) {
  s = String(s == null ? '' : s).slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doGet(e) {
  const room = String((e && e.parameter && e.parameter.room) || '');
  const v = sheet_().getDataRange().getValues();
  const list = [];
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) !== room) continue;
    const o = {};
    KEYS.forEach((k, j) => { o[k] = v[i][j]; });
    o.name = String(o.name).replace(/^'/, '');
    o.score = Number(o.score) || 0;
    o.done = Number(o.done) || 0;
    o.finished = o.finished === true || o.finished === 'TRUE' || o.finished === 'Có';
    o.finishedAt = o.finishedAt ? Number(o.finishedAt) : null;
    o.updatedAt = Number(o.updatedAt) || 0;
    list.push(o);
  }
  return json_({ ok: true, list: list });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = JSON.parse(e.postData.contents);
    const score = Math.max(0, Math.min(2000, Math.floor(Number(p.score) || 0)));
    const room = safe_(p.room, 20), pid = safe_(p.pid, 40);
    if (!room || !pid || !p.name) return json_({ ok: false, error: 'Thiếu dữ liệu' });
    const now = Date.now();
    const row = [room, pid, safe_(p.name, 24), safe_(p.cls, 10), safe_(p.avatar, 8), score,
      Math.max(0, Math.min(7, Math.floor(Number(p.done) || 0))), p.finished ? 'Có' : 'Không',
      p.finishedAt ? Number(p.finishedAt) : '', now,
      Utilities.formatDate(new Date(now), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss')];

    const sh = sheet_();
    const v = sh.getDataRange().getValues();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][0]) === room && String(v[i][1]) === pid) {
        if (Number(v[i][5]) > score) row[5] = Number(v[i][5]);   // điểm không bao giờ giảm
        sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
        return json_({ ok: true });
      }
    }
    sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
