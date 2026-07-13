const sourceBibles = window.TAM_CORPUS || [];
const masterBible = window.TAM_MASTER_BIBLE || { meta: { wordCount: 0 }, chapters: [] };
const masterSource = {
  id: 'master_bible_v2',
  title: 'Comprehensive Game Bible v2.0',
  kind: 'canonical master',
  wordCount: masterBible.meta.wordCount,
  items: masterBible.chapters.map((chapter) => ({
    label: chapter.title,
    locator: chapter.number === null ? 'Front Matter' : `Chapter ${chapter.number}`,
    text: chapter.blocks.map((block) => block.text || (block.items || []).join('\n') || (block.rows || []).map((row) => row.join(' | ')).join('\n')).join('\n\n')
  }))
};
const sources = [masterSource, ...sourceBibles];
const files = {
  master_bible_v2: 'reference/Tap_Against_Me_Comprehensive_Game_Bible_v2.0.pdf',
  competitive_day_night: 'reference/Tap_Against_Me_Competitive_Day_Night_Gravity_Bible.pdf',
  tam_game_design_full: 'reference/Tap_Against_Me_TAM_Game_Design_Bible_v1.0.docx',
  game_design_addendum: 'reference/Tap_Against_Me_Game_Design_Bible_Addendum.pdf',
  tam_game_bible: 'reference/Tap_Against_Me_TAM_Game_Bible.docx',
  tam_design_bible: 'reference/Tap_Against_Me_TAM_Design_Bible_v1.0.pdf',
  game_bible_v1: 'reference/Tap_Against_Me_Game_Bible_v1.0.docx',
  game_design_v1: 'reference/Tap_Against_Me_Game_Design_Bible_v1.0.pdf',
  legacy_bible: 'reference/Tap_Against_Me_Original_Expanded_Bible.pdf'
};
const params = new URLSearchParams(location.search);
let active = sources.some((source) => source.id === params.get('source')) ? params.get('source') : 'all';
const tabs = document.querySelector('#source-tabs');
const results = document.querySelector('#source-results');
const search = document.querySelector('#corpus-search');
search.value = params.get('q') || '';

const totalWords = sources.reduce((total, source) => total + source.wordCount, 0);
document.querySelector('#word-total').textContent = new Intl.NumberFormat().format(totalWords);
const allButton = document.createElement('button');
allButton.className = 'source-tab';
allButton.dataset.id = 'all';
allButton.innerHTML = `<strong>Complete reference library</strong><span>MASTER + EIGHT UNIQUE SOURCES · ${new Intl.NumberFormat().format(totalWords)} WORDS</span>`;
allButton.onclick = () => { active = 'all'; render(); };
tabs.append(allButton);
sources.forEach((source) => {
  const button = document.createElement('button');
  button.className = 'source-tab';
  button.dataset.id = source.id;
  button.innerHTML = `<strong>${source.title}</strong><span>${source.kind.toUpperCase()} · ${new Intl.NumberFormat().format(source.wordCount)} WORDS</span>`;
  button.onclick = () => { active = source.id; render(); };
  tabs.append(button);
});

function escapeHtml(value) {
  return value.replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]));
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const terms = query.split(/\s+/).filter((term) => term.length > 1).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return safe;
  return safe.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>');
}

function render() {
  const source = sources.find((item) => item.id === active);
  const query = search.value.trim().toLowerCase();
  document.querySelectorAll('.source-tab').forEach((button) => button.classList.toggle('active', button.dataset.id === active));
  const allMode = active === 'all';
  document.querySelector('#source-name').textContent = allMode ? 'Complete Library' : source.title;
  const allUnits = sources.reduce((total, item) => total + item.items.length, 0);
  document.querySelector('#source-meta').innerHTML = allMode ? `GLOBAL INDEX<br>${allUnits} searchable units<br>${new Intl.NumberFormat().format(totalWords)} words` : `${source.kind.toUpperCase()}<br>${source.items.length} searchable units<br>${new Intl.NumberFormat().format(source.wordCount)} words`;
  document.querySelector('#open-original').hidden = allMode;
  if (!allMode) document.querySelector('#open-original').href = files[source.id];
  document.querySelector('#results-title').textContent = query ? 'MATCHING PASSAGES' : 'ALL SECTIONS';
  results.innerHTML = '';
  const pool = allMode ? sources.flatMap((owner) => owner.items.map((item) => ({ ...item, sourceTitle: owner.title }))) : source.items;
  const matches = pool.filter((item) => !query || item.text.toLowerCase().includes(query) || item.label.toLowerCase().includes(query));
  matches.forEach((item, index) => {
    const detail = document.createElement('details');
    detail.className = 'source-item';
    if (query && index < 6) detail.open = true;
    detail.innerHTML = `<summary><span class="locator">${item.locator}</span><h3>${item.label}${item.sourceTitle ? ` <small>· ${item.sourceTitle}</small>` : ''}</h3></summary><div class="source-text">${highlight(item.text, query)}</div>`;
    results.append(detail);
  });
  document.querySelector('#result-count').textContent = `${matches.length} of ${pool.length}`;
  document.querySelector('#no-results').hidden = matches.length !== 0;
}

search.oninput = render;
document.querySelector('#clear-search').onclick = () => { search.value = ''; render(); };
render();
