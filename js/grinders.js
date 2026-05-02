// js/grinders.js — popular grinder models database
// micron_per_click: approximate µm per click/step (Comandante = 25µm/click)

export const GRINDERS = [
  { id: 'comandante_c40',   name: 'Comandante C40',       type: 'hand',    micron_per_click: 25  },
  { id: 'comandante_c60',   name: 'Comandante C60',       type: 'hand',    micron_per_click: 25  },
  { id: 'timemore_c3',      name: 'Timemore C3',          type: 'hand',    micron_per_click: 22  },
  { id: 'timemore_c3_pro',  name: 'Timemore C3 Pro',      type: 'hand',    micron_per_click: 22  },
  { id: 'timemore_s90',     name: 'Timemore S90',         type: 'hand',    micron_per_click: 20  },
  { id: '1zpresso_jx',      name: '1Zpresso JX',          type: 'hand',    micron_per_click: 22  },
  { id: '1zpresso_jmax',    name: '1Zpresso JMax',        type: 'hand',    micron_per_click: 22  },
  { id: 'kingrinder_k6',    name: 'Kingrinder K6',        type: 'hand',    micron_per_click: 22  },
  { id: 'baratza_encore',   name: 'Baratza Encore',       type: 'electric', micron_per_click: null },
  { id: 'baratza_virtuoso', name: 'Baratza Virtuoso+',    type: 'electric', micron_per_click: null },
  { id: 'fellow_ode',       name: 'Fellow Ode Gen 2',     type: 'electric', micron_per_click: null },
  { id: 'wilfa_svart',      name: 'Wilfa Svart',          type: 'electric', micron_per_click: null },
  { id: 'niche_zero',       name: 'Niche Zero',           type: 'electric', micron_per_click: null },
  { id: 'ek43',             name: 'Mahlkönig EK43',       type: 'electric', micron_per_click: null },
  { id: 'df64',             name: 'DF64 Gen 2',           type: 'electric', micron_per_click: null },
  { id: 'other',            name: 'Другая молка',         type: 'other',   micron_per_click: null },
]

export function getGrinderById(id) {
  return GRINDERS.find(g => g.id === id) ?? null
}
