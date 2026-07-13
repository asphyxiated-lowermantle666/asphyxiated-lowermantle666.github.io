const bible = window.TAM_MASTER_BIBLE;
const search = document.querySelector('#bible-search');
const chapterList = document.querySelector('#chapter-list');
const chapterNav = document.querySelector('#chapter-nav');
const partFilters = document.querySelector('#part-filters');
let activePart = 'all';

const partInfo = new Map([
  ['Front Matter', 'Governance, provenance, and navigation'],
  ...bible.parts.map((part) => [part.label, part.name])
]);

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function chapterText(chapter) {
  return `${chapter.title} ${chapter.part} ${chapter.partName} ${chapter.blocks.map((block) => block.text || (block.items || []).join(' ') || (block.rows || []).flat().join(' ')).join(' ')}`.toLowerCase();
}

function highlight(value, query) {
  const safe = escapeHtml(value);
  if (!query) return safe;
  const terms = query.split(/\s+/).filter((term) => term.length > 1).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return terms.length ? safe.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>') : safe;
}

function renderBlock(block, query) {
  if (block.type === 'heading') return `<h${block.level + 1} id="${escapeHtml(block.id)}">${highlight(block.text, query)}</h${block.level + 1}>`;
  if (block.type === 'p') return `<p>${highlight(block.text, query)}</p>`;
  if (block.type === 'ul' || block.type === 'ol') return `<${block.type}>${block.items.map((item) => `<li>${highlight(item, query)}</li>`).join('')}</${block.type}>`;
  if (block.type === 'table') {
    const [header, ...rows] = block.rows;
    return `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${highlight(cell, query)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${highlight(cell, query)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return '';
}

function chapterMarkup(chapter, query, forceOpen = false) {
  const wordCount = chapterText(chapter).split(/\s+/).length;
  const label = chapter.number === null ? 'FM' : String(chapter.number).padStart(2, '0');
  return `<details class="chapter" id="chapter-${chapter.id}" ${forceOpen ? 'open' : ''}>
    <summary><span class="chapter-number">${label}</span><strong class="chapter-title">${highlight(chapter.title.replace(/^\d+\.\s*/, ''), query)}</strong><span class="chapter-meta">${new Intl.NumberFormat().format(wordCount)} WORDS <b>+</b></span></summary>
    <div class="chapter-body"><div class="chapter-linkbar"><span>${escapeHtml(chapter.part)} / ${label}</span><button type="button" data-copy="chapter-${chapter.id}">COPY CHAPTER LINK</button></div>${chapter.blocks.map((block) => renderBlock(block, query)).join('')}</div>
  </details>`;
}

function setPart(part) {
  activePart = part;
  document.querySelectorAll('#part-filters button').forEach((button) => button.classList.toggle('active', button.dataset.part === part));
  render();
}

function openChapter(id) {
  const chapter = bible.chapters.find((item) => item.id === id);
  if (!chapter) return;
  if (activePart !== 'all' && activePart !== chapter.part) setPart('all');
  const element = document.querySelector(`#chapter-${CSS.escape(id)}`);
  if (!element) return;
  element.open = true;
  history.replaceState(null, '', `#chapter-${id}`);
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderNav(matches) {
  chapterNav.innerHTML = matches.map((chapter) => `<button type="button" data-chapter="${chapter.id}"><span>${chapter.number === null ? 'FM' : String(chapter.number).padStart(2, '0')}</span>${escapeHtml(chapter.title.replace(/^\d+\.\s*/, ''))}</button>`).join('');
  chapterNav.querySelectorAll('button').forEach((button) => button.onclick = () => openChapter(button.dataset.chapter));
  document.querySelector('#index-count').textContent = `${matches.length} SHOWN`;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const hashId = location.hash.replace(/^#chapter-/, '');
  const matches = bible.chapters.filter((chapter) => (activePart === 'all' || chapter.part === activePart) && (!query || chapterText(chapter).includes(query)));
  const groups = matches.reduce((result, chapter) => ((result[chapter.part] ||= []).push(chapter), result), {});
  chapterList.innerHTML = Object.entries(groups).map(([part, chapters]) => `<section class="part-group"><div class="part-heading"><div><span>${escapeHtml(part)}</span><h3>${escapeHtml(partInfo.get(part) || chapters[0].partName)}</h3></div><p>${chapters.length} reference ${chapters.length === 1 ? 'section' : 'sections'}</p></div>${chapters.map((chapter, index) => chapterMarkup(chapter, query, chapter.id === hashId || (Boolean(query) && index < 3))).join('')}</section>`).join('');
  renderNav(matches);
  document.querySelector('#result-count').textContent = `${matches.length} of ${bible.chapters.length} reference sections`;
  document.querySelector('#results-title').textContent = query ? 'SEARCH RESULTS' : activePart === 'all' ? 'ALL CHAPTERS' : activePart.toUpperCase();
  document.querySelector('#empty-state').hidden = matches.length !== 0;
  document.querySelectorAll('[data-copy]').forEach((button) => button.onclick = async () => {
    const url = `${location.href.split('#')[0]}#${button.dataset.copy}`;
    try { await navigator.clipboard.writeText(url); button.textContent = 'LINK COPIED'; } catch { location.hash = button.dataset.copy; }
  });
  document.querySelectorAll('.chapter').forEach((detail) => detail.addEventListener('toggle', () => {
    if (detail.open) history.replaceState(null, '', `#${detail.id}`);
  }));
}

const filterValues = ['all', ...partInfo.keys()];
partFilters.innerHTML = filterValues.map((part) => `<button type="button" class="${part === 'all' ? 'active' : ''}" data-part="${escapeHtml(part)}">${part === 'all' ? 'ALL PARTS' : escapeHtml(part).toUpperCase()}</button>`).join('');
partFilters.querySelectorAll('button').forEach((button) => button.onclick = () => setPart(button.dataset.part));
search.oninput = render;
document.querySelector('#clear-search').onclick = () => { search.value = ''; setPart('all'); search.focus(); };
document.querySelector('#chapter-stat').textContent = bible.meta.chapterCount;
document.querySelector('#word-stat').textContent = new Intl.NumberFormat().format(bible.meta.wordCount);
document.querySelector('#table-stat').textContent = bible.meta.tableCount;
render();
if (location.hash.startsWith('#chapter-')) requestAnimationFrame(() => openChapter(location.hash.replace('#chapter-', '')));
