// js/i18n.js — UI translations (RU / UK / EN)
// Brew steps / tips / warnings are content — kept in RU, translated separately later.

const TRANSLATIONS = {
  ru: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    'auth.title':    'Вход / Регистрация',
    'auth.email':    'Email',
    'auth.password': 'Пароль',
    'auth.login':    'Войти',
    'auth.signup':   'Регистрация',
    'auth.google':   'Войти через Google',

    // ── Parameters ────────────────────────────────────────────────────────────
    'param.coffee':      'Кофе',
    'param.water':       'Вода',
    'param.ratio':       'Brew Ratio',
    'param.temperature': 'Температура',
    'param.brewtime':    'Время',
    'param.grindsize':   'Помол',
    'param.grind.manual':'Помол',
    'param.auto':        'Авто',
    'param.apply':       'Apply',

    // ── Units ─────────────────────────────────────────────────────────────────
    'unit.g':       'г',
    'unit.ml':      'мл',
    'unit.min':     'мин',
    'unit.microns': 'мкм',
    'unit.clicks':  'кл C40',
    'unit.machine': '(машина)',

    // ── Style toggle ──────────────────────────────────────────────────────────
    'style.label':    'Style',
    'style.standard': 'Standard',
    'style.inverted': 'Inverted',

    // ── Grind hint ────────────────────────────────────────────────────────────
    'grind.hint': 'рек. 600–800 мкм для Bravilor ISO',

    // ── Template selector ────────────────────────────────────────────────────
    'template.placeholder': '— Выбрать рецепт —',
    'suggestion.apply':     'Применить',

    // ── Sections ─────────────────────────────────────────────────────────────
    'section.techniques':   'Техника пролива',
    'section.brewsteps':    'Brew Steps',
    'section.tips':         'Barista Tips',
    'section.recommended':  'Рекомендуется для этого рецепта',
    'section.rec.temp':     'Оптимальная температура',
    'section.rec.time':     'Оптимальное время',

    // ── Technique names ───────────────────────────────────────────────────────
    'tech.3pour.name': '3 пролива',
    'tech.3pour.desc': 'Блум → 60% воды → 100%. Классический контроль экстракции.',
    'tech.1pour.name': 'Один пролив',
    'tech.1pour.desc': 'Все воды одним непрерывным потоком после блума. Метод Хоффманна.',
    'tech.46.name':    '4:6 метод',
    'tech.46.desc':    '40% → 3×20%. Победитель World Brewers Cup 2016. Точный контроль вкуса.',

    // ── Brew button ───────────────────────────────────────────────────────────
    'btn.brew':          '▶\u00a0\u00a0BREW',
    'btn.reset.title':   'Сбросить к дефолтам',

    // ── Impossible overlay ────────────────────────────────────────────────────
    'impossible.title':  'Невозможные параметры',
    'impossible.sub':    'Значения выходят за допустимые пределы метода',

    // ── Modal ─────────────────────────────────────────────────────────────────
    'modal.title':       'Adjust Parameters',
    'modal.question':    'What should change to match the new ratio?',
    'modal.cancel':      'Cancel',
    'modal.apply':       'Apply',
    'modal.water':       'Изменить воду',
    'modal.coffee':      'Изменить кофе',
    'modal.both':        'Оба (balanced)',

    // ── Validation errors ─────────────────────────────────────────────────────
    'error.coffee':  'от 5 до 100 г',
    'error.water':   'от 50 до 1000 г',
    'error.ratio':   'от 8 до 20',
    'error.temp':    'от 70 до 100°C',
    'error.time':    'введите время > 0',

    // ── Bottom nav ────────────────────────────────────────────────────────────
    'nav.calc':  'Калькулятор',
    'nav.feed':  'Feed',
    'nav.mine':  'Мои',

    // ── Feed page ─────────────────────────────────────────────────────────────
    'feed.subtitle':     'Рецепты сообщества',
    'feed.loading':      'Загрузка...',
    'feed.empty':        'Пока никто не поделился рецептами.',
    'feed.empty.cta':    'Будьте первым — заварите кофе и нажмите «Поделиться»!',
    'feed.loadmore':     'Загрузить ещё',
    'feed.load.btn':     'Загрузить в калькулятор',

    // ── My Recipes page ───────────────────────────────────────────────────────
    'myrecipes.title':   'Мои рецепты',
    'myrecipes.loading': 'Загрузка...',
    'myrecipes.empty':   'У вас пока нет сохранённых рецептов.',
    'myrecipes.empty.cta': 'Заварите кофе и нажмите «Записать рецепт»!',
    'myrecipes.auth':    'Для просмотра рецептов необходимо',
    'myrecipes.auth.link': 'войти в аккаунт',
    'myrecipes.delete':  'Удалить',
    'myrecipes.load':    'Загрузить',
    'myrecipes.confirm.delete': 'Удалить этот рецепт? Это действие нельзя отменить.',

    // ── Save recipe page ──────────────────────────────────────────────────────
    'save.title':        'Записать рецепт',
    'save.card.params':  'Параметры заваривания',
    'save.label.coffee': 'Кофе',
    'save.label.water':  'Вода',
    'save.label.temp':   'Температура',
    'save.label.time':   'Общее время',
    'save.label.method': 'Метод',
    'save.card.bean':    'Зерно',
    'save.bean.placeholder': 'Эфиопия Иргачеффе, светлая обжарка...',
    'save.card.grinder': 'Кофемолка',
    'save.grinder.none': '— не указано —',
    'save.label.clicks': 'Клики',
    'save.label.microns':'Помол',
    'save.card.taste':   'Вкус',
    'save.taste.sweet':  'Сладость',
    'save.taste.acid':   'Кислотность',
    'save.taste.bitter': 'Горечь',
    'save.card.notes':   'Заметки',
    'save.notes.placeholder': 'Впечатления, что изменить в следующий раз...',
    'save.btn':          'Сохранить рецепт',
    'save.btn.saving':   'Сохраняю...',
    'save.share.title':  'Рецепт сохранён!',
    'save.share.desc':   'Хотите поделиться этим рецептом? Другие пользователи смогут его увидеть в ленте.',
    'save.share.do':     'Поделиться в Feed',
    'save.share.skip':   'Только в Мои рецепты',
    'save.auth.required':'Для сохранения рецепта необходимо войти в аккаунт.',

    // ── Brew page ─────────────────────────────────────────────────────────────
    'brew.prep.title':   'Подготовка перед таймером:',
    'brew.start.btn':    '▶\u00a0\u00a0Начать заваривание',
    'brew.current.label':'Текущий шаг',
    'brew.next.label':   'Следующий',
    'brew.done.title':   'Готово!',
    'brew.save.btn':     'Записать рецепт',
    'brew.back.btn':     'Завершить без записи',
    'brew.stop.confirm': 'Заваривание прервано. Данные не сохранятся. Выйти?',
    'brew.exit.confirm': 'Данные о заваривании не сохранятся. Точно выйти?',
    'brew.time.label':   'Время заваривания: ',

    // ── Profile page ─────────────────────────────────────────────────────────
    'nav.profile':             'Профиль',
    'profile.title':           'Профиль',
    'profile.nickname':        'Никнейм',
    'profile.nickname.placeholder': 'Ваш никнейм',
    'profile.nickname.save':   'Сохранить',
    'profile.nickname.saved':  'Сохранено!',
    'profile.section.account': 'Аккаунт',
    'profile.section.data':    'Данные',
    'profile.section.app':     'Приложение',
    'profile.email':           'Email',
    'profile.recipes.count':   'Сохранённых рецептов',
    'profile.techniques.count':'Кастомных техник',
    'profile.recipes.clear':   'Очистить все рецепты',
    'profile.techniques.clear':'Удалить все техники',
    'profile.confirm.clear.recipes': 'Удалить ВСЕ ваши рецепты? Это действие нельзя отменить.',
    'profile.confirm.clear.techniques': 'Удалить ВСЕ кастомные техники? Это действие нельзя отменить.',
    'profile.language':        'Язык',
    'profile.signout':         'Выйти из аккаунта',
    'profile.version':         'Версия',
    'profile.auth.required':   'Войдите, чтобы управлять профилем',
  },

  // ────────────────────────────────────────────────────────────────────────────
  uk: {
    'auth.title':    'Вхід / Реєстрація',
    'auth.email':    'Email',
    'auth.password': 'Пароль',
    'auth.login':    'Увійти',
    'auth.signup':   'Реєстрація',
    'auth.google':   'Увійти через Google',

    'param.coffee':      'Кава',
    'param.water':       'Вода',
    'param.ratio':       'Brew Ratio',
    'param.temperature': 'Температура',
    'param.brewtime':    'Час',
    'param.grindsize':   'Помел',
    'param.grind.manual':'Помел',
    'param.auto':        'Авто',
    'param.apply':       'Застосувати',

    'unit.g':       'г',
    'unit.ml':      'мл',
    'unit.min':     'хв',
    'unit.microns': 'мкм',
    'unit.clicks':  'кл C40',
    'unit.machine': '(машина)',

    'style.label':    'Стиль',
    'style.standard': 'Стандарт',
    'style.inverted': 'Інвертований',

    'grind.hint': 'рек. 600–800 мкм для Bravilor ISO',

    'template.placeholder': '— Обрати рецепт —',
    'suggestion.apply':     'Застосувати',

    'section.techniques':  'Техніка проливу',
    'section.brewsteps':   'Brew Steps',
    'section.tips':        'Barista Tips',
    'section.recommended': 'Рекомендовано для цього рецепту',
    'section.rec.temp':    'Оптимальна температура',
    'section.rec.time':    'Оптимальний час',

    'tech.3pour.name': '3 проливи',
    'tech.3pour.desc': 'Блум → 60% води → 100%. Класичний контроль екстракції.',
    'tech.1pour.name': 'Один пролив',
    'tech.1pour.desc': 'Вся вода одним безперервним потоком після блуму. Метод Хоффманна.',
    'tech.46.name':    '4:6 метод',
    'tech.46.desc':    '40% → 3×20%. Переможець World Brewers Cup 2016. Точний контроль смаку.',

    'btn.brew':          '▶\u00a0\u00a0BREW',
    'btn.reset.title':   'Скинути до налаштувань',

    'impossible.title':  'Неможливі параметри',
    'impossible.sub':    'Значення виходять за допустимі межі методу',

    'modal.title':       'Adjust Parameters',
    'modal.question':    'What should change to match the new ratio?',
    'modal.cancel':      'Скасувати',
    'modal.apply':       'Застосувати',
    'modal.water':       'Змінити воду',
    'modal.coffee':      'Змінити каву',
    'modal.both':        'Обидва (balanced)',

    'error.coffee':  'від 5 до 100 г',
    'error.water':   'від 50 до 1000 г',
    'error.ratio':   'від 8 до 20',
    'error.temp':    'від 70 до 100°C',
    'error.time':    'введіть час > 0',

    'nav.calc':  'Калькулятор',
    'nav.feed':  'Feed',
    'nav.mine':  'Мої',

    'feed.subtitle':   'Рецепти спільноти',
    'feed.loading':    'Завантаження...',
    'feed.empty':      'Поки ніхто не ділився рецептами.',
    'feed.empty.cta':  'Будьте першим — заваріть каву і натисніть «Поділитись»!',
    'feed.loadmore':   'Завантажити ще',
    'feed.load.btn':   'Завантажити в калькулятор',

    'myrecipes.title':   'Мої рецепти',
    'myrecipes.loading': 'Завантаження...',
    'myrecipes.empty':   'У вас поки немає збережених рецептів.',
    'myrecipes.empty.cta': 'Заваріть каву і натисніть «Записати рецепт»!',
    'myrecipes.auth':    'Для перегляду рецептів необхідно',
    'myrecipes.auth.link': 'увійти в акаунт',
    'myrecipes.delete':  'Видалити',
    'myrecipes.load':    'Завантажити',
    'myrecipes.confirm.delete': 'Видалити цей рецепт? Цю дію не можна скасувати.',

    'save.title':        'Записати рецепт',
    'save.card.params':  'Параметри заварювання',
    'save.label.coffee': 'Кава',
    'save.label.water':  'Вода',
    'save.label.temp':   'Температура',
    'save.label.time':   'Загальний час',
    'save.label.method': 'Метод',
    'save.card.bean':    'Зерно',
    'save.bean.placeholder': 'Ефіопія Ірґачеффе, світле обсмаження...',
    'save.card.grinder': 'Кавомолка',
    'save.grinder.none': '— не вказано —',
    'save.label.clicks': 'Кліки',
    'save.label.microns':'Помел',
    'save.card.taste':   'Смак',
    'save.taste.sweet':  'Солодкість',
    'save.taste.acid':   'Кислотність',
    'save.taste.bitter': 'Гіркота',
    'save.card.notes':   'Нотатки',
    'save.notes.placeholder': 'Враження, що змінити наступного разу...',
    'save.btn':          'Зберегти рецепт',
    'save.btn.saving':   'Зберігаю...',
    'save.share.title':  'Рецепт збережено!',
    'save.share.desc':   'Хочете поділитися цим рецептом? Інші користувачі зможуть його побачити в стрічці.',
    'save.share.do':     'Поділитися в Feed',
    'save.share.skip':   'Тільки в Мої рецепти',
    'save.auth.required':'Для збереження рецепту необхідно увійти в акаунт.',

    'brew.prep.title':   'Підготовка перед таймером:',
    'brew.start.btn':    '▶\u00a0\u00a0Почати заварювання',
    'brew.current.label':'Поточний крок',
    'brew.next.label':   'Наступний',
    'brew.done.title':   'Готово!',
    'brew.save.btn':     'Записати рецепт',
    'brew.back.btn':     'Завершити без запису',
    'brew.stop.confirm': 'Заварювання перервано. Дані не збережуться. Вийти?',
    'brew.exit.confirm': 'Дані про заварювання не збережуться. Точно вийти?',
    'brew.time.label':   'Час заварювання: ',

    'nav.profile':             'Профіль',
    'profile.title':           'Профіль',
    'profile.nickname':        'Нікнейм',
    'profile.nickname.placeholder': 'Ваш нікнейм',
    'profile.nickname.save':   'Зберегти',
    'profile.nickname.saved':  'Збережено!',
    'profile.section.account': 'Акаунт',
    'profile.section.data':    'Дані',
    'profile.section.app':     'Додаток',
    'profile.email':           'Email',
    'profile.recipes.count':   'Збережених рецептів',
    'profile.techniques.count':'Кастомних технік',
    'profile.recipes.clear':   'Очистити всі рецепти',
    'profile.techniques.clear':'Видалити всі техніки',
    'profile.confirm.clear.recipes': 'Видалити ВСІ ваші рецепти? Цю дію не можна скасувати.',
    'profile.confirm.clear.techniques': 'Видалити ВСІ кастомні техніки? Цю дію не можна скасувати.',
    'profile.language':        'Мова',
    'profile.signout':         'Вийти з акаунту',
    'profile.version':         'Версія',
    'profile.auth.required':   'Увійдіть, щоб керувати профілем',
  },

  // ────────────────────────────────────────────────────────────────────────────
  en: {
    'auth.title':    'Sign In / Register',
    'auth.email':    'Email',
    'auth.password': 'Password',
    'auth.login':    'Sign In',
    'auth.signup':   'Register',
    'auth.google':   'Sign in with Google',

    'param.coffee':      'Coffee',
    'param.water':       'Water',
    'param.ratio':       'Brew Ratio',
    'param.temperature': 'Temperature',
    'param.brewtime':    'Brew Time',
    'param.grindsize':   'Grind Size',
    'param.grind.manual':'Grind',
    'param.auto':        'Auto',
    'param.apply':       'Apply',

    'unit.g':       'g',
    'unit.ml':      'ml',
    'unit.min':     'min',
    'unit.microns': 'µm',
    'unit.clicks':  'cl C40',
    'unit.machine': '(machine)',

    'style.label':    'Style',
    'style.standard': 'Standard',
    'style.inverted': 'Inverted',

    'grind.hint': 'rec. 600–800 µm for Bravilor ISO',

    'template.placeholder': '— Select recipe —',
    'suggestion.apply':     'Apply',

    'section.techniques':  'Pouring Technique',
    'section.brewsteps':   'Brew Steps',
    'section.tips':        'Barista Tips',
    'section.recommended': 'Recommended for this recipe',
    'section.rec.temp':    'Optimal temperature',
    'section.rec.time':    'Optimal time',

    'tech.3pour.name': '3-pour',
    'tech.3pour.desc': 'Bloom → 60% water → 100%. Classic extraction control.',
    'tech.1pour.name': 'Single pour',
    'tech.1pour.desc': 'All water in one continuous stream after bloom. Hoffmann method.',
    'tech.46.name':    '4:6 method',
    'tech.46.desc':    '40% → 3×20%. World Brewers Cup 2016 winner. Precise flavour control.',

    'btn.brew':          '▶\u00a0\u00a0BREW',
    'btn.reset.title':   'Reset to defaults',

    'impossible.title':  'Impossible Parameters',
    'impossible.sub':    'Values exceed the method\'s allowed range',

    'modal.title':       'Adjust Parameters',
    'modal.question':    'What should change to match the new ratio?',
    'modal.cancel':      'Cancel',
    'modal.apply':       'Apply',
    'modal.water':       'Adjust water',
    'modal.coffee':      'Adjust coffee',
    'modal.both':        'Both (balanced)',

    'error.coffee':  '5 to 100 g',
    'error.water':   '50 to 1000 g',
    'error.ratio':   '8 to 20',
    'error.temp':    '70 to 100°C',
    'error.time':    'enter time > 0',

    'nav.calc':  'Calculator',
    'nav.feed':  'Feed',
    'nav.mine':  'Mine',

    'feed.subtitle':   'Community Recipes',
    'feed.loading':    'Loading...',
    'feed.empty':      'No recipes shared yet.',
    'feed.empty.cta':  'Be first — brew coffee and tap Share!',
    'feed.loadmore':   'Load more',
    'feed.load.btn':   'Load to calculator',

    'myrecipes.title':   'My Recipes',
    'myrecipes.loading': 'Loading...',
    'myrecipes.empty':   'No saved recipes yet.',
    'myrecipes.empty.cta': 'Brew coffee and tap Save Recipe!',
    'myrecipes.auth':    'Please',
    'myrecipes.auth.link': 'sign in',
    'myrecipes.delete':  'Delete',
    'myrecipes.load':    'Load',
    'myrecipes.confirm.delete': 'Delete this recipe? This cannot be undone.',

    'save.title':        'Save Recipe',
    'save.card.params':  'Brew Parameters',
    'save.label.coffee': 'Coffee',
    'save.label.water':  'Water',
    'save.label.temp':   'Temperature',
    'save.label.time':   'Total Time',
    'save.label.method': 'Method',
    'save.card.bean':    'Bean',
    'save.bean.placeholder': 'Ethiopia Yirgacheffe, light roast...',
    'save.card.grinder': 'Grinder',
    'save.grinder.none': '— not specified —',
    'save.label.clicks': 'Clicks',
    'save.label.microns':'Grind',
    'save.card.taste':   'Taste',
    'save.taste.sweet':  'Sweetness',
    'save.taste.acid':   'Acidity',
    'save.taste.bitter': 'Bitterness',
    'save.card.notes':   'Notes',
    'save.notes.placeholder': 'Impressions, what to change next time...',
    'save.btn':          'Save Recipe',
    'save.btn.saving':   'Saving...',
    'save.share.title':  'Recipe saved!',
    'save.share.desc':   'Want to share this recipe? Other users will see it in the feed.',
    'save.share.do':     'Share to Feed',
    'save.share.skip':   'Only in My Recipes',
    'save.auth.required':'You need to sign in to save a recipe.',

    'brew.prep.title':   'Preparation before timer:',
    'brew.start.btn':    '▶\u00a0\u00a0Start Brewing',
    'brew.current.label':'Current step',
    'brew.next.label':   'Next',
    'brew.done.title':   'Done!',
    'brew.save.btn':     'Save Recipe',
    'brew.back.btn':     'Exit without saving',
    'brew.stop.confirm': 'Brew interrupted. Data will not be saved. Exit?',
    'brew.exit.confirm': 'Brew data will not be saved. Exit?',
    'brew.time.label':   'Brew time: ',

    'nav.profile':             'Profile',
    'profile.title':           'Profile',
    'profile.nickname':        'Nickname',
    'profile.nickname.placeholder': 'Your nickname',
    'profile.nickname.save':   'Save',
    'profile.nickname.saved':  'Saved!',
    'profile.section.account': 'Account',
    'profile.section.data':    'Data',
    'profile.section.app':     'App',
    'profile.email':           'Email',
    'profile.recipes.count':   'Saved recipes',
    'profile.techniques.count':'Custom techniques',
    'profile.recipes.clear':   'Clear all recipes',
    'profile.techniques.clear':'Delete all techniques',
    'profile.confirm.clear.recipes': 'Delete ALL your recipes? This cannot be undone.',
    'profile.confirm.clear.techniques': 'Delete ALL custom techniques? This cannot be undone.',
    'profile.language':        'Language',
    'profile.signout':         'Sign out',
    'profile.version':         'Version',
    'profile.auth.required':   'Sign in to manage your profile',
  },
}

// ── Core API ──────────────────────────────────────────────────────────────────

const SUPPORTED = ['ru', 'uk', 'en']
const FALLBACK  = 'ru'

export function getLang() {
  const saved = localStorage.getItem('lang')
  return SUPPORTED.includes(saved) ? saved : FALLBACK
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return
  localStorage.setItem('lang', lang)
  document.documentElement.lang = lang
}

export function t(key) {
  const lang = getLang()
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[FALLBACK]?.[key] ?? key
}

/**
 * Walk the DOM and replace text/placeholder/title for all [data-i18n] elements.
 * Call after any language change or after renderAll().
 */
export function applyI18n() {
  document.documentElement.lang = getLang()

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key)
    } else {
      el.textContent = t(key)
    }
  })

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle)
  })

  // Update active state on lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLang())
  })
}
