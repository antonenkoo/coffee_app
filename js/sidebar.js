// js/sidebar.js
export function initSidebar() {
  const burger = document.getElementById('burger-btn')
  burger.addEventListener('click', open)
  document.getElementById('sidebar-backdrop').addEventListener('click', close)

  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.addEventListener('click', close)
  })

  window.addEventListener('hashchange', _syncActive)
  _syncActive()
}

function open() {
  document.getElementById('sidebar').classList.add('open')
  document.getElementById('sidebar-backdrop').classList.add('visible')
}

function close() {
  document.getElementById('sidebar').classList.remove('open')
  document.getElementById('sidebar-backdrop').classList.remove('visible')
}

function _syncActive() {
  const hash = location.hash || '#home'
  const activeHref = hash === '#advanced' ? '#home' : hash
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('href') === activeHref)
  })
}
