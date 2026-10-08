// 建立器（index.html）與報名頁（register.html）共用的資料與工具
const EB = (() => {
  // ===== 風格 =====
  // colors = [頂端列, 按鈕, 淺色底]，僅供建立器的縮圖使用；實際配色在 style.css 的 html[data-theme]
  const THEMES = [
    { id: 'ocean', group: '通用', name: '青藍專業', desc: '乾淨明亮，課程、醫療、企業都合適', colors: ['#5cc2cf', '#197585', '#e2f5f8'] },
    { id: 'minimal', group: '通用', name: '簡約黑白', desc: '極簡俐落，不搶內容', colors: ['#f2f2f2', '#111111', '#f4f4f4'] },
    { id: 'navy', group: '商務／研討會', name: '海軍藍', desc: '穩重可靠，論壇、法說、培訓', colors: ['#1f3a5f', '#1f3a5f', '#e8eef6'] },
    { id: 'graphite', group: '商務／研討會', name: '石墨琥珀', desc: '沉穩灰階搭配琥珀點綴', colors: ['#2f343b', '#a04708', '#f3f1ee'] },
    { id: 'tech', group: '商務／研討會', name: '科技深色', desc: '深色背景，AI、科技、工程', colors: ['#12263f', '#38bdf8', '#132338'] },
    { id: 'sunny', group: '親子／社群／派對', name: '暖陽橘', desc: '親切熱鬧，聚會與社群活動', colors: ['#ffc47a', '#b4440b', '#fff1e0'] },
    { id: 'candy', group: '親子／社群／派對', name: '糖果粉', desc: '甜美圓潤，親子、生日、市集', colors: ['#ffb3d1', '#c2185b', '#ffeaf3'] },
    { id: 'lemon', group: '親子／社群／派對', name: '檸檬黃', desc: '明亮有活力，運動、營隊', colors: ['#ffe066', '#8a6d00', '#fff9d6'] },
    { id: 'neon', group: '親子／社群／派對', name: '霓虹夜店', desc: '深紫配螢光粉，派對、音樂', colors: ['#1a0b2e', '#ff4fd8', '#24103f'] },
    { id: 'paper', group: '文青／展覽／課程', name: '復古紙感', desc: '米色紙張與襯線字體，展覽、講座', colors: ['#e9dcc3', '#7a3e1d', '#f3ead8'] },
    { id: 'forest', group: '文青／展覽／課程', name: '森林綠', desc: '自然沉靜，工作坊、戶外、手作', colors: ['#2f5d46', '#2f5d46', '#e6f1e9'] },
    { id: 'morandi', group: '文青／展覽／課程', name: '莫蘭迪', desc: '低飽和霧色，設計、藝文課程', colors: ['#cbbfb7', '#7a5c6b', '#efe7e3'] },
  ];

  // ===== 頁面底圖（疊在風格底色上；圖檔在 images/，樣式在 style.css 的 .bg-layer） =====
  const BGS = [
    { id: 'none', name: '無底圖', desc: '單純使用風格底色' },
    { id: 'paper', name: '紙感／和紙', desc: '細緻紙張纖維質感' },
    { id: 'aurora', name: '柔光漸層', desc: '依風格配色的柔和光暈' },
    { id: 'geo', name: '幾何線條', desc: '細線、圓點與菱形' },
    { id: 'leaf', name: '自然植物', desc: '角落的枝葉剪影' },
  ];

  // ===== 題型 =====
  const KIND_LABELS = {
    text: '單行文字', textarea: '多行文字', radio: '單選', checkbox: '複選',
    select: '下拉選單', date: '日期', email: 'Email', tel: '電話',
    birthday: '生日', location: '場次',
  };
  const CUSTOM_KINDS = ['text', 'textarea', 'radio', 'checkbox', 'select', 'date'];
  const CHOICE_KINDS = ['radio', 'checkbox', 'select'];

  // ===== 題庫（group 只在每組第一題標示） =====
  const BANK = [
    { id: 'name', group: '基本資料', label: '預約大名', kind: 'text', ph: '請輸入姓名', defReq: 1 },
    { id: 'email', label: 'Email', kind: 'email', ph: 'name@example.com', defReq: 1 },
    { id: 'phone', label: '手機號碼', kind: 'tel', ph: '0912345678', defReq: 1 },
    { id: 'birthday', label: '生日（年／月／日）', kind: 'birthday', hint: '考量手術風險、傷口恢復速度及老花，近視雷射建議施作年齡約落在20~39Y間；老花雷射建議施作年齡約落在35~50Y間' },
    { id: 'gender', label: '性別', kind: 'radio', options: ['男', '女', '不透露'] },
    { id: 'company', group: '身分與單位', label: '公司／單位', kind: 'text' },
    { id: 'jobtitle', label: '職稱', kind: 'text' },
    { id: 'location', group: '場次與聯繫', label: '預約地點（使用「活動資訊」的地點）', kind: 'location' },
    { id: 'slot', label: '方便聯繫時段', kind: 'radio', options: ['早上｜09:00~13:00', '下午｜14:00~17:00', '晚上｜18:00~21:00', '全天皆可'] },
    { id: 'diet', group: '現場安排', label: '飲食需求', kind: 'radio', options: ['葷食', '蛋奶素', '全素', '其他'] },
    { id: 'guests', label: '同行人數（不含本人）', kind: 'select', options: ['0', '1', '2', '3', '4', '5'] },
    { id: 'source', label: '從哪裡得知本活動', kind: 'checkbox', options: ['社群媒體', '朋友推薦', 'Email', '官方網站', '其他'] },
    { id: 'notes', label: '備註／想詢問的事', kind: 'textarea' },
    { id: 'wear', group: '視力評估（眼科活動範例）', label: '配戴習慣', kind: 'checkbox', options: ['一般眼鏡', '軟式隱形眼鏡', '硬式隱形眼鏡', '其他'] },
    { id: 'myopia', label: '是否有近視？', kind: 'radio', options: ['是', '否'] },
    { id: 'astigmatism', label: '是否有散光？', kind: 'radio', options: ['是', '否'] },
    { id: 'presbyopia', label: '是否有老花？', kind: 'radio', options: ['是', '否'] },
    { id: 'disease', label: '是否有其他眼睛疾病？', kind: 'radio', options: ['是', '否'] },
  ];
  const BANK_BY_ID = Object.fromEntries(BANK.map((b) => [b.id, b]));

  // ===== 預設內容：取自「近視老花雷射評估問卷」（SurveyCake 9zd3a） =====
  const DEFAULT_NAME = '近視老花雷射評估問卷';

  const DEFAULT_INTRO = [
    '💡 為什麼近視老花雷射選擇濰視眼科？',
    '',
    '嚴謹術前評估：透過 56 項完整數據與 25 道精密儀器檢測，執行手術前為您的視力安全嚴格檢查與把關。',
    '',
    '先進微創技術：採用 Smart TransPRK 4.0 表層無刀雷射術式，全程不掀角膜瓣、無器械接觸眼球，除可保留較多原生角膜厚度，更能避免術後角膜瓣位移風險，AI 全智能施作，一次性精準改善近視、散光與老花。',
    '',
    '更多完整介紹：https://www.wishvision.com.tw/about2/3.htm',
    '',
    '🎁 活動專屬方案：',
    '',
    '【濰視眼科】 近視/老花雷射專案價 $95,000。本方案適用期間為完成視覺評估後三個月內。',
    '',
    '📋 【預約注意事項】',
    '',
    '填寫對象：限 20-55 歲、有近視、散光或老花用眼困擾，且有考慮雷射評估意願者填寫（若您視力極佳、無度數困擾則無需填寫，謝謝配合），請勿外流轉發。',
    '',
    '安排說明：凡完成填寫者，將協助安排相關服務之聯繫與諮詢，由濰視專人統一電聯，確認您的預約時間並依您的地點安排評估院所。',
    '',
    '預約調整：完成預約後，如需更改時間或取消，請逕行致電安排之分院。',
    '各分院資訊：https://www.wishvision.com.tw/album/all/1.htm',
  ].join('\n');

  const DEFAULT_LOCS = [
    '仁愛院｜台北市大安區復興南路一段243號3F',
    '館前院｜台北市中正區館前路43號2F',
    '新竹院｜新竹縣竹北市光明六路東二段450號',
    '台中院｜台中市西屯區東興路三段410號',
  ];

  const DEFAULT_NOTICE =
    '貼心提醒：本次視覺評估將依填表資訊進行初步篩選，若經審核您的視力狀況優良、無近視/散光/老花等雷射評估需求者，診所端將不另行致電確認預約時段，將以具相關視覺困擾之粉絲優先安排，敬請見諒。';

  const DEFAULT_PRIVACY =
    '感謝您填寫本問卷，以下依據《個人資料保護法》(暨施行細則)，向您告知本問卷蒐集、處理及利用個人資料之事項：\n本問卷依據個資法蒐集、處理及利用您的個人資料包含識別個人姓名、行動電話、電子郵件地址等。上述個人資料之蒐集、處理及利用，將僅限濰視眼科視覺評估之預約安排、聯繫與諮詢業務需要使用，並遵守個資法之規定妥善保護您的個人資訊。依據個資法第3條規定，您可向濰視眼科行使之個資權利包括：查詢、閱覽、複製、補充、更正、處理、利用及刪除。您可電聯濰視眼科各分院或私訊至官方LINE，我們將儘速處理與回覆您的請求。您亦可拒絕提供相關之個人資料，但若無完整的資料，我們將無法進行本問卷之後續作業，致無法提供您相關服務。';

  const IMG_NAME = /^[\w\-. 一-鿿]+\.(png|jpe?g|webp|gif|svg)$/i;
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  // 預設題目：依參考問卷（SurveyCake 9zd3a）的欄位順序；問卷沒有 Email，依先前需求加在手機號碼之後。全部預設必填
  const DEFAULT_IDS = ['name', 'location', 'birthday', 'phone', 'email', 'slot', 'wear', 'myopia', 'astigmatism', 'presbyopia', 'disease'];

  // 隨機代碼：活動編號、送出編號
  function newId() {
    const a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return [...a].map((b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-4);
  }

  function defaultConfig() {
    const logo = (window.EB_CONFIG && window.EB_CONFIG.defaultLogo) || '';
    return {
      v: 1, th: 'ocean', bg: 'none', logo: IMG_NAME.test(logo) ? logo : '', hero: '', id: newId(), cloud: 0,
      name: DEFAULT_NAME, date: '', start: '', end: '', loc: [...DEFAULT_LOCS], intro: DEFAULT_INTRO,
      notice: DEFAULT_NOTICE, priv: DEFAULT_PRIVACY,
      q: DEFAULT_IDS.map((id) => ({ b: id, r: 1 })),
    };
  }

  // ===== 設定清洗：連結內容不可信，一律檢查型別、長度與白名單 =====
  function sanitizeConfig(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
    const cfg = {
      v: 1,
      th: THEMES.some((t) => t.id === r.th) ? r.th : 'ocean',
      bg: BGS.some((b) => b.id === r.bg) ? r.bg : 'none',
      id: /^[a-z0-9]{6,20}$/.test(str(r.id, 20)) ? r.id : '',
      logo: IMG_NAME.test(str(r.logo, 100)) ? r.logo : '',
      hero: IMG_NAME.test(str(r.hero, 100)) ? r.hero : '',
      name: str(r.name, 100),
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(r.date, 10)) ? r.date : '',
      start: /^\d{2}:\d{2}$/.test(str(r.start, 5)) ? r.start : '',
      end: /^\d{2}:\d{2}$/.test(str(r.end, 5)) ? r.end : '',
      loc: Array.isArray(r.loc) ? r.loc.slice(0, 20).map((s) => str(s, 200).trim()).filter(Boolean) : [],
      intro: str(r.intro, 2000),
      // notice 沒有這個欄位時用 null，讓 decodeConfig 補預設；空字串代表主辦者刻意清空
      notice: typeof r.notice === 'string' ? r.notice.slice(0, 2000) : null,
      priv: str(r.priv, 2000),
      q: [],
    };
    cfg.cloud = r.cloud && cfg.id ? 1 : 0;
    (Array.isArray(r.q) ? r.q.slice(0, 40) : []).forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const req = item.r ? 1 : 0;
      if (typeof item.b === 'string' && BANK_BY_ID[item.b]) {
        cfg.q.push({ b: item.b, r: req });
      } else if (CUSTOM_KINDS.includes(item.k) && str(item.t, 200).trim()) {
        const q = { k: item.k, t: str(item.t, 200).trim(), r: req };
        if (CHOICE_KINDS.includes(item.k)) {
          q.o = (Array.isArray(item.o) ? item.o : []).slice(0, 30).map((s) => str(s, 100).trim()).filter(Boolean);
          if (q.o.length < 2) return;
        }
        cfg.q.push(q);
      }
    });
    return cfg;
  }

  // 展開成報名頁實際要畫的題目清單
  function resolveQuestions(cfg) {
    const list = [];
    cfg.q.forEach((item) => {
      if (item.b) {
        const d = BANK_BY_ID[item.b];
        if (d.kind === 'location' && cfg.loc.length === 0) return;
        list.push({ bank: d.id, kind: d.kind, label: d.label.replace(/（使用.*?）/, ''), options: d.options || [], ph: d.ph || '', hint: d.hint || '', required: !!item.r });
      } else {
        list.push({ bank: '', kind: item.k, label: item.t, options: item.o || [], ph: '', hint: '', required: !!item.r });
      }
    });
    return list;
  }

  // ===== 連結編碼（JSON → deflate → base64url），不支援壓縮的瀏覽器用純 base64 =====
  const toB64u = (bytes) => {
    let s = '';
    bytes.forEach((b) => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const fromB64u = (str) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

  async function readAll(stream, limit) {
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) { reader.cancel(); throw new Error('too large'); }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let o = 0;
    chunks.forEach((c) => { out.set(c, o); o += c.length; });
    return out;
  }

  async function encodeConfig(cfg) {
    const slim = { ...cfg };
    ['logo', 'hero', 'date', 'start', 'end', 'intro'].forEach((k) => { if (!slim[k]) delete slim[k]; });
    if (slim.bg === 'none') delete slim.bg;
    if (!slim.cloud) { delete slim.cloud; delete slim.id; } // 活動編號只在連結雲端時才需要
    if (!slim.loc.length) delete slim.loc;
    if (slim.priv === DEFAULT_PRIVACY || !slim.priv) delete slim.priv;
    if (slim.notice === null || slim.notice === DEFAULT_NOTICE) delete slim.notice;
    const bytes = new TextEncoder().encode(JSON.stringify(slim));
    const plain = 'j' + toB64u(bytes);
    if (typeof CompressionStream !== 'function') return plain;
    try {
      const packed = await readAll(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')), 1e6);
      const zipped = 'z' + toB64u(packed);
      return zipped.length < plain.length ? zipped : plain;
    } catch (e) {
      return plain;
    }
  }

  async function decodeConfig(str) {
    if (typeof str !== 'string' || str.length < 2 || str.length > 30000) throw new Error('bad link');
    let bytes = fromB64u(str.slice(1));
    if (str[0] === 'z') {
      if (typeof DecompressionStream !== 'function') throw new Error('unsupported');
      bytes = await readAll(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')), 200000);
    } else if (str[0] !== 'j') {
      throw new Error('bad link');
    }
    const cfg = sanitizeConfig(JSON.parse(new TextDecoder().decode(bytes)));
    if (!cfg.priv) cfg.priv = DEFAULT_PRIVACY;
    if (cfg.notice === null) cfg.notice = DEFAULT_NOTICE;
    return cfg;
  }

  // ===== 小工具 =====
  // 一行「名稱｜地址」拆成 { name, addr }
  function parseLoc(line) {
    const [name, ...rest] = line.split(/[｜|]/);
    return { name: name.trim(), addr: rest.join(' ').trim() };
  }

  function formatDate(cfg) {
    if (!cfg.date) return '';
    const [y, m, d] = cfg.date.split('-').map(Number);
    if (!y || !m || !d) return '';
    let text = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}（${WEEKDAYS[new Date(y, m - 1, d).getDay()]}）`;
    if (cfg.start) text += ` ${cfg.start}`;
    if (cfg.start && cfg.end) text += `–${cfg.end}`;
    return text;
  }

  // 建立元素：class / text 為簡寫，其餘依屬性或 attribute 設定；內容一律走 textContent
  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k in e) e[k] = v;
      else e.setAttribute(k, v);
    });
    e.append(...kids.flat().filter(Boolean));
    return e;
  }

  const $ = (id) => document.getElementById(id);

  // 把文字中的 http(s) 網址變成可點的連結（只處理 http/https，其餘一律當純文字）
  function linkify(text) {
    const frag = document.createDocumentFragment();
    const re = /https?:\/\/[^\s<>"'）)，。、]+/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.append(text.slice(last, m.index));
      const a = document.createElement('a');
      a.href = m[0];
      a.textContent = m[0];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      frag.append(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.append(text.slice(last));
    return frag;
  }

  // ===== 雲端收件（Google Apps Script） =====
  const ENDPOINT_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
  // 收件網址只認 config.js（管理員設定），絕不從報名連結讀取，避免有人偽造連結把資料導去別處
  function endpoint() {
    const e = (window.EB_CONFIG && window.EB_CONFIG.endpoint) || '';
    return ENDPOINT_RE.test(e) ? e : '';
  }

  async function callCloud(payload) {
    const url = endpoint();
    if (!url) throw new Error('no endpoint');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      // 字串 body 會以 text/plain 送出，屬於「簡單請求」，不需要預檢，Apps Script 可直接接收
      const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), signal: ctrl.signal });
      const data = await res.json();
      if (!data || !data.ok) throw new Error((data && data.error) || 'failed');
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  // 欄位名稱不可重複（試算表用名稱對應欄位）
  function uniqueLabels(labels) {
    const seen = {};
    return labels.map((l) => {
      seen[l] = (seen[l] || 0) + 1;
      return seen[l] === 1 ? l : `${l} (${seen[l]})`;
    });
  }

  return {
    newId, endpoint, callCloud, uniqueLabels, linkify,
    DEFAULT_NAME, DEFAULT_INTRO, DEFAULT_LOCS, DEFAULT_NOTICE,
    THEMES, BGS, KIND_LABELS, CUSTOM_KINDS, CHOICE_KINDS, BANK, BANK_BY_ID, DEFAULT_IDS, DEFAULT_PRIVACY, IMG_NAME,
    defaultConfig, sanitizeConfig, resolveQuestions, encodeConfig, decodeConfig, parseLoc, formatDate, el, $,
  };
})();
