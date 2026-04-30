// js/tips.js
import { formatRatio, formatTime, round } from './calculator.js'

/**
 * Returns 3 actionable barista tips based on current state.
 * Each tip: { label: string, text: string }
 *
 * Tips cover three directions:
 *   1. Brighter cup (acidity / sweetness)
 *   2. Bolder cup   (body / strength)
 *   3. Balance      (ratio correction)
 */
export function getTips(state, methodData) {
  const { coffee_g, water_g, temp_c, brew_time_sec, ratio } = state
  const r = methodData.ranges
  const tips = []

  // ─── 1. Ярче / Кислотность ────────────────────────────────────────────────
  // Prefer temp increase; fall back to water reduction if already near max
  if (temp_c <= r.temp_c.max - 2) {
    const t = Math.min(Math.round(temp_c + 2), r.temp_c.max)
    tips.push({
      label: 'Ярче',
      text:  `+2°C → ${t}°C — ускорит экстракцию, подчеркнёт цитрусовые ноты и сладость`,
    })
  } else {
    const w    = Math.round(water_g * 0.95)
    const newR = round(w / coffee_g, 1)
    tips.push({
      label: 'Ярче',
      text:  `−5% воды: ${water_g}г → ${w}г (ratio 1:${newR}) — концентрирует профиль без изменения температуры`,
    })
  }

  // ─── 2. Насыщеннее / Тело ─────────────────────────────────────────────────
  // Prefer temp decrease; fall back to brew time increase if already near min
  if (temp_c >= r.temp_c.min + 2) {
    const t = Math.max(Math.round(temp_c - 2), r.temp_c.min)
    tips.push({
      label: 'Насыщеннее',
      text:  `−2°C → ${t}°C — снизит остроту, добавит тело и округлость`,
    })
  } else {
    const sec = brew_time_sec + 30
    tips.push({
      label: 'Насыщеннее',
      text:  `+30с → ${formatTime(sec)} — увеличит экстракцию и добавит плотность вкуса`,
    })
  }

  // ─── 3. Баланс / Ratio ────────────────────────────────────────────────────
  const mid = (r.ratio.min + r.ratio.max) / 2

  if (ratio > r.ratio.max) {
    const targetW = Math.round(coffee_g * r.ratio.max)
    const delta   = Math.round(water_g - targetW)
    tips.push({
      label: 'Баланс',
      text:  `Ratio ${formatRatio(ratio)} — слабовато. Уберите ${delta}г воды (${water_g}г → ${targetW}г) → ratio 1:${r.ratio.max}`,
    })
  } else if (ratio < r.ratio.min) {
    const targetW = Math.round(coffee_g * r.ratio.min)
    const delta   = Math.round(targetW - water_g)
    tips.push({
      label: 'Баланс',
      text:  `Ratio ${formatRatio(ratio)} — крепковато. Добавьте ${delta}г воды (${water_g}г → ${targetW}г) → ratio 1:${r.ratio.min}`,
    })
  } else {
    // In range — suggest a subtle 0.5-step nudge toward or away from midpoint
    const adjRatio = round(ratio < mid ? ratio + 0.5 : ratio - 0.5, 1)
    const adjWater = Math.round(coffee_g * adjRatio)
    const dir      = ratio < mid ? 'чуть слабее и ярче' : 'чуть крепче'
    tips.push({
      label: 'Баланс',
      text:  `Ratio ${formatRatio(ratio)} — в норме. Попробуйте 1:${adjRatio} (${dir}) → ${adjWater}г воды`,
    })
  }

  return tips
}
