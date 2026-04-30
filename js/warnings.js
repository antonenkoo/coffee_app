// js/warnings.js
import { formatRatio, formatTime } from './calculator.js'

/**
 * Returns array of warning objects: { level, message, impact, advice }
 * level: 'warning' | 'info'
 */
export function getWarnings(state, methodData) {
  const { coffee_g, water_g, ratio, temp_c, brew_time_sec } = state
  const r = methodData.ranges
  const warnings = []

  // ─── Ratio ────────────────────────────────────────────────────────────────
  if (ratio < r.ratio.min) {
    warnings.push({
      level:   'warning',
      message: `Ratio ${formatRatio(ratio)} — очень крепко`,
      impact:  'Риск горечи и переэкстракции',
      advice:  'Добавьте воды или уменьшите кофе',
    })
  } else if (ratio > r.ratio.max) {
    warnings.push({
      level:   'warning',
      message: `Ratio ${formatRatio(ratio)} — очень слабо`,
      impact:  'Риск кислинки и недоэкстракции',
      advice:  'Уменьшите воду или добавьте кофе',
    })
  }

  // ─── Temperature ──────────────────────────────────────────────────────────
  const tempLow  = temp_c < r.temp_c.min
  const tempHigh = temp_c > r.temp_c.max

  if (tempHigh) {
    warnings.push({
      level:   'warning',
      message: `${temp_c}°C — слишком высокая температура`,
      impact:  'Быстрая экстракция горьких соединений',
      advice:  'Охладите воду до 90–96°C',
    })
  } else if (tempLow) {
    warnings.push({
      level:   'warning',
      message: `${temp_c}°C — слишком низкая температура`,
      impact:  'Медленная и неполная экстракция',
      advice:  'Используйте воду выше ' + r.temp_c.min + '°C',
    })
  }

  // ─── Brew time ────────────────────────────────────────────────────────────
  const timeSlow = brew_time_sec > r.brew_time_sec.max
  const timeFast = brew_time_sec < r.brew_time_sec.min

  if (timeSlow) {
    warnings.push({
      level:   'warning',
      message: `Слишком долго (${formatTime(brew_time_sec)})`,
      impact:  'Слишком мелкий помол или слишком крепкий рецепт',
      advice:  'Попробуйте более крупный помол',
    })
  } else if (timeFast) {
    warnings.push({
      level:   'warning',
      message: `Слишком быстро (${formatTime(brew_time_sec)})`,
      impact:  'Слишком крупный помол — кофе не успевает экстрагироваться',
      advice:  'Попробуйте более мелкий помол',
    })
  }

  // ─── Cross-parameter: temp × time ─────────────────────────────────────────
  // Slow drain (brew_time_sec near or above max) inferred as fine grind
  const inferredFinegrind  = brew_time_sec >= r.brew_time_sec.max * 0.85
  // Fast drain (brew_time_sec near or below min) inferred as coarse grind
  const inferredCoarseGrind = brew_time_sec <= r.brew_time_sec.min * 1.15

  if (temp_c > 93 && inferredFinegrind && !tempHigh && !timeSlow) {
    warnings.push({
      level:   'warning',
      message:  'Высокая температура + медленный дренаж',
      impact:  'Двойной риск переэкстракции: горечь и жёсткость',
      advice:  'Снизьте температуру до 90–92°C или сделайте помол чуть крупнее',
    })
  }

  if (temp_c < 88 && inferredCoarseGrind && !tempLow && !timeFast) {
    warnings.push({
      level:   'warning',
      message:  'Низкая температура + быстрый дренаж',
      impact:  'Двойной риск недоэкстракции: кислятина и пустой вкус',
      advice:  'Поднимите температуру до 90–93°C или сделайте помол мельче',
    })
  }

  // ─── Informational hints (in-range but noteworthy) ────────────────────────
  if (!tempHigh && !tempLow) {
    if (temp_c > 95) {
      warnings.push({
        level:   'info',
        message:  `${temp_c}°C — агрессивный режим`,
        impact:  'Интенсивное перемешивание, чёткий яркий вкус',
        advice:  'Лейте уверенно круговыми движениями, без пауз',
      })
    } else if (temp_c < 88) {
      warnings.push({
        level:   'info',
        message:  `${temp_c}°C — мягкий режим`,
        impact:  'Медленная щадящая экстракция, акцент на сладость',
        advice:  'Лейте медленно и плавно, увеличьте время настаивания',
      })
    }
  }

  return warnings
}
