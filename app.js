// app.js — SPA entry point
import { initAuthManager } from './js/auth-manager.js'
import { initSidebar }     from './js/sidebar.js'
import { initRouter }      from './js/router.js'
import { applyI18n }       from './js/i18n.js'
import { auth }            from './js/firebase.js'
import { hideSplash }      from './js/splash.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

applyI18n()
initAuthManager()
initSidebar()
initRouter()

// Splash teardown — wait for auth state + minimum display time
const minDisplay = new Promise(r => setTimeout(r, 900))
let _authDone = false
const authReady = new Promise(resolve => {
  const unsub = onAuthStateChanged(auth, user => {
    if (_authDone) return
    _authDone = true
    unsub()
    resolve(user)
  })
  // Fallback if Firebase takes too long
  setTimeout(() => { if (!_authDone) { _authDone = true; resolve(null) } }, 3500)
})

Promise.all([minDisplay, authReady]).then(([, user]) => {
  const name = user?.displayName || (user?.email ? user.email.split('@')[0] : null) || 'Mark'
  hideSplash(name)
})
