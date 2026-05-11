// js/views/calculator.js
import { state, setState }   from '../state.js'
import {
  calcRatio, adjustForNewRatio,
  parseTime, formatTime, fahrenheitToCelsius, round,
} from '../calculator.js'
import {
  renderAll, renderDynamic, renderParams, renderMethodUI,
  renderTemplateOptions, renderTemplateDescription, renderTechniques,
  renderTemplateSuggestion, hideTemplateSuggestion, getPendingSuggestion,
  getMethodData, renderSteps,
} from '../ui.js'
import { openRatioModal, initModal } from '../modal.js'
import { V60 }       from '../../data/v60.js'
import { AEROPRESS } from '../../data/aeropress.js'
import { FILTER }    from '../../data/filter.js'
import { findMatchingRecipe, getRecipeById } from '../RecipeService.js'
import { checkIsPossible, calcFilterBrewTime } from '../CalculationEngine.js'
import { getBrewSteps } from '../steps.js'
import { auth, loadCustomTechniques, saveMyRecipe, saveCustomTechnique } from '../firebase.js'
import { isGuest, showAuthOverlay } from '../auth-manager.js'
import { t } from '../i18n.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

let _ratioLocked = false
let _ratioModalOpen = false
let _dismissedSuggestionId = null
let _authUnsubscribe = null

export const calculatorView = {
  getHTML() {
    return `
    <!-- Method Selector + Reset -->
    <div class="method-row">
      <section id="method-selector">
        <button class="method-btn active" data-method="v60">V60</button>
        <button class="method-btn" data-method="aeropress">AeroPress</button>
        <button class="method-btn" data-method="filter">Filter</button>
      </section>
      <button id="reset-btn" title="Сбросить к дефолтам">↺</button>
    </div>

    <!-- Recipe Template Selector -->
    <div id="template-row">
      <select id="template-select"></select>
      <p id="template-description" class="hidden"></p>
    </div>

    <!-- Template Match Suggestion Banner -->
    <div id="template-suggestion" class="hidden">
      <span id="suggestion-text"></span>
      <div class="suggestion-actions">
        <button id="suggestion-apply">Применить</button>
        <button id="suggestion-dismiss">✕</button>
      </div>
    </div>

    <!-- AeroPress style toggle -->
    <div id="aeropress-style-row" class="style-row" style="display:none">
      <span class="style-label">Style</span>
      <div class="style-toggle">
        <button class="style-btn" data-style="standard">Standard</button>
        <button class="style-btn active" data-style="inverted">Inverted</button>
      </div>
    </div>

    <!-- Parameters -->
    <section id="parameters">
      <div class="param-row">
        <label for="coffee-input" data-i18n="param.coffee">Coffee</label>
        <div class="param-field">
          <div class="param-input-wrap">
            <button class="stepper-btn" data-field="coffee" data-dir="-1">−</button>
            <input id="coffee-input" type="number" step="0.5" min="5" max="100">
            <button class="stepper-btn" data-field="coffee" data-dir="1">+</button>
            <span class="unit">g</span>
            <span id="coffee-ghost" class="param-ghost hidden"></span>
          </div>
          <div class="param-presets">
            <button class="preset-chip" data-field="coffee" data-val="12">12g</button>
            <button class="preset-chip" data-field="coffee" data-val="15">15g</button>
            <button class="preset-chip" data-field="coffee" data-val="18">18g</button>
            <button class="preset-chip" data-field="coffee" data-val="20">20g</button>
            <button class="preset-chip" data-field="coffee" data-val="22">22g</button>
          </div>
          <span class="field-error hidden" id="coffee-error"></span>
        </div>
      </div>

      <div class="param-row">
        <label for="water-input" data-i18n="param.water">Water</label>
        <div class="param-field">
          <div class="param-input-wrap">
            <button class="stepper-btn" data-field="water" data-dir="-1">−</button>
            <input id="water-input" type="number" step="5" min="50" max="1000">
            <button class="stepper-btn" data-field="water" data-dir="1">+</button>
            <span class="unit">g</span>
            <span id="water-ghost" class="param-ghost hidden"></span>
          </div>
          <div class="param-presets">
            <button class="preset-chip" data-field="water" data-val="200">200ml</button>
            <button class="preset-chip" data-field="water" data-val="250">250ml</button>
            <button class="preset-chip" data-field="water" data-val="300">300ml</button>
            <button class="preset-chip" data-field="water" data-val="360">360ml</button>
          </div>
          <span class="field-error hidden" id="water-error"></span>
        </div>
      </div>

      <div class="param-row ratio-row">
        <label for="ratio-input" data-i18n="param.ratio">Brew Ratio</label>
        <div class="param-field">
          <div class="param-input-wrap ratio-wrap">
            <span class="ratio-prefix">1:</span>
            <input id="ratio-input" type="number" step="0.1" min="8" max="20">
            <button id="ratio-lock-btn" class="ratio-lock-btn" title="Зафиксировать соотношение">🔗</button>
            <button id="ratio-apply-btn" data-i18n="param.apply" title="Apply new ratio">Apply</button>
            <span id="ratio-ghost" class="param-ghost hidden"></span>
          </div>
          <span class="field-error hidden" id="ratio-error"></span>
        </div>
      </div>

      <div class="param-row" id="param-row-temp">
        <label for="temp-input" data-i18n="param.temperature">Temperature</label>
        <div class="param-field">
          <div class="param-input-wrap">
            <button class="stepper-btn" data-field="temp" data-dir="-1">−</button>
            <input id="temp-input" type="number" step="1">
            <button class="stepper-btn" data-field="temp" data-dir="1">+</button>
            <button id="temp-unit-toggle" class="unit-toggle">°C</button>
            <span id="temp-ghost" class="param-ghost hidden"></span>
          </div>
          <div class="param-presets">
            <button class="preset-chip" data-field="temp" data-val="88">88°</button>
            <button class="preset-chip" data-field="temp" data-val="91">91°</button>
            <button class="preset-chip" data-field="temp" data-val="93">93°</button>
            <button class="preset-chip" data-field="temp" data-val="95">95°</button>
          </div>
          <span class="field-error hidden" id="temp-error"></span>
          <span class="field-hint hidden" id="temp-hint"></span>
        </div>
      </div>

      <div class="param-row" id="param-row-time">
        <label for="time-input" data-i18n="param.brewtime">Brew Time</label>
        <div class="param-field">
          <div class="param-input-wrap">
            <input id="time-input" type="text" placeholder="3:00" inputmode="numeric">
            <input id="time-input-native" type="time" step="1"
                   style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
            <span class="unit">min</span>
            <span id="time-ghost" class="param-ghost hidden"></span>
          </div>
          <span class="field-error hidden" id="time-error"></span>
          <span class="field-hint hidden" id="time-hint"></span>
        </div>
      </div>

      <div class="param-row grind-row" id="param-row-grind-calc">
        <label data-i18n="param.grindsize">Grind Size</label>
        <div class="param-input-wrap grind-display">
          <span id="grind-microns" class="grind-value">—</span>
          <span class="unit">мкм</span>
          <span class="grind-sep">·</span>
          <span id="grind-clicks" class="grind-value">—</span>
          <span class="unit">кл C40</span>
        </div>
      </div>

      <div class="param-row hidden" id="param-row-filter-grind">
        <label for="filter-grind-input" data-i18n="param.grind.manual">Помол</label>
        <div class="param-field">
          <div class="param-input-wrap">
            <input id="filter-grind-input" type="number" step="10" min="300" max="1200">
            <span class="unit">мкм</span>
          </div>
          <span class="field-hint" data-i18n="grind.hint">рек. 600–800 мкм для Bravilor ISO</span>
        </div>
      </div>

      <div class="param-row hidden" id="param-row-filter-info">
        <label data-i18n="param.auto">Авто</label>
        <div class="param-input-wrap">
          <span id="filter-time-display" class="grind-value">—</span>
          <span class="unit">мин</span>
          <span class="grind-sep">·</span>
          <span class="grind-value">~93°C</span>
          <span class="unit">(машина)</span>
        </div>
      </div>
    </section>

    <!-- Pouring Techniques (V60 only) -->
    <section id="techniques-section" class="hidden">
      <div class="techniques-header" data-i18n="section.techniques">Техника пролива</div>
      <div class="techniques-list">
        <button class="technique-card" data-technique="3-pour">
          <span class="technique-name" data-i18n="tech.3pour.name">3 пролива</span>
          <span class="technique-desc" data-i18n="tech.3pour.desc">Блум → 60% воды → 100%. Классический контроль экстракции.</span>
        </button>
        <button class="technique-card" data-technique="1-pour">
          <span class="technique-name" data-i18n="tech.1pour.name">Один пролив</span>
          <span class="technique-desc" data-i18n="tech.1pour.desc">Все воды одним непрерывным потоком после блума. Метод Хоффманна.</span>
        </button>
        <button class="technique-card technique-card--accent" data-technique="46">
          <span class="technique-name" data-i18n="tech.46.name">4:6 метод</span>
          <span class="technique-desc" data-i18n="tech.46.desc">40% → 3×20%. Победитель World Brewers Cup 2016. Точный контроль вкуса.</span>
        </button>
      </div>
      <div id="custom-techniques-list"></div>
    </section>

    <!-- BREW Button + Save -->
    <div id="brew-section">
      <button id="brew-btn" data-i18n="btn.brew">▶&nbsp;&nbsp;BREW</button>
      <button id="save-recipe-btn" class="save-recipe-link">Сохранить рецепт</button>
    </div>

    <!-- Warnings -->
    <section id="warnings"></section>

    <!-- Recommended Parameters -->
    <section id="recommended-section">
      <div class="rec-header">Рекомендуется для этого рецепта</div>
      <div id="rec-content"></div>
    </section>

    <!-- Brew Steps + Barista Tips -->
    <div id="steps-tips-wrapper">
      <div id="impossible-overlay" class="hidden">
        <div class="impossible-inner">
          <span class="impossible-icon">⚠</span>
          <p class="impossible-title" data-i18n="impossible.title">Невозможные параметры</p>
          <p class="impossible-sub" data-i18n="impossible.sub">Значения выходят за допустимые пределы метода</p>
        </div>
      </div>
      <details id="brew-steps" open>
        <summary data-i18n="section.brewsteps">Brew Steps</summary>
        <ol id="steps-list"></ol>
      </details>
      <section id="barista-tips">
        <div class="tips-header" data-i18n="section.tips">Barista Tips</div>
        <ul id="tips-list"></ul>
      </section>
    </div>

    <!-- Ratio Adjust Modal -->
    <div id="modal-overlay" class="hidden"></div>
    <div id="ratio-modal" class="modal hidden">
      <div class="modal-content">
        <h2 data-i18n="modal.title">Adjust Parameters</h2>
        <p id="modal-ratio-change" class="modal-subtitle"></p>
        <p class="modal-question" data-i18n="modal.question">What should change to match the new ratio?</p>
        <div id="modal-options"></div>
        <div id="modal-preview" class="modal-preview"></div>
        <div class="modal-actions">
          <button id="modal-cancel" class="btn-secondary" data-i18n="modal.cancel">Cancel</button>
          <button id="modal-apply" class="btn-primary" data-i18n="modal.apply">Apply</button>
        </div>
      </div>
    </div>

    <!-- Quick Save Recipe Modal -->
    <div id="calc-save-overlay" class="calc-modal-overlay">
      <div class="calc-modal">
        <div class="calc-modal-header">
          <span>Сохранить рецепт</span>
          <button class="calc-modal-close" id="calc-save-close">×</button>
        </div>
        <div id="calc-save-preview" class="calc-modal-preview"></div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Зерно</label>
          <input id="calc-save-bean" type="text" class="calc-modal-input" placeholder="Эфиопия, светлая обжарка...">
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Заметки</label>
          <textarea id="calc-save-notes" class="calc-modal-input" placeholder="Впечатления, что изменить..."></textarea>
        </div>
        <button id="calc-save-confirm" class="calc-modal-save">Сохранить</button>
      </div>
    </div>

    <!-- Create Technique Modal -->
    <div id="calc-tech-overlay" class="calc-modal-overlay">
      <div class="calc-modal">
        <div class="calc-modal-header">
          <span>Новая техника</span>
          <button class="calc-modal-close" id="calc-tech-close">×</button>
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Название</label>
          <input id="calc-tech-name" type="text" class="calc-modal-input" placeholder="Агрессивный блум, Быстрый пролив...">
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Описание</label>
          <input id="calc-tech-desc" type="text" class="calc-modal-input" placeholder="Краткое описание">
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Шаги</label>
          <textarea id="calc-tech-steps" class="calc-modal-input" placeholder="Каждый шаг с новой строки:&#10;Bloom: 30г, 40 сек&#10;Пролив 1: до 150г"></textarea>
        </div>
        <button id="calc-tech-save-btn" class="calc-modal-save">Создать технику</button>
      </div>
    </div>`
  },

  init() {
    // ── Custom techniques ───────────────────────────────────────────────────────
    if (_authUnsubscribe) { _authUnsubscribe(); _authUnsubscribe = null }
    _authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) _loadCustomTechniques()
    })

    // ── Ratio Lock ──────────────────────────────────────────────────────────────
    document.getElementById('ratio-lock-btn')?.addEventListener('click', () => {
      _ratioLocked = !_ratioLocked
      document.getElementById('ratio-lock-btn').classList.toggle('active', _ratioLocked)
    })

    // ── Method Switch ───────────────────────────────────────────────────────────
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.method
        if (method === state.method) return
        const methodData = method === 'v60' ? V60 : method === 'filter' ? FILTER : AEROPRESS
        const r = methodData.ranges
        if (method === 'filter') {
          setState({ method, template: null, templateOrigin: null, pour_technique: null, ...FILTER.defaults })
        } else {
          const coffee_g = Math.max(r.coffee_g.min, Math.min(r.coffee_g.max, state.coffee_g))
          const ratio    = Math.max(r.ratio.min,    Math.min(r.ratio.max,    state.ratio))
          const water_g  = Math.max(r.water_g.min,  Math.min(r.water_g.max,  Math.round(coffee_g * ratio)))
          setState({ method, template: null, templateOrigin: null, pour_technique: null,
            temp_c: methodData.defaults.temp_c, brew_time_sec: methodData.defaults.brew_time_sec,
            coffee_g, ratio, water_g })
        }
        _dismissedSuggestionId = null
        hideTemplateSuggestion()
        document.querySelectorAll('.technique-card[data-technique]').forEach(c => c.classList.remove('active'))
        renderAll()
      })
    })

    // ── Reset ───────────────────────────────────────────────────────────────────
    document.getElementById('reset-btn')?.addEventListener('click', () => {
      const methodData = state.method === 'v60' ? V60 : state.method === 'filter' ? FILTER : AEROPRESS
      setState({ ...methodData.defaults, template: null, templateOrigin: null, pour_technique: null })
      localStorage.clear()
      _dismissedSuggestionId = null
      hideTemplateSuggestion()
      document.querySelectorAll('.technique-card[data-technique]').forEach(c => c.classList.remove('active'))
      renderAll()
    })

    // ── AeroPress Style ─────────────────────────────────────────────────────────
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setState({ aeropress_style: btn.dataset.style })
        renderMethodUI()
        _afterChange()
      })
    })

    // ── Template Selector ───────────────────────────────────────────────────────
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
      if (recipe) _applyTemplate(recipe)
    })

    document.getElementById('suggestion-apply')?.addEventListener('click', () => {
      const pending = getPendingSuggestion()
      if (pending) {
        _applyTemplate(pending.recipe)
        const sel = document.getElementById('template-select')
        if (sel) sel.value = pending.recipe.id
      }
    })

    document.getElementById('suggestion-dismiss')?.addEventListener('click', () => {
      const pending = getPendingSuggestion()
      if (pending) _dismissedSuggestionId = pending.recipe.id
      hideTemplateSuggestion()
    })

    // ── Coffee Input ────────────────────────────────────────────────────────────
    document.getElementById('coffee-input').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value)
      const { min, max } = getMethodData().ranges.coffee_g
      if (isNaN(val) || val < min || val > max) { _setFieldError('coffee', t('error.coffee')); return }
      _setFieldError('coffee', null)
      if (_ratioLocked) {
        const newWater = round(val * state.ratio, 1)
        setState({ coffee_g: val, water_g: newWater })
        document.getElementById('water-input').value = round(newWater, 0)
      } else {
        setState({ coffee_g: val, ratio: calcRatio(val, state.water_g) })
        document.getElementById('ratio-input').value = round(state.ratio, 1)
      }
      _afterChange()
    })

    // ── Water Input ─────────────────────────────────────────────────────────────
    document.getElementById('water-input').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value)
      const { min, max } = getMethodData().ranges.water_g
      if (isNaN(val) || val < min || val > max) { _setFieldError('water', t('error.water')); return }
      _setFieldError('water', null)
      if (_ratioLocked) {
        const newCoffee = round(val / state.ratio, 1)
        const patch = { water_g: val, coffee_g: newCoffee }
        if (state.method === 'filter') patch.brew_time_sec = calcFilterBrewTime(val)
        setState(patch)
        document.getElementById('coffee-input').value = newCoffee
      } else {
        const patch = { water_g: val, ratio: calcRatio(state.coffee_g, val) }
        if (state.method === 'filter') patch.brew_time_sec = calcFilterBrewTime(val)
        setState(patch)
        document.getElementById('ratio-input').value = round(state.ratio, 1)
      }
      _afterChange()
    })

    // ── Filter Grind ────────────────────────────────────────────────────────────
    document.getElementById('filter-grind-input')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10)
      if (isNaN(val) || val < 300 || val > 1200) return
      setState({ grind_manual_microns: val })
    })

    // ── Ratio Input ─────────────────────────────────────────────────────────────
    document.getElementById('ratio-apply-btn').addEventListener('click', _openRatioModal)
    document.getElementById('ratio-input').addEventListener('blur', _openRatioModal)
    document.getElementById('ratio-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _openRatioModal()
    })

    // ── Temperature ─────────────────────────────────────────────────────────────
    document.getElementById('temp-input').addEventListener('input', (e) => {
      const raw = parseFloat(e.target.value)
      if (isNaN(raw)) return
      const temp_c = state.temp_unit === 'C' ? raw : fahrenheitToCelsius(raw)
      if (temp_c < 70 || temp_c > 100) { _setFieldError('temp', t('error.temp')); return }
      _setFieldError('temp', null)
      setState({ temp_c: round(temp_c, 1) })
      _afterChange()
    })
    document.getElementById('temp-unit-toggle').addEventListener('click', () => {
      setState({ temp_unit: state.temp_unit === 'C' ? 'F' : 'C' })
      renderParams()
    })

    // ── Brew Time ───────────────────────────────────────────────────────────────
    const timeInput = document.getElementById('time-input')
    timeInput.addEventListener('input',   (e) => _applyTime(e.target.value))
    timeInput.addEventListener('change',  (e) => _applyTime(e.target.value.trim(), true))
    timeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') _applyTime(e.target.value.trim(), true) })

    // iOS native time picker
    const nativeTime = document.getElementById('time-input-native')
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS && timeInput && nativeTime) {
      timeInput.addEventListener('focus', (e) => {
        e.preventDefault(); timeInput.blur()
        nativeTime.style.pointerEvents = 'auto'
        nativeTime.focus(); nativeTime.click()
      })
      nativeTime.addEventListener('change', () => {
        const val = nativeTime.value
        if (!val) return
        const parts = val.split(':')
        const m = parseInt(parts[0], 10), s = parseInt(parts[1] || '0', 10)
        timeInput.value = `${m}:${String(s).padStart(2, '0')}`
        timeInput.dispatchEvent(new Event('input', { bubbles: true }))
        nativeTime.style.pointerEvents = 'none'
      })
      nativeTime.addEventListener('blur', () => { nativeTime.style.pointerEvents = 'none' })
    }

    // ── Technique Selector ──────────────────────────────────────────────────────
    document.querySelectorAll('.technique-card[data-technique]').forEach(card => {
      card.addEventListener('click', () => {
        const tech = card.dataset.technique
        if (state.template !== null) {
          const recipe = getRecipeById(state.template)
          const name = recipe?.name ?? 'текущий рецепт'
          if (!confirm(`Смена техники изменит шаги — это уже не оригинальный рецепт «${name}». Продолжить?`)) return
          setState({ template: null, templateOrigin: null })
          const sel = document.getElementById('template-select')
          if (sel) sel.value = ''
          hideTemplateSuggestion()
          renderTemplateDescription(null)
        }
        const newTech = state.pour_technique === tech ? null : tech
        setState({ pour_technique: newTech, customTechniqueSteps: null })
        document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
          c.classList.toggle('active', c.dataset.technique === newTech)
        )
        renderSteps()
      })
    })

    // ── Save Recipe (quick save) ─────────────────────────────────────────────
    document.getElementById('save-recipe-btn')?.addEventListener('click', () => {
      if (isGuest() || !auth.currentUser) { showAuthOverlay(); return }
      const METHOD_LABELS = { v60: 'V60', aeropress: 'AeroPress', filter: 'Filter' }
      const TECH_LABELS   = { '3-pour': '3 пролива', '1-pour': 'Один пролив', '46': '4:6 метод' }
      const fmtTime = (s) => { if (!s) return ''; const m = Math.floor(s/60); return `${m}:${String(s%60).padStart(2,'0')}` }
      const techName = state.pour_technique
        ? (TECH_LABELS[state.pour_technique] || state.pour_technique.replace(/^custom-/, ''))
        : null
      const preview = [
        METHOD_LABELS[state.method] ?? state.method,
        techName ? `⇢ ${techName}` : null,
      ].filter(Boolean).join(' · ') + '\n' + [
        state.coffee_g ? `${state.coffee_g}г кофе` : null,
        state.water_g  ? `${state.water_g}мл воды` : null,
        state.ratio    ? `1:${(+state.ratio).toFixed(1)}` : null,
        state.method !== 'filter' && state.temp_c ? `${state.temp_c}°C` : null,
        state.brew_time_sec ? fmtTime(state.brew_time_sec) : null,
      ].filter(Boolean).join(' · ')
      document.getElementById('calc-save-preview').textContent = preview
      document.getElementById('calc-save-bean').value = ''
      document.getElementById('calc-save-notes').value = ''
      document.getElementById('calc-save-confirm').disabled = false
      document.getElementById('calc-save-confirm').textContent = 'Сохранить'
      document.getElementById('calc-save-overlay').classList.add('visible')
    })
    document.getElementById('calc-save-close').addEventListener('click', () =>
      document.getElementById('calc-save-overlay').classList.remove('visible')
    )
    document.getElementById('calc-save-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('calc-save-overlay'))
        document.getElementById('calc-save-overlay').classList.remove('visible')
    })
    document.getElementById('calc-save-confirm').addEventListener('click', async () => {
      const btn = document.getElementById('calc-save-confirm')
      btn.disabled = true; btn.textContent = 'Сохранение...'
      try {
        await saveMyRecipe({
          method: state.method,
          coffee_g: state.coffee_g,
          water_g: state.water_g,
          ratio: state.ratio,
          temp_c: state.temp_c,
          brew_time_sec: state.brew_time_sec,
          technique: state.pour_technique ?? null,
          customTechniqueSteps: state.customTechniqueSteps ?? null,
          aeropress_style: state.aeropress_style ?? null,
          bean: document.getElementById('calc-save-bean').value.trim() || null,
          notes: document.getElementById('calc-save-notes').value.trim() || null,
        })
        btn.textContent = '✓ Сохранено!'
        setTimeout(() => document.getElementById('calc-save-overlay').classList.remove('visible'), 900)
      } catch (e) {
        alert(`Ошибка: ${e.message}`)
        btn.disabled = false; btn.textContent = 'Сохранить'
      }
    })

    // ── Create Technique Modal ────────────────────────────────────────────────
    document.getElementById('calc-tech-close').addEventListener('click', () =>
      document.getElementById('calc-tech-overlay').classList.remove('visible')
    )
    document.getElementById('calc-tech-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('calc-tech-overlay'))
        document.getElementById('calc-tech-overlay').classList.remove('visible')
    })
    document.getElementById('calc-tech-save-btn').addEventListener('click', async () => {
      const name  = document.getElementById('calc-tech-name').value.trim()
      const desc  = document.getElementById('calc-tech-desc').value.trim()
      const steps = document.getElementById('calc-tech-steps').value.trim()
      if (!name) { alert('Введите название техники'); return }
      const btn = document.getElementById('calc-tech-save-btn')
      btn.disabled = true; btn.textContent = 'Создание...'
      try {
        await saveCustomTechnique({ name, description: desc, steps })
        document.getElementById('calc-tech-name').value  = ''
        document.getElementById('calc-tech-desc').value  = ''
        document.getElementById('calc-tech-steps').value = ''
        document.getElementById('calc-tech-overlay').classList.remove('visible')
        _loadCustomTechniques()
      } catch (e) {
        alert(`Ошибка: ${e.message}`)
      } finally { btn.disabled = false; btn.textContent = 'Создать технику' }
    })

    // ── Brew Button ─────────────────────────────────────────────────────────────
    document.getElementById('brew-btn')?.addEventListener('click', () => {
      if (!state.isPossible) return
      const brewSteps = getBrewSteps(state)
      sessionStorage.setItem('brewState', JSON.stringify({
        method: state.method, coffee_g: state.coffee_g, water_g: state.water_g,
        ratio: state.ratio, temp_c: state.temp_c, brew_time_sec: state.brew_time_sec,
        pour_technique: state.pour_technique, customTechniqueSteps: state.customTechniqueSteps,
        aeropress_style: state.aeropress_style, brewSteps,
      }))
      window.location.href = 'brew.html'
    })

    // ── Steppers ────────────────────────────────────────────────────────────────
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field
        const inputId = field === 'coffee' ? 'coffee-input' : field === 'water' ? 'water-input' : 'temp-input'
        const input = document.getElementById(inputId)
        if (!input) return
        const step = parseFloat(input.step) || 1
        input.value = Math.round((parseFloat(input.value || 0) + parseInt(btn.dataset.dir) * step) * 100) / 100
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
    })

    // ── Preset Chips ────────────────────────────────────────────────────────────
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const field = chip.dataset.field
        const inputId = field === 'coffee' ? 'coffee-input' : field === 'water' ? 'water-input' : 'temp-input'
        const input = document.getElementById(inputId)
        if (!input) return
        input.value = chip.dataset.val
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
    })

    // ── Modal ───────────────────────────────────────────────────────────────────
    initModal()

    // ── Init Render ─────────────────────────────────────────────────────────────
    renderAll()

    // Restore active technique buttons from state
    if (state.pour_technique) {
      document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
        c.classList.toggle('active', c.dataset.technique === state.pour_technique)
      )
    }

    // Apply recipe loaded from Feed / My Recipes
    const _ext = JSON.parse(sessionStorage.getItem('externalRecipe') || 'null')
    if (_ext) {
      sessionStorage.removeItem('externalRecipe')
      const methodData = _ext.method === 'v60' ? V60 : _ext.method === 'filter' ? FILTER : AEROPRESS
      setState({
        method:               _ext.method ?? 'v60',
        coffee_g:             _ext.coffee_g   ?? methodData.defaults.coffee_g,
        water_g:              _ext.water_g    ?? methodData.defaults.water_g,
        ratio:                _ext.ratio      ?? (_ext.water_g / _ext.coffee_g),
        temp_c:               _ext.temp_c     ?? methodData.defaults.temp_c,
        brew_time_sec:        _ext.brew_time_sec ?? methodData.defaults.brew_time_sec,
        template:             null, templateOrigin: null,
        pour_technique:       _ext.technique ?? null,
        customTechniqueSteps: _ext.customTechniqueSteps ?? null,
      })
      if (_ext.technique) {
        document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
          c.classList.toggle('active', c.dataset.technique === _ext.technique)
        )
      }
      renderAll()
    }
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

async function _loadCustomTechniques() {
  try {
    const techniques = await loadCustomTechniques()
    _renderCustomTechniques(techniques)
  } catch (e) {
    console.error('Failed to load custom techniques:', e)
  }
}

function _renderCustomTechniques(techniques) {
  const list = document.getElementById('custom-techniques-list')
  if (!list) return
  list.innerHTML = ''
  techniques.forEach(tech => {
    const btn = document.createElement('button')
    btn.className = 'technique-card'
    btn.dataset.technique = `custom-${tech.id}`
    btn.innerHTML = `
      <span class="technique-name">${tech.name}</span>
      ${tech.description ? `<span class="technique-desc">${tech.description}</span>` : ''}`
    btn.addEventListener('click', () => {
      const techId = `custom-${tech.id}`
      if (state.template !== null) {
        const recipe = getRecipeById(state.template)
        const name = recipe?.name ?? 'текущий рецепт'
        if (!confirm(`Смена техники изменит шаги — это уже не оригинальный рецепт «${name}». Продолжить?`)) return
        setState({ template: null, templateOrigin: null })
        const sel = document.getElementById('template-select')
        if (sel) sel.value = ''
        hideTemplateSuggestion()
        renderTemplateDescription(null)
      }
      const newTech = state.pour_technique === techId ? null : techId
      setState({ pour_technique: newTech, customTechniqueSteps: newTech ? (tech.steps || tech.description || '') : null })
      document.querySelectorAll('.technique-card[data-technique]').forEach(c =>
        c.classList.toggle('active', c.dataset.technique === newTech)
      )
      renderSteps()
    })
    list.appendChild(btn)
  })
  // "+ Создать технику" card
  const createCard = document.createElement('button')
  createCard.className = 'technique-card technique-card--create'
  createCard.textContent = '+ Создать технику'
  createCard.addEventListener('click', () => {
    document.getElementById('calc-tech-name').value  = ''
    document.getElementById('calc-tech-desc').value  = ''
    document.getElementById('calc-tech-steps').value = ''
    document.getElementById('calc-tech-overlay').classList.add('visible')
    setTimeout(() => document.getElementById('calc-tech-name')?.focus(), 50)
  })
  list.appendChild(createCard)
}

function _afterChange() {
  setState({ isPossible: checkIsPossible(state, getMethodData()) })
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

function _applyTemplate(recipe) {
  const { id, coffee_g, water_g, ratio, temp_c, brew_time_sec, aeropress_style } = recipe
  setState({
    template: id, templateOrigin: { coffee_g, water_g, ratio, temp_c, brew_time_sec },
    coffee_g, water_g, ratio, temp_c, brew_time_sec,
    ...(aeropress_style ? { aeropress_style } : {}),
  })
  _dismissedSuggestionId = null
  hideTemplateSuggestion()
  renderAll()
}

function _setFieldError(name, msg) {
  const inputEl = document.getElementById(`${name}-input`)
  const errorEl = document.getElementById(`${name}-error`)
  const hasError = !!msg
  if (inputEl) inputEl.classList.toggle('input--invalid', hasError)
  if (errorEl) { errorEl.textContent = msg ?? ''; errorEl.classList.toggle('hidden', !hasError) }
}

function _openRatioModal() {
  if (_ratioModalOpen) return
  const ratio_new = parseFloat(document.getElementById('ratio-input').value)
  if (isNaN(ratio_new) || ratio_new < 8 || ratio_new > 20) { _setFieldError('ratio', t('error.ratio')); return }
  _setFieldError('ratio', null)
  if (Math.abs(ratio_new - state.ratio) < 0.05) return
  const ratio_old = state.ratio
  setState({ pendingRatio: ratio_new })
  _ratioModalOpen = true
  openRatioModal(ratio_old, ratio_new, (mode) => {
    _ratioModalOpen = false
    const result = adjustForNewRatio(state.coffee_g, state.water_g, ratio_old, ratio_new, mode)
    setState({ coffee_g: round(result.coffee_g, 2), water_g: round(result.water_g, 1), ratio: ratio_new, pendingRatio: null })
    renderAll()
    _checkSuggestion()
  })
}

function _applyTime(raw, reformat = false) {
  const sec = parseTime(raw)
  if (isNaN(sec) || sec <= 0) { _setFieldError('time', t('error.time')); return }
  _setFieldError('time', null)
  setState({ brew_time_sec: sec })
  if (reformat) document.getElementById('time-input').value = formatTime(sec)
  _afterChange()
}
