/* Move existing article nodes into a reading layout; never replace imported abilities. */
(function () {
  'use strict';
  var main = document.querySelector('main.content');
  var article = main && main.querySelector('.mw-parser-output');
  var title = main && main.querySelector('h1.page-title');
  if (!article || !title || main.querySelector('.role-overview')) return;

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
  if (!/镇民|外来者|爪牙|恶魔|旅行者|传奇|奇遇/.test(kind)) return;
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
  if (english) { var englishLabel = element('span', 'role-english'); englishLabel.textContent = english; meta.appendChild(englishLabel); }
  var tagline = main.querySelector(':scope > .tagline'); if (tagline) meta.appendChild(tagline);
  information.appendChild(meta);
  var abilityBox = element('div', 'role-overview-ability');
  abilityNodes.forEach(function (node) { abilityBox.appendChild(node); }); information.appendChild(abilityBox);
  var action = article.querySelector('.role-script-link'); if (action) information.appendChild(action);

  var toc = main.querySelector(':scope > .toc');
  var headings = [ability].concat(Array.from(article.children).filter(function (node) { return node.tagName === 'H2'; }));
  var usedIds = new Set(Array.from(document.querySelectorAll('[id]')).map(function (node) { return node.id; }));
  headings.forEach(function (node) {
    if (node.id) return;
    var base = node.textContent.trim() || '章节', id = base, index = 2;
    while (usedIds.has(id)) id = base + '-' + index++;
    node.id = id; usedIds.add(id);
  });
  if (!toc && headings.length > 1) {
    toc = element('div', 'toc'); var links = document.createElement('ul');
    headings.forEach(function (node) {
      var li = document.createElement('li'), link = document.createElement('a');
      link.href = '#' + encodeURIComponent(node.id); link.textContent = node.textContent.trim(); li.appendChild(link); links.appendChild(li);
    });
    toc.appendChild(links);
  }
  main.insertBefore(overview, article);
  if (toc) {
    var layout = element('div', 'role-reading-layout'), aside = element('aside', 'role-reading-nav');
    var contents = element('details', 'role-contents'), summary = document.createElement('summary');
    summary.textContent = '本页目录'; contents.appendChild(summary); contents.appendChild(toc); aside.appendChild(contents);
    contents.open = !!(window.matchMedia && window.matchMedia('(min-width: 1101px)').matches);
    var oldHeading = toc.querySelector('.toctitle'); if (oldHeading) oldHeading.setAttribute('aria-hidden', 'true');
    main.insertBefore(layout, article); layout.appendChild(article); layout.appendChild(aside);
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
  main.classList.add('role-detail-page');
})();
