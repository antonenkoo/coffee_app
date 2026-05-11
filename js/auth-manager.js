// js/auth-manager.js — centralised auth + guest mode for SPA
import { auth, signIn, signUp, signInWithGoogle } from './firebase.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

const GUEST_KEY = 'coffeeGuestMode'

let _isGuest = localStorage.getItem(GUEST_KEY) === '1'
let _authReady = false
let _resolveAuthReady = null
const _authReadyPromise = new Promise(r => { _resolveAuthReady = r })

export function isGuest()         { return _isGuest }
export function currentUser()     { return auth.currentUser }
export function isAuthenticated() { return auth.currentUser !== null }
export function awaitAuth()       { return _authReady ? Promise.resolve(auth.currentUser) : _authReadyPromise }

export function showAuthOverlay() {
  const el = document.getElementById('auth-overlay')
  if (el) el.style.display = 'flex'
}

function _hideAuthOverlay() {
  const el = document.getElementById('auth-overlay')
  if (el) el.style.display = 'none'
}

export function initAuthManager() {
  const emailIn  = document.getElementById('email-input')
  const passIn   = document.getElementById('pass-input')
  const authError = document.getElementById('auth-error')

  function showErr(msg) {
    authError.textContent = msg
    authError.style.display = 'block'
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      _isGuest = false
      localStorage.removeItem(GUEST_KEY)
      _hideAuthOverlay()
    } else if (!_isGuest) {
      showAuthOverlay()
    }
    if (!_authReady) {
      _authReady = true
      _resolveAuthReady(user)
    }
  })

  document.getElementById('login-btn').addEventListener('click', async () => {
    authError.style.display = 'none'
    try { await signIn(emailIn.value.trim(), passIn.value) }
    catch (e) { showErr(e.message) }
  })

  document.getElementById('signup-btn').addEventListener('click', async () => {
    authError.style.display = 'none'
    try { await signUp(emailIn.value.trim(), passIn.value) }
    catch (e) { showErr(e.message) }
  })

  document.getElementById('google-btn').addEventListener('click', async () => {
    authError.style.display = 'none'
    try { await signInWithGoogle() }
    catch (e) { showErr(e.message) }
  })

  document.getElementById('guest-btn').addEventListener('click', () => {
    _isGuest = true
    localStorage.setItem(GUEST_KEY, '1')
    _hideAuthOverlay()
    if (!location.hash) location.hash = '#calculator'
  })
}
