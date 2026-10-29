# NEO-CITY · Hướng dẫn triển khai cho giáo viên

Tài liệu dành cho thầy cô không chuyên lập trình. Làm lần lượt từng bước là chạy được.

**Tổng quan nhanh**

- Trò chơi là **trang web tĩnh** (các tệp `.html`, `.js`, `.css`).
  - `index.html` – trang giáo viên, chiếu lên máy chiếu: mã QR tham gia + bảng xếp hạng trực tiếp.
  - `play.html` – trang học sinh chơi trên điện thoại.
- Cần lo **2 việc**: (1) **đưa game lên web** để điện thoại mở được, (2) **chọn nơi lưu điểm** để gom bảng xếp hạng.
- Điện thoại chỉ cho bật camera (quét mã trạm trong game) khi trang chạy bằng **`https://`**.
- Chưa cấu hình nơi lưu điểm thì bảng xếp hạng hiện **"CHẠY THỬ 1 MÁY"** (chỉ thấy điểm trên chính máy đó).

---

## A. Chọn cách triển khai

| | Cách | Đưa game lên web | Lưu điểm | Ghi chú |
|---|---|---|---|---|
| 1 | ⭐ **Khuyên dùng** | GitHub Pages (mục B) | Google Sheets (mục C) | Miễn phí, có HTTPS, điểm nằm trong bảng tính xem như Excel. Hợp 1 đến vài lớp chơi cùng lúc. |
| 2 | **Không cần Internet ổn định** | Máy tính giáo viên chạy `node server.js` trong mạng LAN (mục D) | File `data/xep-hang.csv` (mở bằng Excel) và `data/xep-hang.json` trong thư mục `neo-city` | Không có HTTPS. Phông chữ và thư viện QR vẫn cần Internet (xem hạn chế ở mục D). |
| 3 | **Cả trường chơi cùng lúc** | Firebase Hosting (mục E) | Firebase Firestore (mục E) | Chịu tải lớn, miễn phí trong hạn mức. Cần cài công cụ dòng lệnh. |

Dù chọn cách nào, nút **"⬇ Tải Excel"** trên trang giáo viên luôn tải được bảng xếp hạng thành tệp CSV mở bằng Excel.

---

## B. Đưa game lên web bằng GitHub Pages

GitHub Pages chỉ **chứa trang web** (có HTTPS). Điểm phải lưu ở Google Sheets (mục C) hoặc Firebase (mục E).

**Bước 1 – Tạo kho chứa**

1. Vào https://github.com, đăng ký tài khoản miễn phí.
2. Bấm **New repository** (dấu `+` góc trên phải).
3. Repository name: `neo-city`. Chọn **Public**. Bấm **Create repository**.

**Bước 2 – Tải tệp lên** (chọn một cách)

*Cách 1 – Không cần git:*

1. Trong trang repository vừa tạo, bấm **uploading an existing file**.
2. Mở thư mục `neo-city` trên máy, chọn **toàn bộ tệp** rồi kéo thả vào trang.
3. Bấm **Commit changes**.

*Cách 2 – Bằng git* (mở Command Prompt trong thư mục `neo-city`):

```bash
git init
git add .
git commit -m "NEO-CITY"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/neo-city.git
git push -u origin main
```

**Bước 3 – Bật GitHub Pages**

1. Vào **Settings › Pages**.
2. Source: **Deploy from a branch**. Branch: **`main`**, thư mục **`/ (root)`** → **Save**.
3. Chờ 1–2 phút. Link trò chơi: `https://<tài-khoản>.github.io/neo-city/index.html`

**Cập nhật khi sửa tệp:** sửa xong thì tải đè tệp lên (Cách 1), hoặc chạy:

```bash
git add .
git commit -m "Cap nhat noi dung"
git push
```

*Khác:* Netlify Drop (https://app.netlify.com/drop) – kéo thả cả thư mục `neo-city` là có link HTTPS ngay, không cần tài khoản GitHub.

---

## C. Lưu bảng xếp hạng bằng Google Sheets (dễ nhất, xem như Excel)

1. Vào https://sheets.google.com, tạo **Bảng tính trống**. Đặt tên, ví dụ `NEO-CITY Xếp hạng`.
2. Menu: **Tiện ích mở rộng › Apps Script**.
3. **Xóa hết** đoạn code mẫu.
4. Mở tệp `google-apps-script.gs` (trong thư mục `neo-city`) bằng Notepad. Sao chép **toàn bộ** và dán vào.
5. Bấm **Lưu** (biểu tượng đĩa mềm).
6. Bấm **Triển khai › Tùy chọn triển khai mới**:
   - Bánh răng › chọn loại **Ứng dụng web**.
   - **Thực thi dưới dạng:** `Tôi`.
   - **Người có quyền truy cập:** `Bất kỳ ai`.
   - Bấm **Triển khai**.
7. **Cấp quyền** → chọn tài khoản của mình.
   - Nếu Google cảnh báo "chưa xác minh": bấm **Nâng cao › Đi tới … (không an toàn)** → **Cho phép**. Đây là code của chính thầy cô.
8. Sao chép **URL ứng dụng web** (đuôi **`/exec`**).
9. Mở `config.js` bằng Notepad, dán vào phần `sheets`:

   ```js
   sheets: {
     scriptUrl: 'https://script.google.com/macros/s/AKfy...xyz/exec',
     sheetUrl:  'https://docs.google.com/spreadsheets/d/1AbC...xyz/edit'
   }
   ```

   - `scriptUrl`: URL ở bước 8 (bắt buộc).
   - `sheetUrl`: link bảng tính (không bắt buộc, để mở nhanh từ trang giáo viên).
   - Để **trống** `firebase.apiKey`.
10. Lưu `config.js`, rồi tải lại lên GitHub (mục B).

Trang tính **`XepHang`** tự được tạo khi có điểm đầu tiên.

> **Khi sửa code Apps Script:** vào **Triển khai › Quản lý các bản triển khai › Chỉnh sửa (bút chì) › Phiên bản: Phiên bản mới › Triển khai**. Nếu không, Google vẫn chạy code cũ. URL `/exec` giữ nguyên.

> **Giới hạn:** bảng xếp hạng làm mới khoảng 5–10 giây/lần. Apps Script có hạn mức (tối đa khoảng 30 yêu cầu cùng lúc), nên hợp **1 lớp đến vài lớp** chơi cùng lúc. Cả trường chơi cùng lúc → dùng Firebase (mục E).

---

## D. Chạy trong mạng LAN bằng máy tính giáo viên (`server.js`)

Máy tính giáo viên làm máy chủ. Điểm lưu thành file ngay trong thư mục `neo-city/data/`.

1. Cài **Node.js** bản **LTS** tại https://nodejs.org (bấm Next liên tục).
2. Mở thư mục `neo-city` trong File Explorer. Bấm vào **thanh địa chỉ**, gõ `cmd`, Enter.
3. Trong cửa sổ đen, gõ:

   ```bash
   node server.js
   ```

   - Mặc định dùng cổng 8080. Muốn đổi cổng: `node server.js 3000`.
4. Cửa sổ in ra địa chỉ dạng `http://192.168.x.x:8080/index.html`. Mở địa chỉ đó trên máy chiếu (**không dùng `localhost`**).
5. Nếu **Windows Firewall** hỏi: tích **Private networks** → **Allow access**.
6. Điện thoại học sinh phải bắt **cùng mạng Wi-Fi** với máy tính.
7. **Không cần sửa `config.js`** (để trống `sheets` và `firebase`) – game tự nhận máy chủ.
8. Giữ cửa sổ đen mở suốt buổi chơi. Đóng cửa sổ = tắt máy chủ.

**Xem điểm:**

- Dữ liệu nằm trong `neo-city/data/`: `xep-hang.csv` (mở bằng Excel) và `xep-hang.json`.
- Đang chơi mà muốn xem: **sao chép** `xep-hang.csv` ra chỗ khác rồi mới mở, để Excel không khóa file.

**Hạn chế:**

- Không có HTTPS → camera trong game không bật. Ở chế độ Trạm QR, học sinh quét mã trạm bằng **app Camera** của điện thoại.
- Phông chữ và thư viện tạo QR tải từ Internet. Mất mạng: game vẫn chạy (phông chữ dự phòng) nhưng trang giáo viên **không tạo được mã QR**. Nên có Internet lúc mở trang giáo viên.

---

## E. Firebase (tùy chọn, cho cả trường)

Gói miễn phí **Spark** đủ cho cả trường: khoảng **50.000 lượt đọc và 20.000 lượt ghi mỗi ngày** (con số tham khảo – kiểm tra hạn mức hiện tại tại https://firebase.google.com/pricing). Link trò chơi dạng `https://<tên-dự-án>.web.app`.

1. **Tạo dự án:** vào https://console.firebase.google.com → **Tạo dự án** → đặt tên → **tắt Google Analytics** → Tạo.
2. **Thêm Web app:** bấm biểu tượng **`</>`** → đặt tên → Đăng ký. Sao chép `firebaseConfig` vào `config.js`:

   ```js
   firebase: {
     apiKey: 'AIzaSyA...xyz',
     authDomain: 'neo-city-thcs-abc.firebaseapp.com',
     projectId: 'neo-city-thcs-abc',
     storageBucket: 'neo-city-thcs-abc.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abc123'
   }
   ```

3. **Tạo Firestore:** **Build › Firestore Database › Tạo cơ sở dữ liệu** → vị trí **`asia-southeast1 (Singapore)`** → **Production mode** → Tạo.
4. **Cài công cụ và đưa lên web** (Command Prompt):

   ```bash
   npm install -g firebase-tools
   firebase login
   cd C:\Users\HP\Downloads\AMZ\VKer\neo-city
   firebase use --add
   firebase deploy
   ```

   - `firebase use --add`: chọn dự án, đặt tên gọi `default`.
   - `firebase deploy` gửi cả trang web và luật bảo vệ `firestore.rules`.
   - *Không muốn cài gì:* vào **Firestore Database › tab Rules**, dán toàn bộ nội dung `firestore.rules` → **Publish**. Trang web thì đặt ở GitHub Pages (mục B).
5. Mở `https://<tên-dự-án>.web.app/index.html` trên máy chiếu.

---

## F. Tổ chức buổi chơi

1. Mở `index.html` trên máy chiếu.
2. Ô **"Địa chỉ website"**: thường để mặc định. Chỉ sửa khi mã QR cần trỏ tới địa chỉ khác.
3. **Phiên chơi:** mỗi phiên có **mã phiên** riêng. Bấm **"Phiên mới"** cho mỗi lớp/mỗi buổi để bảng xếp hạng bắt đầu lại.
4. Chọn chế độ:
   - **🗺 Tự do:** chơi lần lượt 7 ải ngay trên điện thoại.
   - **📷 Trạm QR:** phải đến trạm quét mã mới mở ải (thứ tự bất kỳ).
5. Chế độ Trạm QR: bấm **"🖨 In mã trạm"**, in và dán 7 mã ở 7 vị trí trong lớp/sân trường.
6. Học sinh quét **mã QR tham gia** trên màn chiếu, nhập tên, lớp, chọn avatar rồi chơi.
7. Bấm **"⛶ Toàn màn hình"** để trình chiếu bảng xếp hạng.
8. Bấm **"⬇ Tải Excel"** để lưu kết quả.

**Cách tính điểm:**

**Điểm mỗi ải = Điểm tối đa × Hệ số thời gian × Hệ số mạng** (không có điểm cộng sẵn).

| Thành phần | Giá trị |
|---|---|
| Điểm tối đa | 250 mỗi ải, trùm cuối 350 (tổng tối đa 1850) |
| Hệ số thời gian | ×1.00 nếu xong trong "thời gian vàng", giảm dần đến ×0.20 khi quá chậm |
| Hệ số mạng | 0.6 + 0.4 × (mạng còn lại ÷ mạng tối đa) → đủ mạng ×1.00 |

| Ải | Thời gian vàng (×1.00) | Chậm nhất (×0.20) |
|---|---|---|
| 1 Cổng trường · 2 Phòng Tin học · 3 Bảng tin | 0:30–0:40 | 2:30 |
| 4 Phòng STEM · 6 Hộp thư | 1:00 | 5:00 |
| 5 Thư viện số | 0:45 | 3:00 |
| 7 Phòng Máy Chủ | 1:30 | 5:00 |

- Chơi lại một ải hoặc "Chơi lại từ đầu": chỉ giữ **điểm cao nhất** của từng ải, **không cộng dồn**. Điểm tổng không bao giờ giảm.
- Bằng điểm: ai phá đảo sớm hơn xếp trên.

---

## G. Sửa nội dung

- Câu hỏi, tin tức, lời chúc, cốt truyện nằm trong **`data.js`**. Mở bằng Notepad (hoặc VS Code).
- Chỉ sửa chữ trong dấu nháy. Giữ nguyên dấu phẩy, dấu ngoặc.
- Sửa xong thì đưa lại lên web:
  - GitHub Pages: tải đè tệp hoặc `git add .` → `git commit -m "..."` → `git push`.
  - Firebase Hosting: `firebase deploy --only hosting`.
  - `server.js`: chỉ cần tải lại trang.
- Điện thoại có thể cần **tải lại trang** (hoặc chờ vài phút) mới thấy nội dung mới.

---

## H. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách khắc phục |
|---|---|---|
| Quét QR không mở được game | Trang giáo viên mở bằng `localhost` hoặc `file://` | Mở bằng link HTTPS (mục B) hoặc địa chỉ IP do `server.js` in ra (mục D) |
| Camera trong game không bật | Không phải HTTPS, hoặc chưa cấp quyền camera | Dùng link `https://`; bấm "Cho phép" khi được hỏi; kiểm tra quyền camera của trình duyệt. Chạy LAN thì quét trạm bằng app Camera |
| Bảng xếp hạng báo **"CHẠY THỬ 1 MÁY"** | Chưa dán cấu hình vào `config.js`, hoặc chưa đưa bản mới lên web | Làm mục C hoặc E, rồi cập nhật lên web |
| **Google Sheets không nhận điểm** | Chưa chọn "Bất kỳ ai"; dùng nhầm URL đuôi `/dev` thay vì `/exec`; sửa code mà chưa tạo phiên bản mới | Xem lại mục C bước 6, 8 và lưu ý "Khi sửa code Apps Script" |
| Lỗi **"Missing or insufficient permissions"** | Chưa Publish luật Firestore | Mục E bước 4 |
| **Điện thoại không vào được máy chủ `server.js`** | Khác mạng Wi-Fi; tường lửa Windows chặn; Wi-Fi trường chặn kết nối giữa các thiết bị (client isolation) | Cho điện thoại bắt cùng Wi-Fi; cho phép Node.js trong Windows Firewall (Private); dùng điểm phát Wi-Fi từ điện thoại hoặc router riêng |
| Excel báo file `xep-hang.csv` đang bị khóa / điểm không ghi | Đang mở trực tiếp file trong lúc chơi | Đóng Excel; lần sau sao chép file ra chỗ khác rồi mới mở |
| Điện thoại cũ không chạy | Trình duyệt quá cũ | Cập nhật Chrome/Safari; cho học sinh chơi theo nhóm trên máy khác |

---

## I. Bảo mật và quyền riêng tư

- Game chỉ lưu: **tên hiển thị, lớp, avatar, điểm** và thời gian chơi. Không lưu email, số điện thoại.
- Nếu trường yêu cầu, hướng dẫn học sinh **không nhập họ tên đầy đủ** (dùng biệt danh hoặc tên + chữ cái đầu).
- Google Sheets: bảng tính thuộc tài khoản của thầy cô. Học sinh chỉ gửi điểm qua Apps Script, **không** mở được bảng tính nếu thầy cô không chia sẻ.
- `server.js`: dữ liệu chỉ nằm trên máy tính giáo viên.
- Firebase: cấu hình trong `config.js` **công khai theo thiết kế**. Dữ liệu được bảo vệ nhờ `firestore.rules`: chỉ cho ghi đúng dạng bản ghi điểm, điểm không giảm, không ai xóa được.
- Kho GitHub ở chế độ Public: mọi người xem được mã nguồn và câu hỏi trong `data.js`. Không đưa thông tin riêng tư vào các tệp.
- Kết thúc đợt chơi có thể xóa dữ liệu: xóa dòng trong Google Sheets, xóa thư mục `data/`, hoặc xóa collection `players` trong Firebase Console.
