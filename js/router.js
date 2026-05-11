// js/router.js — hash-based SPA router
import { calculatorView } from './views/calculator.js'
import { feedView }       from './views/feed.js'
import { recipesView }    from './views/recipes.js'
import { profileView }    from './views/profile.js'

const VIEWS = {
  '#calculator': calculatorView,
  '#feed':       feedView,
  '#recipes':    recipesView,
  '#profile':    profileView,
}

const TITLES = {
  '#calculator': '☕ Brew Calculator',
  '#feed':       '🌐 Feed',
  '#recipes':    '📚 Мои рецепты',
  '#profile':    '👤 Профиль',
}

let _currentHash = null

export function initRouter() {
  window.addEventListener('hashchange', _navigate)
  _navigate()
}

function _navigate() {
  const hash = location.hash || '#calculator'
  if (hash === _currentHash) return
  _currentHash = hash

  const view = VIEWS[hash]
  if (!view) { location.hash = '#calculator'; return }

  const container = document.getElementById('view')
  container.innerHTML = view.getHTML()

  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.textContent = TITLES[hash] || '☕'

  // sync sidebar highlight
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('href') === hash)
  })

  view.init()
}
