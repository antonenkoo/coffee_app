// js/views/profile.js
import { auth, logOut, getUserProfile, updateUserProfile, loadMyRecipes, loadCustomTechniques, deleteAllMyRecipes, deleteAllCustomTechniques } from '../firebase.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'
import { t, setLang, applyI18n } from '../i18n.js'
import { isGuest, showAuthOverlay } from '../auth-manager.js'
import { BLEScale } from '../scale.js'

let _authUnsubscribe = null
let _calScale = null

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

function _initAccuracyCard() {
  const card      = document.getElementById('acc-test-card')
  const hintEl    = document.getElementById('acc-hint')
  const progressEl= document.getElementById('acc-progress')
  const actionBtn = document.getElementById('acc-action-btn')
  const readingsEl= document.getElementById('acc-readings')
  const listEl    = document.getElementById('acc-readings-list')
  const verdictEl = document.getElementById('acc-verdict')
  const verdictMain = document.getElementById('acc-verdict-main')
  const verdictSub  = document.getElementById('acc-verdict-sub')
  const resetBtn  = document.getElementById('acc-reset-btn')
  if (!card) return

  const TESTS = {
    repeat: { hint: 'Ставьте тот же груз → нажмите «Измерить» → уберите → повторите 5 раз', btn: 'Измерить', total: 5 },
    drift:  { hint: 'Поставьте груз и нажмите «Старт» — 20 замеров каждую секунду', btn: 'Старт', total: 20 },
    zero:   { hint: 'Поставьте груз → «Вес» → уберите → «Ноль». 3 цикла', btn: 'Вес', total: 6 },
  }

  function grade(dev) {
    if (dev <= 0.10) return { label: '★★★ Отлично',         color: 'var(--accent)' }
    if (dev <= 0.30) return { label: '★★☆ Хорошо',          color: '#22c55e' }
    if (dev <= 0.60) return { label: '★☆☆ Приемлемо',       color: '#f59e0b' }
    return               { label: '✗ Нужен датчик лучше', color: 'var(--warning)' }
  }

  let activeTest = 'repeat'
  let st = {}

  function resetTest() {
    const t = TESTS[activeTest]
    st = { measurements: [], zeros: [], weights: [], phase: 'weight', timer: null, done: false }
    hintEl.textContent     = t.hint
    progressEl.textContent = activeTest === 'zero' ? 'Цикл 0 / 3' : `0 / ${t.total}`
    actionBtn.textContent  = t.btn
    actionBtn.disabled     = false
    readingsEl.style.display = 'none'
    verdictEl.style.display  = 'none'
    resetBtn.style.display   = 'none'
    listEl.innerHTML = ''
  }

  function setTab(t) {
    if (st.timer) { clearInterval(st.timer); st.timer = null }
    activeTest = t
    card.querySelectorAll('.acc-tab').forEach(b => b.classList.toggle('active', b.dataset.t === t))
    resetTest()
  }

  function addRow(label, val, accent) {
    readingsEl.style.display = ''
    const d = document.createElement('div')
    d.style.color = accent ? 'var(--text)' : 'var(--text-dim)'
    d.textContent = `${label}: ${val.toFixed(2)} г`
    listEl.appendChild(d)
  }

  function showVerdict(dev, sub) {
    const g = grade(dev)
    verdictMain.textContent = `${g.label} — погрешность ±${dev.toFixed(2)} г`
    verdictMain.style.color = g.color
    verdictSub.textContent  = sub
    verdictEl.style.display = ''
    resetBtn.style.display  = ''
    actionBtn.disabled = true
    st.done = true
  }

  function doRepeat() {
    const w = _calScale?.weight
    if (w == null) return
    st.measurements.push(w)
    addRow(`#${st.measurements.length}`, w, true)
    progressEl.textContent = `${st.measurements.length} / 5`
    if (st.measurements.length >= 5) {
      const mean   = st.measurements.reduce((a, b) => a + b, 0) / 5
      const diffs  = st.measurements.map(v => Math.abs(v - mean))
      const maxDev = Math.max(...diffs)
      const stdDev = Math.sqrt(diffs.reduce((a, b) => a + b * b, 0) / 5)
      const info = document.createElement('div')
      info.style.cssText = 'margin-top:4px;font-size:0.75rem;color:var(--text-dim);'
      info.textContent = `Среднее: ${mean.toFixed(2)} г  |  СКО: ±${stdDev.toFixed(2)} г`
      listEl.appendChild(info)
      showVerdict(maxDev, `Среднее ${mean.toFixed(2)} г, макс. отклонение от среднего ${maxDev.toFixed(2)} г`)
    }
  }

  function doDrift() {
    if (st.timer) return
    actionBtn.textContent = '...'
    actionBtn.disabled = true
    const total = 20
    let count = 0
    st.timer = setInterval(() => {
      const w = _calScale?.weight
      if (w == null) return
      st.measurements.push(w)
      count++
      addRow(`${count} с`, w, false)
      progressEl.textContent = `${count} / ${total}`
      if (count >= total) {
        clearInterval(st.timer)
        const mn = Math.min(...st.measurements), mx = Math.max(...st.measurements)
        showVerdict(mx - mn, `Мин ${mn.toFixed(2)} г, макс ${mx.toFixed(2)} г, диапазон ${(mx - mn).toFixed(2)} г`)
      }
    }, 1000)
  }

  function doZero() {
    const w = _calScale?.weight
    if (w == null) return
    if (st.phase === 'weight') {
      st.weights.push(w)
      addRow(`Вес #${st.weights.length}`, w, true)
      st.phase = 'zero'
      actionBtn.textContent = 'Ноль'
      hintEl.textContent = 'Уберите груз, дождитесь ~0 г, нажмите «Ноль»'
    } else {
      st.zeros.push(w)
      addRow(`Ноль #${st.zeros.length}`, w, false)
      progressEl.textContent = `Цикл ${st.zeros.length} / 3`
      if (st.zeros.length >= 3) {
        const maxZero    = Math.max(...st.zeros.map(Math.abs))
        const weightRange= Math.max(...st.weights) - Math.min(...st.weights)
        const worst      = Math.max(maxZero, weightRange / 2)
        showVerdict(worst,
          `Откл. нуля: макс ±${maxZero.toFixed(2)} г  |  Разброс веса: ${weightRange.toFixed(2)} г`)
        return
      }
      st.phase = 'weight'
      actionBtn.textContent = 'Вес'
      hintEl.textContent = 'Поставьте груз обратно, дождитесь стабилизации, нажмите «Вес»'
    }
  }

  card.querySelectorAll('.acc-tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.t)))
  actionBtn.addEventListener('click', () => {
    if (st.done) return
    if (activeTest === 'repeat') doRepeat()
    else if (activeTest === 'drift') doDrift()
    else if (activeTest === 'zero') doZero()
  })
  resetBtn.addEventListener('click', () => resetTest())

  setTab('repeat')
}

function _initScaleCard() {
  const statusEl  = document.getElementById('cal-ble-status')
  const calSect   = document.getElementById('cal-section')
  const connectBtn = document.getElementById('cal-connect-btn')
  const liveEl    = document.getElementById('cal-live-weight')
  const resultMsg = document.getElementById('cal-result-msg')
  const applyBtn  = document.getElementById('cal-apply-btn')
  const knownIn   = document.getElementById('cal-known-input')
  if (!connectBtn) return

  const accCard = document.getElementById('acc-test-card')

  _calScale = new BLEScale({
    onWeight: (g) => { if (liveEl) liveEl.textContent = g.toFixed(1) + ' г' },
    onState:  (state) => {
      if (!statusEl) return
      if (state === 'connected') {
        statusEl.textContent    = 'Подключены'
        calSect.style.display  = ''
        if (accCard) accCard.style.display = ''
        connectBtn.textContent = 'Отключить'
        connectBtn.disabled    = false
      } else if (state === 'connecting') {
        statusEl.textContent = 'Подключение...'
        connectBtn.disabled  = true
      } else {
        statusEl.textContent   = 'Не подключены'
        calSect.style.display  = 'none'
        if (accCard) accCard.style.display = 'none'
        if (liveEl) liveEl.textContent = '—'
        connectBtn.textContent = 'Подключить'
        connectBtn.disabled    = false
      }
    }
  })

  connectBtn.addEventListener('click', async () => {
    if (_calScale.state === 'connected') _calScale.disconnect()
    else await _calScale.connect()
  })

  applyBtn.addEventListener('click', async () => {
    const shownG = _calScale.weight
    const knownG = parseFloat(knownIn.value)
    if (isNaN(knownG) || knownG <= 0) {
      resultMsg.textContent = 'Введите эталонный вес'
      resultMsg.style.color = 'var(--warning)'
      return
    }
    applyBtn.disabled     = true
    resultMsg.textContent = ''
    const result = await _calScale.calibrate(shownG, knownG)
    const msgs = {
      ok:          { text: `✓ Откалибровано`,              color: 'var(--accent)'  },
      no_char:     { text: '✗ Прошивка не поддерживает',   color: 'var(--warning)' },
      no_weight:   { text: '✗ Поставьте груз на весы',     color: 'var(--warning)' },
      bad_ratio:   { text: '✗ Слишком большая погрешность', color: 'var(--warning)' },
      write_error: { text: '✗ Ошибка записи BLE',          color: 'var(--warning)' },
    }
    const m = msgs[result] || msgs.write_error
    resultMsg.textContent = m.text
    resultMsg.style.color  = m.color
    setTimeout(() => { applyBtn.disabled = false; resultMsg.textContent = '' }, 3000)
  })

  window.addEventListener('hashchange', () => {
    if (_calScale) { _calScale.disconnect(); _calScale = null }
  }, { once: true })

  _initAccuracyCard()
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
    </div>

    <div class="settings-card">
      <div class="settings-card-title">Весы</div>
      <div class="settings-row">
        <span class="settings-label">Bluetooth</span>
        <span id="cal-ble-status" class="settings-value">Не подключены</span>
      </div>
      <div class="settings-row" style="justify-content:flex-end;">
        <button id="cal-connect-btn" class="btn-secondary">Подключить</button>
      </div>

      <div id="cal-section" style="display:none;">
        <div class="settings-row">
          <span class="settings-label">Текущий вес</span>
          <span id="cal-live-weight" class="settings-value" style="font-variant-numeric:tabular-nums;min-width:56px;">—</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Эталонный вес (г)</span>
          <input id="cal-known-input" type="number" min="1" max="5000" step="0.1"
                 class="settings-input" placeholder="напр. 200">
        </div>
        <div class="settings-row" style="justify-content:space-between;">
          <span id="cal-result-msg" style="font-size:0.8rem;"></span>
          <button id="cal-apply-btn" class="nickname-save-btn">Откалибровать</button>
        </div>
        <div class="settings-row" style="padding-top:0;">
          <span style="font-size:0.75rem;color:var(--text-dim);line-height:1.5;">
            Поставьте груз известного веса, дождитесь стабильного показания, введите его точный вес и нажмите «Откалибровать». Коэффициент сохраняется в весах.
          </span>
        </div>
      </div>
    </div>

    <div id="acc-test-card" class="settings-card" style="display:none;">
      <div class="settings-card-title">Тест точности</div>
      <div class="settings-row" style="gap:6px;flex-wrap:wrap;padding-bottom:0;">
        <button class="acc-tab active" data-t="repeat">Повторяемость</button>
        <button class="acc-tab" data-t="drift">Дрейф</button>
        <button class="acc-tab" data-t="zero">Ноль</button>
      </div>
      <div class="settings-row" style="padding-top:6px;padding-bottom:0;">
        <span id="acc-hint" style="font-size:0.78rem;color:var(--text-dim);line-height:1.5;"></span>
      </div>
      <div class="settings-row" style="justify-content:space-between;align-items:center;">
        <span id="acc-progress" style="font-size:0.82rem;color:var(--text-dim);"></span>
        <button id="acc-action-btn" class="nickname-save-btn">Измерить</button>
      </div>
      <div id="acc-readings" style="display:none;padding:0 16px 4px;">
        <div id="acc-readings-list" style="font-size:0.8rem;line-height:1.9;font-variant-numeric:tabular-nums;"></div>
      </div>
      <div id="acc-verdict" style="display:none;" class="settings-row">
        <div style="width:100%;">
          <div id="acc-verdict-main" style="font-size:0.88rem;font-weight:600;margin-bottom:2px;"></div>
          <div id="acc-verdict-sub" style="font-size:0.75rem;color:var(--text-dim);"></div>
        </div>
      </div>
      <div class="settings-row" style="justify-content:flex-end;padding-top:0;">
        <button id="acc-reset-btn" class="btn-ghost" style="font-size:0.78rem;padding:4px 10px;display:none;">↺ Сбросить</button>
      </div>
    </div>`
  },

  init() {
    applyI18n()
    if (_authUnsubscribe) { _authUnsubscribe(); _authUnsubscribe = null }

    // Scale calibration card — always available, no auth required
    if (_calScale) { _calScale.disconnect(); _calScale = null }
    _initScaleCard()

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
