// js/views/feed.js
import { loadFeed } from '../firebase.js'
import { t, applyI18n } from '../i18n.js'

export const feedView = {
  getHTML() {
    return `
      <div id="loading-state" style="display:flex;justify-content:center;padding:40px;color:var(--text-dim);font-size:0.875rem;">Загрузка...</div>
      <div id="empty-state" class="hidden" style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:0.9rem;line-height:1.6;">
        <div style="font-size:2.5rem;margin-bottom:12px;">☕</div>
        <div data-i18n="feed.empty">Пока никто не поделился рецептами.</div>
        <div data-i18n="feed.empty.cta">Будьте первым — заварите кофе и нажмите «Поделиться»!</div>
      </div>
      <div id="error-state" class="hidden" style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:0.9rem;">
        <div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div>
        <div id="error-msg">Ошибка загрузки</div>
      </div>
      <div id="feed-list" style="display:flex;flex-direction:column;gap:16px;"></div>
      <button id="load-more-btn" class="hidden" data-i18n="feed.loadmore"
        style="width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:var(--radius-s);color:var(--text-muted);font-size:0.875rem;cursor:pointer;font-family:inherit;margin-top:8px;">
        Загрузить ещё
      </button>`
  },

  init() {
    applyI18n()
    const METHOD_NAMES  = { v60: 'V60', aeropress: 'AeroPress', filter: 'Filter' }
    const TASTE_LABELS  = { sweetness: 'Сладость', acidity: 'Кислотность', bitterness: 'Горечь' }

    function fmt(sec) {
      if (!sec) return '—'
      const m = Math.floor(sec / 60), s = sec % 60
      return `${m}:${String(s).padStart(2,'0')}`
    }
    function formatDate(ts) {
      if (!ts) return ''
      try {
        const d = ts.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
      } catch { return '' }
    }
    function tastePips(val, max = 5) {
      return Array.from({ length: max }, (_, i) =>
        `<div class="taste-pip ${i < val ? 'on' : ''}"></div>`
      ).join('')
    }

    function renderCard(r) {
      const method = METHOD_NAMES[r.method] ?? r.method ?? '—'
      const author = r.userNickname || (r.userEmail ? r.userEmail.split('@')[0] : 'аноним')
      const date   = formatDate(r.createdAt)
      const paramsLine = [
        r.coffee_g   ? `<span>${r.coffee_g}г</span> кофе` : null,
        r.water_g    ? `<span>${r.water_g}мл</span> воды` : null,
        r.ratio      ? `1:<span>${(+r.ratio).toFixed(1)}</span>` : null,
        r.method !== 'filter' && r.temp_c ? `<span>${r.temp_c}°C</span>` : null,
        r.brew_time_sec ? `<span>${fmt(r.brew_time_sec)}</span>` : null,
      ].filter(Boolean).join(' · ')
      const grinderLine = [
        r.grinder_name,
        r.grind_clicks  ? `${r.grind_clicks} кл` : null,
        r.grind_microns ? `${r.grind_microns} мкм` : null,
      ].filter(Boolean).join(' · ')
      const hasTaste = r.taste && Object.values(r.taste).some(v => v > 0)
      const tasteHtml = hasTaste
        ? `<div class="recipe-taste">
            ${Object.entries(r.taste).filter(([,v]) => v > 0).map(([k, v]) => `
              <div class="taste-row">
                <span class="taste-name">${TASTE_LABELS[k] ?? k}</span>
                <div class="taste-pips">${tastePips(v)}</div>
                <span style="font-size:0.7rem;color:var(--text-dim);min-width:12px">${v}</span>
              </div>`).join('')}
           </div>` : ''

      const card = document.createElement('div')
      card.className = 'recipe-card'
      card.innerHTML = `
        <div class="recipe-card-header">
          <span class="recipe-method-badge">${method}</span>
          <div class="recipe-meta">${author}<br>${date}</div>
        </div>
        <div class="recipe-params">${paramsLine}</div>
        ${r.bean      ? `<div class="recipe-bean">☕ ${r.bean}</div>` : ''}
        ${grinderLine ? `<div class="recipe-grinder">⚙ ${grinderLine}</div>` : ''}
        ${tasteHtml}
        ${r.notes     ? `<div class="recipe-notes">${r.notes}</div>` : ''}
        <div class="recipe-card-footer">
          <button class="btn-load">${t('feed.load.btn')}</button>
        </div>`

      card.querySelector('.btn-load').addEventListener('click', () => {
        sessionStorage.setItem('externalRecipe', JSON.stringify({
          method:        r.method,
          coffee_g:      r.coffee_g,
          water_g:       r.water_g,
          ratio:         r.ratio ?? null,
          temp_c:        r.temp_c,
          brew_time_sec: r.brew_time_sec,
          brewSteps:     r.brewSteps   ?? null,
          actualPours:   r.actualPours ?? null,
        }))
        location.hash = '#advanced'
      })
      return card
    }

    const listEl      = document.getElementById('feed-list')
    const loadingEl   = document.getElementById('loading-state')
    const emptyEl     = document.getElementById('empty-state')
    const errorEl     = document.getElementById('error-state')
    const loadMoreBtn = document.getElementById('load-more-btn')

    loadMoreBtn.addEventListener('mouseenter', () => {
      loadMoreBtn.style.borderColor = 'var(--accent)'
      loadMoreBtn.style.color = 'var(--accent)'
    })
    loadMoreBtn.addEventListener('mouseleave', () => {
      loadMoreBtn.style.borderColor = 'var(--border)'
      loadMoreBtn.style.color = 'var(--text-muted)'
    })

    let _page = 0
    const PAGE = 20

    async function loadPage() {
      loadMoreBtn.disabled = true
      try {
        const recipes = await loadFeed(PAGE * (_page + 1))
        loadingEl.style.display = 'none'
        if (recipes.length === 0) { emptyEl.classList.remove('hidden'); return }
        const newItems = recipes.slice(_page * PAGE)
        newItems.forEach(r => listEl.appendChild(renderCard(r)))
        _page++
        loadMoreBtn.classList.toggle('hidden', recipes.length < PAGE * _page)
        loadMoreBtn.disabled = false
      } catch (e) {
        loadingEl.style.display = 'none'
        errorEl.classList.remove('hidden')
        document.getElementById('error-msg').textContent = `Ошибка: ${e.message}`
      }
    }

    loadPage()
    loadMoreBtn.addEventListener('click', loadPage)
  }
}
