// js/steps.js
import { formatTime } from './calculator.js'

export function getV60Steps(coffee_g, water_g) {
  const bloom = Math.round(coffee_g * 2)
  const pour1 = Math.round(water_g * 0.6)

  return [
    { time: '0:00',       action: `Bloom: влить <strong>${bloom}г</strong> воды, аккуратно перемешать все сухие частицы` },
    { time: '0:00–0:45',  action: 'Ждать — дать газам выйти (bloom)' },
    { time: '0:45',       action: `Полив 1: долить воды до <strong>${pour1}г</strong>, круговые движения от центра` },
    { time: '1:15',       action: `Полив 2: долить воды до <strong>${water_g}г</strong>, спираль снаружи к центру` },
    { time: '~2:00–3:30', action: 'Дренаж — вода стекает через фильтр' },
    { time: '~3:00–3:30', action: 'Слегка покрутить V60 для выравнивания гущи' },
  ]
}

export function getAeropressSteps(coffee_g, water_g, temp_c, style) {
  if (style === 'inverted') {
    return [
      { time: '—',         action: 'Перевернуть AeroPress поршнем вниз, поршень на 1 см внутри камеры' },
      { time: '0:00',      action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)` },
      { time: '0:00',      action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек` },
      { time: '0:00–1:30', action: 'Ждать 1:30 — настаивание (вода не вытекает)' },
      { time: '1:20',      action: 'Установить бумажный фильтр, смочить его' },
      { time: '1:30',      action: 'Аккуратно перевернуть AeroPress на кружку' },
      { time: '1:30–2:00', action: 'Медленно давить поршень ~30 сек до шипения воздуха' },
      { time: '2:00',      action: '☕ Готово!' },
    ]
  } else {
    return [
      { time: '—',         action: 'Установить бумажный фильтр, прогреть кипятком, слить воду' },
      { time: '0:00',      action: `Засыпать <strong>${coffee_g}г</strong> кофе (средний помол)` },
      { time: '0:00',      action: `Залить <strong>${water_g}г</strong> воды (${temp_c}°C), перемешать 10 сек` },
      { time: '0:30',      action: 'Вставить поршень — создать вакуум, не давить' },
      { time: '0:30–2:00', action: 'Ждать 1:30 — настаивание' },
      { time: '2:00',      action: 'Медленно давить поршень ~30 сек до шипения' },
      { time: '2:30',      action: '☕ Готово!' },
    ]
  }
}
