import { createApp } from 'vue'
import DownloadApp from './DownloadApp.vue'
import i18n from './i18n'
import './styles/main.css'

const app = createApp(DownloadApp)
app.use(i18n)
app.mount('#download-app')
