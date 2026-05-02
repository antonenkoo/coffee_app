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
import { FILTER }    from './data/filter.js'
import { findMatchingRecipe, getRecipeById } from './js/RecipeService.js'
import { checkIsPossible, calcFilterBrewTime } from './js/CalculationEngine.js'
import { getBrewSteps } from './js/steps.js'
import { auth, signIn, signUp, signInWithGoogle } from './js/firebase.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

// ─── Auth UI ──────────────────────────────────────────────────────────────────

const authOverlay = document.getElementById('auth-overlay')
const emailIn     = document.getElementById('email-input')
const passIn      = document.getElementById('pass-input')
const authError   = document.getElementById('auth-error')

function showAuthError(msg) {
  authError.textContent = msg
  authError.style.display = 'block'
}

// Firebase tells us definitively whether a user is logged in.
// Overlay starts hidden (display:none in HTML); we only show it when confirmed no user.
onAuthStateChanged(auth, (user) => {
  authOverlay.style.display = user ? 'none' : 'flex'
})

document.getElementById('login-btn').addEventListener('click', async () => {
  authError.style.display = 'none'
  try {
    await signIn(emailIn.value.trim(), passIn.value)
  } catch (e) {
    showAuthError(e.message)
  }
})

document.getElementById('signup-btn').addEventListener('click', async () => {
  authError.style.display = 'none'
  try {
    await signUp(emailIn.value.trim(), passIn.value)
  } catch (e) {
    showAuthError(e.message)
  }
})

document.getElementById('google-btn').addEventListener('click', async () => {
  authError.style.display = 'none'
  try {
    await signInWithGoogle()
  } catch (e) {
    showAuthError(e.message)
  }
})


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

// ─── Validation ─────────────────────────────────────────────────────────────

function setFieldError(name, msg) {
  const inputEl = document.getElementById(`${name}-input`)
  const errorEl = document.getElementById(`${name}-error`)
  const hasError = !!msg
  if (inputEl) inputEl.classList.toggle('input--invalid', hasError)
  if (errorEl) {
    errorEl.textContent = msg ?? ''
    errorEl.classList.toggle('hidden', !hasError)
  }
}

// ─── Method Switch ─────────────────────────────────────────────────────────────

document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method
    if (method === state.method) return

    const methodData = method === 'v60' ? V60 : method === 'filter' ? FILTER : AEROPRESS
    const r = methodData.ranges

    if (method === 'filter') {
      // Filter: use its own defaults (fixed params)
      setState({
        method,
        template: null, templateOrigin: null,
        pour_technique: null,
        ...FILTER.defaults,
      })
    } else {
      // V60 / AeroPress: preserve coffee_g + ratio, recalculate water, clip to ranges
      const coffee_g = Math.max(r.coffee_g.min, Math.min(r.coffee_g.max, state.coffee_g))
      const ratio    = Math.max(r.ratio.min,    Math.min(r.ratio.max,    state.ratio))
      const water_g  = Math.max(r.water_g.min,  Math.min(r.water_g.max,  Math.round(coffee_g * ratio)))
      setState({
        method,
        template: null, templateOrigin: null,
        pour_technique: null,
        temp_c:        methodData.defaults.temp_c,
        brew_time_sec: methodData.defaults.brew_time_sec,
        coffee_g, ratio, water_g,
      })
    }

    _dismissedSuggestionId = null
    hideTemplateSuggestion()
    document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
      c.classList.remove('active')
    )
    renderAll()
  })
})

// ─── Reset ───────────────────────────────────────────────────────────────────

document.getElementById('reset-btn')?.addEventListener('click', () => {
  const methodData = state.method === 'v60' ? V60 : state.method === 'filter' ? FILTER : AEROPRESS
  setState({
    ...methodData.defaults,
    template: null, templateOrigin: null,
    pour_technique: null,
  })
  localStorage.clear()
  _dismissedSuggestionId = null
  hideTemplateSuggestion()
  document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
    c.classList.remove('active')
  )
  renderAll()
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
  const methodData = getMethodData()
  const { min, max } = methodData.ranges.coffee_g
  if (isNaN(val) || val < min || val > max) {
    setFieldError('coffee', `от ${min} до ${max} г`)
    return
  }
  setFieldError('coffee', null)
  const ratio = calcRatio(val, state.water_g)
  setState({ coffee_g: val, ratio })
  document.getElementById('ratio-input').value = round(ratio, 1)
  _afterChange()
})

// ─── Water Input ─────────────────────────────────────────────────────────────

document.getElementById('water-input').addEventListener('input', (e) => {
  const val = parseFloat(e.target.value)
  const methodData = getMethodData()
  const { min, max } = methodData.ranges.water_g
  if (isNaN(val) || val < min || val > max) {
    setFieldError('water', `от ${min} до ${max} г`)
    return
  }
  setFieldError('water', null)
  const ratio = calcRatio(state.coffee_g, val)
  const patch = { water_g: val, ratio }
  // Filter: auto-recalculate brew time from water volume
  if (state.method === 'filter') patch.brew_time_sec = calcFilterBrewTime(val)
  setState(patch)
  document.getElementById('ratio-input').value = round(ratio, 1)
  _afterChange()
})

// ─── Filter: Manual Grind Input ───────────────────────────────────────────────

document.getElementById('filter-grind-input')?.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10)
  if (isNaN(val) || val < 300 || val > 1200) return
  setState({ grind_manual_microns: val })
})

// ─── Ratio Input + Apply ────────────────────────────────────────────────────

let _ratioModalOpen = false

function _openRatioModal() {
  if (_ratioModalOpen) return
  const ratio_new = parseFloat(document.getElementById('ratio-input').value)
  if (isNaN(ratio_new) || ratio_new < 8 || ratio_new > 20) {
    setFieldError('ratio', 'от 8 до 20')
    return
  }
  setFieldError('ratio', null)
  if (Math.abs(ratio_new - state.ratio) < 0.05) return

  const ratio_old = state.ratio
  setState({ pendingRatio: ratio_new })
  _ratioModalOpen = true

  openRatioModal(ratio_old, ratio_new, (mode) => {
    _ratioModalOpen = false
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
}

document.getElementById('ratio-apply-btn').addEventListener('click', _openRatioModal)

document.getElementById('ratio-input').addEventListener('blur', () => {
  // Auto-open modal on blur if value changed
  _openRatioModal()
})

document.getElementById('ratio-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') _openRatioModal()
})

// ─── Temperature ─────────────────────────────────────────────────────────────────

document.getElementById('temp-input').addEventListener('input', (e) => {
  const raw = parseFloat(e.target.value)
  if (isNaN(raw)) return
  const temp_c = state.temp_unit === 'C' ? raw : fahrenheitToCelsius(raw)
  if (temp_c < 70 || temp_c > 100) {
    setFieldError('temp', 'от 70 до 100°C')
    return
  }
  setFieldError('temp', null)
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
  if (isNaN(sec) || sec <= 0) {
    setFieldError('time', 'введите время > 0')
    return
  }
  setFieldError('time', null)
  setState({ brew_time_sec: sec })
  if (reformat) document.getElementById('time-input').value = formatTime(sec)
  _afterChange()
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

    // Confirm if a template is active
    if (state.template !== null) {
      const recipe = getRecipeById(state.template)
      const name = recipe?.name ?? 'текущий рецепт'
      const ok = confirm(
        `Смена техники изменит шаги — это уже не оригинальный рецепт «${name}». Продолжить?`
      )
      if (!ok) return
      setState({ template: null, templateOrigin: null })
      const sel = document.getElementById('template-select')
      if (sel) sel.value = ''
      hideTemplateSuggestion()
      renderTemplateDescription(null)
    }

    const newTech = state.pour_technique === tech ? null : tech
    setState({ pour_technique: newTech })
    document.querySelectorAll('.technique-card[data-technique]').forEach(c => {
      c.classList.toggle('active', c.dataset.technique === newTech)
    })
    renderSteps()
  })
})

// ─── Brew Button ─────────────────────────────────────────────────────────────

document.getElementById('brew-btn')?.addEventListener('click', () => {
  if (!state.isPossible) return
  const brewSteps = getBrewSteps(state)
  sessionStorage.setItem('brewState', JSON.stringify({
    method:          state.method,
    coffee_g:        state.coffee_g,
    water_g:         state.water_g,
    ratio:           state.ratio,
    temp_c:          state.temp_c,
    brew_time_sec:   state.brew_time_sec,
    pour_technique:  state.pour_technique,
    aeropress_style: state.aeropress_style,
    brewSteps,
  }))
  window.location.href = 'brew.html'
})

// ─── Modal ─────────────────────────────────────────────────────────────────

initModal()

// ─── Init ────────────────────────────────────────────────────────────────────

renderAll()
