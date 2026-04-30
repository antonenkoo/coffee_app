// js/steps.js
import { formatTime } from './calculator.js'

/**
 * Single entry point. Returns step array for current state.
 * Each step: { time: string, action: string }
 */
export function getSteps(state) {
  const { method, coffee_g, water_g, temp_c, brew_time_sec, aeropress_style } = state
  return method === 'v60'
    ? _v60Steps(coffee_g, water_g, temp_c, brew_time_sec)
    : _aeropressSteps(coffee_g, water_g, temp_c, aeropress_style, brew_time_sec)
}

// ─── V60 ─────────────────────────────────────────────────────────────────────

function _v60Steps(coffee_g, water_g, temp_c, brew_time_sec) {
  const bloom_g   = Math.round(coffee_g * 2)
  const bloom_sec = 45  // degassing window — fixed regardless of brew time

  // Scale pour intervals proportionally to brew time (base = 180s)
  const scale     = Math.max(0.7, Math.min(1.6, brew_time_sec / 180))
  const pour1_sec = bloom_sec                            // pour 1 immediately after bloom
  const pour2_sec = Math.round(pour1_sec + 28 * scale)  // base: +28s → 1:13, scaled
  const pour1_g   = Math.round(water_g * 0.6)
  const drain_end = brew_time_sec

  const tech = _v60PourTechnique(temp_c)

  return [
    {
      time:   '0:00',
      action: `Bloom: влить <strong>${bloom_g}г</strong> воды, аккуратно перемешать все сухие частицы`,
    },
    {
      time:   `0:00 – ${formatTime(bloom_sec)}`,
      action: `Ждать ${bloom_sec} сек — дать газам выйти (блум)`,
    },
    {
      time:   formatTime(pour1_sec),
      action: `Полив 1: долить до <strong>${pour1_g}г</strong>. ${tech.pour1}`,
    },
    {
      time:   formatTime(pour2_sec),
      action: `Полив 2: долить до <strong>${water_g}г</strong>. ${tech.pour2}`,
    },
    {
      time:   `~${formatTime(pour2_sec + 25)} – ${formatTime(drain_end)}`,
      action: 'Дренаж — вода стекает через фильтр',
    },
    {
      time:   `~${formatTime(drain_end)}`,
      action: 'Слегка покрутить V60 для выравнивания гущи ☕',
    },
  ]
}

/**
 * Pour technique advice based on temperature:
 * >95°C → aggressive (intense circular pour)
 * <88°C → gentle (slow spiral)
 * 88–95°C → standard
 */
function _v60PourTechnique(temp_c) {
  if (temp_c > 95) {
    return {
      pour1: 'Уверенная непрерывная струя круговыми движениями — высокая температура требует активного перемешивания',
      pour2: 'Непрерывная спираль снаружи к центру без пауз',
    }
  }
  if (temp_c < 88) {
    return {
      pour1: 'Медленная нежная струя — дайте воде постепенно проникнуть в кофе',
      pour2: 'Плавная спираль, равномерно и медленно, без резких движений',
    }
  }
  return {
    pour1: 'Равномерная круговая струя от центра',
    pour2: 'Спираль снаружи к центру',
  }
}

// ─── AeroPress ───────────────────────────────────────────────────────────────

function _aeropressSteps(coffee_g, water_g, temp_c, style, brew_time_sec) {
  const press_sec = 30
  // Steep time = total brew time minus press time, minimum 30s
  const steep_sec = Math.max(30, brew_time_sec - press_sec)
  const done_sec  = steep_sec + press_sec

  // Temperature note injected into the steep step
  let tempNote = ''
  if (temp_c < 80) {
    tempNote = ' — низкая температура, настаивайте дольше для полной экстракции'
  } else if (temp_c > 93) {
    tempNote = ' — высокая температура, достаточно 60–90 сек'
  }

  if (style === 'inverted') {
    const filter_sec = Math.max(steep_sec - 10, Math.round(steep_sec * 0.88))
    return [
      {
        time:   '—',
        action: 'Перевернуть AeroPress поршнем вниз, поршень на 1 см внутри камеры',
      },
      {
        time:   '0:00',
        action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)`,
      },
      {
        time:   '0:00',
        action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек`,
      },
      {
        time:   `0:00 – ${formatTime(steep_sec)}`,
        action: `Настаивание <strong>${formatTime(steep_sec)}</strong>${tempNote}`,
      },
      {
        time:   formatTime(filter_sec),
        action: 'Установить бумажный фильтр, смочить его',
      },
      {
        time:   formatTime(steep_sec),
        action: 'Аккуратно перевернуть AeroPress на кружку',
      },
      {
        time:   `${formatTime(steep_sec)} – ${formatTime(done_sec)}`,
        action: 'Медленно давить поршень ~30 сек до шипения воздуха',
      },
      {
        time:   formatTime(done_sec),
        action: '☕ Готово!',
      },
    ]
  }

  // Standard
  const insert_sec = 30
  return [
    {
      time:   '—',
      action: 'Установить бумажный фильтр, прогреть кипятком, слить воду',
    },
    {
      time:   '0:00',
      action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)`,
    },
    {
      time:   '0:00',
      action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек`,
    },
    {
      time:   formatTime(insert_sec),
      action: 'Вставить поршень — создать вакуум, не давить',
    },
    {
      time:   `${formatTime(insert_sec)} – ${formatTime(steep_sec)}`,
      action: `Настаивание <strong>${formatTime(steep_sec - insert_sec)}</strong>${tempNote}`,
    },
    {
      time:   `${formatTime(steep_sec)} – ${formatTime(done_sec)}`,
      action: 'Медленно давить поршень ~30 сек до шипения',
    },
    {
      time:   formatTime(done_sec),
      action: '☕ Готово!',
    },
  ]
}
