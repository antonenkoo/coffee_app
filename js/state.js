// js/state.js
export const state = {
  method: 'v60',             // 'v60' | 'aeropress'
  coffee_g: 15,
  water_g: 250,
  ratio: 16.67,              // always synced: water_g / coffee_g
  temp_c: 93,
  brew_time_sec: 180,
  temp_unit: 'C',            // 'C' | 'F'
  aeropress_style: 'inverted', // 'standard' | 'inverted'
  pendingRatio: null,        // ratio awaiting modal confirmation
}

export function setState(patch) {
  Object.assign(state, patch)
}
