// data/filter.js — Bravilor Bonamat ISO filter coffee machine
//
// About the machine:
//   - Commercial filter brewer; temperature fixed by machine (~93°C)
//   - Brew time is automatic: ~150 ml/min flow rate → 1 L in ~6:40
//   - User controls: coffee amount, water amount, grind size (in microns)
//   - Recommended ratio: 1:16–1:17 (60g / 1L is a solid baseline)
//   - Grind: medium-coarse, 600–800 µm

export const FILTER = {
  name: 'Filter',
  defaults: {
    coffee_g:           60,
    water_g:            1000,
    ratio:              16.67,
    temp_c:             93,     // fixed by machine — not shown as input
    brew_time_sec:      400,    // auto-calculated from water_g — not shown as input
    grind_manual_microns: 700,  // user sets manually
  },
  ranges: {
    coffee_g:      { min: 30,  max: 120  },
    water_g:       { min: 500, max: 2000 },
    ratio:         { min: 13,  max: 20   },
    temp_c:        { min: 90,  max: 96   }, // machine range, not user input
    brew_time_sec: { min: 200, max: 900  }, // auto range, not user input
  },
}
