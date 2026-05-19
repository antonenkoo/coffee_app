// js/views/recipes.js
import { auth, loadMyRecipes, deleteMyRecipe, updateMyRecipe, saveMyRecipe, loadCustomTechniques, saveCustomTechnique, updateCustomTechnique, deleteCustomTechnique } from '../firebase.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'
import { GRINDERS } from '../grinders.js'
import { t, applyI18n } from '../i18n.js'
import { isGuest, showAuthOverlay } from '../auth-manager.js'

let _authUnsubscribe = null

export const recipesView = {
  getHTML() {
    return `
    <div id="loading-state" style="display:flex;justify-content:center;padding:40px;color:var(--text-dim);font-size:0.875rem;">Загрузка...</div>

    <div id="guest-wall" class="hidden">
      <div class="state-icon">☕</div>
      <p>Войдите, чтобы сохранять рецепты и управлять своей коллекцией.</p>
      <button class="btn-primary guest-signin-btn" style="margin-top:16px;">Войти / Зарегистрироваться</button>
    </div>

    <div id="auth-prompt" class="hidden">
      <div class="state-icon">🔐</div>
      <div data-i18n="myrecipes.auth">Для просмотра рецептов необходимо войти в аккаунт.</div>
      <button class="btn-primary guest-signin-btn" style="margin-top:16px;">Войти</button>
    </div>

    <div id="recipes-toolbar" class="hidden">
      <button id="create-recipe-btn" class="create-recipe-btn">+ Создать рецепт</button>
    </div>

    <div id="techniques-mgmt" class="hidden">
      <div class="tech-mgmt-header">
        <span class="tech-mgmt-title">Мои техники пролива</span>
        <button id="btn-add-tech" class="btn-add-tech">+ Добавить</button>
      </div>
      <div id="tech-list"></div>
      <div id="tech-empty" class="hidden">Нет кастомных техник</div>
      <div id="add-tech-form">
        <input id="tech-name-input" class="add-tech-input" type="text" placeholder="Название (напр. «Турецкий пролив»)">
        <input id="tech-desc-input" class="add-tech-input" type="text" placeholder="Краткое описание">
        <textarea id="tech-steps-input" class="add-tech-input" placeholder="Шаги (каждый с новой строки):&#10;Bloom: 30г воды, ждать 40 сек&#10;Пролив 1: долить до 150г&#10;Пролив 2: долить до 250г"></textarea>
        <div class="add-tech-actions">
          <button id="btn-save-tech" class="btn-save-tech">Сохранить</button>
          <button id="btn-cancel-tech" class="btn-cancel-tech">Отмена</button>
        </div>
      </div>
    </div>

    <div id="empty-state" class="hidden">
      <div class="state-icon">☕</div>
      <div data-i18n="myrecipes.empty">У вас пока нет сохранённых рецептов.</div>
      <div data-i18n="myrecipes.empty.cta">Заварите кофе или создайте рецепт заранее!</div>
    </div>

    <div id="error-state" class="hidden">
      <div class="state-icon">⚠️</div>
      <div id="error-msg">Ошибка загрузки</div>
    </div>

    <div id="recipes-list" style="display:flex;flex-direction:column;gap:16px;"></div>

    <!-- Edit / Create Modal -->
    <div id="edit-modal-overlay">
      <div id="edit-modal">
        <div class="edit-header">
          <h2 id="edit-modal-title">Редактировать рецепт</h2>
          <button id="edit-close" class="edit-close">×</button>
        </div>
        <div class="edit-section-title">Параметры</div>
        <div class="edit-row" id="edit-method-row" style="display:none">
          <span class="edit-label">Метод</span>
          <div class="edit-input-wrap" style="justify-content:flex-end;">
            <select id="edit-method" class="edit-input" style="width:auto;min-width:140px;">
              <option value="v60">V60</option>
              <option value="aeropress">AeroPress</option>
              <option value="filter">Filter / Drip</option>
            </select>
          </div>
        </div>
        <div class="edit-row" id="edit-technique-row" style="display:none">
          <span class="edit-label">Техника</span>
          <div class="edit-input-wrap" style="justify-content:flex-end;">
            <select id="edit-technique" class="edit-input" style="width:auto;min-width:140px;"></select>
          </div>
        </div>
        <div class="edit-row">
          <span class="edit-label">Кофе</span>
          <div class="edit-input-wrap">
            <button class="edit-stepper" data-edit="coffee" data-dir="-1">−</button>
            <input id="edit-coffee" class="edit-input" type="number" step="0.5" min="5" max="100">
            <button class="edit-stepper" data-edit="coffee" data-dir="1">+</button>
            <span class="edit-unit">г</span>
          </div>
        </div>
        <div class="edit-row">
          <span class="edit-label">Вода</span>
          <div class="edit-input-wrap">
            <button class="edit-stepper" data-edit="water" data-dir="-1">−</button>
            <input id="edit-water" class="edit-input" type="number" step="5" min="50">
            <button class="edit-stepper" data-edit="water" data-dir="1">+</button>
            <span class="edit-unit">мл</span>
          </div>
        </div>
        <div class="edit-row" id="edit-temp-row">
          <span class="edit-label">Температура</span>
          <div class="edit-input-wrap">
            <button class="edit-stepper" data-edit="temp" data-dir="-1">−</button>
            <input id="edit-temp" class="edit-input" type="number" step="1" min="70" max="100">
            <button class="edit-stepper" data-edit="temp" data-dir="1">+</button>
            <span class="edit-unit">°C</span>
          </div>
        </div>
        <div class="edit-row">
          <span class="edit-label">Время</span>
          <div class="edit-input-wrap">
            <input id="edit-time" class="edit-input" type="text" placeholder="3:00" style="width:80px;">
            <span class="edit-unit">мин</span>
          </div>
        </div>
        <div class="edit-section-title">Зерно и помол</div>
        <div class="edit-row" style="flex-direction:column;align-items:stretch;gap:6px;">
          <span class="edit-label">Зерно</span>
          <input id="edit-bean" class="edit-input edit-input--full" type="text" placeholder="Эфиопия, светлая обжарка...">
        </div>
        <div class="edit-row" style="flex-direction:column;align-items:stretch;gap:6px;">
          <span class="edit-label">Кофемолка</span>
          <select id="edit-grinder" class="edit-input edit-input--full"></select>
        </div>
        <div class="edit-row" id="edit-clicks-row" style="display:none">
          <span class="edit-label">Клики</span>
          <div class="edit-input-wrap">
            <input id="edit-grind-clicks" class="edit-input" type="number" step="1" min="1" placeholder="28">
            <span class="edit-unit">кл</span>
          </div>
        </div>
        <div class="edit-row">
          <span class="edit-label">Помол</span>
          <div class="edit-input-wrap">
            <input id="edit-grind-microns" class="edit-input" type="number" step="10" min="100" placeholder="700">
            <span class="edit-unit">мкм</span>
          </div>
        </div>
        <div class="edit-section-title">Вкус</div>
        <div class="edit-slider-row" data-edit-taste="sweetness">
          <span class="edit-slider-label">Сладость</span>
          <div class="edit-slider-track"></div>
          <span class="edit-slider-val">0</span>
        </div>
        <div class="edit-slider-row" data-edit-taste="acidity">
          <span class="edit-slider-label">Кислотность</span>
          <div class="edit-slider-track"></div>
          <span class="edit-slider-val">0</span>
        </div>
        <div class="edit-slider-row" data-edit-taste="bitterness">
          <span class="edit-slider-label">Горечь</span>
          <div class="edit-slider-track"></div>
          <span class="edit-slider-val">0</span>
        </div>
        <div class="edit-section-title">Шаги приготовления <span class="edit-section-hint">опционально</span></div>
        <div id="edit-steps-list"></div>
        <button id="edit-add-step" class="edit-add-step-btn">+ Добавить шаг</button>
        <div class="edit-section-title">Заметки</div>
        <div style="padding:4px 0 8px;">
          <textarea id="edit-notes" class="edit-input edit-input--full" placeholder="Впечатления, что изменить..."></textarea>
        </div>
        <button id="edit-save-btn" class="edit-save-btn">Сохранить изменения</button>
      </div>
    </div>

    <!-- Technique Edit Modal -->
    <div id="tech-edit-overlay" class="calc-modal-overlay">
      <div class="calc-modal">
        <div class="calc-modal-header">
          <span>Редактировать технику</span>
          <button class="calc-modal-close" id="tech-edit-close">×</button>
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Название</label>
          <input id="tech-edit-name" type="text" class="calc-modal-input">
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Описание</label>
          <input id="tech-edit-desc" type="text" class="calc-modal-input" placeholder="Краткое описание">
        </div>
        <div class="calc-modal-field">
          <label class="calc-modal-label">Шаги</label>
          <textarea id="tech-edit-steps" class="calc-modal-input" placeholder="Каждый шаг с новой строки"></textarea>
        </div>
        <button id="tech-edit-save-btn" class="calc-modal-save">Сохранить изменения</button>
      </div>
    </div>`
  },

  init() {
    applyI18n()
    if (_authUnsubscribe) { _authUnsubscribe(); _authUnsubscribe = null }

    // Guest wall
    if (isGuest()) {
      document.getElementById('loading-state').style.display = 'none'
      document.getElementById('guest-wall').classList.remove('hidden')
      document.querySelector('#guest-wall .guest-signin-btn').addEventListener('click', showAuthOverlay)
      return
    }

    const METHOD_NAMES = { v60: 'V60', aeropress: 'AeroPress', filter: 'Filter' }
    const TASTE_LABELS = { sweetness: 'Сладость', acidity: 'Кислотность', bitterness: 'Горечь' }
    const TECH_NAMES   = { '3-pour': '3 пролива', '1-pour': 'Один пролив', '46': '4:6 метод' }

    function fmt(sec) {
      if (!sec) return '—'
      const m = Math.floor(sec / 60), s = sec % 60
      return `${m}:${String(s).padStart(2,'0')}`
    }
    function parseFmt(str) {
      if (!str) return 0
      const parts = str.split(':')
      return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0)
    }
    function formatDate(ts) {
      if (!ts) return ''
      try {
        const d = ts.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
      } catch { return '' }
    }
    function tastePips(val, max = 5) {
      return Array.from({ length: max }, (_, i) =>
        `<div class="taste-pip ${i < val ? 'on' : ''}"></div>`
      ).join('')
    }

    // ── Edit modal state ────────────────────────────────────────────────────────
    let _editMode      = 'edit'   // 'edit' | 'create'
    let _editRecipeId  = null
    let _editMethod    = null
    let _editTasteValues = { sweetness: 0, acidity: 0, bitterness: 0 }
    let _customTechniques = []

    const editGrinderSel = document.getElementById('edit-grinder')
    editGrinderSel.innerHTML =
      `<option value="">— без кофемолки —</option>` +
      GRINDERS.map(g => `<option value="${g.id}">${g.name}</option>`).join('')

    editGrinderSel.addEventListener('change', () => {
      const g = GRINDERS.find(x => x.id === editGrinderSel.value)
      document.getElementById('edit-clicks-row').style.display = (g && g.micron_per_click) ? 'flex' : 'none'
    })

    document.getElementById('edit-method').addEventListener('change', () => {
      if (_editMode !== 'create') return
      const m = document.getElementById('edit-method').value
      document.getElementById('edit-technique-row').style.display = m === 'v60' ? 'flex' : 'none'
      document.getElementById('edit-temp-row').style.display = m === 'filter' ? 'none' : 'flex'
    })

    document.querySelectorAll('.edit-slider-row').forEach(row => {
      const taste = row.dataset.editTaste
      const track = row.querySelector('.edit-slider-track')
      const valEl = row.querySelector('.edit-slider-val')
      for (let i = 1; i <= 5; i++) {
        const pip = document.createElement('div')
        pip.className = 'edit-slider-pip'
        pip.dataset.val = i
        pip.addEventListener('click', () => {
          const newVal = _editTasteValues[taste] === i ? 0 : i
          _editTasteValues[taste] = newVal
          _updatePips(track, newVal)
          valEl.textContent = newVal
        })
        track.appendChild(pip)
      }
    })

    function _updatePips(track, val) {
      track.querySelectorAll('.edit-slider-pip').forEach(pip =>
        pip.classList.toggle('active', parseInt(pip.dataset.val) <= val)
      )
    }
    function _refreshAllPips() {
      document.querySelectorAll('.edit-slider-row').forEach(row => {
        const taste = row.dataset.editTaste
        const track = row.querySelector('.edit-slider-track')
        const valEl = row.querySelector('.edit-slider-val')
        _updatePips(track, _editTasteValues[taste] || 0)
        valEl.textContent = _editTasteValues[taste] || 0
      })
    }

    document.querySelectorAll('.edit-stepper').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.edit
        const inputId = field === 'coffee' ? 'edit-coffee' : field === 'water' ? 'edit-water' : 'edit-temp'
        const input = document.getElementById(inputId)
        if (!input) return
        input.value = Math.round((parseFloat(input.value || 0) + parseInt(btn.dataset.dir) * (parseFloat(input.step) || 1)) * 100) / 100
      })
    })

    function _buildTechniqueSelect(currentTech) {
      const sel = document.getElementById('edit-technique')
      sel.innerHTML =
        `<option value="">— без техники —</option>` +
        `<option value="3-pour">3 пролива</option>` +
        `<option value="1-pour">Один пролив</option>` +
        `<option value="46">4:6 метод</option>` +
        _customTechniques.map(tc => `<option value="custom-${tc.id}">${tc.name}</option>`).join('')
      sel.value = currentTech ?? ''
    }

    // ── Steps builder ───────────────────────────────────────────────────────────
    function _buildStepItem(step = {}) {
      const div = document.createElement('div')
      div.className = 'edit-step-item'
      div.innerHTML = `
        <div class="edit-step-top">
          <span class="edit-step-num"></span>
          <input class="edit-input edit-step-label" type="text" placeholder="Блум, Пролив 1..." value="${(step.label || '').replace(/"/g, '&quot;')}">
          <input class="edit-input edit-step-dur" type="text" placeholder="0:30" value="${step.duration_sec ? fmt(step.duration_sec) : ''}">
          <button class="edit-step-del" title="Удалить шаг">×</button>
        </div>
        <input class="edit-input edit-step-note" type="text" placeholder="Описание шага (опционально)" value="${(step.note || '').replace(/"/g, '&quot;')}">`
      div.querySelector('.edit-step-del').addEventListener('click', () => {
        div.remove()
        _renumberSteps()
      })
      return div
    }

    function _renumberSteps() {
      document.querySelectorAll('#edit-steps-list .edit-step-item').forEach((item, i) => {
        const num = item.querySelector('.edit-step-num')
        if (num) num.textContent = i + 1
      })
    }

    function _collectSteps() {
      const steps = []
      document.querySelectorAll('#edit-steps-list .edit-step-item').forEach(item => {
        const label = item.querySelector('.edit-step-label')?.value.trim()
        const durStr = item.querySelector('.edit-step-dur')?.value.trim()
        const note = item.querySelector('.edit-step-note')?.value.trim()
        const duration_sec = parseFmt(durStr)
        if (label || duration_sec) steps.push({ label: label || '', duration_sec, note: note || null })
      })
      return steps.length > 0 ? steps : null
    }

    function _loadSteps(steps) {
      const list = document.getElementById('edit-steps-list')
      list.innerHTML = ''
      if (steps && steps.length > 0) {
        steps.forEach(s => list.appendChild(_buildStepItem(s)))
        _renumberSteps()
      }
    }

    document.getElementById('edit-add-step').addEventListener('click', () => {
      const list = document.getElementById('edit-steps-list')
      list.appendChild(_buildStepItem())
      _renumberSteps()
      list.lastElementChild.querySelector('.edit-step-label')?.focus()
    })

    // ── Modal open helpers ──────────────────────────────────────────────────────
    function openEditModal(r) {
      _editMode      = 'edit'
      _editRecipeId  = r.id
      _editMethod    = r.method
      document.getElementById('edit-modal-title').textContent = 'Редактировать рецепт'
      document.getElementById('edit-save-btn').textContent = 'Сохранить изменения'
      document.getElementById('edit-method-row').style.display = 'none'
      const techRow = document.getElementById('edit-technique-row')
      if (r.method === 'v60') { techRow.style.display = 'flex'; _buildTechniqueSelect(r.technique) }
      else { techRow.style.display = 'none' }
      document.getElementById('edit-temp-row').style.display = r.method === 'filter' ? 'none' : 'flex'
      document.getElementById('edit-coffee').value        = r.coffee_g ?? ''
      document.getElementById('edit-water').value         = r.water_g ?? ''
      document.getElementById('edit-temp').value          = r.temp_c ?? ''
      document.getElementById('edit-time').value          = r.brew_time_sec ? fmt(r.brew_time_sec) : ''
      document.getElementById('edit-bean').value          = r.bean ?? ''
      document.getElementById('edit-grind-microns').value = r.grind_microns ?? ''
      document.getElementById('edit-grind-clicks').value  = r.grind_clicks ?? ''
      document.getElementById('edit-notes').value         = r.notes ?? ''
      editGrinderSel.value = r.grinder_id ?? ''
      const gHasClicks = GRINDERS.find(x => x.id === r.grinder_id)?.micron_per_click
      document.getElementById('edit-clicks-row').style.display = (r.grinder_id && gHasClicks) ? 'flex' : 'none'
      _editTasteValues = { sweetness: r.taste?.sweetness ?? 0, acidity: r.taste?.acidity ?? 0, bitterness: r.taste?.bitterness ?? 0 }
      _refreshAllPips()
      _loadSteps(r.steps)
      document.getElementById('edit-modal-overlay').classList.add('visible')
      document.getElementById('edit-save-btn').disabled = false
    }

    function openCreateModal() {
      _editMode     = 'create'
      _editRecipeId = null
      _editMethod   = 'v60'
      document.getElementById('edit-modal-title').textContent = 'Новый рецепт'
      document.getElementById('edit-save-btn').textContent = 'Сохранить рецепт'
      document.getElementById('edit-method-row').style.display = 'flex'
      document.getElementById('edit-method').value = 'v60'
      document.getElementById('edit-technique-row').style.display = 'flex'
      _buildTechniqueSelect(null)
      document.getElementById('edit-temp-row').style.display = 'flex'
      document.getElementById('edit-coffee').value        = ''
      document.getElementById('edit-water').value         = ''
      document.getElementById('edit-temp').value          = ''
      document.getElementById('edit-time').value          = ''
      document.getElementById('edit-bean').value          = ''
      document.getElementById('edit-grind-microns').value = ''
      document.getElementById('edit-grind-clicks').value  = ''
      document.getElementById('edit-notes').value         = ''
      editGrinderSel.value = ''
      document.getElementById('edit-clicks-row').style.display = 'none'
      _editTasteValues = { sweetness: 0, acidity: 0, bitterness: 0 }
      _refreshAllPips()
      _loadSteps(null)
      document.getElementById('edit-modal-overlay').classList.add('visible')
      document.getElementById('edit-save-btn').disabled = false
    }

    // ── Technique edit modal ────────────────────────────────────────────────────
    let _editTechId = null

    function openTechEditModal(tech) {
      _editTechId = tech.id
      document.getElementById('tech-edit-name').value  = tech.name || ''
      document.getElementById('tech-edit-desc').value  = tech.description || ''
      document.getElementById('tech-edit-steps').value = tech.steps || ''
      document.getElementById('tech-edit-save-btn').disabled = false
      document.getElementById('tech-edit-save-btn').textContent = 'Сохранить изменения'
      document.getElementById('tech-edit-overlay').classList.add('visible')
    }

    document.getElementById('tech-edit-close').addEventListener('click', () =>
      document.getElementById('tech-edit-overlay').classList.remove('visible')
    )
    document.getElementById('tech-edit-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('tech-edit-overlay'))
        document.getElementById('tech-edit-overlay').classList.remove('visible')
    })
    document.getElementById('tech-edit-save-btn').addEventListener('click', async () => {
      if (!_editTechId) return
      const btn = document.getElementById('tech-edit-save-btn')
      btn.disabled = true; btn.textContent = 'Сохранение...'
      const name  = document.getElementById('tech-edit-name').value.trim()
      const description = document.getElementById('tech-edit-desc').value.trim()
      const steps = document.getElementById('tech-edit-steps').value.trim()
      if (!name) {
        alert('Введите название')
        btn.disabled = false; btn.textContent = 'Сохранить изменения'
        return
      }
      try {
        await updateCustomTechnique(_editTechId, { name, description, steps })
        const idx = _customTechniques.findIndex(tc => tc.id === _editTechId)
        if (idx !== -1) _customTechniques[idx] = { ..._customTechniques[idx], name, description, steps }
        renderTechList(_customTechniques)
        document.getElementById('tech-edit-overlay').classList.remove('visible')
      } catch (e) {
        alert(`Ошибка: ${e.message}`)
        btn.disabled = false; btn.textContent = 'Сохранить изменения'
      }
    })

    document.getElementById('edit-close').addEventListener('click', () =>
      document.getElementById('edit-modal-overlay').classList.remove('visible')
    )
    document.getElementById('edit-modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('edit-modal-overlay'))
        document.getElementById('edit-modal-overlay').classList.remove('visible')
    })

    document.getElementById('create-recipe-btn').addEventListener('click', openCreateModal)

    // ── Save handler ────────────────────────────────────────────────────────────
    document.getElementById('edit-save-btn').addEventListener('click', async () => {
      const btn = document.getElementById('edit-save-btn')
      btn.disabled = true; btn.textContent = 'Сохранение...'
      const grinderVal  = editGrinderSel.value
      const grinderName = GRINDERS.find(g => g.id === grinderVal)?.name ?? null
      const selectedTech = document.getElementById('edit-technique')?.value || null
      const customTechObj = _customTechniques.find(tc => `custom-${tc.id}` === selectedTech)
      const method = _editMode === 'create' ? document.getElementById('edit-method').value : _editMethod

      const updated = {
        coffee_g: parseFloat(document.getElementById('edit-coffee').value) || 0,
        water_g:  parseFloat(document.getElementById('edit-water').value)  || 0,
        temp_c:   parseFloat(document.getElementById('edit-temp').value)   || 0,
        brew_time_sec: parseFmt(document.getElementById('edit-time').value),
        bean:     document.getElementById('edit-bean').value.trim() || null,
        grinder_id: grinderVal || null, grinder_name: grinderName,
        grind_clicks:  parseInt(document.getElementById('edit-grind-clicks').value)  || null,
        grind_microns: parseInt(document.getElementById('edit-grind-microns').value) || null,
        taste: { ..._editTasteValues },
        notes: document.getElementById('edit-notes').value.trim() || null,
        technique: selectedTech || null,
        customTechniqueSteps: customTechObj ? (customTechObj.steps || customTechObj.description || '') : null,
        steps: _collectSteps(),
      }
      updated.ratio = updated.coffee_g ? +(updated.water_g / updated.coffee_g).toFixed(2) : 0

      try {
        if (_editMode === 'create') {
          const ref = await saveMyRecipe({ ...updated, method })
          const newRecipe = { id: ref.id, method, createdAt: new Date(), ...updated }
          const listEl = document.getElementById('recipes-list')
          listEl.prepend(renderCard(newRecipe))
          document.getElementById('empty-state').classList.add('hidden')
          _updateCount()
        } else {
          await updateMyRecipe(_editRecipeId, updated)
          const existingCard = document.querySelector(`.recipe-card[data-id="${_editRecipeId}"]`)
          if (existingCard) existingCard.replaceWith(renderCard({ id: _editRecipeId, method, createdAt: null, ...updated }))
        }
        document.getElementById('edit-modal-overlay').classList.remove('visible')
      } catch (e) {
        alert(`Ошибка: ${e.message}`)
        btn.disabled = false
        btn.textContent = _editMode === 'create' ? 'Сохранить рецепт' : 'Сохранить изменения'
      }
    })

    // ── Recipe card renderer ────────────────────────────────────────────────────
    function renderCard(r) {
      const method = METHOD_NAMES[r.method] ?? r.method ?? '—'
      const date   = formatDate(r.createdAt)
      const paramsLine = [
        r.coffee_g   ? `<span>${r.coffee_g}г</span> кофе` : null,
        r.water_g    ? `<span>${r.water_g}мл</span> воды` : null,
        r.ratio      ? `1:<span>${(+r.ratio).toFixed(1)}</span>` : null,
        r.method !== 'filter' && r.temp_c ? `<span>${r.temp_c}°C</span>` : null,
        r.brew_time_sec ? `<span>${fmt(r.brew_time_sec)}</span>` : null,
      ].filter(Boolean).join(' · ')
      const grinderLine = [
        r.grinder_name,
        r.grind_clicks  ? `${r.grind_clicks} кл` : null,
        r.grind_microns ? `${r.grind_microns} мкм` : null,
      ].filter(Boolean).join(' · ')
      const hasTaste = r.taste && Object.values(r.taste).some(v => v > 0)
      const tasteHtml = hasTaste
        ? `<div class="recipe-taste">${Object.entries(r.taste).filter(([,v]) => v > 0).map(([k, v]) => `
            <div class="taste-row">
              <span class="taste-name">${TASTE_LABELS[k] ?? k}</span>
              <div class="taste-pips">${tastePips(v)}</div>
              <span style="font-size:0.7rem;color:var(--text-dim);min-width:12px">${v}</span>
            </div>`).join('')}</div>` : ''
      const techName = r.technique
        ? (TECH_NAMES[r.technique] || r.technique.replace('custom-', '').slice(0, 20) || r.technique) : null

      const hasSteps = r.steps && r.steps.length > 0
      const stepsHtml = hasSteps ? `
        <div class="recipe-steps">
          <div class="recipe-steps-toggle" data-open="false">
            <span>Шаги <span class="recipe-steps-count">(${r.steps.length})</span></span>
            <span class="recipe-steps-arrow">▶</span>
          </div>
          <div class="recipe-steps-body hidden">
            ${r.steps.map((s, i) => `
              <div class="recipe-step">
                <span class="recipe-step-num">${i + 1}</span>
                <div class="recipe-step-content">
                  <span class="recipe-step-label">${s.label}</span>
                  ${s.duration_sec ? `<span class="recipe-step-dur">${fmt(s.duration_sec)}</span>` : ''}
                  ${s.note ? `<div class="recipe-step-note">${s.note}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''

      const card = document.createElement('div')
      card.className = 'recipe-card'
      card.dataset.id = r.id
      card.innerHTML = `
        <div class="recipe-card-header">
          <span class="recipe-method-badge">${method}</span>
          <div class="recipe-meta">${date}</div>
        </div>
        <div class="recipe-params">${paramsLine}</div>
        ${techName ? `<div class="recipe-technique">⇢ ${techName}</div>` : ''}
        ${r.bean      ? `<div class="recipe-bean">☕ ${r.bean}</div>` : ''}
        ${grinderLine ? `<div class="recipe-grinder">⚙ ${grinderLine}</div>` : ''}
        ${tasteHtml}
        ${stepsHtml}
        ${r.notes     ? `<div class="recipe-notes">${r.notes}</div>` : ''}
        <div class="recipe-card-footer">
          <button class="btn-delete" data-id="${r.id}">${t('myrecipes.delete')}</button>
          <button class="btn-edit">Изменить</button>
          <button class="btn-load">${t('myrecipes.load')}</button>
        </div>`

      if (hasSteps) {
        const toggle = card.querySelector('.recipe-steps-toggle')
        const body   = card.querySelector('.recipe-steps-body')
        const arrow  = card.querySelector('.recipe-steps-arrow')
        toggle.addEventListener('click', () => {
          const isOpen = toggle.dataset.open === 'true'
          toggle.dataset.open = String(!isOpen)
          body.classList.toggle('hidden', isOpen)
          arrow.textContent = isOpen ? '▶' : '▼'
        })
      }

      card.querySelector('.btn-load').addEventListener('click', () => {
        sessionStorage.setItem('externalRecipe', JSON.stringify({
          method:              r.method,
          coffee_g:            r.coffee_g,
          water_g:             r.water_g,
          ratio:               r.ratio ?? null,
          temp_c:              r.temp_c,
          brew_time_sec:       r.brew_time_sec,
          technique:           r.technique ?? null,
          customTechniqueSteps: r.customTechniqueSteps ?? null,
          brewSteps:           r.brewSteps   ?? null,
          actualPours:         r.actualPours ?? null,
        }))
        location.hash = '#advanced'
      })
      card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(r))
      card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id
        if (!confirm(t('myrecipes.confirm.delete'))) return
        try {
          await deleteMyRecipe(id)
          document.querySelector(`.recipe-card[data-id="${id}"]`)?.remove()
          _updateCount()
        } catch (err) { alert(`Ошибка удаления: ${err.message}`) }
      })
      return card
    }

    function _updateCount() {
      const count = document.querySelectorAll('.recipe-card').length
      const countEl = document.getElementById('recipes-count')
      if (countEl) countEl.textContent =
        count > 0 ? `${count} ${count === 1 ? 'рецепт' : count < 5 ? 'рецепта' : 'рецептов'}` : ''
      if (count === 0) document.getElementById('empty-state').classList.remove('hidden')
    }

    // ── Custom techniques management ────────────────────────────────────────────
    function renderTechList(techniques) {
      const listEl  = document.getElementById('tech-list')
      const emptyEl = document.getElementById('tech-empty')
      listEl.innerHTML = ''
      if (techniques.length === 0) { emptyEl.classList.remove('hidden'); return }
      emptyEl.classList.add('hidden')
      techniques.forEach(tech => {
        const item = document.createElement('div')
        item.className = 'tech-item'
        item.innerHTML = `
          <div class="tech-item-info">
            <div class="tech-item-name">${tech.name}</div>
            ${tech.description ? `<div class="tech-item-desc">${tech.description}</div>` : ''}
          </div>
          <div class="tech-item-actions">
            <button class="btn-edit-tech" data-id="${tech.id}">Изменить</button>
            <button class="btn-del-tech" data-id="${tech.id}">Удалить</button>
          </div>`
        item.querySelector('.btn-edit-tech').addEventListener('click', () => openTechEditModal(tech))
        item.querySelector('.btn-del-tech').addEventListener('click', async () => {
          if (!confirm(`Удалить технику «${tech.name}»?`)) return
          try {
            await deleteCustomTechnique(tech.id)
            _customTechniques = _customTechniques.filter(tc => tc.id !== tech.id)
            renderTechList(_customTechniques)
          } catch (e) { alert(`Ошибка: ${e.message}`) }
        })
        listEl.appendChild(item)
      })
    }

    document.getElementById('btn-add-tech').addEventListener('click', () => {
      document.getElementById('add-tech-form').classList.add('visible')
      document.getElementById('tech-name-input').focus()
    })
    document.getElementById('btn-cancel-tech').addEventListener('click', () => {
      document.getElementById('add-tech-form').classList.remove('visible')
      document.getElementById('tech-name-input').value = ''
      document.getElementById('tech-desc-input').value = ''
      document.getElementById('tech-steps-input').value = ''
    })
    document.getElementById('btn-save-tech').addEventListener('click', async () => {
      const name  = document.getElementById('tech-name-input').value.trim()
      const desc  = document.getElementById('tech-desc-input').value.trim()
      const steps = document.getElementById('tech-steps-input').value.trim()
      if (!name) { alert('Введите название техники'); return }
      const btn = document.getElementById('btn-save-tech')
      btn.disabled = true
      try {
        const ref = await saveCustomTechnique({ name, description: desc, steps })
        _customTechniques.unshift({ id: ref.id, name, description: desc, steps })
        renderTechList(_customTechniques)
        document.getElementById('btn-cancel-tech').click()
      } catch (e) { alert(`Ошибка: ${e.message}`) }
      finally { btn.disabled = false }
    })

    // ── Auth + load ─────────────────────────────────────────────────────────────
    const listEl    = document.getElementById('recipes-list')
    const loadingEl = document.getElementById('loading-state')

    _authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      loadingEl.style.display = 'none'
      if (!user) {
        document.getElementById('auth-prompt').classList.remove('hidden')
        document.querySelector('#auth-prompt .guest-signin-btn').addEventListener('click', showAuthOverlay)
        return
      }
      document.getElementById('recipes-toolbar').classList.remove('hidden')
      document.getElementById('techniques-mgmt').classList.remove('hidden')
      try {
        const [recipes, techniques] = await Promise.all([loadMyRecipes(), loadCustomTechniques()])
        _customTechniques = techniques
        renderTechList(techniques)
        if (recipes.length === 0) { document.getElementById('empty-state').classList.remove('hidden'); return }
        recipes.forEach(r => listEl.appendChild(renderCard(r)))
        const countEl = document.getElementById('recipes-count')
        if (countEl) countEl.textContent =
          `${recipes.length} ${recipes.length === 1 ? 'рецепт' : recipes.length < 5 ? 'рецепта' : 'рецептов'}`
      } catch (e) {
        document.getElementById('error-state').classList.remove('hidden')
        document.getElementById('error-msg').textContent = `Ошибка: ${e.message}`
      }
    })
  }
}
