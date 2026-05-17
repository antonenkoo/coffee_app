// js/router.js — hash-based SPA router
import { homeView }       from './views/home.js'
import { calculatorView } from './views/calculator.js'
import { feedView }       from './views/feed.js'
import { recipesView }    from './views/recipes.js'
import { profileView }    from './views/profile.js'

const VIEWS = {
  '#home':       homeView,
  '#advanced':   calculatorView,
  '#feed':       feedView,
  '#recipes':    recipesView,
  '#profile':    profileView,
}

const TITLES = {
  '#home':       '☕ Режим заварки',
  '#advanced':   '⚗️ Калькулятор',
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
  const hash = location.hash || '#home'
  if (hash === _currentHash) return
  _currentHash = hash

  const view = VIEWS[hash]
  if (!view) { location.hash = '#home'; return }

  const container = document.getElementById('view')
  container.innerHTML = view.getHTML()

  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.textContent = TITLES[hash] || '☕'

  // sync sidebar highlight — home and advanced both highlight the brew nav item
  const activeHref = (hash === '#advanced') ? '#home' : hash
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('href') === activeHref)
  })

  view.init()
}
