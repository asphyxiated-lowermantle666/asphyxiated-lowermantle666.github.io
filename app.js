const pages = [...document.querySelectorAll('[data-page]')];
const routeLinks = [...document.querySelectorAll('[data-route]')];

function setRoute() {
  const target = (location.hash || '#overview').slice(1).split('?')[0];
  const page = pages.find((item) => item.id === target) || pages[0];
  pages.forEach((item) => item.classList.toggle('active', item === page));
  routeLinks.forEach((item) => item.classList.toggle('active', item.getAttribute('href') === `#${page.id}`));
  if (page.id === target) window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('hashchange', setRoute);
setRoute();

const filters = [...document.querySelectorAll('.wiki-filter')];
const entries = [...document.querySelectorAll('#wiki-grid article')];
const search = document.querySelector('#wiki-search');
const resultCount = document.querySelector('#result-count');
const noResults = document.querySelector('.no-results');
let activeFilter = 'all';

function filterWiki() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  entries.forEach((entry) => {
    const categoryMatch = activeFilter === 'all' || entry.dataset.category === activeFilter;
    const searchMatch = !query || entry.textContent.toLowerCase().includes(query);
    const show = categoryMatch && searchMatch;
    entry.hidden = !show;
    if (show) visible += 1;
  });
  resultCount.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}`;
  noResults.hidden = visible !== 0;
}

filters.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach((item) => item.classList.toggle('active', item === button));
  filterWiki();
}));
search.addEventListener('input', filterWiki);
