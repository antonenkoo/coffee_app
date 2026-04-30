// js/warnings.js
import { formatRatio, formatTime, round } from './calculator.js'

// ─── Method Configuration ─────────────────────────────────────────────────────
// Authoritative config for temperature bounds and ideal ratio range per method.
// Ratio hard limits (too extreme to brew) come from methodData.ranges.
const METHOD_CONFIG = {
  v60:       { min_temp: 85, max_temp: 98, ideal_ratio_min: 15, ideal_ratio_max: 17 },
  aeropress: { min_temp: 75, max_temp: 98, ideal_ratio_min: 11, ideal_ratio_max: 14 },
}

/**
 * Returns array of warning objects: { level, message, impact, advice }
 * level: 'warning' | 'info'
 */
export function getWarnings(state, methodData) {
  const { coffee_g, water_g, ratio, temp_c, brew_time_sec, method } = state
  const r   = methodData.ranges
  const cfg = METHOD_CONFIG[method] ?? METHOD_CONFIG.v60
  const warnings = []

  // ─── Ratio — hard limits ──────────────────────────────────────────────────
  if (ratio < r.ratio.min) {
    const targetRatio = r.ratio.min
    const addWater    = Math.round(coffee_g * targetRatio - water_g)
    const removeCoffee = round(coffee_g - water_g / targetRatio, 1)
    warnings.push({
      level:   'warning',
      message: `Ratio ${formatRatio(ratio)} — слишком крепко (лимит 1:${r.ratio.min})`,
      impact:  'Горечь, вяжущий привкус, переэкстракция',
      advice:  `Добавьте ${addWater}г воды или уберите ${removeCoffee}г кофе → 1:${targetRatio}`,
    })
  } else if (ratio > r.ratio.max) {
    const targetRatio  = r.ratio.max
    const removeWater  = Math.round(water_g - coffee_g * targetRatio)
    const addCoffee    = round(water_g / targetRatio - coffee_g, 1)
    warnings.push({
      level:   'warning',
      message: `Ratio ${formatRatio(ratio)} — слишком слабо (лимит 1:${r.ratio.max})`,
      impact:  'Водянистый вкус, кислинка, недоэкстракция',
      advice:  `Уберите ${removeWater}г воды или добавьте ${addCoffee}г кофе → 1:${targetRatio}`,
    })
  } else if (ratio > cfg.ideal_ratio_max) {
    // Within hard limit but above ideal — soft info
    const targetRatio = cfg.ideal_ratio_max
    const removeWater = Math.round(water_g - coffee_g * targetRatio)
    warnings.push({
      level:   'info',
      message: `Ratio ${formatRatio(ratio)} — слабовато (идеал 1:${cfg.ideal_ratio_min}–1:${cfg.ideal_ratio_max})`,
      impact:  'Вкус может быть водянистым или недостаточно выраженным',
      advice:  `Уберите ${removeWater}г воды → 1:${targetRatio} для стандартного баланса`,
    })
  } else if (ratio < cfg.ideal_ratio_min) {
    // Within hard limit but below ideal — soft info
    const targetRatio = cfg.ideal_ratio_min
    const addWater    = Math.round(coffee_g * targetRatio - water_g)
    warnings.push({
      level:   'info',
      message: `Ratio ${formatRatio(ratio)} — крепковато (идеал 1:${cfg.ideal_ratio_min}–1:${cfg.ideal_ratio_max})`,
      impact:  'Может ощущаться горечь или вяжущий привкус',
      advice:  `Добавьте ${addWater}г воды → 1:${targetRatio} для стандартного баланса`,
    })
  }

  // ─── Temperature ──────────────────────────────────────────────────────────
  const tempLow  = temp_c < cfg.min_temp
  const tempHigh = temp_c > cfg.max_temp

  if (tempHigh) {
    const delta = Math.round(temp_c - cfg.max_temp)
    warnings.push({
      level:   'warning',
      message: `${temp_c}°C — выше максимума (${cfg.max_temp}°C) на ${delta}°C`,
      impact:  'Мгновенная экстракция горьких алкалоидов, потеря аромата',
      advice:  `Дайте воде остыть ${delta * 15}–${delta * 20} сек после кипения → ${cfg.max_temp}°C`,
    })
  } else if (tempLow) {
    const delta     = Math.round(cfg.min_temp - temp_c)
    const extraSec  = delta * 25
    warnings.push({
      level:   'warning',
      message: `${temp_c}°C — ниже минимума (${cfg.min_temp}°C) на ${delta}°C`,
      impact:  'Неполная экстракция, плоский и кислый вкус',
      advice:  `Поднимите до ${cfg.min_temp}°C или добавьте ${extraSec}с к времени заваривания → ${formatTime(brew_time_sec + extraSec)}`,
    })
  }

  // ─── Brew time ────────────────────────────────────────────────────────────
  const timeSlow = brew_time_sec > r.brew_time_sec.max
  const timeFast = brew_time_sec < r.brew_time_sec.min

  if (timeSlow) {
    const excess = brew_time_sec - r.brew_time_sec.max
    warnings.push({
      level:   'warning',
      message: `${formatTime(brew_time_sec)} — слишком долго (норма до ${formatTime(r.brew_time_sec.max)}, +${excess}с)`,
      impact:  'Слишком мелкий помол — переэкстракция и горечь',
      advice:  'Сделайте помол чуть крупнее или уменьшите дозу кофе на 1–2г',
    })
  } else if (timeFast) {
    const deficit = r.brew_time_sec.min - brew_time_sec
    warnings.push({
      level:   'warning',
      message: `${formatTime(brew_time_sec)} — слишком быстро (норма от ${formatTime(r.brew_time_sec.min)}, −${deficit}с)`,
      impact:  'Слишком крупный помол — недоэкстракция, пустой вкус',
      advice:  'Сделайте помол мельче или увеличьте дозу кофе на 1–2г',
    })
  }

  // ─── Cross-parameter: temp × time ─────────────────────────────────────────
  const inferredFineGrind   = brew_time_sec >= r.brew_time_sec.max * 0.85
  const inferredCoarseGrind = brew_time_sec <= r.brew_time_sec.min * 1.15

  if (temp_c > 93 && inferredFineGrind && !tempHigh && !timeSlow) {
    const suggestTemp = Math.round(temp_c - 2)
    warnings.push({
      level:   'warning',
      message: 'Высокая температура + медленный дренаж',
      impact:  'Двойной риск переэкстракции: горечь и жёсткость во вкусе',
      advice:  `Снизьте до ${suggestTemp}°C или сделайте помол чуть крупнее`,
    })
  }

  if (temp_c < 88 && inferredCoarseGrind && !tempLow && !timeFast) {
    const suggestTemp = Math.round(temp_c + 2)
    warnings.push({
      level:   'warning',
      message: 'Низкая температура + быстрый дренаж',
      impact:  'Двойной риск недоэкстракции: кислятина и пустой вкус',
      advice:  `Поднимите до ${suggestTemp}°C или сделайте помол мельче`,
    })
  }

  // ─── Informational: in-range but noteworthy temp ──────────────────────────
  if (!tempHigh && !tempLow) {
    if (temp_c > 95) {
      warnings.push({
        level:   'info',
        message: `${temp_c}°C — агрессивный режим`,
        impact:  'Интенсивная быстрая экстракция: чёткий профиль, акцент на тело',
        advice:  'Лейте уверенно круговыми движениями без пауз',
      })
    } else if (temp_c < 88) {
      warnings.push({
        level:   'info',
        message: `${temp_c}°C — мягкий режим`,
        impact:  'Щадящая экстракция: акцент на сладость и нежность',
        advice:  `Лейте медленно, добавьте 15–20с к времени → ${formatTime(brew_time_sec + 17)}`,
      })
    }
  }

  return warnings
}
