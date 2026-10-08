// 報名頁：讀取網址 ?c=... 的設定，自動長出整個頁面與報名表
(async () => {
  const { $, el } = EB;

  let cfg;
  try {
    cfg = await EB.decodeConfig(new URLSearchParams(location.search).get('c'));
  } catch (e) {
    $('loadError').hidden = false;
    $('siteNav').hidden = true;
    return;
  }

  const questions = EB.resolveQuestions(cfg);
  const form = $('regForm');

  // ---------- 風格與圖片 ----------
  document.documentElement.dataset.theme = cfg.th;
  $('bgLayer').dataset.bg = cfg.bg;
  if (cfg.logo) {
    const logo = $('brandLogo');
    logo.src = `images/${encodeURIComponent(cfg.logo)}`;
    logo.alt = cfg.name || '活動 Logo';
    logo.hidden = false;
    $('brandText').hidden = true;
    // 圖檔不存在時退回文字標題
    logo.addEventListener('error', () => { logo.hidden = true; $('brandText').hidden = false; });
  }
  if (cfg.hero) {
    const hero = document.querySelector('.hero');
    hero.classList.add('hero--image');
    hero.style.setProperty('--hero-img', `url("images/${encodeURIComponent(cfg.hero)}")`);
  }

  // ---------- 活動資訊 ----------
  const title = cfg.name.trim() || '活動名稱';
  $('eventTitle').textContent = title;
  document.title = `${title}｜活動報名`;
  $('footerText').textContent = `© ${title}`;

  const locs = cfg.loc.map(EB.parseLoc);
  const dateText = EB.formatDate(cfg);
  $('metaDate').hidden = !dateText;
  $('metaDate').querySelector('.meta-value').textContent = dateText;
  $('metaLocation').hidden = locs.length === 0;
  $('metaLocation').querySelector('.meta-value').textContent = locs.map((l) => l.name).join('、');

  const hasIntro = cfg.intro.trim() !== '';
  $('eventIntro').replaceChildren(EB.linkify(cfg.intro));
  $('eventIntro').hidden = !hasIntro;
  $('introPlace').hidden = locs.length === 0;
  $('introPlaceList').replaceChildren(...locs.map(({ name, addr }) => {
    const li = el('li', {}, el('span', { class: 'loc-name', text: name }));
    if (addr) li.append(el('span', { class: 'loc-addr', text: addr }));
    return li;
  }));
  $('intro').hidden = !(hasIntro || locs.length);
  $('navIntro').hidden = $('intro').hidden;
  $('info').hidden = !dateText;
  $('navInfo').hidden = $('info').hidden;
  $('infoDate').textContent = dateText;

  // ---------- 動態報名表 ----------
  const optionRow = (type, name, value, addr) => {
    const text = el('span', { text: value });
    if (addr) text.append(el('span', { class: 'loc-addr', text: addr }));
    return el('label', { class: 'option' }, el('input', { type, name, value }), text);
  };

  function buildBirthday(key) {
    const year = el('select', { name: `${key}_y`, 'aria-label': '出生年' }, el('option', { value: '', text: '年' }));
    const month = el('select', { name: `${key}_m`, 'aria-label': '出生月' }, el('option', { value: '', text: '月' }));
    const day = el('select', { name: `${key}_d`, 'aria-label': '出生日' }, el('option', { value: '', text: '日' }));
    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y >= thisYear - 100; y--) year.add(new Option(y, y));
    for (let m = 1; m <= 12; m++) month.add(new Option(String(m).padStart(2, '0'), m));
    const refresh = () => {
      const keep = day.value;
      const max = year.value && month.value ? new Date(year.value, month.value, 0).getDate() : 31;
      day.replaceChildren(new Option('日', ''));
      for (let d = 1; d <= max; d++) day.add(new Option(String(d).padStart(2, '0'), d));
      if (keep && Number(keep) <= max) day.value = keep;
    };
    year.addEventListener('change', refresh);
    month.addEventListener('change', refresh);
    refresh();
    return el('div', { class: 'birthday' }, year, month, day);
  }

  function buildInput(q, key) {
    switch (q.kind) {
      case 'text': return el('input', { id: key, name: key, type: 'text', placeholder: q.ph });
      case 'email': return el('input', { id: key, name: key, type: 'email', placeholder: q.ph, autocomplete: 'email' });
      case 'tel': return el('input', { id: key, name: key, type: 'tel', inputMode: 'numeric', placeholder: q.ph, autocomplete: 'tel' });
      case 'date': return el('input', { id: key, name: key, type: 'date' });
      case 'textarea': return el('textarea', { id: key, name: key, rows: 3 });
      case 'select':
        return el('select', { id: key, name: key },
          el('option', { value: '', text: '請選擇' }),
          q.options.map((o) => el('option', { value: o, text: o })));
      case 'birthday': return buildBirthday(key);
      case 'location': return el('div', { class: 'options' }, locs.map((l) => optionRow('radio', key, l.name, l.addr)));
      case 'radio': return el('div', { class: `options${q.options.every((o) => o.length <= 6) ? ' options--inline' : ''}` }, q.options.map((o) => optionRow('radio', key, o)));
      case 'checkbox': return el('div', { class: 'options' }, q.options.map((o) => optionRow('checkbox', key, o)));
      default: return null;
    }
  }

  const GROUP_KINDS = ['radio', 'checkbox', 'birthday', 'location'];

  function buildForm() {
    const fields = questions.map((q, i) => {
      const key = `q${i}`;
      const isGroup = GROUP_KINDS.includes(q.kind);
      const labelChildren = [
        el('span', { class: 'num', text: String(i + 1) }),
        q.label,
        q.required ? el('span', { class: 'req', text: ' *' }) : null,
        q.kind === 'checkbox' ? el('span', { class: 'hint', text: '（可複選）' }) : null,
      ];
      const err = el('p', { class: 'error', role: 'alert' });
      const input = buildInput(q, key);
      const hint = q.hint ? el('p', { class: 'field__hint', text: q.hint }) : null;
      return isGroup
        ? el('fieldset', { class: 'field', 'data-field': key }, el('legend', { class: 'field__label' }, labelChildren), hint, input, err)
        : el('div', { class: 'field', 'data-field': key }, el('label', { class: 'field__label', for: key }, labelChildren), hint, input, err);
    });

    const notice = cfg.notice.trim() ? el('div', { class: 'notice' }, EB.linkify(cfg.notice)) : null;
    const privacy = el('div', { class: 'privacy' }, el('h3', { text: '個人資料蒐集告知' }), el('p', { text: cfg.priv }));
    const consent = el('div', { class: 'field field--consent', 'data-field': 'consent' },
      el('label', { class: 'option' },
        el('input', { type: 'checkbox', id: 'consent' }),
        el('span', {}, '我已閱讀並同意上述個人資料蒐集告知 ', el('span', { class: 'req', text: '*' }))),
      el('p', { class: 'error', role: 'alert' }));
    form.replaceChildren(...fields, notice, privacy, consent,
      el('p', { id: 'submitError', class: 'error', role: 'alert' }),
      el('button', { type: 'submit', id: 'submitBtn', class: 'btn btn--primary', text: '送出報名' }));
  }

  // ---------- 驗證 ----------
  const setError = (name, message) => {
    const field = form.querySelector(`[data-field="${name}"]`);
    field.classList.toggle('invalid', Boolean(message));
    field.querySelector('.error').textContent = message || '';
    return field;
  };

  function validate() {
    const data = new FormData(form);
    const val = (k) => (data.get(k) || '').toString().trim();
    const errors = {};
    questions.forEach((q, i) => {
      const key = `q${i}`;
      if (q.kind === 'birthday') {
        const parts = ['y', 'm', 'd'].map((s) => val(`${key}_${s}`));
        const filled = parts.filter(Boolean).length;
        if ((q.required && filled === 0) || (filled > 0 && filled < 3)) errors[key] = '請選擇完整的年月日';
      } else if (q.kind === 'checkbox') {
        if (q.required && data.getAll(key).length === 0) errors[key] = '請至少選擇一項';
      } else if (q.kind === 'radio' || q.kind === 'location' || q.kind === 'select') {
        if (q.required && !val(key)) errors[key] = '請選擇一個選項';
      } else {
        const v = val(key);
        if (q.required && !v) errors[key] = '此欄位為必填';
        else if (v && q.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[key] = 'Email 格式不正確';
        else if (v && q.kind === 'tel' && !/^09\d{8}$/.test(v.replace(/[\s-]/g, ''))) errors[key] = '請輸入 10 碼手機號碼，例如 0912345678';
      }
    });
    if (!$('consent').checked) errors.consent = '請勾選同意個人資料蒐集告知';
    return errors;
  }

  // ---------- 雲端送出 ----------
  // 活動有連結雲端、且管理員已在 config.js 設定收件網址，才會真的送出資料
  const useCloud = Boolean(cfg.cloud && cfg.id && EB.endpoint());
  let submissionId = EB.newId(); // 同一次填寫重試時沿用，伺服器端據此去除重複

  function collectFields() {
    const data = new FormData(form);
    const pad = (v) => String(v).padStart(2, '0');
    const labels = EB.uniqueLabels(questions.map((q) => q.label));
    const fields = questions.map((q, i) => {
      const key = `q${i}`;
      let value;
      if (q.kind === 'birthday') {
        const [y, m, d] = ['y', 'm', 'd'].map((s) => data.get(`${key}_${s}`));
        value = y && m && d ? `${y}/${pad(m)}/${pad(d)}` : '';
      } else if (q.kind === 'checkbox') {
        value = data.getAll(key).join('、');
      } else {
        value = (data.get(key) || '').toString().trim();
      }
      return { label: labels[i], value };
    });
    fields.push({ label: '已同意個資告知', value: '是' });
    return fields;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = validate();
    let first = null;
    [...form.querySelectorAll('[data-field]')].forEach((f) => {
      const field = setError(f.dataset.field, errors[f.dataset.field]);
      if (errors[f.dataset.field] && !first) first = field;
    });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first.querySelector('input, select, textarea')?.focus({ preventScroll: true });
      return;
    }
    const nameIdx = questions.findIndex((q) => q.bank === 'name');
    const who = nameIdx >= 0 ? new FormData(form).get(`q${nameIdx}`).toString().trim() : '';

    if (useCloud) {
      const btn = $('submitBtn');
      $('submitError').textContent = '';
      btn.disabled = true;
      btn.textContent = '送出中…';
      try {
        await EB.callCloud({ action: 'submit', id: cfg.id, sid: submissionId, fields: collectFields() });
      } catch (err) {
        $('submitError').textContent = '送出失敗，請檢查網路後再按一次「送出報名」；若持續失敗，請聯絡主辦單位。';
        btn.disabled = false;
        btn.textContent = '送出報名';
        return;
      }
    }
    $('demoNote').hidden = useCloud;
    $('successText').textContent = `${who ? `${who}，` : ''}您已完成「${title}」的報名。`;
    form.hidden = true;
    $('formHeading').scrollIntoView({ behavior: 'smooth' });
    $('success').hidden = false;
    $('success').focus();
  });

  form.addEventListener('input', (e) => {
    const field = e.target.closest('[data-field]');
    if (field) setError(field.dataset.field, '');
  });

  $('resetBtn').addEventListener('click', () => {
    submissionId = EB.newId();
    buildForm();
    $('success').hidden = true;
    form.hidden = false;
    $('formHeading').scrollIntoView({ behavior: 'smooth' });
  });

  buildForm();
  $('content').hidden = false;
  $('siteNav').hidden = false;
})();
