// js/views/home.js
import { t, applyI18n } from '../i18n.js'

export const homeView = {
  getHTML() {
    return `
    <div class="home-hero">
      <div class="home-tagline">Как хотите заварить?</div>
    </div>
    <div class="home-mode-cards">

      <div class="home-card" id="card-simple">
        <div class="home-card-icon">⏱</div>
        <div class="home-card-title">Просто таймер</div>
        <div class="home-card-desc">Без рецепта. Просто запустите таймер и варите как умеете.</div>
        <button class="home-card-btn">Начать</button>
      </div>

      <div class="home-card" id="card-advanced">
        <div class="home-card-icon">📋</div>
        <div class="home-card-title">По рецепту</div>
        <div class="home-card-desc">Рассчитайте дозировку и следуйте пошаговой инструкции.</div>
        <button class="home-card-btn home-card-btn--accent">Выбрать рецепт</button>
      </div>

    </div>`
  },

  init() {
    applyI18n()

    document.getElementById('card-simple').addEventListener('click', () => {
      sessionStorage.setItem('brewState', JSON.stringify({
        mode: 'simple',
        method: 'simple',
        coffee_g: 0,
        water_g: 0,
        temp_c: 0,
        ratio: 0,
        brew_time_sec: 3600,
        brewSteps: [],
      }))
      window.location.href = 'brew.html'
    })

    document.getElementById('card-advanced').addEventListener('click', () => {
      location.hash = '#advanced'
    })
  }
}
