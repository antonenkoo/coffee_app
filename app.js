// app.js — SPA entry point
import { initAuthManager } from './js/auth-manager.js'
import { initSidebar }     from './js/sidebar.js'
import { initRouter }      from './js/router.js'
import { applyI18n }       from './js/i18n.js'

applyI18n()
initAuthManager()
initSidebar()
initRouter()
