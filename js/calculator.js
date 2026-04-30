// js/calculator.js

export function calcRatio(coffee_g, water_g) {
  return water_g / coffee_g
}

export function calcWaterFromRatio(coffee_g, ratio) {
  return coffee_g * ratio
}

export function calcCoffeeFromRatio(water_g, ratio) {
  return water_g / ratio
}

// Adjustment when ratio changes
// mode: 'water' | 'coffee' | 'both'
export function adjustForNewRatio(coffee_g, water_g, ratio_old, ratio_new, mode) {
  const factor = Math.sqrt(ratio_new / ratio_old)

  switch (mode) {
    case 'water':
      return { coffee_g, water_g: coffee_g * ratio_new }
    case 'coffee':
      return { coffee_g: water_g / ratio_new, water_g }
    case 'both':
      return {
        coffee_g: coffee_g / factor,
        water_g: water_g * factor,
      }
    default:
      return { coffee_g, water_g }
  }
}

export function formatRatio(ratio) {
  return `1:${ratio.toFixed(1)}`
}

export function parseRatio(str) {
  // supports "16.7" or "1:16.7"
  const s = str.includes(':') ? str.split(':')[1] : str
  return parseFloat(s)
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseTime(str) {
  const s = str.trim()
  if (s.includes(':')) {
    const parts = s.split(':').map(Number)
    if (parts.length === 2 && !isNaN(parts[0])) {
      return parts[0] * 60 + (isNaN(parts[1]) ? 0 : parts[1])
    }
    return NaN
  }
  // Plain number: treat as seconds if ≥ 60, as minutes otherwise (e.g. "3" → 180s, "180" → 180s)
  const n = parseFloat(s)
  if (isNaN(n) || n <= 0) return NaN
  return n < 60 ? Math.round(n * 60) : Math.round(n)
}

export function celsiusToFahrenheit(c) {
  return (c * 9 / 5) + 32
}

export function fahrenheitToCelsius(f) {
  return (f - 32) * 5 / 9
}

export function round(val, decimals = 1) {
  return Math.round(val * 10 ** decimals) / 10 ** decimals
}
