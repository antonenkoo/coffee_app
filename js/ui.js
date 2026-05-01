// js/ui.js
import { state } from './state.js'
import { formatRatio, formatTime, celsiusToFahrenheit, round } from './calculator.js'
import { getWarnings }    from './warnings.js'
import { getSteps }       from './steps.js'
import { getTips }        from './tips.js'
import { V60 }            from '../data/v60.js'
import { AEROPRESS }      from '../data/aeropress.js'
import { getRecipeById, getRecipesForMethod } from './RecipeService.js'
import { calcGrind, calcGrindRange, calcOptimalTemp, calcOptimalTime } from './CalculationEngine.js'

export function getMethodData() {
  return state.method === 'v60' ? V60 : AEROPRESS
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
  document.getElementById('time-input').value   = formatTime(state.brew_time_sec)

  const tempBtn = document.getElementById('temp-unit-toggle')
  if (state.temp_unit === 'C') {
    document.getElementById('temp-input').value = round(state.temp_c, 0)
    tempBtn.textContent = '°C'
  } else {
    document.getElementById('temp-input').value = round(celsiusToFahrenheit(state.temp_c), 0)
    tempBtn.textContent = '°F'
  }
}

// ─── Method / Style UI ────────────────────────────────────────────────────────

export function renderMethodUI() {
  const styleRow = document.getElementById('aeropress-style-row')
  if (styleRow) styleRow.style.display = state.method === 'aeropress' ? 'flex' : 'none'

  document.querySelectorAll('.method-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.method === state.method)
  )
  document.querySelectorAll('.style-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.style === state.aeropress_style)
  )
}

// ─── Template UI ─────────────────────────────────────────────────────────────

/** Populate the recipe <select> for the given method. */
export function renderTemplateOptions(method) {
  const select = document.getElementById('template-select')
  if (!select) return
  const recipes = getRecipesForMethod(method)
  select.innerHTML =
    `<option value="">— Выбрать рецепт —</option>` +
    recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')
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

/** Show pouring-technique cards for V60 (always, regardless of template). */
export function renderTechniques() {
  const el = document.getElementById('techniques-section')
  if (!el) return
  el.classList.toggle('hidden', state.method !== 'v60')
}

// ─── Grind Display ────────────────────────────────────────────────────────────

export function renderGrind() {
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
      <span class="rec-label">Оптимальная температура</span>
      <span class="rec-value${tempOk ? ' rec-match' : ''}">${optTemp}°C
        ${tempOk ? '<span class="rec-check">✓</span>' : ''}</span>
    </div>
    <div class="rec-row">
      <span class="rec-label">Оптимальное время</span>
      <span class="rec-value${timeOk ? ' rec-match' : ''}">${formatTime(optTime)}
        ${timeOk ? '<span class="rec-check">✓</span>' : ''}</span>
    </div>`
}

// ─── Impossible Overlay ───────────────────────────────────────────────────────

export function renderImpossible() {
  const overlay = document.getElementById('impossible-overlay')
  if (!overlay) return
  overlay.classList.toggle('hidden', state.isPossible)
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

export function renderSteps() {
  const list = document.getElementById('steps-list')
  const steps = getSteps(state)
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
