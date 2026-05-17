// js/views/profile.js
import { auth, logOut, getUserProfile, updateUserProfile, loadMyRecipes, loadCustomTechniques, deleteAllMyRecipes, deleteAllCustomTechniques } from '../firebase.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'
import { t, setLang, applyI18n } from '../i18n.js'
import { isGuest, showAuthOverlay } from '../auth-manager.js'

let _authUnsubscribe = null

// ── Sound preview (used by profile page) ────────────────────────────────────
let _profileAudioCtx = null

async function _previewSound(mode) {
  if (mode === 'off') return
  try {
    if (!_profileAudioCtx) _profileAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (_profileAudioCtx.state === 'suspended') await _profileAudioCtx.resume()
  } catch (_) {}
  const ctx = _profileAudioCtx
  if (mode === 'beep')       { _tone(ctx, 660, 0.12, 0); _tone(ctx, 880, 0.20, 0.18) }
  else if (mode === 'bell')  { _tone(ctx, 1047, 0.6, 0, 'sine'); _tone(ctx, 1319, 0.3, 0.02, 'sine') }
  else if (mode === 'gong')  { _tone(ctx, 220, 1.4, 0, 'sine'); _tone(ctx, 110, 0.8, 0.05, 'sine') }
  else if (mode === 'chime') { _tone(ctx, 1568, 0.5, 0, 'sine'); _tone(ctx, 1976, 0.4, 0.12, 'sine'); _tone(ctx, 2093, 0.3, 0.25, 'sine') }
}

function _tone(ctx, freq, dur, delayStart = 0, type = 'sine') {
  try {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = type; osc.frequency.value = freq
    const t = ctx.currentTime + delayStart
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t); osc.stop(t + dur)
  } catch (_) {}
}

export const profileView = {
  getHTML() {
    return `
    <div id="loading-state" style="display:flex;justify-content:center;padding:48px;color:var(--text-dim);font-size:0.875rem;">Загрузка...</div>

    <div id="guest-wall" class="hidden" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-size:0.9rem;line-height:1.7;">
      <div class="state-icon">☕</div>
      <p>Войдите, чтобы управлять профилем, сохранять рецепты и настраивать приложение.</p>
      <button class="btn-primary guest-signin-btn" style="margin-top:16px;">Войти / Зарегистрироваться</button>
    </div>

    <div id="auth-prompt" class="hidden" style="text-align:center;padding:48px 20px;color:var(--text-muted);font-size:0.9rem;line-height:1.7;">
      <div class="state-icon">🔐</div>
      <div>Войдите, чтобы управлять профилем</div>
      <button class="btn-primary guest-signin-btn" style="margin-top:16px;">Войти</button>
    </div>

    <div id="profile-content" class="hidden" style="display:flex;flex-direction:column;gap:16px;">
      <div class="profile-header-info">
        <div class="profile-avatar" id="profile-avatar">☕</div>
        <div>
          <div class="profile-name" id="profile-display-name">—</div>
          <div class="profile-email" id="profile-email">—</div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title" data-i18n="profile.section.account">Аккаунт</div>
        <div class="settings-row">
          <span class="settings-label" data-i18n="profile.nickname">Никнейм</span>
          <div class="nickname-row">
            <input id="nickname-input" class="nickname-input" type="text" maxlength="24"
                   data-i18n="profile.nickname.placeholder" placeholder="Ваш никнейм">
            <button id="nickname-save" class="nickname-save-btn" data-i18n="profile.nickname.save">Сохранить</button>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-label" data-i18n="profile.email">Email</span>
          <span class="settings-value" id="profile-email-row">—</span>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title" data-i18n="profile.section.data">Данные</div>
        <div class="settings-row">
          <span class="settings-label">
            <span data-i18n="profile.recipes.count">Сохранённых рецептов</span>:
            <strong id="recipes-count-val">—</strong>
          </span>
          <button id="clear-recipes-btn" class="btn-danger-outline" data-i18n="profile.recipes.clear">Очистить</button>
        </div>
        <div class="settings-row">
          <span class="settings-label">
            <span data-i18n="profile.techniques.count">Кастомных техник</span>:
            <strong id="techniques-count-val">—</strong>
          </span>
          <button id="clear-techniques-btn" class="btn-danger-outline" data-i18n="profile.techniques.clear">Удалить</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title" data-i18n="profile.section.app">Приложение</div>
        <div class="settings-row">
          <span class="settings-label" data-i18n="profile.language">Язык</span>
          <div class="lang-switcher" style="margin-left:0;">
            <button class="lang-btn" data-lang="ru">RU</button>
            <button class="lang-btn" data-lang="uk">UA</button>
            <button class="lang-btn" data-lang="en">EN</button>
          </div>
        </div>
        <div class="settings-row sound-pref-row">
          <span class="settings-label">Звук будильника</span>
          <div class="sound-pref-controls">
            <select id="pref-alert-mode" class="settings-select">
              <option value="beep">Бип</option>
              <option value="bell">Колокольчик</option>
              <option value="gong">Гонг</option>
              <option value="chime">Чайм</option>
              <option value="off">Выкл</option>
            </select>
            <button id="pref-alert-preview" class="preview-sound-btn" title="Проверить звук">▶</button>
          </div>
        </div>
        <div class="settings-row">
          <span class="settings-label" data-i18n="profile.version">Версия</span>
          <a href="changelog.html" class="settings-value settings-value--accent" style="text-decoration:none;">v3.0</a>
        </div>
      </div>

      <button id="signout-btn" class="signout-btn" data-i18n="profile.signout">Выйти из аккаунта</button>
    </div>`
  },

  init() {
    applyI18n()
    if (_authUnsubscribe) { _authUnsubscribe(); _authUnsubscribe = null }

    // Guest wall
    if (isGuest()) {
      document.getElementById('loading-state').style.display = 'none'
      document.getElementById('guest-wall').classList.remove('hidden')
      document.querySelector('#guest-wall .guest-signin-btn').addEventListener('click', showAuthOverlay)
      return
    }

    // Lang switcher (available before auth)
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => { setLang(btn.dataset.lang); applyI18n() })
    })

    const loadingEl    = document.getElementById('loading-state')
    const authPrompt   = document.getElementById('auth-prompt')
    const contentEl    = document.getElementById('profile-content')
    const nicknameIn   = document.getElementById('nickname-input')
    const nicknameSave = document.getElementById('nickname-save')

    let _recipesCount    = 0
    let _techniquesCount = 0

    _authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      loadingEl.style.display = 'none'
      if (!user) {
        authPrompt.classList.remove('hidden')
        document.querySelector('#auth-prompt .guest-signin-btn').addEventListener('click', showAuthOverlay)
        return
      }
      authPrompt.classList.add('hidden')
      contentEl.classList.remove('hidden')

      document.getElementById('profile-email').textContent    = user.email
      document.getElementById('profile-email-row').textContent = user.email

      try {
        const [profile, recipes, techniques] = await Promise.all([
          getUserProfile(), loadMyRecipes(), loadCustomTechniques(),
        ])
        const nickname = profile?.nickname || ''
        nicknameIn.value = nickname
        document.getElementById('profile-display-name').textContent = nickname || user.email.split('@')[0]
        document.getElementById('profile-avatar').textContent = (nickname || user.email || '?')[0].toUpperCase()

        _recipesCount    = recipes.length
        _techniquesCount = techniques.length
        document.getElementById('recipes-count-val').textContent    = _recipesCount
        document.getElementById('techniques-count-val').textContent = _techniquesCount
        document.getElementById('clear-recipes-btn').disabled    = _recipesCount === 0
        document.getElementById('clear-techniques-btn').disabled = _techniquesCount === 0

        // Sound preference
        const alertSel     = document.getElementById('pref-alert-mode')
        const previewBtn   = document.getElementById('pref-alert-preview')
        if (alertSel) {
          const raw      = localStorage.getItem('coffee_alert_mode') || 'beep'
          const migrated = raw.startsWith('ja-') ? 'beep' : raw
          if (migrated !== raw) localStorage.setItem('coffee_alert_mode', migrated)
          alertSel.value = migrated
          alertSel.addEventListener('change', () => {
            localStorage.setItem('coffee_alert_mode', alertSel.value)
            updateUserProfile({ pref_alert_mode: alertSel.value }).catch(() => {})
          })
        }
        if (previewBtn) {
          previewBtn.addEventListener('click', async () => {
            previewBtn.textContent = '♪'
            setTimeout(() => { previewBtn.textContent = '▶' }, 1200)
            await _previewSound(alertSel?.value || 'beep')
          })
        }
      } catch (e) { console.error('Profile load error:', e) }
    })

    nicknameSave.addEventListener('click', async () => {
      const val = nicknameIn.value.trim()
      if (!val) return
      nicknameSave.disabled = true; nicknameSave.textContent = '...'
      try {
        await updateUserProfile({ nickname: val })
        document.getElementById('profile-display-name').textContent = val
        document.getElementById('profile-avatar').textContent = val[0].toUpperCase()
        nicknameSave.textContent = t('profile.nickname.saved')
        setTimeout(() => { nicknameSave.textContent = t('profile.nickname.save'); nicknameSave.disabled = false }, 1500)
      } catch (e) {
        alert(e.message)
        nicknameSave.textContent = t('profile.nickname.save'); nicknameSave.disabled = false
      }
    })

    document.getElementById('clear-recipes-btn').addEventListener('click', async () => {
      if (_recipesCount === 0) return
      if (!confirm(t('profile.confirm.clear.recipes'))) return
      const btn = document.getElementById('clear-recipes-btn')
      btn.disabled = true
      try {
        await deleteAllMyRecipes()
        _recipesCount = 0
        document.getElementById('recipes-count-val').textContent = 0
      } catch (e) { alert(e.message) }
      btn.disabled = _recipesCount === 0
    })

    document.getElementById('clear-techniques-btn').addEventListener('click', async () => {
      if (_techniquesCount === 0) return
      if (!confirm(t('profile.confirm.clear.techniques'))) return
      const btn = document.getElementById('clear-techniques-btn')
      btn.disabled = true
      try {
        await deleteAllCustomTechniques()
        _techniquesCount = 0
        document.getElementById('techniques-count-val').textContent = 0
      } catch (e) { alert(e.message) }
      btn.disabled = _techniquesCount === 0
    })

    document.getElementById('signout-btn').addEventListener('click', async () => {
      await logOut()
      location.hash = '#calculator'
    })
  }
}
