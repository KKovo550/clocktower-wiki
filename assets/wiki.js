
(function () {
  // The visual layer is isolated from search, navigation and tool state.
  if(typeof URL!=='undefined'){
    var experienceScript=document.createElement('script');
    experienceScript.src=new URL('./site-experience.js',document.currentScript?document.currentScript.src:new URL((document.body.getAttribute('data-root')||'')+'assets/wiki.js',document.baseURI)).href;
    experienceScript.defer=true;document.head.appendChild(experienceScript);
  }
  // Sticky panels track the real header height, including wrapped search controls.
  var header = document.querySelector('.site-header');
  if (header && header.getBoundingClientRect && document.documentElement && document.documentElement.style) {
    var lastHeaderHeight, lastViewportHeight;
    var updateHeaderSpace = function () {
      var height = Math.ceil(header.getBoundingClientRect().height);
      if (height !== lastHeaderHeight) {
        document.documentElement.style.setProperty('--wiki-header-height', height + 'px');
        lastHeaderHeight = height;
      }
      var viewportHeight = Math.floor(window.visualViewport ? window.visualViewport.height : window.innerHeight);
      if (viewportHeight !== lastViewportHeight) {
        document.documentElement.style.setProperty('--wiki-viewport-height', viewportHeight + 'px');
        lastViewportHeight = viewportHeight;
      }
    };
    updateHeaderSpace();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderSpace).observe(header);
    else window.addEventListener('resize', updateHeaderSpace);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateHeaderSpace);
  }

  // 渐进增强：无 JavaScript 时导航保持可见，桌面端始终展开。
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.setAttribute('aria-label', '站点导航');
    var collapseButton;
    function revealCurrentNavigation() {
      var selected = sidebar.querySelector('[aria-current=page]');
      if (!selected || !sidebar.getBoundingClientRect || !selected.getBoundingClientRect) return;
      var outer = sidebar.getBoundingClientRect(), item = selected.getBoundingClientRect();
      if (!outer.height || !item.height) return;
      var upper = outer.top + 12;
      if (item.top < upper) sidebar.scrollTop -= upper - item.top;
      else if (item.bottom > outer.bottom - 16) sidebar.scrollTop += item.bottom - outer.bottom + 16;
    }
    // Highlight the current page and every enclosing collection independently of hover.
    function updateCurrentNavigation() {
      if (typeof URL === "undefined" || !window.location || !sidebar.querySelectorAll) return;
      var current = new URL(window.location.href), links = Array.from(sidebar.querySelectorAll('a[href]'));
      function decoded(value) { try { return decodeURIComponent(value); } catch (_) { return value; } }
      var samePage = links.filter(function (link) {
        var target = new URL(link.href, document.baseURI);
        return target.origin === current.origin && decoded(target.pathname) === decoded(current.pathname);
      });
      var selected = samePage.find(function (link) { return decoded(new URL(link.href).hash) === decoded(current.hash); });
      if (!selected) selected = samePage.find(function (link) { var hash = decoded(new URL(link.href).hash); return !hash || hash === '#总览'; });
      links.forEach(function (link) { if (link === selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
      sidebar.querySelectorAll('.sidebar-group').forEach(function (group) { group.removeAttribute('data-current-branch'); });
      if (selected) {
        var group = selected.closest('.sidebar-group');
        while (group) {
          group.setAttribute('data-current-branch', '');
          group.open = true;
          group = group.parentElement.closest('.sidebar-group');
        }
      }
      if (window.requestAnimationFrame) window.requestAnimationFrame(revealCurrentNavigation);
    }
    updateCurrentNavigation();
    if (window.addEventListener) window.addEventListener('hashchange', updateCurrentNavigation);
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
      if (document.body.classList && document.body.classList.contains('mobile-nav-ready')) return;
      var expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? '收起导航' : '展开导航';
    });
    sidebar.appendChild(toggle);
    sidebar.appendChild(navigation);
    var headingRow = document.createElement('div');
    headingRow.className = 'sidebar-heading-row';
    var firstHeading = navigation.querySelector('h3');
    if (firstHeading) {
      firstHeading.parentNode.insertBefore(headingRow, firstHeading);
      headingRow.appendChild(firstHeading);
    } else navigation.insertBefore(headingRow, navigation.firstChild);
    collapseButton = document.createElement('button');
    collapseButton.type = 'button';
    collapseButton.className = 'sidebar-collapse';
    collapseButton.textContent = '收起分类';
    collapseButton.setAttribute('aria-label', '收起所有分类');
    collapseButton.setAttribute('aria-controls', navigation.id);
    collapseButton.title = '收起所有分类';
    headingRow.appendChild(collapseButton);
    collapseButton.addEventListener('click', function () {
      navigation.querySelectorAll('.sidebar-group[open]').forEach(function (group) { group.open = false; });
      collapseButton.focus({ preventScroll: true });
      sidebar.scrollTop = 0;
    });
    // Mobile drawer keeps the same navigation links and current-page highlight.
    if (header && document.body.classList && window.matchMedia) {
      var mobileMenu = window.matchMedia('(max-width: 820px)');
      var backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-label', '关闭导航');
      backdrop.tabIndex = -1;
      document.body.appendChild(backdrop);
      header.insertBefore(toggle, header.firstChild);
      document.body.classList.add('mobile-nav-ready');
      toggle.innerHTML = '<span aria-hidden="true">☰</span>';
      toggle.setAttribute('aria-label', '打开导航');
      function navigationFocusables() {
        return Array.from(navigation.querySelectorAll('a[href],summary')).filter(function (node) {
          var parent = node.parentElement;
          while (parent && parent !== navigation) {
            if (parent.tagName === 'DETAILS' && !parent.open && parent.firstElementChild !== node) return false;
            parent = parent.parentElement;
          }
          return !node.hidden;
        });
      }
      function setDrawer(open, returnFocus) {
        open = Boolean(open && mobileMenu.matches);
        document.body.classList.toggle('mobile-nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
        toggle.innerHTML = '<span aria-hidden="true">' + (open ? '×' : '☰') + '</span>';
        sidebar.inert = mobileMenu.matches && !open;
        if (open) {
          var firstLink = navigation.querySelector('[aria-current=page]') || navigationFocusables()[0];
          if (firstLink) firstLink.focus({ preventScroll: true });
          if (window.requestAnimationFrame) window.requestAnimationFrame(function () {
            if (!document.body.classList.contains('mobile-nav-open') || document.querySelector('dialog[open]')) return;
            if (firstLink) firstLink.focus({ preventScroll: true });
            revealCurrentNavigation();
          });
        } else if (returnFocus) toggle.focus({ preventScroll: true });
      }
      // Animated drawers may not accept focus until they are visibly on screen.
      sidebar.addEventListener('transitionend', function (event) {
        if (event.target !== sidebar || event.propertyName !== 'transform' || !mobileMenu.matches || !document.body.classList.contains('mobile-nav-open') || document.querySelector('dialog[open]')) return;
        if (document.activeElement !== document.body && document.activeElement !== toggle) return;
        var targets = navigationFocusables();
        var current = navigation.querySelector('[aria-current=page]');
        var target = targets.indexOf(current) >= 0 ? current : targets[0];
        if (target) target.focus({ preventScroll: true });
        revealCurrentNavigation();
      });
      // Replace the inline expansion behavior with drawer state.
      toggle.addEventListener('click', function () {
        setDrawer(!document.body.classList.contains('mobile-nav-open'), false);
      });
      backdrop.addEventListener('click', function () { setDrawer(false, true); });
      navigation.addEventListener('click', function (event) {
        if (event.target.closest('a[href]')) setDrawer(false, false);
      });
      document.addEventListener('keydown', function (event) {
        if (!document.body.classList.contains('mobile-nav-open') || document.querySelector('dialog[open]')) return;
        if (event.key === 'Escape') { event.preventDefault(); setDrawer(false, true); }
        if (event.key === 'Tab') {
          var links = navigationFocusables();
          var focusables = [toggle, collapseButton].concat(links);
          var index = focusables.indexOf(document.activeElement);
          var next = index < 0 ? 0 : (index + (event.shiftKey ? -1 : 1) + focusables.length) % focusables.length;
          event.preventDefault();
          focusables[next].focus();
        }
      });
      function resetDrawer() { setDrawer(false, false); }
      if (mobileMenu.addEventListener) mobileMenu.addEventListener('change', resetDrawer);
      else if (mobileMenu.addListener) mobileMenu.addListener(resetDrawer);
      window.addEventListener('pageshow', resetDrawer);
      setDrawer(false, false);
    }
  }
  if (typeof URL !== 'undefined' && (!window.matchMedia || window.matchMedia('(any-hover: hover)').matches) && document.querySelector && document.querySelector('.gallerybox a img, .homebrew-card a img, .role-index, .charinfo-img img')) {
    var previewScript = document.createElement('script');
    previewScript.src = new URL('./role-preview.js', document.currentScript ? document.currentScript.src : new URL((document.body.getAttribute('data-root') || '') + 'assets/wiki.js', document.baseURI)).href;
    document.head.appendChild(previewScript);
  }
  var input = document.getElementById('wiki-search-input');
  var box = document.getElementById('wiki-search-results');
  if (!input || !box) return;
  // 搜索结果里的 u 是相对站点根的路径，须按当前页面层级补前缀
  var ROOT = (document.body && document.body.getAttribute('data-root')) || '';
  var idx = [], ready = false, loading = false, composing = false, wanted = false, callbacks = [];
  var filter = document.getElementById('wiki-search-category');
  var status = document.getElementById('wiki-search-status');
  var sel = -1, cur = [], searchTimer;
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
    if (searchTimer !== undefined) clearTimeout(searchTimer);
    searchTimer = undefined;
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
  input.addEventListener('input', function () {
    if (searchTimer !== undefined) clearTimeout(searchTimer);
    searchTimer = undefined;
    if (composing) return;
    var query = input.value.trim();
    if (query && window.matchMedia && window.matchMedia('(max-width: 820px)').matches) {
      searchTimer = setTimeout(function () { render(input.value.trim()); }, 140);
    } else render(query);
  });
  input.addEventListener('focus', function () { loadIndex(); if (input.value.trim()) render(input.value.trim()); });
  if (filter) filter.addEventListener('change', function () { render(input.value.trim()); });
  input.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter' && searchTimer !== undefined) {
      clearTimeout(searchTimer);
      searchTimer = undefined;
      render(input.value.trim());
    }
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
