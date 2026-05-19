// js/ui.js
import { state } from './state.js'
import { formatRatio, formatTime, celsiusToFahrenheit, round } from './calculator.js'
import { t, applyI18n } from './i18n.js'
import { getWarnings }    from './warnings.js'
import { getSteps }       from './steps.js'
import { getTips }        from './tips.js'
import { V60 }            from '../data/v60.js'
import { AEROPRESS }      from '../data/aeropress.js'
import { FILTER }         from '../data/filter.js'
import { calcFilterBrewTime } from './CalculationEngine.js'
import { getRecipeById, getRecipesForMethod } from './RecipeService.js'
import { calcGrind, calcGrindRange, calcOptimalTemp, calcOptimalTime } from './CalculationEngine.js'

export function getMethodData() {
  if (state.method === 'v60')    return V60
  if (state.method === 'filter') return FILTER
  return AEROPRESS
}

// ─── Composite renders ────────────────────────────────────────────────────────

/** Full re-render: param inputs + all reactive blocks + structural UI. */
export function renderAll() {
  renderParams()
  renderMethodUI()
  renderTemplateOptions(state.method)
  renderTemplateDescription(getRecipeById(state.template))
  renderTechniques()
  renderDynamic()
  applyI18n()
}

/** Reactive blocks only — called on every parameter change without touching inputs. */
export function renderDynamic() {
  renderWarnings()
  renderSteps()
  renderTips()
  renderRecommended()
  renderGrind()
  renderImpossible()
  renderTemplateGhosts()
  renderHints()
}

// ─── Param fields ─────────────────────────────────────────────────────────────

export function renderParams() {
  document.getElementById('coffee-input').value = round(state.coffee_g, 1)
  document.getElementById('water-input').value  = round(state.water_g, 0)
  document.getElementById('ratio-input').value  = round(state.ratio, 1)

  if (state.method !== 'filter') {
    document.getElementById('time-input').value = formatTime(state.brew_time_sec)
    const tempBtn = document.getElementById('temp-unit-toggle')
    if (state.temp_unit === 'C') {
      document.getElementById('temp-input').value = round(state.temp_c, 0)
      tempBtn.textContent = '°C'
    } else {
      document.getElementById('temp-input').value = round(celsiusToFahrenheit(state.temp_c), 0)
      tempBtn.textContent = '°F'
    }
  }

  // Filter: manual grind input + auto time display
  if (state.method === 'filter') {
    const filterGrindEl = document.getElementById('filter-grind-input')
    if (filterGrindEl && state.grind_manual_microns != null) {
      filterGrindEl.value = state.grind_manual_microns
    }
    const filterTimeEl = document.getElementById('filter-time-display')
    if (filterTimeEl) filterTimeEl.textContent = formatTime(state.brew_time_sec)
  }
}

// ─── Method / Style UI ────────────────────────────────────────────────────────

export function renderMethodUI() {
  const isFilter    = state.method === 'filter'
  const isAeropress = state.method === 'aeropress'

  // AeroPress style toggle
  const styleRow = document.getElementById('aeropress-style-row')
  if (styleRow) styleRow.style.display = isAeropress ? 'flex' : 'none'

  // Filter: hide temp + time rows, show filter-specific rows
  const toggleRow = (id, hidden) => document.getElementById(id)?.classList.toggle('hidden', hidden)
  toggleRow('param-row-temp',         isFilter)
  toggleRow('param-row-time',         isFilter)
  toggleRow('param-row-grind-calc',   isFilter)
  toggleRow('param-row-filter-grind', !isFilter)
  toggleRow('param-row-filter-info',  !isFilter)

  // Filter: hide template selector (no recipes for filter)
  const templateRow = document.getElementById('template-row')
  if (templateRow) templateRow.classList.toggle('hidden', isFilter)

  // Filter: hide pouring techniques
  const techSection = document.getElementById('techniques-section')
  if (isFilter && techSection) techSection.classList.add('hidden')

  // Active method button
  document.querySelectorAll('.method-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.method === state.method)
  )
  document.querySelectorAll('.style-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.style === state.aeropress_style)
  )
}

// ─── Template UI ─────────────────────────────────────────────────────────────

/** Populate the recipe <select> for the given method. */
let _userRecipes = []

export function setUserRecipes(recipes) {
  _userRecipes = recipes ?? []
}

export function renderTemplateOptions(method) {
  const select = document.getElementById('template-select')
  if (!select) return
  const recipes = getRecipesForMethod(method)
  let html = `<option value="">${t('template.placeholder')}</option>` +
    recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')

  const mine = _userRecipes.filter(r => r.method === method)
  if (mine.length) {
    html += `<optgroup label="── Мои рецепты ──">` +
      mine.map(r => {
        const label = [
          r.bean || null,
          r.coffee_g ? `${r.coffee_g}г` : null,
          r.water_g  ? `${r.water_g}мл` : null,
          r.ratio    ? `1:${(+r.ratio).toFixed(1)}` : null,
          r.temp_c   ? `${r.temp_c}°C` : null,
        ].filter(Boolean).join(' · ')
        return `<option value="user:${r.id}">${label}</option>`
      }).join('') + '</optgroup>'
  }

  select.innerHTML = html
  select.value = state.template ?? ''
}

/** Show recipe description below the dropdown. */
export function renderTemplateDescription(recipe) {
  const el = document.getElementById('template-description')
  if (!el) return
  if (!recipe) { el.textContent = ''; el.classList.add('hidden'); return }
  el.textContent = recipe.description
  el.classList.remove('hidden')
}

/** Ghost labels: show original template value next to each input that diverged. */
export function renderTemplateGhosts() {
  const origin = state.templateOrigin

  const setGhost = (id, show, text = '') => {
    const el = document.getElementById(`${id}-ghost`)
    if (!el) return
    el.classList.toggle('hidden', !show)
    if (show) el.textContent = text
  }

  if (!origin) {
    ['coffee', 'water', 'ratio', 'temp', 'time'].forEach(k => setGhost(k, false))
    return
  }

  setGhost('coffee', Math.abs(state.coffee_g - origin.coffee_g) > 0.1,
    `↺ ${origin.coffee_g}g`)
  setGhost('water', Math.abs(state.water_g - origin.water_g) > 1,
    `↺ ${origin.water_g}g`)
  setGhost('ratio', Math.abs(state.ratio - origin.ratio) > 0.05,
    `↺ 1:${origin.ratio.toFixed(1)}`)

  const origTemp = state.temp_unit === 'C'
    ? origin.temp_c
    : Math.round(origin.temp_c * 9 / 5 + 32)
  const tempUnit = state.temp_unit === 'C' ? '°C' : '°F'
  setGhost('temp', Math.abs(state.temp_c - origin.temp_c) > 0.5,
    `↺ ${origTemp}${tempUnit}`)

  setGhost('time', Math.abs(state.brew_time_sec - origin.brew_time_sec) > 5,
    `↺ ${formatTime(origin.brew_time_sec)}`)
}

// ─── Template Suggestion Banner ───────────────────────────────────────────────

let _pendingSuggestion = null

export function renderTemplateSuggestion(matchResult) {
  const el = document.getElementById('template-suggestion')
  if (!el) return
  _pendingSuggestion = matchResult
  const textEl = document.getElementById('suggestion-text')
  if (textEl) {
    textEl.innerHTML =
      `Похоже на <strong>${matchResult.recipe.name}</strong> ` +
      `<span class="suggestion-count">(${matchResult.matchCount} параметра)</span>`
  }
  el.classList.remove('hidden')
}

export function hideTemplateSuggestion() {
  const el = document.getElementById('template-suggestion')
  if (el) el.classList.add('hidden')
  _pendingSuggestion = null
}

export function getPendingSuggestion() {
  return _pendingSuggestion
}

// ─── Techniques (no template selected) ───────────────────────────────────────

/** Show pouring-technique cards for V60 only. */
export function renderTechniques() {
  const el = document.getElementById('techniques-section')
  if (!el) return
  el.classList.toggle('hidden', state.method !== 'v60')
}

// ─── Grind Display ────────────────────────────────────────────────────────────

export function renderGrind() {
  // Filter has its own manual grind row — skip the calculated grind display
  if (state.method === 'filter') return

  const mEl = document.getElementById('grind-microns')
  const cEl = document.getElementById('grind-clicks')
  if (!mEl || !cEl) return

  if (!state.template) {
    const { minMicrons, maxMicrons, minClicks, maxClicks } = calcGrindRange(state.method)
    mEl.textContent = `${minMicrons}–${maxMicrons}`
    cEl.textContent = `${minClicks}–${maxClicks}`
  } else {
    const { microns, clicks } = calcGrind(state.method, state.ratio, state.brew_time_sec)
    mEl.textContent = microns
    cEl.textContent = clicks
  }
}

// ─── Recommended Parameters ───────────────────────────────────────────────────

export function renderRecommended() {
  const el = document.getElementById('rec-content')
  if (!el) return
  const optTemp = calcOptimalTemp(state.method, state.ratio, state.coffee_g)
  const optTime = calcOptimalTime(state.method, state.ratio, state.coffee_g)
  const tempOk  = Math.abs(state.temp_c - optTemp) <= 1
  const timeOk  = Math.abs(state.brew_time_sec - optTime) <= 15

  el.innerHTML = `
    <div class="rec-row">
      <span class="rec-label">${t('section.rec.temp')}</span>
      <span class="rec-value${tempOk ? ' rec-match' : ''}">${optTemp}°C
        ${tempOk ? '<span class="rec-check">✓</span>' : ''}</span>
    </div>
    <div class="rec-row">
      <span class="rec-label">${t('section.rec.time')}</span>
      <span class="rec-value${timeOk ? ' rec-match' : ''}">${formatTime(optTime)}
        ${timeOk ? '<span class="rec-check">✓</span>' : ''}</span>
    </div>`
}

// ─── Impossible Overlay ───────────────────────────────────────────────────────

export function renderImpossible() {
  const overlay = document.getElementById('impossible-overlay')
  if (overlay) overlay.classList.toggle('hidden', state.isPossible)

  const brewBtn = document.getElementById('brew-btn')
  if (brewBtn) {
    brewBtn.disabled = !state.isPossible
    brewBtn.title = state.isPossible ? '' : 'Параметры выходят за допустимые пределы'
  }
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

export function renderWarnings() {
  const el = document.getElementById('warnings')
  try {
    const warnings = getWarnings(state, getMethodData())
    if (warnings.length === 0) { el.innerHTML = ''; return }
    el.innerHTML = warnings.map(w => `
      <div class="warning warning--${w.level}">
        <span class="warning-message">${w.message}</span>
        <span class="warning-impact">${w.impact}</span>
        <span class="warning-advice">${w.advice}</span>
      </div>`).join('')
  } catch (e) {
    console.error('renderWarnings:', e)
    el.innerHTML = ''
  }
}

// ─── Steps ────────────────────────────────────────────────────────────────────

let _externalSteps = null   // brewSteps or actualPours from a loaded recipe

export function setExternalSteps(steps) {
  _externalSteps = steps ?? null
}

export function getExternalSteps() {
  return _externalSteps
}

// Convert brewSteps (timer format) → display format for the calculator view
function _brewStepsToDisplay(brewSteps) {
  const fmtSec = s => {
    if (s === null) return '—'
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }
  return brewSteps.map(s => ({
    time:   fmtSec(s.start_sec),
    action: s.action,
    note:   s.speed_gs != null
      ? `⚡ ${s.speed_gs} г/с${s.target_g != null ? ` → ${s.target_g}г` : ''}`
      : (s.note ?? null),
  }))
}

// Convert actualPours (scale recording) → display format
function _actualPoursToDisplay(pours) {
  return pours.map((p, i) => ({
    time:   `${Math.floor(p.start_sec / 60)}:${String(Math.round(p.start_sec) % 60).padStart(2, '0')}`,
    action: `Пролив ${i + 1}: <b>${p.amount_g}г</b> → итого <b>${p.target_g}г</b>`,
    note:   `${p.speed_gs} г/с · ${p.duration_sec}с`,
  }))
}

export function renderSteps() {
  const list = document.getElementById('steps-list')
  if (!list) return

  let steps
  if (_externalSteps?.brewSteps?.length) {
    steps = _brewStepsToDisplay(_externalSteps.brewSteps)
  } else if (_externalSteps?.actualPours?.length) {
    steps = _actualPoursToDisplay(_externalSteps.actualPours)
  } else {
    steps = getSteps(state)
  }

  list.innerHTML = steps.map(s => `
    <li>
      <span class="step-time">${s.time}</span>
      <div class="step-body">
        <span class="step-action">${s.action}</span>
        ${s.note ? `<span class="step-note">${s.note}</span>` : ''}
      </div>
    </li>`).join('')
}

// ─── Field Hints ─────────────────────────────────────────────────────────────

/** Shows subtle gray hints below temp and time when values deviate from optimal. */
export function renderHints() {
  const optTemp = calcOptimalTemp(state.method, state.ratio, state.coffee_g)
  const optTime = calcOptimalTime(state.method, state.ratio, state.coffee_g)

  const tempHint = document.getElementById('temp-hint')
  if (tempHint) {
    const show = Math.abs(state.temp_c - optTemp) > 2
    if (show) {
      const displayTemp = state.temp_unit === 'C' ? optTemp : Math.round(optTemp * 9 / 5 + 32)
      const unit = state.temp_unit === 'C' ? '°C' : '°F'
      tempHint.textContent = `оптимально: ${displayTemp}${unit}`
    }
    tempHint.classList.toggle('hidden', !show)
  }

  const timeHint = document.getElementById('time-hint')
  if (timeHint) {
    const show = Math.abs(state.brew_time_sec - optTime) > 20
    if (show) {
      const lo = formatTime(Math.max(60, optTime - 15))
      const hi = formatTime(optTime + 15)
      timeHint.textContent = `рекомендуем: ${lo}–${hi}`
    }
    timeHint.classList.toggle('hidden', !show)
  }
}

// ─── Tips ─────────────────────────────────────────────────────────────────────

export function renderTips() {
  const el = document.getElementById('tips-list')
  if (!el) return
  try {
    const tips = getTips(state, getMethodData())
    el.innerHTML = tips.map(t => `
      <li class="tip-item">
        <span class="tip-label">${t.label}</span>
        <span class="tip-text">${t.text}</span>
      </li>`).join('')
  } catch (e) {
    console.error('renderTips:', e)
    el.innerHTML = ''
  }
}
