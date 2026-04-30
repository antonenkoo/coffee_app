// js/warnings.js
import { formatRatio } from './calculator.js'

export function getWarnings(state, methodData) {
  const { coffee_g, water_g, ratio, temp_c, brew_time_sec } = state
  const r = methodData.ranges
  const warnings = []

  if (ratio < r.ratio.min) {
    warnings.push(`⚠️ Ratio ${formatRatio(ratio)} — очень крепко, риск переэкстракции и горечи`)
  } else if (ratio > r.ratio.max) {
    warnings.push(`⚠️ Ratio ${formatRatio(ratio)} — очень слабо, риск кислоты и недоэкстракции`)
  }

  if (temp_c < r.temp_c.min) {
    warnings.push(`⚠️ ${temp_c}°C — низкая температура, медленная экстракция`)
  } else if (temp_c > r.temp_c.max) {
    warnings.push(`⚠️ ${temp_c}°C — высокая температура, риск горечи`)
  }

  if (brew_time_sec < r.brew_time_sec.min) {
    warnings.push(`⚠️ Слишком быстро (${formatTime(brew_time_sec)}) — попробуйте более мелкий помол`)
  } else if (brew_time_sec > r.brew_time_sec.max) {
    warnings.push(`⚠️ Слишком долго (${formatTime(brew_time_sec)}) — попробуйте более крупный помол`)
  }

  return warnings
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
