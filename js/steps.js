// js/steps.js
import { formatTime } from './calculator.js'

// ─── Custom Steps Parser ─────────────────────────────────────────────────────
function _parseCustomSteps(customSteps) {
  try {
    const arr = JSON.parse(customSteps)
    if (Array.isArray(arr)) {
      return arr.map(s => ({
        start_sec: s.sec,
        action: `${s.label}: до ${s.g}г`,
        note: null,
      }))
    }
  } catch (_) {}
  // fallback: legacy plain-text format
  return customSteps.split('\n').filter(l => l.trim()).map((line, i) => ({
    start_sec: i === 0 ? 0 : null,
    action: line.trim(),
    note: null,
  }))
}

// ─── Brew Mode Steps ─────────────────────────────────────────────────────────
// Returns steps with start_sec for brew.html auto-advance.
// start_sec: null = prep step (shown before countdown)
// start_sec: N    = triggered when timer reaches N seconds

export function getBrewSteps(state) {
  const { method, coffee_g, water_g, temp_c, brew_time_sec, aeropress_style, pour_technique, grind_manual_microns, customTechniqueSteps } = state
  if (method === 'v60')     return _brewV60(coffee_g, water_g, temp_c, brew_time_sec, pour_technique, customTechniqueSteps)
  if (method === 'filter')  return _brewFilter(coffee_g, water_g, brew_time_sec, grind_manual_microns)
  return _brewAeropress(coffee_g, water_g, temp_c, aeropress_style, brew_time_sec)
}

function _brewV60(coffee_g, water_g, temp_c, brew_time_sec, technique, customSteps) {
  if (technique?.startsWith('custom-') && customSteps) {
    return _parseCustomSteps(customSteps)
  }
  switch (technique) {
    case '1-pour': return _brewV60OnePour(coffee_g, water_g, temp_c, brew_time_sec)
    case '46':     return _brewV60FourSix(coffee_g, water_g, temp_c, brew_time_sec)
    default:       return _brewV60ThreePour(coffee_g, water_g, temp_c, brew_time_sec)
  }
}

function _brewV60ThreePour(coffee_g, water_g, temp_c, brew_time_sec) {
  const bloom_g   = Math.round(coffee_g * 2)
  const bloom_sec = 45
  const scale     = Math.max(0.7, Math.min(1.6, brew_time_sec / 180))
  const pour2_sec = bloom_sec + Math.round(28 * scale)
  const drain_sec = pour2_sec + 25
  const pour1_g   = Math.round(water_g * 0.6)
  const tempNote  = temp_c < 89 ? 'Продлите ожидание до 50–55 сек' : temp_c > 94 ? '35–40 сек достаточно' : null

  return [
    { start_sec: 0,             action: `Bloom: влить <b>${bloom_g}г</b>, перемешать — ждать 45 сек`, note: tempNote },
    { start_sec: bloom_sec,     action: `Пролив 1: долить до <b>${pour1_g}г</b> — круговая струя от центра`, note: `${temp_c}°C` },
    { start_sec: pour2_sec,     action: `Пролив 2: долить до <b>${water_g}г</b> — спираль снаружи к центру`, note: null },
    { start_sec: drain_sec,     action: 'Дренаж — не трогать V60', note: null },
    { start_sec: brew_time_sec, action: 'Покрутить V60 ☕', note: null },
  ]
}

function _brewV60OnePour(coffee_g, water_g, temp_c, brew_time_sec) {
  const bloom_g   = Math.round(coffee_g * 2)
  const bloom_sec = 45
  const pour_end  = Math.round(brew_time_sec * 0.5)

  return [
    { start_sec: 0,             action: `Bloom: влить <b>${bloom_g}г</b>, перемешать — ждать 45 сек`, note: null },
    { start_sec: bloom_sec,     action: `Непрерывный пролив: влить все <b>${water_g}г</b>`, note: `Лейте до ${formatTime(pour_end)} — метод Hoffmann` },
    { start_sec: pour_end,      action: 'Дренаж — не трогать', note: null },
    { start_sec: brew_time_sec, action: 'Покрутить V60 ☕', note: null },
  ]
}

function _brewV60FourSix(coffee_g, water_g, temp_c, brew_time_sec) {
  const first40    = Math.round(water_g * 0.40)
  const remaining60 = water_g - first40
  const each20     = Math.round(remaining60 / 3)
  const interval   = Math.round(brew_time_sec / 5)
  const t1 = interval, t2 = interval * 2, t3 = interval * 3, t4 = interval * 4
  const cum1 = Math.round(first40 * 0.6)

  return [
    { start_sec: 0,             action: `Пролив 1: влить <b>${cum1}г</b> — кислотный баланс`, note: 'Больше воды → меньше кислотности' },
    { start_sec: t1,            action: `Пролив 2: долить до <b>${first40}г</b> — сладость`, note: 'Больше воды → больше сладости' },
    { start_sec: t2,            action: `Пролив 3: долить до <b>${first40 + each20}г</b>`, note: null },
    { start_sec: t3,            action: `Пролив 4: долить до <b>${first40 + each20 * 2}г</b>`, note: null },
    { start_sec: t4,            action: `Пролив 5: долить до <b>${water_g}г</b> (финал)`, note: null },
    { start_sec: brew_time_sec, action: 'Дренаж завершён ☕', note: null },
  ]
}

function _brewAeropress(coffee_g, water_g, temp_c, style, brew_time_sec) {
  // brew_time_sec = steep time + 30s press
  // Timer starts the moment water hits coffee (start_sec: 0)
  const steep_sec  = Math.max(30, brew_time_sec - 30)
  const done_sec   = steep_sec + 30

  if (style === 'inverted') {
    const filter_sec = Math.max(steep_sec - 10, Math.round(steep_sec * 0.88))
    return [
      // Prep before timer — shown on start screen
      { start_sec: null,       action: 'Перевернуть AeroPress поршнем вниз (1 см внутри)', note: null },
      { start_sec: null,       action: `Засыпать <b>${coffee_g}г</b> кофе`, note: null },
      { start_sec: null,       action: 'Установить бумажный фильтр в сито, смочить кипятком', note: null },
      // Timer starts here — water hits coffee
      { start_sec: 0,          action: `Залить <b>30г</b> воды (${temp_c}°C), перемешать 10 сек`, note: 'Таймер пошёл — вода в кофе' },
      { start_sec: 30,         action: `Долить оставшийся обьем воды до <b>${water_g}г</b>`, note: null },
      { start_sec: 40,         action: `Настаивание — ждать до ${formatTime(filter_sec)}`, note: 'Не перемешивайте' },
      { start_sec: steep_sec,  action: 'Перевернуть на кружку, медленно давить 30 сек', note: 'Остановитесь на шипении' },
      { start_sec: done_sec,   action: '☕ Готово!', note: null },
    ]
  }

  // Standard
  const insert_sec = 30
  return [
    // Prep before timer
    { start_sec: null,       action: 'Установить фильтр, прогреть кипятком, слить воду', note: null },
    { start_sec: null,       action: `Засыпать <b>${coffee_g}г</b> кофе (средний помол)`, note: null },
    // Timer starts here — water hits coffee
    { start_sec: 0,          action: `Залить <b>${water_g}г</b> воды (${temp_c}°C), перемешать 10 сек`, note: 'Таймер пошёл — вода в кофе' },
    { start_sec: insert_sec, action: 'Вставить поршень, создать вакуум', note: 'Вакуум замедляет дренаж' },
    { start_sec: steep_sec,  action: 'Медленно давить поршень 30 сек', note: 'Остановитесь на шипении' },
    { start_sec: done_sec,   action: '☕ Готово!', note: null },
  ]
}

/**
 * Single entry point. Returns step array for current state.
 * Each step: { time, action, note }
 */
export function getSteps(state) {
  const { method, coffee_g, water_g, temp_c, brew_time_sec, aeropress_style, pour_technique, grind_manual_microns, customTechniqueSteps } = state
  if (method === 'v60')    return _v60Steps(coffee_g, water_g, temp_c, brew_time_sec, pour_technique, customTechniqueSteps)
  if (method === 'filter') return _filterStepsUI(coffee_g, water_g, brew_time_sec, grind_manual_microns)
  return _aeropressSteps(coffee_g, water_g, temp_c, aeropress_style, brew_time_sec)
}

// ─── V60 dispatcher ─────────────────────────────────────────────────────────────────

function _v60Steps(coffee_g, water_g, temp_c, brew_time_sec, technique, customSteps) {
  if (technique?.startsWith('custom-') && customSteps) {
    return _parseCustomSteps(customSteps)
  }
  switch (technique) {
    case '1-pour': return _v60OnePour(coffee_g, water_g, temp_c, brew_time_sec)
    case '46':     return _v60FourSix(coffee_g, water_g, temp_c, brew_time_sec)
    default:       return _v60ThreePour(coffee_g, water_g, temp_c, brew_time_sec)
  }
}

// ─── V60: 3-пролива (default / null) ──────────────────────────────────────────

function _v60ThreePour(coffee_g, water_g, temp_c, brew_time_sec) {
  const bloom_g    = Math.round(coffee_g * 2)
  const bloom_sec  = 45
  const scale      = Math.max(0.7, Math.min(1.6, brew_time_sec / 180))
  const pour1_sec  = bloom_sec
  const pour2_sec  = Math.round(pour1_sec + 28 * scale)
  const pour1_g    = Math.round(water_g * 0.6)
  const drain_end  = brew_time_sec
  const lowTemp    = temp_c < 89 ? ` При ${temp_c}°C +${formatTime(Math.round(brew_time_sec * 1.12))}+ для полной экстракции.` : ''

  return [
    {
      time:   '0:00',
      action: `Bloom: влить <strong>${bloom_g}г</strong>, перемешать`,
      note:   'Соотношение 2:1 — стандарт дегазации. Тёмная обжарка: 30 сек достаточно',
    },
    {
      time:   `0:00 – ${formatTime(bloom_sec)}`,
      action: `Ждать ${bloom_sec} сек`,
      note:   temp_c > 94 ? `${temp_c}°C — CO₂ выходит быстрее, 40 сек достаточно`
             : temp_c < 89 ? `${temp_c}°C — продлите до 50–55 сек` : null,
    },
    {
      time:   formatTime(pour1_sec),
      action: `Пролив 1: долить до <strong>${pour1_g}г</strong> (60%). Круговая струя от центра`,
      note:   temp_c > 94 ? `${temp_c}°C — уверенная струя, активное перемешивание`
             : temp_c < 89 ? `${temp_c}°C — медленно, дайте воде проникнуть в кофе` : `${temp_c}°C — оптимальная зона`,
    },
    {
      time:   formatTime(pour2_sec),
      action: `Пролив 2: долить до <strong>${water_g}г</strong> (100%). Спираль снаружи к центру`,
      note:   'Равномерная спираль закрывает гущу по краям',
    },
    {
      time:   `~${formatTime(pour2_sec + 25)} – ${formatTime(drain_end)}`,
      action: 'Дренаж — вода стекает через фильтр',
      note:   `Норма: до ${formatTime(drain_end)}. Быстрее 2:30 → помол крупноват; медленнее ${formatTime(drain_end + 30)} → слишком мелко.${lowTemp}`,
    },
    {
      time:   `~${formatTime(drain_end)}`,
      action: 'Покрутить V60 для выравнивания гущи ☕',
      note:   'Плоское дно гущи = равномерная экстракция',
    },
  ]
}

// ─── V60: Один пролив (Hoffmann) ─────────────────────────────────────────────

function _v60OnePour(coffee_g, water_g, temp_c, brew_time_sec) {
  const bloom_g    = Math.round(coffee_g * 2)
  const bloom_sec  = 45
  // Pour duration: from bloom end to ~80% of brew time
  const pour_end   = Math.round(brew_time_sec * 0.5)
  const drain_end  = brew_time_sec

  return [
    {
      time:   '0:00',
      action: `Bloom: влить <strong>${bloom_g}г</strong>, аккуратно перемешать`,
      note:   'Медленная дегазация особенно важна перед одним непрерывным проливом',
    },
    {
      time:   `0:00 – ${formatTime(bloom_sec)}`,
      action: `Ждать ${bloom_sec} сек`,
      note:   temp_c > 94 ? `${temp_c}°C — 35–40 сек достаточно` : temp_c < 89 ? `${temp_c}°C — продлите до 55 сек` : null,
    },
    {
      time:   formatTime(bloom_sec),
      action: `Непрерывный пролив: влить все <strong>${water_g}г</strong> одной плавной струёй`,
      note:   `Лейте до ${formatTime(pour_end)} — равномерная скорость важнее паттерна. Метод Hoffmann`,
    },
    {
      time:   `${formatTime(pour_end)} – ${formatTime(drain_end)}`,
      action: 'Дренаж — не трогать V60',
      note:   `Норма до ${formatTime(drain_end)}. Один пролив даёт чистую, яркую, однородную чашку`,
    },
    {
      time:   `~${formatTime(drain_end)}`,
      action: 'Покрутить V60 ☕',
      note:   null,
    },
  ]
}

// ─── V60: Метод 4:6 (Tetsu Kasuya) ─────────────────────────────────────────

function _v60FourSix(coffee_g, water_g, temp_c, brew_time_sec) {
  const first40    = Math.round(water_g * 0.40)
  const remaining60 = water_g - first40
  const each20     = Math.round(remaining60 / 3)
  // Timing: 5 equal intervals across brew time
  const interval   = Math.round(brew_time_sec / 5)
  const t1 = interval
  const t2 = interval * 2
  const t3 = interval * 3
  const t4 = interval * 4

  const cum1 = first40
  const cum2 = Math.round(first40 * 0.6)   // ~40%: первая порция - регулирует кислотность
  const cum3 = first40 + each20
  const cum4 = first40 + each20 * 2
  const cum5 = water_g

  return [
    {
      time:   '0:00',
      action: `Пролив 1: влить <strong>${Math.round(first40 * 0.6)}г</strong> — кислотный баланс`,
      note:   'Первые 40% делятся на 2 порции. Больше воды в пролив 1 → меньше кислотности',
    },
    {
      time:   formatTime(t1),
      action: `Пролив 2: долить до <strong>${cum1}г</strong> — сладость`,
      note:   'Больше воды в пролив 2 → больше сладости. Всего 40% воды = контроль вкуса',
    },
    {
      time:   formatTime(t2),
      action: `Пролив 3: долить до <strong>${cum3}г</strong>`,
      note:   'Оставшиеся 60% воды делятся на 3 равные порции — контроль крепости',
    },
    {
      time:   formatTime(t3),
      action: `Пролив 4: долить до <strong>${cum4}г</strong>`,
      note:   'Больше порций → более лёгкое тело. Меньше порций → плотнее',
    },
    {
      time:   formatTime(t4),
      action: `Пролив 5: долить до <strong>${cum5}г</strong> (финал)`,
      note:   `${temp_c}°C — оптимально для 4:6. Метод Tetsu Kasuya, World Brewers Cup 2016`,
    },
    {
      time:   `~${formatTime(brew_time_sec)}`,
      action: 'Дренаж завершён ☕',
      note:   '4:6 даёт точный контроль: меняй только пролив 1–2 для вкуса, 3–5 для крепости',
    },
  ]
}

// ─── AeroPress ────────────────────────────────────────────────────────────────────

function _aeropressSteps(coffee_g, water_g, temp_c, style, brew_time_sec) {
  const press_sec  = 30
  const steep_sec  = Math.max(30, brew_time_sec - press_sec)
  const done_sec   = steep_sec + press_sec
  const tempNote   = temp_c < 80 ? ` — низкая температура, настаивайте дольше`
                   : temp_c > 93 ? ` — высокая температура, 60–90 сек достаточно` : ''
  const pourNote   = temp_c > 94 ? `${temp_c}°C — быстрая экстракция, сократите настаивание на 10–15 сек`
                   : temp_c < 80 ? `${temp_c}°C — перемешайте активнее (15–20 сек)` : null

  if (style === 'inverted') {
    const filter_sec = Math.max(steep_sec - 10, Math.round(steep_sec * 0.88))
    return [
      { time: '—',   action: 'Перевернуть AeroPress поршнем вниз (1 см внутри)', note: 'Инвертированный метод — полный контроль настаивания без преждевременного дренажа' },
      { time: '0:00', action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)`, note: null },
      { time: '0:00', action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек`, note: pourNote },
      { time: `0:00 – ${formatTime(steep_sec)}`, action: `Настаивание <strong>${formatTime(steep_sec)}</strong>${tempNote}`, note: 'Не перемешивайте — турбулентность нарушает равномерность' },
      { time: formatTime(filter_sec), action: 'Установить бумажный фильтр, смочить кипятком', note: 'Промывка устраняет бумажный привкус' },
      { time: formatTime(steep_sec), action: 'Аккуратно перевернуть AeroPress на кружку', note: null },
      { time: `${formatTime(steep_sec)} – ${formatTime(done_sec)}`, action: 'Медленно давить поршень ~30 сек до шипения', note: 'Давление ~1 кг; остановитесь на шипении воздуха' },
      { time: formatTime(done_sec), action: '☕ Готово!', note: null },
    ]
  }

  const insert_sec = 30
  return [
    { time: '—',   action: 'Установить фильтр, прогреть кипятком, слить воду', note: 'Промывка фильтра устраняет бумажный привкус и прогревает чашку' },
    { time: '0:00', action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)`, note: null },
    { time: '0:00', action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек`, note: pourNote },
    { time: formatTime(insert_sec), action: 'Вставить поршень — создать вакуум, не давить', note: 'Вакуум замедляет дренаж и увеличивает время контакта' },
    { time: `${formatTime(insert_sec)} – ${formatTime(steep_sec)}`, action: `Настаивание <strong>${formatTime(steep_sec - insert_sec)}</strong>${tempNote}`, note: null },
    { time: `${formatTime(steep_sec)} – ${formatTime(done_sec)}`, action: 'Медленно давить поршень ~30 сек до шипения', note: 'Остановитесь на шипении — последние капли содержат горечь' },
    { time: formatTime(done_sec), action: '☕ Готово!', note: null },
  ]
}

// ─── Filter (Bravilor Bonamat ISO) ────────────────────────────────────────────

/** Steps shown in the main UI (with time labels). */
function _filterStepsUI(coffee_g, water_g, brew_time_sec, grind_microns) {
  const grindNote = grind_microns ? `Помол: ${grind_microns} мкм` : 'Средний помол'
  return [
    {
      time:   '—',
      action: 'Установить бумажный фильтр, промыть горячей водой',
      note:   'Убирает бумажный привкус, прогревает колбу',
    },
    {
      time:   '0:00',
      action: `Засыпать <strong>${coffee_g}г</strong> кофе равномерно`,
      note:   grindNote,
    },
    {
      time:   '0:00',
      action: `Включить машину, залить <strong>${water_g}г</strong> воды`,
      note:   'Bravilor ISO — температура ~93°C, управляет машина',
    },
    {
      time:   `~${formatTime(brew_time_sec)}`,
      action: '☕ Дождаться окончания заваривания',
      note:   `Расчётное время: ${formatTime(brew_time_sec)} (${water_g}мл / 150мл·мин)`,
    },
  ]
}

/** Steps for brew.html (with start_sec). */
function _brewFilter(coffee_g, water_g, brew_time_sec, grind_microns) {
  const grindNote = grind_microns ? `Помол: ${grind_microns} мкм` : null
  return [
    // Prep before timer
    { start_sec: null,           action: 'Установить фильтр, промыть горячей водой', note: 'Убирает бумажный привкус' },
    { start_sec: null,           action: `Засыпать <b>${coffee_g}г</b> кофе равномерно`, note: grindNote },
    // Timer starts when water is poured
    { start_sec: 0,              action: `Залить <b>${water_g}г</b> воды, запустить машину`, note: '~93°C — машина управляет температурой' },
    { start_sec: brew_time_sec,  action: '☕ Заваривание завершено!', note: null },
  ]
}
