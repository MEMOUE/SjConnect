// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'

// PrimeVue components
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'
import MenuBar from 'primevue/menubar'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'
import AvatarGroup from 'primevue/avatargroup'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import InlineMessage from 'primevue/inlinemessage'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'
import SplitButton from 'primevue/splitbutton'
import OverlayPanel from 'primevue/overlaypanel'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Divider from 'primevue/divider'
import ScrollPanel from 'primevue/scrollpanel'

import "@primevue/themes/lara/autocomplete";  // ✅ thème
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import './style.css'

const app = createApp(App)

// PrimeVue configuration
app.use(PrimeVue, {
  ripple: true,
  inputStyle: 'outlined'
})

app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)

// Global component registration
app.component('Button', Button)
app.component('Card', Card)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('Textarea', Textarea)
app.component('Dropdown', Dropdown)
app.component('Checkbox', Checkbox)
app.component('RadioButton', RadioButton)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Sidebar', Sidebar)
app.component('Menu', Menu)
app.component('MenuBar', MenuBar)
app.component('Badge', Badge)
app.component('Avatar', Avatar)
app.component('AvatarGroup', AvatarGroup)
app.component('Chip', Chip)
app.component('Tag', Tag)
app.component('Panel', Panel)
app.component('Accordion', Accordion)
app.component('AccordionTab', AccordionTab)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Message', Message)
app.component('InlineMessage', InlineMessage)
app.component('Skeleton', Skeleton)
app.component('Toolbar', Toolbar)
app.component('SplitButton', SplitButton)
app.component('OverlayPanel', OverlayPanel)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('Divider', Divider)
app.component('ScrollPanel', ScrollPanel)

app.use(createPinia())
app.use(router)

app.mount('#app')