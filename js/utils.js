// utils.js — utility functions for debounce, storage, etc.

const DEBOUNCE_MS = 200

// Debounce helper
export const debounce = (fn, ms = DEBOUNCE_MS) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

// LocalStorage with auto-save on state change
export const initStorage = (setState) => {
  const saved = localStorage.getItem('coffeeState')
  if (saved) {
    const parsed = JSON.parse(saved)
    setState(parsed)
  }

  // Auto-save on any state change
  let saveTimeout
  const debouncedSave = debounce(() => {
    localStorage.setItem('coffeeState', JSON.stringify(state))
  }, 500)

  const originalSetState = setState
  window.setState = (newState) => {
    originalSetState(newState)
    debouncedSave()
  }
}

// Safe DOM query with error handling
export const qs = (selector) => {
  const el = document.querySelector(selector)
  if (!el) console.warn(`DOM element not found: ${selector}`)
  return el
}

// Show toast notification
export const showToast = (message, type = 'info') => {
  // Simple toast implementation
  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}
