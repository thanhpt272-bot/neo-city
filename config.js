/* ===== NEO-CITY · Cấu hình nơi lưu bảng xếp hạng =====
   Chọn MỘT trong các cách sau (xem HUONG-DAN-TRIEN-KHAI.md):
   1. Google Sheets  → dán URL Apps Script (…/exec) vào sheets.scriptUrl
   2. Firebase       → dán cấu hình vào firebase
   3. Máy tính trong lớp → chạy `node server.js`, KHÔNG cần sửa file này
   Để trống tất cả = bảng xếp hạng chỉ chạy thử trên 1 máy. */
window.NEO_CONFIG = {
  sheets: {
    scriptUrl: '',   // VD: 'https://script.google.com/macros/s/AKfy.../exec'
    sheetUrl: ''     // (tùy chọn) link mở bảng tính để thầy cô xem
  },
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
};
