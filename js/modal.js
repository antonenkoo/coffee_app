// js/modal.js
import { adjustForNewRatio, formatRatio, round } from './calculator.js'
import { state, setState } from './state.js'

let _onApply = null

export function openRatioModal(ratio_old, ratio_new, onApply) {
  _onApply = onApply

  const modal = document.getElementById('ratio-modal')
  const overlay = document.getElementById('modal-overlay')
  const changeText = document.getElementById('modal-ratio-change')
  const optionsEl = document.getElementById('modal-options')
  const previewEl = document.getElementById('modal-preview')

  changeText.textContent = `Brew ratio: ${formatRatio(ratio_old)} → ${formatRatio(ratio_new)}`

  // Build radio options with previews
  const options = [
    { value: 'water',  label: 'Изменить воду' },
    { value: 'coffee', label: 'Изменить кофе' },
    { value: 'both',   label: 'Оба (balanced)' },
  ]

  optionsEl.innerHTML = options.map((opt, i) => {
    const result = adjustForNewRatio(state.coffee_g, state.water_g, ratio_old, ratio_new, opt.value)
    const preview = getPreviewText(opt.value, result)
    return `
      <label class="modal-option ${i === 0 ? 'selected' : ''}">
        <input type="radio" name="ratio-adj" value="${opt.value}" ${i === 0 ? 'checked' : ''}>
        <span class="modal-option-label">${opt.label}</span>
        <span class="modal-option-preview">${preview}</span>
      </label>`
  }).join('')

  // Initial preview
  updatePreview(ratio_old, ratio_new, 'water')

  // Store ratio values on modal for the delegated listener
  modal.dataset.ratioOld = ratio_old
  modal.dataset.ratioNew = ratio_new

  modal.classList.remove('hidden')
  overlay.classList.remove('hidden')
}

function getPreviewText(mode, result) {
  switch (mode) {
    case 'water':
      return `${round(result.coffee_g, 1)}г кофе · <strong>${round(result.water_g, 0)}г воды</strong>`
    case 'coffee':
      return `<strong>${round(result.coffee_g, 1)}г кофе</strong> · ${round(result.water_g, 0)}г воды`
    case 'both':
      return `<strong>${round(result.coffee_g, 1)}г кофе</strong> · <strong>${round(result.water_g, 0)}г воды</strong>`
    default:
      return ''
  }
}

function updatePreview(ratio_old, ratio_new, mode) {
  const previewEl = document.getElementById('modal-preview')
  const result = adjustForNewRatio(state.coffee_g, state.water_g, ratio_old, ratio_new, mode)
  previewEl.innerHTML = `
    <div class="preview-row"><span>Coffee</span><span>${round(state.coffee_g, 1)}г → <strong>${round(result.coffee_g, 1)}г</strong></span></div>
    <div class="preview-row"><span>Water</span><span>${round(state.water_g, 0)}г → <strong>${round(result.water_g, 0)}г</strong></span></div>
    <div class="preview-row"><span>Ratio</span><span>${formatRatio(ratio_old)} → <strong>${formatRatio(ratio_new)}</strong></span></div>
  `
}

export function closeModal() {
  document.getElementById('ratio-modal').classList.add('hidden')
  document.getElementById('modal-overlay').classList.add('hidden')
  _onApply = null
}

export function initModal() {
  const modal = document.getElementById('ratio-modal')
  const overlay = document.getElementById('modal-overlay')

  // Delegated change listener — single, registered once
  document.getElementById('modal-options').addEventListener('change', (e) => {
    if (e.target.name === 'ratio-adj') {
      document.querySelectorAll('.modal-option').forEach(el => el.classList.remove('selected'))
      e.target.closest('.modal-option').classList.add('selected')
      const ro = parseFloat(modal.dataset.ratioOld)
      const rn = parseFloat(modal.dataset.ratioNew)
      updatePreview(ro, rn, e.target.value)
    }
  })

  function cancelModal() {
    closeModal()
    document.getElementById('ratio-input').value = round(state.ratio, 1)
    setState({ pendingRatio: null })
  }

  document.getElementById('modal-cancel').addEventListener('click', cancelModal)
  overlay.addEventListener('click', cancelModal)

  document.getElementById('modal-apply').addEventListener('click', () => {
    const selected = document.querySelector('input[name="ratio-adj"]:checked')
    if (selected && _onApply) {
      _onApply(selected.value)
    }
    closeModal()
  })
}
