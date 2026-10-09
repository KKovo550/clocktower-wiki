/* Move existing article nodes into a reading layout; never replace imported abilities. */
(function () {
  'use strict';
  var main = document.querySelector('main.content');
  var article = main && main.querySelector('.mw-parser-output');
  var title = main && main.querySelector('h1.page-title');
  if (!article || !title || main.querySelector('.role-overview, .role-reading-layout')) return;

  function metadata(label) {
    var rows = article.querySelectorAll('.charinfo-meta .row');
    for (var i = 0; i < rows.length; i++) {
      var key = rows[i].querySelector('.k'), value = rows[i].querySelector('.v');
      if (key && value && key.textContent.trim() === label) return value.textContent.trim();
    }
    var fields = article.querySelectorAll('li,p');
    for (var j = 0; j < fields.length; j++) {
      var match = fields[j].textContent.trim().match(new RegExp('^' + label + '[：:]\\s*(.+)$'));
      if (match) return match[1].trim();
    }
    return '';
  }
  var kind = metadata('角色类型');
  var origin = metadata('角色归属') || metadata('所属剧本');
  var categories = (metadata('能力标签') || metadata('能力类别')).split(/[、，,]/).map(function (value) { return value.trim(); }).filter(Boolean);
  if (!/镇民|外来者|爪牙|恶魔|旅行者|传奇|奇遇/.test(kind)) {
    var articleToc = main.querySelector(':scope > .toc') || article.querySelector(':scope > .toc');
    var hasSection = articleToc && Array.from(articleToc.querySelectorAll('a[href^="#"]')).some(function (link) {
      try { return !!document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch (_) { return false; }
    });
    if (hasSection) {
      main.classList.add('article-detail-page');
      mountContents(articleToc, '本页章节目录');
    }
    return;
  }
  var children = Array.from(article.children);
  // Stars pages begin with the final JSON configuration; keep that complete source block together.
  var ability = children.find(function (node) { return node.tagName === 'H2' && node.textContent.trim() === '角色配置'; }) ||
    children.find(function (node) { return node.tagName === 'H2' && node.textContent.trim() === '角色能力'; });
  if (!ability) return;
  var abilityNodes = [ability], next = ability.nextSibling;
  while (next && !(next.nodeType === 1 && next.tagName === 'H2')) { abilityNodes.push(next); next = next.nextSibling; }
  if (!abilityNodes.some(function (node) { return node !== ability && node.textContent.trim(); })) return;

  function element(tag, className) {
    var node = document.createElement(tag); node.className = className; return node;
  }
  var icon = article.querySelector('.charinfo-img');
  if (!icon) icon = children.slice(0, children.indexOf(ability)).find(function (node) {
    return node.tagName === 'IMG' || node.tagName === 'P' && node.querySelectorAll('img').length === 1 && !node.textContent.trim();
  });
  var overview = element('section', 'role-overview'); overview.setAttribute('aria-label', '角色概要');
  if (icon) {
    var imageBox = element('div', 'role-overview-icon'); imageBox.appendChild(icon); overview.appendChild(imageBox);
    overview.classList.add('has-icon');
    var image = imageBox.querySelector('img'); if (image) image.loading = 'eager';
  }
  var information = element('div', 'role-overview-main'); overview.appendChild(information);
  information.appendChild(title);
  var meta = element('div', 'role-overview-meta');
  if (ability.textContent.trim() !== '角色配置') {
    var badge = element('span', 'role-kind'); badge.textContent = kind;
    badge.classList.add(/爪牙|恶魔/.test(kind) ? 'is-evil' : /传奇|奇遇/.test(kind) ? 'is-special' : 'is-good');
    meta.appendChild(badge);
  }
  var english = metadata('英文名');
  if (english && title.textContent.indexOf(english) < 0) { var englishLabel = element('span', 'role-english'); englishLabel.textContent = english; meta.appendChild(englishLabel); }
  if (origin) { var sourceLabel = element('span', 'role-origin'); sourceLabel.textContent = origin; meta.appendChild(sourceLabel); }
  var tagline = main.querySelector(':scope > .tagline');
  information.appendChild(meta);
  if (categories.length) {
    var tags = element('div', 'role-overview-tags'); tags.setAttribute('aria-label', '能力标签');
    categories.slice(0, 6).forEach(function (value) { var tag = element('span', 'role-ability-tag'); tag.textContent = value; tags.appendChild(tag); });
    information.appendChild(tags);
  }
  var abilityBox = element('div', 'role-overview-ability');
  abilityNodes.forEach(function (node) { abilityBox.appendChild(node); }); information.appendChild(abilityBox);
  var action = article.querySelector('.role-script-link'); if (action) information.appendChild(action);

  var toc = main.querySelector(':scope > .toc') || article.querySelector(':scope > .toc');
  var headings = [ability].concat(Array.from(article.children).filter(function (node) { return node.tagName === 'H2'; }));
  var usedIds = new Set(Array.from(document.querySelectorAll('[id]')).map(function (node) { return node.id; }));
  headings.forEach(function (node) {
    if (node.id) return;
    var base = node.textContent.trim() || '章节', id = base, index = 2;
    while (usedIds.has(id)) id = base + '-' + index++;
    node.id = id; usedIds.add(id);
  });
  var jumps = element('nav', 'role-section-jumps'); jumps.setAttribute('aria-label', '角色资料快捷入口');
  [['运作方式','怎么玩'],['规则细节','规则细节'],['夜晚行动顺序','夜序'],['游玩与对抗技巧','技巧'],['整体设计','设计']].forEach(function (item) {
    var heading = headings.find(function (node) { return node.textContent.trim() === item[0]; });
    if (!heading) return;
    var link = document.createElement('a'); link.href = '#' + encodeURIComponent(heading.id); link.textContent = item[1]; jumps.appendChild(link);
  });
  if (jumps.childElementCount) information.appendChild(jumps);
  if (tagline) { tagline.classList.add('role-source-note'); information.appendChild(tagline); }
  if (!toc && headings.length > 1) {
    toc = element('div', 'toc'); var links = document.createElement('ul');
    headings.forEach(function (node) {
      var li = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + encodeURIComponent(node.id); link.textContent = node.textContent.trim(); li.appendChild(link); links.appendChild(li);
    });
    toc.appendChild(links);
  }
  main.insertBefore(overview, article);
  function mountContents(toc, label) {
    function create(tag, className) {
      var node = document.createElement(tag); node.className = className; return node;
    }
    var layout = create('div', 'role-reading-layout'), aside = create('aside', 'role-reading-nav');
    aside.setAttribute('aria-label', label);
    var contents = create('details', 'role-contents'), summary = document.createElement('summary');
    summary.textContent = '本页目录'; contents.appendChild(summary); contents.appendChild(toc); aside.appendChild(contents);
    contents.open = !!(window.matchMedia && window.matchMedia('(min-width: 1101px)').matches);
    var oldHeading = toc.querySelector('.toctitle'); if (oldHeading) oldHeading.setAttribute('aria-hidden', 'true');
    main.insertBefore(layout, article); layout.appendChild(article); layout.appendChild(aside);
    // Reuse the directory outside normal desktop paper; fluid windows keep it beside the centered text.
    var shell = main.parentElement;
    if (shell && shell.classList.contains('layout') && window.matchMedia) {
      var railMedia = window.matchMedia('screen and (min-width: 1800px)');
      var fluidMedia = window.matchMedia('screen and (min-width: 2000px)');
      var expandedMedia = window.matchMedia('(min-width: 1101px)');
      function placeContents() {
        var external = railMedia.matches && !fluidMedia.matches;
        var focused = aside.contains(document.activeElement) ? document.activeElement : null;
        shell.classList.toggle('has-role-reading-rail', external);
        main.classList.toggle('has-external-role-contents', external);
        aside.classList.toggle('role-reading-rail', external);
        if (aside.parentElement !== (external ? shell : layout)) {
          if (external) main.insertAdjacentElement('afterend', aside);
          else layout.appendChild(aside);
        }
        contents.open = external || expandedMedia.matches;
        if (focused) (contents.open ? focused : summary).focus({ preventScroll: true });
      }
      function watchMedia(media) {
        if (media.addEventListener) media.addEventListener('change', placeContents);
        else if (media.addListener) media.addListener(placeContents);
      }
      placeContents(); watchMedia(railMedia); watchMedia(fluidMedia); watchMedia(expandedMedia);
    }
    // Reflect native anchor navigation without intercepting clicks or observing every scroll.
    function updateContentsSelection() {
      var selectedId;
      try { selectedId = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { selectedId = ''; }
      toc.querySelectorAll('a[href^="#"]').forEach(function (link) {
        var id;
        try { id = decodeURIComponent(link.hash.slice(1)); } catch (_) { id = ''; }
        if (selectedId && id === selectedId && document.getElementById(id)) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    updateContentsSelection(); window.addEventListener('hashchange', updateContentsSelection);
  }
  if (toc) mountContents(toc, '角色章节目录');
  main.classList.add('role-detail-page');
})();
