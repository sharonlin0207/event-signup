// 建立器：四步驟設定 → 產生報名連結（設定全部編進網址，不需要後端）
(() => {
  const { $, el } = EB;
  const DRAFT_KEY = 'eventBuilderDraft3'; // 預設內容改版後換新名稱，避免讀到舊草稿

  // ---------- 草稿（存在這台電腦的瀏覽器，下次開啟可繼續） ----------
  function loadDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;
      const c = EB.sanitizeConfig(JSON.parse(saved));
      if (!c.priv) c.priv = EB.DEFAULT_PRIVACY;
      if (!c.id) c.id = EB.newId();
      if (c.notice === null) c.notice = EB.DEFAULT_NOTICE;
      return c;
    } catch (e) {
      return null;
    }
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg)); } catch (e) { /* 無痕模式等情況略過 */ }
  }

  let cfg = loadDraft() || EB.defaultConfig();
  let step = 1;
  const changed = () => saveDraft();

  const bankTitle = (id) => EB.BANK_BY_ID[id].label.replace(/（使用.*?）/, '');
  const qTitle = (q) => (q.b ? bankTitle(q.b) : q.t);
  const qKind = (q) => (q.b ? EB.BANK_BY_ID[q.b].kind : q.k);

  // ---------- 步驟 1：風格 ----------
  function renderThemes() {
    const cards = EB.THEMES.map((t) => {
      const [bar, btn, soft] = t.colors;
      const input = el('input', { type: 'radio', name: 'theme', value: t.id, checked: cfg.th === t.id });
      input.addEventListener('change', () => { cfg.th = t.id; changed(); });
      const mini = el('span', { class: 'mini' },
        el('span', { class: 'mini__bar', style: `background:${bar}` }),
        el('span', { class: 'mini__body', style: `background:${soft}` },
          el('span', { class: 'mini__line' }), el('span', { class: 'mini__line mini__line--short' }),
          el('span', { class: 'mini__btn', style: `background:${btn}` })));
      return el('label', { class: 'theme-card' }, input,
        el('span', { class: 'theme-card__box' }, mini,
          el('span', { class: 'theme-card__name', text: t.name }),
          el('span', { class: 'theme-card__desc', text: t.desc })));
    });
    // 依活動類型分組顯示
    const groups = [...new Set(EB.THEMES.map((t) => t.group))];
    $('themeList').replaceChildren(...groups.map((g) => el('div', { class: 'theme-group' },
      el('p', { class: 'bank-group', text: g }),
      el('div', { class: 'theme-grid' }, EB.THEMES.map((t, i) => (t.group === g ? cards[i] : null))))));
  }

  function renderBgs() {
    $('bgList').replaceChildren(...EB.BGS.map((b) => {
      const input = el('input', { type: 'radio', name: 'bg', value: b.id, checked: cfg.bg === b.id });
      input.addEventListener('change', () => { cfg.bg = b.id; changed(); });
      const thumb = el('span', { class: 'bgthumb' }, el('span', { class: 'bg-layer bg-layer--thumb', 'data-bg': b.id }));
      return el('label', { class: 'theme-card' }, input,
        el('span', { class: 'theme-card__box' }, thumb,
          el('span', { class: 'theme-card__name', text: b.name }),
          el('span', { class: 'theme-card__desc', text: b.desc })));
    }));
  }

  function bindImageInput(id, key, msgId) {
    $(id).addEventListener('input', (e) => {
      const v = e.target.value.trim();
      if (!v || EB.IMG_NAME.test(v)) {
        cfg[key] = v;
        $(msgId).textContent = '';
      } else {
        cfg[key] = '';
        $(msgId).textContent = '檔名格式需像 logo.png（支援 png、jpg、webp、gif、svg），且不能包含資料夾路徑';
      }
      changed();
    });
  }

  // ---------- 步驟 3：活動資訊 ----------
  function bindTextInput(id, apply) {
    $(id).addEventListener('input', (e) => { apply(e.target.value); changed(); });
  }

  function fillInputs() {
    $('logo').value = cfg.logo;
    $('hero').value = cfg.hero;
    $('name').value = cfg.name;
    $('date').value = cfg.date;
    $('start').value = cfg.start;
    $('end').value = cfg.end;
    $('loc').value = cfg.loc.join('\n');
    $('intro').value = cfg.intro;
    $('notice').value = cfg.notice;
    $('priv').value = cfg.priv;
    $('logoMsg').textContent = '';
    $('heroMsg').textContent = '';
  }

  // ---------- 步驟 2：題目 ----------
  function renderBank() {
    const box = $('bankList');
    box.replaceChildren();
    EB.BANK.forEach((b) => {
      if (b.group) box.append(el('p', { class: 'bank-group', text: b.group }));
      const cb = el('input', { type: 'checkbox', checked: cfg.q.some((q) => q.b === b.id) });
      cb.addEventListener('change', () => {
        if (cb.checked) cfg.q.push({ b: b.id, r: b.defReq ? 1 : 0 });
        else cfg.q = cfg.q.filter((q) => q.b !== b.id);
        renderSel();
        changed();
      });
      box.append(el('label', { class: 'option' }, cb,
        el('span', { class: 'bank-label', text: b.label }),
        EB.DEFAULT_IDS.includes(b.id) ? el('span', { class: 'tag tag--def', text: '預設' }) : null,
        el('span', { class: 'tag', text: EB.KIND_LABELS[b.kind] })));
    });
  }

  function move(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= cfg.q.length) return;
    [cfg.q[i], cfg.q[j]] = [cfg.q[j], cfg.q[i]];
    renderSel();
    changed();
  }

  function renderSel() {
    $('selList').replaceChildren(...cfg.q.map((q, i) => {
      const req = el('input', { type: 'checkbox', checked: !!q.r });
      req.addEventListener('change', () => { q.r = req.checked ? 1 : 0; changed(); });
      const mk = (text, label, onClick, disabled) => {
        const b = el('button', { type: 'button', class: 'iconbtn', text, 'aria-label': `${label}：${qTitle(q)}`, disabled });
        b.addEventListener('click', onClick);
        return b;
      };
      const remove = () => { cfg.q.splice(i, 1); renderSel(); renderBank(); changed(); };
      return el('li', { class: 'sel-item' },
        el('span', { class: 'num', text: String(i + 1) }),
        el('span', { class: 'sel-item__title', text: qTitle(q) }),
        el('span', { class: 'sel-item__meta' },
          el('span', { text: `${EB.KIND_LABELS[qKind(q)]}${q.b ? '' : '・自訂'}` }),
          el('label', {}, req, '必填')),
        el('span', { class: 'sel-item__btns' },
          mk('↑', '上移', () => move(i, -1), i === 0),
          mk('↓', '下移', () => move(i, 1), i === cfg.q.length - 1),
          mk('✕', '移除', remove, false)));
    }));
    $('selCount').textContent = `（${cfg.q.length} 題）`;
    $('selEmpty').hidden = cfg.q.length > 0;
    updateLocWarn();
  }

  function updateLocWarn() {
    $('locWarn').hidden = !(cfg.q.some((q) => q.b === 'location') && cfg.loc.length === 0);
  }

  $('restoreQ').addEventListener('click', () => {
    cfg.q = EB.defaultConfig().q;
    renderSel();
    renderBank();
    changed();
  });
  $('clearQ').addEventListener('click', () => {
    cfg.q = [];
    renderSel();
    renderBank();
    changed();
  });

  function initCustomForm() {
    const kind = $('cKind');
    EB.CUSTOM_KINDS.forEach((k) => kind.add(new Option(EB.KIND_LABELS[k], k)));
    kind.addEventListener('change', () => { $('cOptsWrap').hidden = !EB.CHOICE_KINDS.includes(kind.value); });
    $('cAdd').addEventListener('click', () => {
      const msg = $('cMsg');
      const t = $('cTitle').value.trim();
      if (!t) { msg.textContent = '請輸入題目文字'; $('cTitle').focus(); return; }
      const k = kind.value;
      const item = { k, t, r: $('cReq').checked ? 1 : 0 };
      if (EB.CHOICE_KINDS.includes(k)) {
        const o = $('cOpts').value.split('\n').map((s) => s.trim()).filter(Boolean);
        if (o.length < 2) { msg.textContent = '選擇題至少需要兩個選項（一行一個）'; $('cOpts').focus(); return; }
        item.o = o;
      }
      cfg.q.push(item);
      msg.textContent = '';
      $('cTitle').value = '';
      $('cOpts').value = '';
      $('cReq').checked = false;
      renderSel();
      changed();
    });
  }

  // ---------- 步驟 4：雲端試算表 ----------
  // 試算表編號只存在這台電腦（不放進分享連結）；換電腦可按「重新取得試算表連結」找回
  const SHEETS_KEY = 'ebSheets';
  const readSheets = () => {
    try { return JSON.parse(localStorage.getItem(SHEETS_KEY) || '{}'); } catch (e) { return {}; }
  };
  const getSheetId = () => readSheets()[cfg.id] || '';
  function setSheetId(sheetId) {
    try {
      const map = readSheets();
      map[cfg.id] = sheetId;
      localStorage.setItem(SHEETS_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  }

  function renderCloud() {
    const hasEndpoint = Boolean(EB.endpoint());
    const linked = hasEndpoint && Boolean(cfg.cloud);
    $('cloudForm').hidden = !hasEndpoint;
    $('cloudLead').textContent = !hasEndpoint
      ? '管理員尚未設定雲端收件（config.js 的 endpoint 還是空的），所以目前報名者送出後不會收集資料。設定方式請看「雲端設定說明.md」。'
      : linked
        ? '已連結：報名者送出的資料會自動寫進這場活動專屬的試算表。'
        : '按下按鈕後，會替這場活動建立一份專屬試算表；報名者送出的資料會自動寫進去。';
    $('cloudBtn').textContent = linked ? '重新取得試算表連結' : '建立並連結試算表';
    const sheetId = getSheetId();
    const ok = linked && /^[\w-]+$/.test(sheetId);
    $('cloudLinks').hidden = !ok;
    if (ok) {
      const base = `https://docs.google.com/spreadsheets/d/${sheetId}`;
      $('sheetOpen').href = `${base}/edit`;
      $('sheetXlsx').href = `${base}/export?format=xlsx`;
      $('sheetCsv').href = `${base}/export?format=csv`;
    }
  }

  $('cloudBtn').addEventListener('click', async () => {
    const btn = $('cloudBtn');
    const msg = $('cloudMsg');
    const email = $('cloudEmail').value.trim();
    const code = $('cloudCode').value;
    msg.classList.remove('b-msg--ok');
    if (!code) { msg.textContent = '請輸入主辦者通行碼'; $('cloudCode').focus(); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Email 格式不正確'; return; }
    btn.disabled = true;
    msg.textContent = '處理中，請稍候…';
    try {
      const labels = EB.uniqueLabels(EB.resolveQuestions(cfg).map((q) => q.label));
      const data = await EB.callCloud({ action: 'init', id: cfg.id, name: cfg.name.trim(), email, labels, code });
      cfg.cloud = 1;
      setSheetId(data.sheetId);
      changed();
      renderCloud();
      refreshShare();
      msg.classList.add('b-msg--ok');
      msg.textContent = '完成！試算表已建立並連結。';
    } catch (e) {
      msg.textContent = e.message === 'bad code'
        ? '主辦者通行碼不正確，請向管理員確認。'
        : e.message === 'organizer code not set'
          ? '管理員還沒在 Apps Script 設定通行碼（ORGANIZER_CODE），請先完成「雲端設定說明.md」的第 2-1 步。'
          : '無法連線到雲端收件服務，請確認管理員已完成設定，並把 Apps Script 部署為「所有人」可存取。';
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- 步驟 4：分享 ----------
  let lastLink = '';
  async function refreshShare() {
    const token = await EB.encodeConfig(EB.sanitizeConfig(cfg));
    const url = new URL('register.html', location.href);
    url.search = `?c=${token}`;
    const link = url.href;
    const theme = EB.THEMES.find((t) => t.id === cfg.th);
    $('summary').textContent = `風格「${theme.name}」・活動「${cfg.name.trim()}」・${cfg.q.length} 個題目・${cfg.cloud && EB.endpoint() ? '已連結雲端試算表' : '尚未連結雲端（示範模式）'}`;
    $('shareLink').value = link;
    $('openBtn').href = link;
    $('lenNote').textContent = link.length > 1800
      ? `連結有 ${link.length} 個字元，偏長；若在某些通訊軟體被截斷，可減少題目或使用短網址服務。`
      : '';
    if (link !== lastLink) { $('preview').src = link; lastLink = link; }
  }

  $('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('shareLink').value);
      $('copyMsg').textContent = '已複製連結！';
    } catch (e) {
      $('shareLink').select();
      $('copyMsg').textContent = '請按 Ctrl+C 複製選取的連結';
    }
  });

  // ---------- 匯入既有連結 ----------
  $('importBtn').addEventListener('click', async () => {
    const msg = $('importMsg');
    const raw = $('importInput').value.trim();
    try {
      let token = raw;
      try { token = new URL(raw).searchParams.get('c') || raw; } catch (e) { /* 不是完整網址就當成純代碼 */ }
      cfg = await EB.decodeConfig(token);
      if (!cfg.id) cfg.id = EB.newId();
      renderAll();
      changed();
      msg.classList.add('b-msg--ok');
      msg.textContent = '匯入成功，已載入設定！';
    } catch (e) {
      msg.classList.remove('b-msg--ok');
      msg.textContent = '無法讀取這個連結，請確認有完整複製。';
    }
  });

  // ---------- 步驟切換與檢查 ----------
  function check(n) {
    if (n === 2 && cfg.q.length === 0) return '請至少選擇一個題目';
    if (n === 3 && !cfg.name.trim()) return '請先填寫活動名稱';
    return '';
  }

  function show(n) {
    step = n;
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = Number(p.dataset.panel) !== n; });
    document.querySelectorAll('#steps button').forEach((b) => {
      const s = Number(b.dataset.step);
      if (s === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('done', s < n);
    });
    $('prevBtn').disabled = n === 1;
    $('nextBtn').hidden = n === 4;
    $('stepMsg').textContent = '';
    if (n === 4) { renderCloud(); $('cloudMsg').textContent = ''; refreshShare(); }
    window.scrollTo({ top: 0 });
  }

  function go(target) {
    target = Math.min(4, Math.max(1, target));
    for (let s = step; s < target; s++) {
      const msg = check(s);
      if (msg) {
        if (s !== step) show(s);
        $('stepMsg').textContent = msg;
        if (s === 3) $('name').focus();
        return;
      }
    }
    show(target);
  }

  document.querySelectorAll('#steps button').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.step))));
  $('prevBtn').addEventListener('click', () => go(step - 1));
  $('nextBtn').addEventListener('click', () => go(step + 1));
  $('resetBtn').addEventListener('click', () => {
    if (!window.confirm('確定要清除目前的設定，重新開始嗎？')) return;
    cfg = EB.defaultConfig();
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    renderAll();
    show(1);
  });

  // ---------- 啟動 ----------
  function renderAll() {
    renderThemes();
    renderBgs();
    renderBank();
    renderSel();
    fillInputs();
  }

  bindImageInput('logo', 'logo', 'logoMsg');
  bindImageInput('hero', 'hero', 'heroMsg');
  bindTextInput('name', (v) => { cfg.name = v; });
  bindTextInput('date', (v) => { cfg.date = v; });
  bindTextInput('start', (v) => { cfg.start = v; });
  bindTextInput('end', (v) => { cfg.end = v; });
  bindTextInput('loc', (v) => { cfg.loc = v.split('\n').map((s) => s.trim()).filter(Boolean); updateLocWarn(); });
  bindTextInput('intro', (v) => { cfg.intro = v; });
  bindTextInput('notice', (v) => { cfg.notice = v; });
  bindTextInput('priv', (v) => { cfg.priv = v; });
  initCustomForm();
  renderAll();
  show(1);
})();
