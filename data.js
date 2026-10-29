/* ===== NEO-CITY · Dữ liệu trò chơi (dùng chung cho play.html và index.html) ===== */

const AVATARS = ['🤖', '🦊', '🐼', '🦉', '🐯', '👾', '🐉', '🦄'];

const LEVELS = [
  {
    id: 1, key: 'NC-GATE-01', type: 'quiz', icon: '🏫', color: '#00f0ff', hearts: 3,
    name: 'Cổng Trường Thông Minh', area: 'Hiểu đúng về chuyển đổi số',
    story: 'Sáng thứ Hai, cổng điểm danh nhận diện khuôn mặt bỗng khóa chặt, cả trường đứng ngoài! GLITCH đã cài mật mã: chỉ học sinh hiểu đúng về chuyển đổi số mới mở được cổng vào lớp.',
    mission: 'Trả lời 5 câu hỏi về chuyển đổi số để mở 5 ổ khóa cổng. Sai quá 2 câu là bị chặn lại.',
    lesson: 'Chuyển đổi số không phải là có thật nhiều máy móc. Đó là dùng công nghệ để học tốt hơn và sống tốt hơn mỗi ngày.'
  },
  {
    id: 2, key: 'NC-PASS-02', type: 'password', icon: '🔐', color: '#ff2bd6', hearts: 3,
    name: 'Phòng Tin Học', area: 'Bảo vệ tài khoản học tập',
    story: 'GLITCH đang dò mật khẩu tài khoản học tập của toàn trường, mỗi giây hàng tỷ lần! Phòng Tin học cần em tạo một "mật khẩu mẫu" thật mạnh để hướng dẫn các bạn cùng khóa tài khoản.',
    mission: 'Tạo mật khẩu thỏa đủ 6 điều kiện an toàn để khóa lại hệ thống tài khoản học tập.',
    lesson: 'Mật khẩu là chìa khóa "ngôi nhà số" của em: dài, đa dạng ký tự, không chia sẻ cho ai, mỗi tài khoản một mật khẩu riêng.'
  },
  {
    id: 3, key: 'NC-NEWS-03', type: 'swipe', icon: '📰', color: '#f9f871', hearts: 2,
    name: 'Bảng Tin Học Đường', area: 'Nhận diện tin giả',
    story: 'Bảng tin điện tử và nhóm chat các lớp tràn ngập tin giả do GLITCH tung ra: "mai được nghỉ học", "đề thi bị lộ"… Các bạn đang hoang mang! Em hãy lọc lại bảng tin cho cả trường.',
    mission: 'Vuốt 6 thẻ tin: sang PHẢI nếu là tin thật, sang TRÁI nếu là tin giả. Chỉ được sai 1 lần.',
    lesson: 'Trước khi chia sẻ: Dừng lại, kiểm tra nguồn, hỏi thầy cô. Đừng để mình thành "cái loa" cho tin giả.'
  },
  {
    id: 4, key: 'NC-BOT-04', type: 'robot', icon: '🤖', color: '#39ff88', hearts: 3,
    name: 'Phòng STEM', area: 'Tư duy thuật toán',
    story: 'Robot giao sách của CLB STEM, tiết mục chính của Ngày hội Chuyển đổi số, bị GLITCH xóa sạch bộ nhớ và hết pin. Em cần lập trình lại từng bước để robot nhặt pin và về trạm sạc kịp giờ trình diễn.',
    mission: 'Lập trình robot nhặt ⚡ pin rồi về 🏁 trạm sạc. Né tường, dùng 🔑 mở 🚪 cửa, canh lúc tia laser TẮT mới đi qua (lệnh ⏸ chờ). Chạm vào lệnh để lặp ×2, ×3.',
    lesson: 'Lập trình là chia việc lớn thành các bước nhỏ, rõ ràng, đúng thứ tự. Đó chính là tư duy thuật toán, dùng được cả khi học bài!'
  },
  {
    id: 5, key: 'NC-BIT-05', type: 'binary', icon: '💾', color: '#8b5cf6', hearts: 3,
    name: 'Thư Viện Số', area: 'Máy tính hiểu dữ liệu thế nào',
    story: 'Hàng nghìn sách điện tử và bài giảng số của Thư viện trường bị GLITCH khóa bằng mã nhị phân 0 và 1, đúng ngôn ngữ của máy tính. Hãy mở 3 lớp khóa để các bạn được đọc sách trở lại!',
    mission: 'Bật/tắt các bit để tổng giá trị bằng số mục tiêu. Mở đủ 3 lớp khóa.',
    lesson: 'Mọi chữ, hình ảnh, video bài giảng đều được máy tính lưu bằng các bit 0 và 1. Hiểu máy tính là bước đầu để làm chủ máy tính.'
  },
  {
    id: 6, key: 'NC-MAIL-06', type: 'phishing', icon: '🎣', color: '#ff8a3d', hearts: 3,
    name: 'Hộp Thư Lớp Học', area: 'Phòng chống lừa đảo trực tuyến',
    story: 'GLITCH gửi email và tin nhắn Zalo giả danh nhà trường, thầy cô tới mọi lớp để lừa lấy tài khoản, tiền của học sinh. Bẫy lần này rất tinh vi – em hãy soi thật kỹ từng chi tiết!',
    mission: 'Soi 3 tin nhắn (email + Zalo), chạm đúng mọi dấu hiệu lừa đảo. Cẩn thận chỗ trông đáng ngờ nhưng an toàn – chạm nhầm sẽ mất mạng.',
    lesson: 'Nhà trường không bao giờ xin mật khẩu hay mã OTP qua email. Thấy nghi ngờ thì báo ngay cho thầy cô.'
  },
  {
    id: 7, key: 'NC-CORE-07', type: 'boss', icon: '👾', color: '#ff3864', hearts: 3, boss: true,
    name: 'Phòng Máy Chủ', area: 'Giải cứu trợ lý AI BIT',
    story: 'Em đã giải phóng 6 khu vực! GLITCH đang khống chế BIT trong Phòng Máy Chủ. Nó có 2 dạng – khi bị dồn ép, GLITCH sẽ hóa CUỒNG NỘ với câu hỏi khó hơn và đòn đánh nhanh hơn. Hãy tấn công và đỡ đòn thật chuẩn!',
    mission: 'Hạ 2 phase của GLITCH (mỗi phase 5 máu): trả lời Đúng/Sai, chọn đáp án, bắn virus, canh nhịp nạp năng lượng; đỡ các chiêu Mưa mã độc, Tia lừa đảo, Khóa màn hình.',
    lesson: 'AI là trợ lý mạnh mẽ khi người dùng có hiểu biết, trung thực và có trách nhiệm. Em chính là người làm chủ công nghệ!'
  }
];

/* Ải 1 – đáp án đúng luôn ở vị trí đầu tiên (trò chơi tự xáo trộn) */
const QUIZ = [
  { q: '"Chuyển đổi số" được hiểu đúng nhất là gì?',
    o: ['Thay đổi cách học tập, làm việc, sinh hoạt dựa trên công nghệ số và dữ liệu', 'Chỉ là mua thật nhiều máy tính mới', 'Chụp ảnh tất cả sách giấy lưu vào điện thoại', 'Cho học sinh chơi game nhiều hơn'],
    e: 'Chuyển đổi số là thay đổi toàn diện cách chúng ta sống, học và làm việc nhờ công nghệ số – không chỉ là mua thiết bị.' },
  { q: 'Muốn làm thủ tục hành chính trực tuyến (không cần xếp hàng), em dùng nền tảng nào?',
    o: ['Cổng Dịch vụ công quốc gia / ứng dụng VNeID', 'Ứng dụng chỉnh sửa ảnh', 'Trang web bán hàng', 'Ứng dụng nghe nhạc'],
    e: 'Cổng Dịch vụ công quốc gia và VNeID giúp người dân làm thủ tục online nhanh chóng.' },
  { q: '"IoT – Internet of Things" nghĩa là gì?',
    o: ['Internet vạn vật: đồ vật kết nối mạng và trao đổi dữ liệu', 'Một loại virus máy tính', 'Mạng xã hội dành cho học sinh', 'Tên một trò chơi điện tử'],
    e: 'IoT là đèn, camera, cảm biến… kết nối Internet để tự động hóa – ví dụ nhà thông minh, vườn tưới tự động.' },
  { q: 'Thanh toán bằng cách quét mã QR ở căng-tin trường là ví dụ của:',
    o: ['Chuyển đổi số trong kinh tế – thanh toán không dùng tiền mặt', 'Một trò ảo thuật', 'Việc lãng phí điện thoại', 'Hoạt động bị cấm ở mọi nơi'],
    e: 'Thanh toán số nhanh, minh bạch. Nhớ kiểm tra tên người nhận trước khi chuyển tiền!' },
  { q: 'Sổ liên lạc điện tử và học bạ số mang lại lợi ích gì?',
    o: ['Thầy cô, phụ huynh theo dõi kết quả học tập nhanh và chính xác', 'Giúp học sinh tự sửa điểm dễ dàng', 'Không có lợi ích gì', 'Chỉ dùng được vào cuối năm'],
    e: 'Dữ liệu học tập số giúp nhà trường – gia đình kết nối kịp thời, minh bạch.' },
  { q: 'Học sinh nên sử dụng trí tuệ nhân tạo (AI) như thế nào?',
    o: ['Làm trợ lý để giải thích, gợi ý – rồi tự suy nghĩ và kiểm chứng', 'Chép nguyên câu trả lời của AI để nộp bài', 'Tin tuyệt đối mọi điều AI nói', 'Tuyệt đối không được tìm hiểu về AI'],
    e: 'AI là công cụ hỗ trợ học tập. Em cần tư duy, kiểm chứng và trung thực khi dùng AI.' },
  { q: '"Dữ liệu lớn" (Big Data) được dùng để làm gì?',
    o: ['Phân tích lượng dữ liệu khổng lồ để dự báo, ra quyết định tốt hơn', 'Làm đầy bộ nhớ điện thoại', 'Tạo ra thật nhiều quảng cáo', 'Xóa hết thông tin cá nhân'],
    e: 'Ví dụ: phân tích dữ liệu giao thông để giảm kẹt xe, dự báo thời tiết chính xác hơn.' },
  { q: 'Đâu là "danh tính số" của em?',
    o: ['Tài khoản, thông tin và dấu vết của em trên môi trường mạng', 'Chiều cao và cân nặng của em', 'Số nhà của em', 'Màu áo em thích nhất'],
    e: 'Danh tính số cần được bảo vệ như danh tính thật: mật khẩu mạnh, không chia sẻ thông tin cá nhân bừa bãi.' }
];

/* Ải 3 */
const NEWS = [
  { src: '💬 Nhóm chat lớp 8A', t: 'NÓNG: Ngày mai toàn trường được nghỉ học, nghe nói thầy hiệu trưởng vừa nhắn vậy! Share cho cả khối đi!', real: false,
    e: 'Thông báo nghỉ học chỉ có giá trị khi đến từ kênh chính thức (website, sổ liên lạc điện tử, GVCN). "Nghe nói" không phải là nguồn tin.' },
  { src: '📲 Tài khoản lạ', t: 'Lộ đề thi học kỳ môn Toán! Chuyển 50.000đ để nhận file đề kèm đáp án.', real: false,
    e: 'Lừa đảo nhắm vào học sinh: vừa mất tiền, vừa vi phạm quy chế thi. Hãy báo cho thầy cô.' },
  { src: '📘 Sổ liên lạc điện tử', t: 'Nhà trường thông báo: Ngày hội Chuyển đổi số tổ chức sáng thứ Bảy tại sân trường.', real: true,
    e: 'Thông báo từ kênh chính thức của trường là nguồn tin đáng tin cậy.' },
  { src: '📱 Nhóm Zalo "Sức khỏe vàng"', t: 'Uống nước chanh nóng chữa khỏi MỌI loại virus chỉ trong 1 ngày!!! Chia sẻ ngay kẻo muộn!', real: false,
    e: 'Không có "thần dược" chữa mọi bệnh. Giật gân, nhiều dấu chấm than, giục chia sẻ → dấu hiệu tin giả.' },
  { src: '🌐 moet.gov.vn', t: 'Bộ GD&ĐT công bố lịch thi chính thức trên cổng thông tin điện tử của Bộ.', real: true,
    e: 'Tin từ trang .gov.vn chính thức của cơ quan nhà nước là nguồn đáng tin cậy.' },
  { src: '💬 Tin nhắn lạ', t: 'Chúc mừng! Số điện thoại của bạn trúng iPhone 17. Chuyển 200.000đ phí nhận quà để nhận ngay.', real: false,
    e: 'Trúng thưởng mà bắt chuyển tiền trước = chiêu lừa đảo kinh điển!' },
  { src: '🛡️ Trung tâm An ninh mạng', t: 'Bật xác thực 2 lớp (2FA) giúp tài khoản an toàn hơn kể cả khi lộ mật khẩu.', real: true,
    e: '2FA thêm một lớp bảo vệ – kẻ gian có mật khẩu cũng khó đăng nhập.' },
  { src: '🎬 Video lan truyền', t: 'Người nổi tiếng kêu gọi đầu tư tiền ảo, cam kết lãi 300% mỗi tháng!', real: false,
    e: 'Rất có thể là video deepfake do AI tạo ra. Lãi "khủng" bất thường = lừa đảo.' },
  { src: '👍 Bài đăng Facebook', t: 'Chia sẻ bài này 10 lần, Facebook sẽ tặng bạn 1 triệu đồng vào tài khoản!', real: false,
    e: 'Mạng xã hội không tặng tiền vì bạn chia sẻ bài. Đây là chiêu câu tương tác.' },
  { src: '🏫 Website nhà trường', t: 'Nhà trường triển khai nộp bài tập qua hệ thống học tập trực tuyến (LMS).', real: true,
    e: 'Nhiều trường đang chuyển đổi số với LMS – thông tin từ website chính thức của trường.' },
  { src: '🏦 Cảnh báo ngân hàng', t: 'Mã QR thanh toán có thể bị dán đè – hãy kiểm tra tên người nhận trước khi chuyển tiền.', real: true,
    e: 'Cảnh báo có thật và rất hữu ích – luôn kiểm tra tên tài khoản nhận.' },
  { src: '📸 Ảnh "siêu hiếm"', t: 'Ảnh cá mập bơi trên phố sau cơn mưa lớn – ảnh thật 100%!', real: false,
    e: 'Ảnh ghép hoặc do AI tạo. Hãy tìm kiếm ngược hình ảnh (Google Lens) để kiểm chứng.' }
];

/* Ải 4 (bản 7x7) – S: xuất phát, B: ⚡ pin, K: 🔑 chìa khóa, D: 🚪 cửa khóa,
   Z: cổng laser (BẬT ở bước chẵn, TẮT ở bước lẻ), G: 🏁 trạm sạc, #: tường.
   2 đường: lấy chìa mở cửa (dài) hoặc canh giờ qua laser (ngắn, cần ⏸ chờ). */
const ROBOT_LEVEL = {
  map: [
    'S..K#..',
    '##.##.#',
    '...B...',
    '.###.#.',
    '...###Z',
    '##..D..',
    '...#.#G'
  ],
  max: 20,
  hint: '3 lệnh đầu: ➡×2 ⬇×2 ➡ (nhặt ⚡). Đường laser ngắn hơn đường 🚪 nhưng phải canh giờ!'
};

/* Ải 6 – Hộp thư gồm 3 tin nhắn chơi lần lượt.
   Mỗi dòng (row) có k = loại dòng, s = danh sách đoạn (segment).
   Đoạn: t = chữ hiển thị (văn bản thường, sẽ được escape),
         f = giải thích dấu hiệu lừa đảo (đoạn là "cờ đỏ" cần tìm),
         d = giải thích vì sao chỗ này AN TOÀN (bẫy: chạm vào sẽ mất mạng),
         link = hiển thị dạng đường link, href = link thật (xem khi giữ/bấm "Xem link thật"),
         sub = chữ phụ (dung lượng tệp…), cls = class phụ.
   Loại dòng: email → meta (lbl), p, att (tệp đính kèm), qr; chat → time, bub (bong bóng). */
const MAIL = [
  {
    kind: 'email', app: '📧 Thư đến', label: 'Email “Bảng điểm học kì I”',
    rows: [
      { k: 'meta', lbl: 'Từ:', s: [
        { t: 'Phòng Đào tạo THCS Neo-City' },
        { t: '<daotao@thcs-neoclty.edu.vn>', f: 'Tên miền nhái: "neoclty" (chữ l) thay cho "neocity" (chữ i). Tên miền thật của trường là thcs-neocity.edu.vn.' }
      ] },
      { k: 'meta', lbl: 'Đến:', s: [{ t: 'em@thcs-neocity.edu.vn' }] },
      { k: 'meta', lbl: 'Lúc:', s: [{ t: 'Hôm nay, 02:47 sáng', f: 'Gửi lúc 2:47 sáng – nhà trường không gửi thông báo điểm vào nửa đêm.' }] },
      { k: 'meta', lbl: 'Tiêu đề:', s: [{ t: 'Bảng điểm học kì I của em', cls: 'subj' }] },
      { k: 'p', s: [{ t: 'Chào em,', d: 'Lời chào bình thường – một câu chào không phải dấu hiệu lừa đảo.' }] },
      { k: 'p', s: [{ t: 'Nhà trường gửi em bảng điểm học kì I. Em mở tệp đính kèm bên dưới để xem chi tiết điểm từng môn.' }] },
      { k: 'att', s: [{ t: 'Bang_diem_HK1.pdf.exe', sub: '2,1 MB', f: 'Đuôi kép ".pdf.exe": thực chất là chương trình (.exe) có thể chứa mã độc, không phải file PDF.' }] },
      { k: 'p', s: [
        { t: 'Lịch thi học kì II xem tại cổng thông tin: ' },
        { t: 'https://thcs-neocity.edu.vn/lich-thi', link: true, href: 'https://thcs-neocity.edu.vn/lich-thi', d: 'Link này đúng tên miền thật của trường và link thật cũng trùng khớp – an toàn. Kẻ gian hay chèn link thật để tạo lòng tin.' }
      ] },
      { k: 'p', s: [{ t: 'Trân trọng,' }] },
      { k: 'p', s: [{ t: 'Phòng Đào tạo – THCS Neo-City' }] }
    ]
  },
  {
    kind: 'chat', app: 'Zalo', label: 'Tin nhắn Zalo từ “cô chủ nhiệm”',
    name: 'Cô Thu Hương (CN 7A2)', avatar: '👩‍🏫',
    sub: { t: 'Tài khoản mới tạo 2 ngày · 0 bạn chung', f: 'Tài khoản mới tạo, không có bạn chung nhưng xưng là cô chủ nhiệm – dấu hiệu giả danh. Hãy gọi điện hoặc hỏi trực tiếp cô.' },
    rows: [
      { k: 'time', s: [{ t: 'Hôm nay 19:05', d: 'Nhắn tin lúc 7 giờ tối là bình thường, không có gì bất thường.' }] },
      { k: 'bub', s: [{ t: 'Em ơi, cô Hương chủ nhiệm đây 😊' }] },
      { k: 'bub', s: [{ t: 'Cô đang họp nên không nghe máy được, em mua giúp cô 5 thẻ cào Viettel 200k rồi cào ra chụp mã gửi cô nhé, mai cô trả lại.', f: 'Nhờ mua thẻ cào và né nghe điện thoại – chiêu lừa kinh điển. Thầy cô không bao giờ nhờ học sinh mua thẻ cào.' }] },
      { k: 'bub', s: [{ t: 'Nhanh trong 10 phút giúp cô nha, đừng kể với bạn nào kẻo các bạn bì.', f: 'Hối thúc và bắt giữ bí mật để em không kịp hỏi ai – hãy báo ngay bố mẹ, thầy cô.' }] }
    ]
  },
  {
    kind: 'email', app: '📧 Thư đến', label: 'Email “Học bổng Tài Năng Số”',
    rows: [
      { k: 'meta', lbl: 'Từ:', s: [
        { t: 'Ban Giám hiệu THCS Neo-City' },
        { t: '<bgh.thcsneocity.2025@gmail.com>', f: 'Tên hiển thị là "Ban Giám hiệu" nhưng địa chỉ thật là Gmail cá nhân, không phải @thcs-neocity.edu.vn.' }
      ] },
      { k: 'meta', lbl: 'Lúc:', s: [{ t: 'Hôm qua, 16:30', d: 'Gửi lúc 16:30, trong giờ hành chính – thời gian bình thường.' }] },
      { k: 'meta', lbl: 'Tiêu đề:', s: [{ t: 'Chúc mừng em nhận học bổng Tài Năng Số', cls: 'subj' }] },
      { k: 'p', s: [{ t: 'Thân ái chào em, chúc mừng em đã đuợc chọn nhận học bỗng 2.000.000 đồng.', f: 'Sai chính tả ("đuợc", "học bỗng") – văn bản chính thức của trường luôn được kiểm tra kỹ.' }] },
      { k: 'p', s: [
        { t: 'Xem hồ sơ trên Google Drive: ' },
        { t: 'drive.google.com/thcs-neocity/hoc-bong', link: true, href: 'http://drive-google.com.dang-nhap.top/login', f: 'Chữ hiện ra là Google Drive nhưng link thật trỏ tới "drive-google.com.dang-nhap.top" – trang đăng nhập giả để lấy mật khẩu.' }
      ] },
      { k: 'qr', s: [{ t: 'Quét mã QR để nhận học bổng ngay hôm nay', f: 'Mã QR "nhận học bổng" thường dẫn tới trang lừa nhập mật khẩu, tài khoản ngân hàng. Học bổng thật được trao qua nhà trường.' }] },
      { k: 'p', s: [
        { t: 'Thông tin khác xem tại website trường: ' },
        { t: 'https://thcs-neocity.edu.vn', link: true, href: 'https://thcs-neocity.edu.vn', d: 'Đây đúng là website thật của trường, link thật trùng khớp – an toàn.' }
      ] },
      { k: 'p', s: [{ t: 'Ban Giám hiệu' }] }
    ]
  }
];

/* Ải 7 – Trùm cuối. a: đáp án (true = ĐÚNG), e: giải thích.
   BOSS_Q: câu thường (Phase 1). BOSS_Q_HARD: câu khó, nhiều "bẫy" (Phase 2).
   Câu hỏi "Chọn đáp án" được game tự ghép từ 3 câu trong cùng bộ. */
const BOSS_Q = [
  { t: 'AI có thể tạo ra hình ảnh và video giả rất giống thật (deepfake).', a: true, e: 'Đúng! Vì vậy cần kiểm chứng trước khi tin.' },
  { t: 'Đăng số CCCD và địa chỉ nhà lên mạng xã hội là an toàn.', a: false, e: 'Sai! Thông tin cá nhân có thể bị kẻ xấu lợi dụng.' },
  { t: 'Dùng AI làm bài hộ rồi nộp như bài của mình là trung thực.', a: false, e: 'Sai! Hãy dùng AI để học, không phải để gian lận.' },
  { t: 'Nên kiểm tra tin tức từ nhiều nguồn chính thống trước khi chia sẻ.', a: true, e: 'Đúng! Đó là cách chặn tin giả lan truyền.' },
  { t: 'Có thể đọc mã OTP cho người lạ nếu họ tự xưng là nhân viên ngân hàng.', a: false, e: 'Sai! Không bao giờ chia sẻ OTP cho bất kỳ ai.' },
  { t: 'Cập nhật phần mềm thường xuyên giúp vá lỗ hổng bảo mật.', a: true, e: 'Đúng! Bản cập nhật thường sửa các lỗi bảo mật.' },
  { t: 'Bắt nạt qua mạng (cyberbullying) cũng gây tổn thương thật.', a: true, e: 'Đúng! Hãy tử tế trên mạng như ngoài đời.' },
  { t: 'AI luôn đúng 100%, không cần kiểm tra lại.', a: false, e: 'Sai! AI có thể "bịa" thông tin. Luôn kiểm chứng.' },
  { t: 'Chuyển đổi số giúp học sinh học mọi lúc, mọi nơi qua nền tảng trực tuyến.', a: true, e: 'Đúng! Học liệu số giúp em học linh hoạt hơn.' },
  { t: 'Dùng chung một mật khẩu cho tất cả tài khoản là cách an toàn nhất.', a: false, e: 'Sai! Lộ 1 mật khẩu là mất tất cả tài khoản.' },
  { t: 'Khi gặp nội dung xấu trên mạng, em nên báo cho thầy cô hoặc bố mẹ.', a: true, e: 'Đúng! Người lớn tin cậy sẽ giúp em xử lý.' },
  { t: 'Tải nhạc, phim lậu rồi chia sẻ lại cho bạn bè là hợp pháp.', a: false, e: 'Sai! Đó là vi phạm bản quyền, hãy dùng nguồn chính thống.' },
  { t: 'Chia sẻ ảnh chế giễu bạn cùng lớp lên nhóm chat chỉ là đùa vui, không sao cả.', a: false, e: 'Sai! Đó là bắt nạt qua mạng và gây tổn thương thật.' },
  { t: 'Sổ liên lạc điện tử giúp phụ huynh theo dõi việc học của con dễ dàng hơn.', a: true, e: 'Đúng! Đó là một lợi ích của chuyển đổi số trong trường học.' },
  { t: 'Mật khẩu "12345678" đủ mạnh vì có 8 ký tự.', a: false, e: 'Sai! Mật khẩu mạnh cần dài, trộn chữ hoa, chữ thường, số và ký hiệu.' },
  { t: 'Đăng nhập tài khoản học tập trên máy tính chung thì phải đăng xuất khi dùng xong.', a: true, e: 'Đúng! Nếu quên, người sau có thể dùng tài khoản của em.' }
];

const BOSS_Q_HARD = [
  { t: 'Trang web có biểu tượng ổ khóa 🔒 (HTTPS) thì chắc chắn không phải trang lừa đảo.', a: false, e: 'Sai! HTTPS chỉ mã hóa đường truyền. Trang lừa đảo vẫn có thể có ổ khóa.' },
  { t: 'Ảnh có giấy phép Creative Commons BY được dùng miễn phí, miễn là ghi đúng tên tác giả.', a: true, e: 'Đúng! CC BY cho phép dùng lại nếu ghi công tác giả.' },
  { t: 'Ảnh tìm thấy trên Google thì ai cũng được tự do dùng vì nó đã công khai.', a: false, e: 'Sai! Công khai không có nghĩa là hết bản quyền. Hãy kiểm tra giấy phép.' },
  { t: 'Chatbot AI có thể đưa ra tên sách, trích dẫn nghe rất thật nhưng thực ra không tồn tại.', a: true, e: 'Đúng! Hiện tượng "ảo giác AI". Luôn kiểm tra lại nguồn.' },
  { t: 'Video deepfake luôn dễ nhận ra vì giọng nói bị méo như robot.', a: false, e: 'Sai! Deepfake ngày càng giống thật. Hãy để ý khẩu hình, ánh sáng, nguồn đăng.' },
  { t: 'Nhân viên ngân hàng thật có thể gọi điện hỏi mã OTP để "xác minh tài khoản".', a: false, e: 'Sai! Ngân hàng thật không bao giờ hỏi OTP. Ai hỏi OTP là kẻ gian.' },
  { t: 'Mã OTP thường chỉ dùng được một lần và hết hạn sau thời gian ngắn.', a: true, e: 'Đúng! Nhưng vẫn tuyệt đối không đưa OTP cho ai.' },
  { t: 'Duyệt web ở chế độ ẩn danh thì trang web và nhà mạng không biết em đã truy cập gì.', a: false, e: 'Sai! Ẩn danh chỉ không lưu lịch sử trên máy của em.' },
  { t: 'Bấm "Chấp nhận tất cả cookie" có thể cho phép trang web theo dõi thói quen lướt web của em.', a: true, e: 'Đúng! Hãy chọn chỉ cho phép cookie cần thiết khi có thể.' },
  { t: 'Dùng Wi-Fi công cộng, trang HTTPS an toàn hơn HTTP nhưng vẫn nên tránh nhập mật khẩu quan trọng.', a: true, e: 'Đúng! Wi-Fi giả mạo vẫn có thể dẫn em tới trang lừa.' },
  { t: 'Tin nhắn trong nhóm chat "kín" sẽ không bao giờ bị lộ ra ngoài.', a: false, e: 'Sai! Chỉ một người chụp màn hình là tin nhắn bị lan ra.' },
  { t: 'Ứng dụng đèn pin xin quyền đọc danh bạ và tin nhắn là yêu cầu hợp lý.', a: false, e: 'Sai! Quyền không liên quan chức năng là dấu hiệu thu thập dữ liệu.' },
  { t: 'Ảnh chụp bằng điện thoại có thể chứa thông tin vị trí (GPS) nơi em chụp.', a: true, e: 'Đúng! Hãy tắt định vị cho máy ảnh trước khi đăng ảnh.' },
  { t: 'Trích dẫn một đoạn ngắn và ghi rõ nguồn khi làm bài thuyết trình ở lớp là cách dùng hợp lý.', a: true, e: 'Đúng! Ghi nguồn là tôn trọng tác giả.' },
  { t: 'Đã bật xác thực hai lớp (2FA) thì có thể đưa mã xác thực cho bạn thân giữ hộ.', a: false, e: 'Sai! Mã 2FA chỉ mình em được biết, kể cả bạn thân.' },
  { t: 'Nội dung AI tạo ra luôn khách quan vì máy tính không có thiên kiến.', a: false, e: 'Sai! AI học từ dữ liệu của con người nên có thể mang thiên kiến.' },
  { t: 'Bài đăng đã xóa vẫn có thể còn tồn tại do người khác đã chụp hoặc lưu lại.', a: true, e: 'Đúng! Dấu chân số rất khó xóa hoàn toàn.' }
];

const WISHES = [
  'Chúc em luôn là "công dân số" thông thái – dùng công nghệ để học giỏi và sống tử tế!',
  'Mỗi dòng code em viết hôm nay là một viên gạch xây tương lai. Cố lên nhé!',
  'Chúc em học tập tiến bộ, luôn tò mò và dám khám phá thế giới số!',
  'Thông minh trên mạng, tử tế ngoài đời – em làm được!',
  'Chúc em luôn tỉnh táo trước tin giả và lan tỏa thật nhiều điều tích cực.',
  'Mật khẩu mạnh, trái tim ấm – chúc em an toàn trên mọi nền tảng!',
  'Tương lai thuộc về người biết học suốt đời. Chúc em không ngừng "nâng cấp" bản thân!',
  'Chúc em mạnh khỏe, vui vẻ và luôn "online" với ước mơ của mình.',
  'AI là trợ lý, em mới là người chỉ huy. Chúc em làm chủ công nghệ!',
  'Chúc em đạt điểm 10 "full pin" trong mọi bài kiểm tra!',
  'Em chính là phiên bản 2.0 tuyệt vời nhất của chính mình!',
  'Chúc em kết nối thật nhiều bạn tốt – cả trên mạng lẫn ngoài đời.',
  'Sáng tạo không giới hạn – chúc em biến ý tưởng thành sản phẩm số!',
  'Chúc gia đình em luôn hạnh phúc, mỗi ngày "tải xuống" thật nhiều niềm vui.',
  'Dữ liệu quý nhất là kiến thức trong đầu em. Chúc em tích lũy thật nhiều!',
  'Chúc em vượt qua mọi "bug" của cuộc sống bằng nụ cười.',
  'Hacker mũ trắng giỏi nhất là người bảo vệ người khác. Chúc em luôn tốt bụng!',
  'Chúc em và cả lớp cùng nhau chinh phục kỷ nguyên số!'
];
