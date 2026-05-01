// app.js — entry point / state machine
import { state, setState }    from './js/state.js'
import {
  calcRatio, adjustForNewRatio,
  parseTime, formatTime, fahrenheitToCelsius, round,
} from './js/calculator.js'
import {
  renderAll, renderDynamic, renderParams, renderMethodUI,
  renderTemplateOptions, renderTemplateDescription, renderTechniques,
  renderTemplateSuggestion, hideTemplateSuggestion, getPendingSuggestion,
  getMethodData, renderSteps,
} from './js/ui.js'
import { openRatioModal, initModal } from './js/modal.js'
import { V60 }       from './data/v60.js'
import { AEROPRESS } from './data/aeropress.js'
import { findMatchingRecipe, getRecipeById } from './js/RecipeService.js'
import { checkIsPossible } from './js/CalculationEngine.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _dismissedSuggestionId = null

function _afterChange() {
  const methodData = getMethodData()
  setState({ isPossible: checkIsPossible(state, methodData) })
  renderDynamic()
  _checkSuggestion()
}

function _checkSuggestion() {
  const match = findMatchingRecipe(state, state.template)
  if (match && match.recipe.id !== _dismissedSuggestionId) {
    renderTemplateSuggestion(match)
  } else if (!match) {
    _dismissedSuggestionId = null
    hideTemplateSuggestion()
  } else {
    hideTemplateSuggestion()
  }
}

function applyTemplate(recipe) {
  const { id, coffee_g, water_g, ratio, temp_c, brew_time_sec, aeropress_style } = recipe
  setState({
    template:       id,
    templateOrigin: { coffee_g, water_g, ratio, temp_c, brew_time_sec },
    coffee_g, water_g, ratio, temp_c, brew_time_sec,
    ...(aeropress_style ? { aeropress_style } : {}),
  })
  _dismissedSuggestionId = null
  hideTemplateSuggestion()
  renderAll()
}

// ─── Method Switch ─────────────────────────────────────────────────────────────

document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method
    setState({
      method,
      template: null, templateOrigin: null,
      pour_technique: null,
      ...(method === 'v60' ? V60 : AEROPRESS).defaults,
    })
    _dismissedSuggestionId = null
    hideTemplateSuggestion()
    // Reset active technique cards
    document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
      c.classList.remove('active')
    )
    renderAll()
  })
})

// ─── AeroPress Style Toggle ──────────────────────────────────────────────────

document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setState({ aeropress_style: btn.dataset.style })
    renderMethodUI()
    _afterChange()
  })
})

// ─── Template Selector ────────────────────────────────────────────────────────

document.getElementById('template-select')?.addEventListener('change', (e) => {
  const id = e.target.value
  if (!id) {
    setState({ template: null, templateOrigin: null })
    renderTemplateDescription(null)
    renderTechniques()
    renderDynamic()
    return
  }
  const recipe = getRecipeById(id)
  if (recipe) applyTemplate(recipe)
})

// ─── Template Suggestion Actions ────────────────────────────────────────────

document.getElementById('suggestion-apply')?.addEventListener('click', () => {
  const pending = getPendingSuggestion()
  if (pending) {
    applyTemplate(pending.recipe)
    const sel = document.getElementById('template-select')
    if (sel) sel.value = pending.recipe.id
  }
})

document.getElementById('suggestion-dismiss')?.addEventListener('click', () => {
  const pending = getPendingSuggestion()
  if (pending) _dismissedSuggestionId = pending.recipe.id
  hideTemplateSuggestion()
})

// ─── Coffee Input ──────────────────────────────────────────────────────────────

document.getElementById('coffee-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(val, state.water_g)
    setState({ coffee_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    _afterChange()
  }
})

// ─── Water Input ─────────────────────────────────────────────────────────────

document.getElementById('water-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (!isNaN(val) && val > 0) {
    const ratio = calcRatio(state.coffee_g, val)
    setState({ water_g: val, ratio })
    document.getElementById('ratio-input').value = round(ratio, 1)
    _afterChange()
  }
})

// ─── Ratio Input + Apply ────────────────────────────────────────────────────

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
    _checkSuggestion()
  })
})

document.getElementById('ratio-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('ratio-apply-btn').click()
})

// ─── Temperature ─────────────────────────────────────────────────────────────────

document.getElementById('temp-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  if (isNaN(val)) return
  const temp_c = state.temp_unit === 'C' ? val : fahrenheitToCelsius(val)
  setState({ temp_c: round(temp_c, 1) })
  _afterChange()
})

document.getElementById('temp-unit-toggle').addEventListener('click', () => {
  setState({ temp_unit: state.temp_unit === 'C' ? 'F' : 'C' })
  renderParams()
})

// ─── Brew Time ─────────────────────────────────────────────────────────────────

function _applyTime(raw, reformat = false) {
  const sec = parseTime(raw)
  if (!isNaN(sec) && sec > 0) {
    setState({ brew_time_sec: sec })
    if (reformat) document.getElementById('time-input').value = formatTime(sec)
    _afterChange()
  }
}

document.getElementById('time-input').addEventListener('input',   (e) => _applyTime(e.target.value))
document.getElementById('time-input').addEventListener('change',  (e) => _applyTime(e.target.value.trim(), true))
document.getElementById('time-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') _applyTime(e.target.value.trim(), true)
})

// ─── Pour Technique Selector (V60) ───────────────────────────────────────────────

document.querySelectorAll('.technique-card[data-technique]').forEach(card => {
  card.addEventListener('click', () => {
    const tech = card.dataset.technique
    const newTech = state.pour_technique === tech ? null : tech
    setState({ pour_technique: newTech })
    document.querySelectorAll('.technique-card[data-technique]').forEach(c => {
      c.classList.toggle('active', c.dataset.technique === newTech)
    })
    renderSteps()
  })
})

// ─── Modal ─────────────────────────────────────────────────────────────────

initModal()

// ─── Init ────────────────────────────────────────────────────────────────────

renderAll()
