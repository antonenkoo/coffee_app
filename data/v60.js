// data/v60.js
export const V60 = {
  name: 'V60',
  defaults: {
    coffee_g: 15,
    water_g: 250,
    ratio: 16.67,
    temp_c: 93,
    brew_time_sec: 180,
  },
  ranges: {
    coffee_g:      { min: 10,  max: 50  },
    water_g:       { min: 150, max: 850 },
    ratio:         { min: 14,  max: 18  },
    temp_c:        { min: 85,  max: 98  },
    brew_time_sec: { min: 120, max: 270 },
  },
}
