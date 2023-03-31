import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import App from './App.vue'
import { firebaseApp } from './firebase'

import './assets/main.css'

const app = createApp(App)
app
  .use(VueFire, {
    firebaseApp,
  })

app.mount('#app')
