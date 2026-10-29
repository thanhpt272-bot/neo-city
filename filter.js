/* ===== NEO-CITY · Lọc từ ngữ không phù hợp trong tên / lớp =====
   Dùng chung cho trình duyệt (window.isBadName) và server.js (require).
   Thầy cô có thể bổ sung từ vào các danh sách dưới đây. */
(function (root) {
  // So khớp nguyên từ, giữ dấu (tránh chặn nhầm tên thật như "Du", "Di", "Nguyễn")
  const EXACT = ['đụ', 'đù', 'đĩ', 'địt', 'đjt', 'lồn', 'lìn', 'buồi', 'cặc', 'cạc', 'đéo', 'đếch', 'cứt', 'ngu', 'đần', 'khốn',
    'điếm', 'phò', 'dâm', 'chó', 'đmm', 'đm', 'đcm', 'đkm', 'đỵt',
    // xưng hô / lời lẽ thiếu văn minh
    'thằng', 'thằg', 'mày', 'tao', 'tau', 'bố', 'đồ', 'điên', 'khùng', 'dở', 'hâm', 'hãm', 'láo', 'mất', 'dạy', 'đểu', 'xàm', 'lìn', 'cút', 'chết', 'giết'];
  // Các từ chỉ bị chặn khi đi kèm từ khác trong cụm (VD: "bố mày", "mất dạy") – để "Bố Tuấn", "Đỗ…" vẫn hợp lệ
  const PAIR_ONLY = ['bố', 'đồ', 'dở', 'mất', 'dạy', 'chết'];
  // So khớp nguyên từ sau khi bỏ dấu và chuẩn hóa ký tự lách (0→o, 1→i, 3→e, 4→a, @→a, $→s…)
  const WORDS = ['dm', 'dmm', 'dcm', 'dcmm', 'dkm', 'dmcs', 'dcmn', 'cmm', 'cmn', 'clm', 'vcl', 'vkl', 'vl', 'vcc', 'cl', 'clgt', 'cc', 'ml',
    'dit', 'djt', 'duma', 'dume', 'dumam', 'lon', 'loz', 'lol', 'buoi', 'cac', 'cak', 'deo', 'cut', 'dek', 'dech', 'occho', 'sucvat',
    'fuck', 'fck', 'fuk', 'shit', 'bitch', 'dick', 'pussy', 'porn', 'sex', 'sexy', 'wtf', 'stfu', 'idiot', 'nigga', 'nigger', 'hentai'];
  // So khớp chuỗi con sau khi bỏ dấu, bỏ khoảng trắng & ký tự đặc biệt (bắt kiểu viết dính "d i t m e")
  const PARTS = ['ditme', 'ditcon', 'ditbo', 'dmvl', 'dcmvl', 'vailon', 'vailol', 'vailoz', 'cailon',
    'cailol', 'concac', 'conchohe', 'dauboi', 'daubuoi', 'occho', 'sucvat', 'chetme', 'chetcha', 'chetmemay', 'mayngu', 'thangngu', 'conngu',
    'occac', 'oclon', 'thangcho', 'thangkia', 'thangoc', 'bomay', 'taomay', 'maytao', 'conmemay', 'matday', 'dohoi', 'doocho', 'conchodien', 'matlon', 'banhlon', 'fuck', 'shit', 'bitch', 'pussy', 'porn', 'hentai', 'nigger'];

  const LEET = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', 'z': 'z' };
  const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd');
  const deleet = s => s.replace(/[0134@5$789!]/g, c => LEET[c] || c);
  const squeeze = s => s.replace(/(.)\1+/g, '$1');      // "nguuuu" → "ngu"

  function isBadName(input) {
    const raw = String(input || '').toLowerCase().normalize('NFC');
    const rawTokens = raw.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const hit = t => EXACT.includes(t) || EXACT.includes(squeeze(t));
    if (rawTokens.some(t => hit(t) && !PAIR_ONLY.includes(t))) return true;
    const pairs = ['bố mày', 'bố mầy', 'đồ ngu', 'đồ chó', 'đồ điên', 'đồ khùng', 'dở hơi', 'mất dạy', 'chết tiệt', 'chết đi', 'đồ hâm', 'đồ khốn'];
    const spaced = rawTokens.join(' ');
    if (pairs.some(x => (' ' + spaced + ' ').includes(' ' + x + ' '))) return true;

    const norm = deleet(strip(raw));
    const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.some(t => WORDS.includes(t) || WORDS.includes(squeeze(t)))) return true;

    // "du ma", "dit me"… viết tách thành 2 từ
    for (let i = 0; i < tokens.length - 1; i++) if (WORDS.includes(tokens[i] + tokens[i + 1]) || PARTS.includes(tokens[i] + tokens[i + 1])) return true;

    // Viết dính / chèn ký tự. Không khớp khi chữ sau là g/h để khỏi chặn nhầm tên ("Cái Long", "Vai Lonh"…)
    const flat = norm.replace(/[^a-z]/g, '');
    const flat2 = squeeze(flat);
    return PARTS.some(p => { const re = new RegExp(p + '(?![gh])'); return re.test(flat) || re.test(flat2); });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { isBadName };
  else root.isBadName = isBadName;
})(typeof window !== 'undefined' ? window : this);
