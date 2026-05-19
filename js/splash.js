// js/splash.js — Loading splash animation
function rnd(a, b) { return a + Math.random() * (b - a) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export async function hideSplash(name = 'Mark') {
  const splash = document.getElementById('splash')
  if (!splash) return

  // Hide main UI for assembly-in effect later
  document.body.classList.add('app-entering')

  const iconEl = document.getElementById('splash-icon')
  const spinEl = document.getElementById('splash-spinner')

  // Phase 1: scatter icon + spinner outward
  for (const el of [iconEl, spinEl]) {
    if (!el) continue
    el.style.setProperty('--tx', `${rnd(-280, 280)}px`)
    el.style.setProperty('--ty', `${rnd(-380, -100)}px`)
    el.style.setProperty('--rot', `${rnd(-300, 300)}deg`)
    el.classList.add('sp-scatter')
  }

  await sleep(360)

  // Phase 2: assemble "Welcome {name}" letter by letter from scattered positions
  const welcomeEl = document.createElement('div')
  welcomeEl.id = 'splash-welcome'
  splash.appendChild(welcomeEl)

  const letters = [...`Welcome ${name}`].map(ch => {
    const span = document.createElement('span')
    span.className = 'sp-letter'
    span.textContent = ch === ' ' ? ' ' : ch
    span.style.setProperty('--tx', `${rnd(-200, 200)}px`)
    span.style.setProperty('--ty', `${rnd(-260, 260)}px`)
    welcomeEl.appendChild(span)
    return span
  })

  letters.forEach((span, i) =>
    setTimeout(() => span.classList.add('sp-letter-in'), i * 45)
  )

  await sleep(45 * letters.length + 580)

  // Phase 3: scatter all letters outward simultaneously
  letters.forEach((span, i) => {
    span.style.setProperty('--tx', `${rnd(-400, 400)}px`)
    span.style.setProperty('--ty', `${rnd(-300, 300)}px`)
    span.style.setProperty('--rot', `${rnd(-400, 400)}deg`)
    setTimeout(() => span.classList.add('sp-letter-out'), i * 10)
  })

  await sleep(10 * letters.length + 320)

  // Phase 4: reveal and assemble main interface
  document.body.classList.remove('app-entering')
  document.body.classList.add('app-assembled')

  splash.classList.add('sp-fade-out')
  await sleep(450)
  splash.remove()
  setTimeout(() => document.body.classList.remove('app-assembled'), 800)
}
