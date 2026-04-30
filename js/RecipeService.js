// js/RecipeService.js
// Static recipe data and template-matching logic.

export const RECIPES = [

  // ─── V60 ─────────────────────────────────────────────────────────────────
  {
    id:            'hoffmann_v60',
    name:          'James Hoffmann V60',
    method:        'v60',
    description:   'Один непрерывный пролив после блума. Максимальная ясность вкуса и равномерная экстракция. Идеален для светлой и средней обжарки.',
    coffee_g:      15,
    water_g:       250,
    ratio:         16.67,
    temp_c:        93,
    brew_time_sec: 210,
  },
  {
    id:            'tetsu_4_6',
    name:          'Tetsu Kasuya 4:6',
    method:        'v60',
    description:   'Победитель World Brewers Cup 2016. 40% воды управляют кислотностью/сладостью, 60% — насыщенностью. Гибкий контроль вкусового профиля.',
    coffee_g:      20,
    water_g:       300,
    ratio:         15,
    temp_c:        93,
    brew_time_sec: 210,
  },
  {
    id:            'scott_rao_v60',
    name:          'Scott Rao V60',
    method:        'v60',
    description:   'Агрессивный блум + активная агитация для максимального раскрытия. Акцент на тело и сложность. Хорошо работает с тёмной и средней обжаркой.',
    coffee_g:      15,
    water_g:       250,
    ratio:         16.67,
    temp_c:        96,
    brew_time_sec: 180,
  },

  // ─── AeroPress ────────────────────────────────────────────────────────────
  {
    id:              'wbc_aeropress',
    name:            'WBC AeroPress Championship',
    method:          'aeropress',
    description:     'Адаптация рецепта финалистов World AeroPress Championship. Инвертированный метод, насыщенный и концентрированный вкус с чистым финишем.',
    coffee_g:        17,
    water_g:         220,
    ratio:           12.94,
    temp_c:          88,
    brew_time_sec:   120,
    aeropress_style: 'inverted',
  },
  {
    id:              'aeropress_classic',
    name:            'Classic AeroPress',
    method:          'aeropress',
    description:     'Стандартный метод: чистый вкус, быстрое приготовление. Раскрывает ореховые, шоколадные и карамельные ноты. Хорош для разных обжарок.',
    coffee_g:        17,
    water_g:         250,
    ratio:           14.7,
    temp_c:          92,
    brew_time_sec:   150,
    aeropress_style: 'standard',
  },
]

// ─── Matching ─────────────────────────────────────────────────────────────────

// Absolute tolerances for each field
const MATCH_TOLERANCES = {
  coffee_g:      1.0,   // ±1 g
  water_g:       20,    // ±20 g
  ratio:         0.5,   // ±0.5
  temp_c:        2,     // ±2 °C
  brew_time_sec: 25,    // ±25 s
}

const MATCH_FIELDS = ['coffee_g', 'water_g', 'temp_c', 'brew_time_sec', 'ratio']

/**
 * Returns the best-matching recipe if ≥ 2 parameters are within tolerance.
 * @param {object} state
 * @param {string|null} excludeId  – skip the currently active template
 * @returns {{ recipe, matchCount, matchFields } | null}
 */
export function findMatchingRecipe(state, excludeId = null) {
  let best = null
  let bestCount = 0

  for (const recipe of RECIPES) {
    if (recipe.method !== state.method) continue
    if (recipe.id === excludeId) continue

    const matched = MATCH_FIELDS.filter(
      f => Math.abs((state[f] ?? 0) - recipe[f]) <= MATCH_TOLERANCES[f]
    )

    if (matched.length >= 2 && matched.length > bestCount) {
      bestCount = matched.length
      best = { recipe, matchCount: matched.length, matchFields: matched }
    }
  }

  return best
}

export function getRecipeById(id) {
  return RECIPES.find(r => r.id === id) ?? null
}

export function getRecipesForMethod(method) {
  return RECIPES.filter(r => r.method === method)
}
