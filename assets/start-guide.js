(function () {
  if (window.clocktowerGuideReady) return;
  window.clocktowerGuideReady = true;
  var dialog, choices, panels, loading, previousFocus, backdropDown = false;
  function isGuideHash(hash) { return /^#(?:site-guide|guide-(?:roles|scripts|create|nights))$/.test(hash); }
  function select(index, focus) {
    choices.forEach(function (choice, position) {
      var selected = position === index;
      choice.setAttribute('aria-selected', String(selected));
      choice.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (focus) choices[index].focus();
  }
  function initialize(element) {
    var guide = element.querySelector('#site-guide');
    var navigation = guide && guide.querySelector('.guide-choices');
    choices = guide ? Array.from(guide.querySelectorAll('[data-guide-choice]')) : [];
    panels = choices.map(function (choice) { return guide.querySelector('#guide-' + choice.dataset.guideChoice); });
    if (!navigation || choices.length !== 4 || panels.some(function (panel) { return !panel; }) || typeof element.showModal !== 'function') throw Error('Guide unavailable');
    dialog = element;
    navigation.setAttribute('role', 'tablist');
    choices.forEach(function (choice, index) {
      choice.setAttribute('role', 'tab');
      choice.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].tabIndex = 0;
      choice.addEventListener('click', function (event) { event.preventDefault(); select(index, false); });
      choice.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowRight') next = (index + 1) % choices.length;
        else if (event.key === 'ArrowLeft') next = (index + choices.length - 1) % choices.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = choices.length - 1;
        else return;
        event.preventDefault(); select(next, true);
      });
    });
    element.querySelector('.guide-close').addEventListener('click', function () { dialog.close(); });
    function outside(event) {
      var rect = dialog.getBoundingClientRect();
      return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    }
    dialog.addEventListener('pointerdown', function (event) { backdropDown = outside(event); });
    dialog.addEventListener('click', function (event) { if (backdropDown && outside(event)) dialog.close(); backdropDown = false; });
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('site-guide-open');
      if (isGuideHash(location.hash)) history.replaceState(history.state, '', location.pathname + location.search);
      if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    });
    // An in-page inspiration link leaves the guide before scrolling to the collection.
    dialog.querySelectorAll('.guide-actions a').forEach(function (link) {
      link.addEventListener('click', function () {
        var target = new URL(link.href, location.href);
        if (target.pathname === location.pathname && target.search === location.search) dialog.close();
      });
    });
    guide.classList.add('guide-ready');
    select(0, false);
    return dialog;
  }
  function getDialog(trigger) {
    if (dialog) return Promise.resolve(dialog);
    var local = document.querySelector('.site-guide-dialog');
    if (local) return Promise.resolve().then(function () { return initialize(local); });
    if (!loading) {
      var source = new URL(trigger.href, location.href); source.hash = '';
      loading = fetch(source.href).then(function (response) {
        if (!response.ok) throw Error('Guide could not load');
        return response.text().then(function (html) { return { html: html, url: response.url || source.href }; });
      }).then(function (result) {
        var parsed = new DOMParser().parseFromString(result.html, 'text/html');
        var template = parsed.querySelector('.site-guide-dialog');
        if (!template) throw Error('Guide missing');
        var element = document.importNode(template, true);
        element.querySelectorAll('.guide-actions a').forEach(function (link) { link.href = new URL(link.getAttribute('href'), result.url).href; });
        document.body.appendChild(element);
        try { return initialize(element); } catch (error) { element.remove(); throw error; }
      }).catch(function (error) { loading = null; throw error; });
    }
    return loading;
  }
  function open(trigger, hash) {
    if (!trigger) return;
    trigger.setAttribute('aria-busy', 'true');
    getDialog(trigger).then(function (element) {
      if (!element.open) {
        previousFocus = trigger;
        element.showModal();
        document.documentElement.classList.add('site-guide-open');
        element.scrollTop = 0;
      }
      var index = choices.findIndex(function (choice) { return choice.getAttribute('href') === hash; });
      if (index >= 0) select(index, false);
      choices.find(function (choice) { return choice.getAttribute('aria-selected') === 'true'; }).focus({ preventScroll: true });
    }).catch(function () {
      // Local-file use and older browsers retain the normal homepage link.
      if (!document.querySelector('.site-guide-dialog')) location.href = trigger.href;
      else {
        document.querySelector('.site-guide-dialog').setAttribute('open', '');
        document.querySelector('.site-guide-dialog').scrollIntoView();
      }
    }).finally(function () { trigger.removeAttribute('aria-busy'); });
  }
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest && event.target.closest('[data-open-guide]');
    if (!trigger || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); open(trigger, new URL(trigger.href, location.href).hash);
  });
  function followHash() {
    if (isGuideHash(location.hash)) open(document.querySelector('[data-open-guide]'), location.hash);
  }
  window.addEventListener('hashchange', followHash);
  followHash();
})();
