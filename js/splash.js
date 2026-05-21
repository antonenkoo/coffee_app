// js/splash.js — Loading splash: simple fade-out, no welcome animation
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export async function hideSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.classList.add('sp-fade-out')
  await sleep(400)
  splash.remove()
}
