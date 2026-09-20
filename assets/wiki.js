
(function () {
  // Sticky panels track the real header height, including wrapped search controls.
  var header = document.querySelector('.site-header');
  if (header && header.getBoundingClientRect && document.documentElement && document.documentElement.style) {
    var updateHeaderSpace = function () {
      document.documentElement.style.setProperty('--wiki-header-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
    };
    updateHeaderSpace();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderSpace).observe(header);
    else window.addEventListener('resize', updateHeaderSpace);
  }

  // 渐进增强：无 JavaScript 时导航保持可见，桌面端始终展开。
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    var navigation = document.createElement('div');
    navigation.id = 'wiki-navigation';
    while (sidebar.firstChild) navigation.appendChild(sidebar.firstChild);
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sidebar-toggle';
    toggle.textContent = '展开导航';
    toggle.setAttribute('aria-controls', navigation.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? '收起导航' : '展开导航';
    });
    sidebar.appendChild(toggle);
    sidebar.appendChild(navigation);
  }
  var input = document.getElementById('wiki-search-input');
  var box = document.getElementById('wiki-search-results');
  if (!input || !box) return;
  // 搜索结果里的 u 是相对站点根的路径，须按当前页面层级补前缀
  var ROOT = (document.body && document.body.getAttribute('data-root')) || '';
  var idx = [], ready = false, loading = false, composing = false, wanted = false, callbacks = [];
  var filter = document.getElementById('wiki-search-category');
  var status = document.getElementById('wiki-search-status');
  var sel = -1, cur = [];
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', box.id);
  input.setAttribute('aria-expanded', 'false');
  box.setAttribute('role', 'listbox');

  function prepare() {
    idx = window.WIKI_INDEX || [];
    for (var i = 0; i < idx.length; i++) {
      idx[i]._t = idx[i].t.toLowerCase();
      idx[i]._s = (idx[i].b || idx[i].s || '').toLowerCase();
      idx[i]._aliases = (idx[i].aliases || []).map(function (x) { return x.toLowerCase(); });
    }
    ready = true;
  }
  function loaded() {
    loading = false;
    prepare();
    if (status) status.textContent = '';
    if (wanted && (document.activeElement === input || document.activeElement === filter)) render(input.value.trim());
    var pending = callbacks;
    callbacks = [];
    pending.forEach(function (callback) { callback(); });
  }
  function loadIndex(callback) {
    if (ready) { if (callback) callback(); return; }
    if (callback) callbacks.push(callback);
    if (loading) return;
    if (window.WIKI_INDEX) { loaded(); return; }
    loading = true;
    if (status) status.textContent = '正在加载搜索索引…';
    var script = document.createElement('script');
    script.src = ROOT + 'assets/search-index.js';
    script.onload = loaded;
    script.onerror = function () {
      loading = false;
      callbacks = [];
      script.remove();
      if (status) status.textContent = '搜索索引加载失败，请保留完整目录后重新输入重试。';
    };
    document.head.appendChild(script);
  }

  function close() {
    wanted = false;
    box.className = 'search-results';
    box.innerHTML = '';
    cur = [];
    sel = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    if (status) status.textContent = '';
  }

  function render(q) {
    if (!q) { close(); return; }
    if (composing) return;
    wanted = true;
    if (!ready) { loadIndex(); return; }
    var ql = q.toLowerCase();
    var out = [];
    for (var i = 0; i < idx.length; i++) {
      var e = idx[i], pos = e._t.indexOf(ql), score;
      if (filter && filter.value && e.c !== filter.value) continue;
      if (e._t === ql) score = 0;
      else if (e._aliases.indexOf(ql) >= 0) score = 1;
      else if (pos === 0) score = 2;
      else if (pos > 0 || e._aliases.some(function (alias) { return alias.indexOf(ql) >= 0; })) score = 3;
      else if (e._s.indexOf(ql) >= 0) score = 4;
      else continue;
      out.push([score, e]);
    }
    out.sort(function (a, b) {
      return a[0] - b[0] || a[1].t.length - b[1].t.length;
    });
    cur = out.slice(0, 15).map(function (x) { return x[1]; });
    if (!cur.length) { box.innerHTML = '<div class="none">没有匹配「' + esc(q) + '」的页面</div>'; }
    else {
      box.innerHTML = cur.map(function (e, i) {
        var text = e.b || e.s || '', at = text.toLowerCase().indexOf(ql);
        var start = Math.max(0, at - 35);
        var snippet = (start ? '…' : '') + text.slice(start, start + 160);
        return '<a role="option" aria-selected="false" id="wiki-result-' + i + '" href="' + esc(ROOT + e.u) + '" data-i="' + i + '"><span class="t">' +
          esc(e.t) + '</span><span class="s">' + esc(snippet) + '</span></a>';
      }).join('');
    }
    sel = -1;
    box.className = 'search-results on';
    input.setAttribute('aria-expanded', 'true');
    input.removeAttribute('aria-activedescendant');
    if (status) status.textContent = '找到 ' + out.length + ' 个结果，显示前 ' + cur.length + ' 个';
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function move(d) {
    var as = box.querySelectorAll('a');
    if (!as.length) return;
    if (sel >= 0) { as[sel].className = ''; as[sel].setAttribute('aria-selected', 'false'); }
    sel = sel < 0 ? (d > 0 ? 0 : as.length - 1) : (sel + d + as.length) % as.length;
    as[sel].className = 'sel';
    as[sel].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', as[sel].id);
    as[sel].scrollIntoView({ block: 'nearest' });
  }
  input.addEventListener('compositionstart', function () { composing = true; close(); });
  input.addEventListener('compositionend', function () { composing = false; render(input.value.trim()); });
  input.addEventListener('input', function () { if (!composing) render(input.value.trim()); });
  input.addEventListener('focus', function () { loadIndex(); if (input.value.trim()) render(input.value.trim()); });
  if (filter) filter.addEventListener('change', function () { render(input.value.trim()); });
  input.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') { close(); return; }
    if (!input.value.trim() || box.className !== 'search-results on') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      var as = box.querySelectorAll('a');
      var go = sel >= 0 ? as[sel] : as[0];
      if (go) { e.preventDefault(); window.location.href = go.getAttribute('href'); }
    }
  });
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input && e.target !== filter) close();
  });
  // 快捷键 / 聚焦搜索
  document.addEventListener('keydown', function (e) {
    if (!e.defaultPrevented && e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
      e.preventDefault(); input.focus();
    }
  });
  // 随机页面
  var rnd = document.getElementById('wiki-random');
  if (rnd) rnd.addEventListener('click', function (e) {
    e.preventDefault();
    loadIndex(function () {
      var entries = idx.filter(function (x) { return x.a; });
      if (entries.length) window.location.href = ROOT + entries[Math.floor(Math.random() * entries.length)].u;
    });
  });
})();
