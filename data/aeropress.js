// data/aeropress.js
export const AEROPRESS = {
  name: 'AeroPress',
  defaults: {
    coffee_g: 17,
    water_g: 220,
    ratio: 12.94,
    temp_c: 85,
    brew_time_sec: 150,
  },
  ranges: {
    coffee_g:      { min: 10,  max: 30  },
    water_g:       { min: 100, max: 350 },
    ratio:         { min: 10,  max: 16  },
    temp_c:        { min: 75,  max: 98  },
    brew_time_sec: { min: 60,  max: 240 },
  },
}
