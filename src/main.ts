import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import i18n from './i18n'
import './styles/main.css'

// FontAwesome 配置
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faDownload,
  faGamepad,
  faFolderOpen,
  faPalette,
  faGlobe,
  faBolt,
  faBox,
  faPlug,
  faComment,
  faDesktop,
  faCode,
  faLanguage,
  faFilm,
  faBrush,
  faCheck,
  faArrowRight,
  faBars,
  faTimes,
  faStar,
  faRocket,
  faHeart,
  faEnvelope,
  faExternalLinkAlt,
  faImage,
  faExpand
} from '@fortawesome/free-solid-svg-icons'
import {
  faGithub,
  faWindows,
  faVuejs,
  faRust
} from '@fortawesome/free-brands-svg-icons'

// 添加图标到库
library.add(
  faDownload,
  faGamepad,
  faFolderOpen,
  faPalette,
  faGlobe,
  faBolt,
  faBox,
  faPlug,
  faComment,
  faDesktop,
  faCode,
  faLanguage,
  faFilm,
  faBrush,
  faCheck,
  faArrowRight,
  faBars,
  faTimes,
  faStar,
  faRocket,
  faHeart,
  faEnvelope,
  faExternalLinkAlt,
  faImage,
  faExpand,
  faGithub,
  faWindows,
  faVuejs,
  faRust
)

// 路由配置
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return savedPosition || { top: 0 }
  }
})

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(i18n)
app.use(router)
app.mount('#app')
