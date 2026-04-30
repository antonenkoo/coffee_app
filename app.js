// app.js — entry point
import { state, setState } from './js/state.js'
import {
  calcRatio, adjustForNewRatio,
  parseTime, formatTime, fahrenheitToCelsius, round
} from './js/calculator.js'
import {
  renderAll, renderDynamic, renderParams, renderMethodUI, getMethodData
} from './js/ui.js'
import { openRatioModal, initModal } from './js/modal.js'
import { V60 }       from './data/v60.js'
import { AEROPRESS } from './data/aeropress.js'

// ─── Method switch ──────────────────────────────────────────────────────────

document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method
    setState({ method, ...(method === 'v60' ? V60 : AEROPRESS).defaults })
    renderMethodUI()
    renderAll()
  })
})

// ─── AeroPress style toggle ─────────────────────────────────────────────────

document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setState({ aeropress_style: btn.dataset.style })
    renderMethodUI()
    renderDynamic()
  })
})

// ─── Coffee input ───────────────────────────────────────────────────────────

document.getElementById('coffee-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(val, state.water_g)
    setState({ coffee_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    renderDynamic()
  }
})

// ─── Water input ────────────────────────────────────────────────────────────

document.getElementById('water-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(state.coffee_g, val)
    setState({ water_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    renderDynamic()
  }
})

// ─── Ratio input + Apply ─────────────────────────────────────────────────────

document.getElementById('ratio-apply-btn').addEventListener('click', () => {
  const ratio_new = parseFloat(document.getElementById('ratio-input').value)
  if (isNaN(ratio_new) || ratio_new <= 0) return
  if (Math.abs(ratio_new - state.ratio) < 0.05) return

  const ratio_old = state.ratio
  setState({ pendingRatio: ratio_new })

  openRatioModal(ratio_old, ratio_new, (mode) => {
    const result = adjustForNewRatio(state.coffee_g, state.water_g, ratio_old, ratio_new, mode)
    setState({
      coffee_g: round(result.coffee_g, 2),
      water_g:  round(result.water_g, 1),
      ratio:    ratio_new,
      pendingRatio: null,
    })
    renderAll()
  })
})

document.getElementById('ratio-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('ratio-apply-btn').click()
})

// ─── Temperature ─────────────────────────────────────────────────────────────

document.getElementById('temp-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (isNaN(val)) return
  const temp_c = state.temp_unit === 'C' ? val : fahrenheitToCelsius(val)
  setState({ temp_c: round(temp_c, 1) })
  renderDynamic()
})

document.getElementById('temp-unit-toggle').addEventListener('click', () => {
  setState({ temp_unit: state.temp_unit === 'C' ? 'F' : 'C' })
  renderParams()
})

// ─── Brew time ────────────────────────────────────────────────────────────────

function _applyTime(raw, reformat = false) {
  const sec = parseTime(raw)
  if (!isNaN(sec) && sec > 0) {
    setState({ brew_time_sec: sec })
    if (reformat) document.getElementById('time-input').value = formatTime(sec)
    renderDynamic()
  }
}

document.getElementById('time-input').addEventListener('input',   (e) => _applyTime(e.target.value))
document.getElementById('time-input').addEventListener('change',  (e) => _applyTime(e.target.value.trim(), true))
document.getElementById('time-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') _applyTime(e.target.value.trim(), true)
})

// ─── Modal ────────────────────────────────────────────────────────────────────

initModal()

// ─── Init ─────────────────────────────────────────────────────────────────────

renderMethodUI()
renderAll()
