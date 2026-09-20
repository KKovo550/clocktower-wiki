(function () {
  'use strict';
  const form = document.getElementById('homebrew-filters');
  if (!form) return;
  const query = document.getElementById('homebrew-query');
  const team = document.getElementById('homebrew-team');
  const cards = Array.from(document.querySelectorAll('.homebrew-card'));
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const texts = cards.map(card => normalize(card.dataset.search || card.textContent));
  function readSection() {
    let section = '';
    try { section = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* Invalid URL fragment: show all. */ }
    team.value = Array.from(team.options).some(option => option.value === section) ? section : '';
    query.value = '';
    render();
    if (section && section !== '总览') form.scrollIntoView?.({block: 'start'});
  }
  function render() {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach((card, i) => {
      card.hidden = !!(team.value && card.dataset.team !== team.value) || !words.every(word => texts[i].includes(word));
      if (!card.hidden) count++;
    });
    document.getElementById('homebrew-count').textContent = `显示 ${count} / ${cards.length} 个角色`;
    document.getElementById('homebrew-empty').hidden = count !== 0;
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('reset', () => setTimeout(render, 0));
  window.addEventListener('hashchange', readSection);
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.href, location.href);
      if (target.pathname === location.pathname && target.hash === location.hash) {
        event.preventDefault();
        readSection();
      }
    });
  });
  readSection();
}());
