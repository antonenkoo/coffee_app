// js/ui.js
import { state } from './state.js'
import { formatRatio, formatTime, celsiusToFahrenheit, round } from './calculator.js'
import { getWarnings } from './warnings.js'
import { getSteps }    from './steps.js'
import { getTips }     from './tips.js'
import { V60 }         from '../data/v60.js'
import { AEROPRESS }   from '../data/aeropress.js'

export function getMethodData() {
  return state.method === 'v60' ? V60 : AEROPRESS
}

// ─── Composite renders ────────────────────────────────────────────────────────

/** Full re-render: params + all reactive blocks. */
export function renderAll() {
  renderParams()
  renderDynamic()
}

/** Reactive blocks only (warnings + steps + tips). No param fields. */
export function renderDynamic() {
  renderWarnings()
  renderSteps()
  renderTips()
}

// ─── Individual renders ───────────────────────────────────────────────────────

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

export function renderMethodUI() {
  const styleRow = document.getElementById('aeropress-style-row')
  if (styleRow) styleRow.style.display = state.method === 'aeropress' ? 'flex' : 'none'

  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === state.method)
  })

  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === state.aeropress_style)
  })
}
