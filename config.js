/* ===== NEO-CITY · Cấu hình nơi lưu bảng xếp hạng =====
   Chọn MỘT trong các cách sau (xem HUONG-DAN-TRIEN-KHAI.md):
   1. Google Sheets  → dán URL Apps Script (…/exec) vào sheets.scriptUrl
   2. Firebase       → dán cấu hình vào firebase
   3. Máy tính trong lớp → chạy `node server.js`, KHÔNG cần sửa file này
   Để trống tất cả = bảng xếp hạng chỉ chạy thử trên 1 máy. */
window.NEO_CONFIG = {
  sheets: {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbzYxf6uDrBvEOTQbPmBvdK3gvb51KaluxuLp5v5MP3pdRcmdOsRPmwx44W-rSCsvqKSKg/exec',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1cNVZhNY_Dx3Lxe2Ndk2mNAjRF962ZuzwhwIag65xAp8/edit?usp=sharing'  // link mở bảng tính để thầy cô xem
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
