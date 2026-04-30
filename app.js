// app.js — entry point
import { state, setState } from './js/state.js'
import {
  calcRatio, adjustForNewRatio,
  parseTime, formatTime, fahrenheitToCelsius, round
} from './js/calculator.js'
import { renderAll, renderParams, renderWarnings, renderSteps, renderMethodUI, getMethodData } from './js/ui.js'
import { openRatioModal, initModal } from './js/modal.js'
import { V60 } from './data/v60.js'
import { AEROPRESS } from './data/aeropress.js'

// ─── Method switch ──────────────────────────────────────────────────────────

document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method
    const data = method === 'v60' ? V60 : AEROPRESS
    setState({
      method,
      ...data.defaults,
    })
    renderMethodUI()
    renderAll()
  })
})

// ─── AeroPress style toggle ─────────────────────────────────────────────────

document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setState({ aeropress_style: btn.dataset.style })
    renderMethodUI()
    renderSteps()
  })
})

// ─── Coffee input ───────────────────────────────────────────────────────────

document.getElementById('coffee-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(val, state.water_g)
    setState({ coffee_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    renderWarnings()
    renderSteps()
  }
})

// ─── Water input ────────────────────────────────────────────────────────────

document.getElementById('water-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(state.coffee_g, val)
    setState({ water_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    renderWarnings()
    renderSteps()
  }
})

// ─── Ratio input + Apply ─────────────────────────────────────────────────────

document.getElementById('ratio-apply-btn').addEventListener('click', () => {
  const rawVal = document.getElementById('ratio-input').value
  const ratio_new = parseFloat(rawVal)
  if (isNaN(ratio_new) || ratio_new <= 0) return
  if (Math.abs(ratio_new - state.ratio) < 0.05) return  // no meaningful change

  const ratio_old = state.ratio
  setState({ pendingRatio: ratio_new })

  openRatioModal(ratio_old, ratio_new, (mode) => {
    const result = adjustForNewRatio(state.coffee_g, state.water_g, ratio_old, ratio_new, mode)
    setState({
      coffee_g: round(result.coffee_g, 2),
      water_g: round(result.water_g, 1),
      ratio: ratio_new,
      pendingRatio: null,
    })
    renderAll()
  })
})

// Allow pressing Enter on ratio input
document.getElementById('ratio-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('ratio-apply-btn').click()
})

// ─── Temperature ─────────────────────────────────────────────────────────────

document.getElementById('temp-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (isNaN(val)) return
  const temp_c = state.temp_unit === 'C' ? val : fahrenheitToCelsius(val)
  setState({ temp_c: round(temp_c, 1) })
  renderWarnings()
  renderSteps()
})

document.getElementById('temp-unit-toggle').addEventListener('click', () => {
  const newUnit = state.temp_unit === 'C' ? 'F' : 'C'
  setState({ temp_unit: newUnit })
  renderParams()  // re-render with converted value
})

// ─── Brew time ────────────────────────────────────────────────────────────────

document.getElementById('time-input').addEventListener('change', (e) => {
  const raw = e.target.value.trim()
  const sec = parseTime(raw)
  if (!isNaN(sec) && sec > 0) {
    setState({ brew_time_sec: sec })
    e.target.value = formatTime(sec)
    renderWarnings()
    renderSteps()
  }
})

// ─── Modal ────────────────────────────────────────────────────────────────────

initModal()

// ─── Init ─────────────────────────────────────────────────────────────────────

renderMethodUI()
renderAll()
