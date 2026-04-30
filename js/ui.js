// js/ui.js
import { state } from './state.js'
import { formatRatio, formatTime, celsiusToFahrenheit, round } from './calculator.js'
import { getWarnings } from './warnings.js'
import { getV60Steps, getAeropressSteps } from './steps.js'
import { V60 } from '../data/v60.js'
import { AEROPRESS } from '../data/aeropress.js'

export function getMethodData() {
  return state.method === 'v60' ? V60 : AEROPRESS
}

export function renderAll() {
  renderParams()
  renderWarnings()
  renderSteps()
}

export function renderParams() {
  document.getElementById('coffee-input').value = round(state.coffee_g, 1)
  document.getElementById('water-input').value = round(state.water_g, 0)
  document.getElementById('ratio-input').value = round(state.ratio, 1)
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

export function renderWarnings() {
  const el = document.getElementById('warnings')
  const methodData = getMethodData()
  const warnings = getWarnings(state, methodData)

  if (warnings.length === 0) {
    el.innerHTML = ''
    return
  }
  el.innerHTML = warnings.map(w => `<div class="warning">${w}</div>`).join('')
}

export function renderSteps() {
  const list = document.getElementById('steps-list')
  let steps

  if (state.method === 'v60') {
    steps = getV60Steps(state.coffee_g, state.water_g)
  } else {
    steps = getAeropressSteps(state.coffee_g, state.water_g, state.temp_c, state.aeropress_style)
  }

  list.innerHTML = steps.map(s =>
    `<li><span class="step-time">${s.time}</span><span class="step-action">${s.action}</span></li>`
  ).join('')
}

export function renderMethodUI() {
  // Show/hide AeroPress style toggle
  const styleRow = document.getElementById('aeropress-style-row')
  if (styleRow) {
    styleRow.style.display = state.method === 'aeropress' ? 'flex' : 'none'
  }

  // Update active method button
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === state.method)
  })

  // Update active style button
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === state.aeropress_style)
  })
}
