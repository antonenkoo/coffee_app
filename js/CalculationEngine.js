// js/CalculationEngine.js
// Pure math: grind size, optimal parameters, feasibility check.

// ─── Grind Size ───────────────────────────────────────────────────────────────

/**
 * Calculate grind size in microns and Comandante C40 clicks.
 *
 * Calibration reference (Comandante C40, ~25 µm per click):
 *   V60  1:16, 180 s → ~750 µm → 30 clicks  (medium-coarse)
 *   AP   1:12, 120 s → ~500 µm → 20 clicks  (medium)
 *
 * Both ratio and brew time influence grind:
 *   higher ratio  → more water → coarser needed
 *   longer time   → flow slower → coarser compensates
 */
export function calcGrind(method, ratio, brew_time_sec = 180) {
  let microns
  if (method === 'v60') {
    const rBase  = 300 + ratio * 28                        // ratio drives base
    const tAdj   = (brew_time_sec - 180) * 0.25           // time fine-tunes
    microns = Math.round(rBase + tAdj)
  } else {
    const rBase  = 200 + ratio * 25
    const tAdj   = (brew_time_sec - 120) * 0.25
    microns = Math.round(rBase + tAdj)
  }
  const clicks = Math.round(microns / 25)
  return { microns, clicks }
}

// ─── Optimal Parameters ───────────────────────────────────────────────────────

/**
 * Recommended temperature for the current recipe.
 *
 * Model:
 *   • Higher ratio (weaker brew) → more temp needed for full extraction
 *   • More coffee → slightly lower temp OK (more surface area)
 */
export function calcOptimalTemp(method, ratio, coffee_g) {
  const base       = method === 'aeropress' ? 88 : 93
  const ratioRef   = method === 'aeropress' ? 12 : 16
  const ratioAdj   = (ratio    - ratioRef) *  0.5
  const coffeeAdj  = (coffee_g - 15)       * -0.1
  const [min, max] = method === 'aeropress' ? [75, 98] : [85, 98]
  return Math.max(min, Math.min(max, Math.round(base + ratioAdj + coffeeAdj)))
}

/**
 * Recommended brew time for the current recipe.
 *
 * Model:
 *   • Higher ratio → more water → longer extraction window
 *   • More coffee → more surface contact → longer
 */
export function calcOptimalTime(method, ratio, coffee_g) {
  if (method === 'v60') {
    const base      = 180
    const ratioAdj  = (ratio    - 16) * 10
    const coffeeAdj = (coffee_g - 15) *  5
    return Math.max(120, Math.min(270, Math.round(base + ratioAdj + coffeeAdj)))
  } else {
    const base     = 120
    const ratioAdj = (ratio - 12) * 8
    return Math.max(60, Math.min(240, Math.round(base + ratioAdj)))
  }
}

// ─── Filter: auto brew time ───────────────────────────────────────────────────

/**
 * Bravilor Bonamat ISO flow rate: ~150 ml/min
 * Returns brew_time_sec based on water volume.
 */
export function calcFilterBrewTime(water_g) {
  return Math.round(water_g / 150 * 60)
}

// ─── Grind Range (no recipe selected) ────────────────────────────────────────

const _GRIND_IDEAL = {
  v60:       { min_ratio: 15, max_ratio: 17, brew_time: 180 },
  aeropress: { min_ratio: 11, max_ratio: 14, brew_time: 120 },
}

/** Returns {minMicrons, maxMicrons, minClicks, maxClicks} for the method's ideal ratio range. */
export function calcGrindRange(method) {
  const r = _GRIND_IDEAL[method] ?? _GRIND_IDEAL.v60
  const lo = calcGrind(method, r.min_ratio, r.brew_time)
  const hi = calcGrind(method, r.max_ratio, r.brew_time)
  return { minMicrons: lo.microns, maxMicrons: hi.microns, minClicks: lo.clicks, maxClicks: hi.clicks }
}

// ─── Feasibility ─────────────────────────────────────────────────────────────

/**
 * Returns true when all key parameters are within the method's defined ranges.
 * Triggering false renders the "Impossible Brewing Parameters" overlay.
 */
export function checkIsPossible(state, methodData) {
  const { coffee_g, water_g, temp_c, brew_time_sec } = state
  const r = methodData.ranges
  return (
    coffee_g      >= r.coffee_g.min      && coffee_g      <= r.coffee_g.max      &&
    water_g       >= r.water_g.min       && water_g       <= r.water_g.max       &&
    temp_c        >= r.temp_c.min        && temp_c        <= r.temp_c.max        &&
    brew_time_sec >= r.brew_time_sec.min && brew_time_sec <= r.brew_time_sec.max
  )
}
