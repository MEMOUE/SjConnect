// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../components/Dashboard.vue'),
      meta: { title: 'Tableau de bord' }
    },
    {
      path: '/entreprises',
      name: 'entreprises',
      component: () => import('../components/Entreprises.vue'),
      meta: { title: 'Entreprises' }
    },
    {
      path: '/entreprises/:id',
      name: 'entreprise-detail',
      component: () => import('../components/EntrepriseDetail.vue'),
      meta: { title: 'Détail Entreprise' }
    },
    {
      path: '/groupes',
      name: 'groupes',
      component: () => import('../components/Groupes.vue'),
      meta: { title: 'Groupes' }
    },
    {
      path: '/groupes/:id',
      name: 'groupe-detail',
      component: () => import('../components/GroupeDetail.vue'),
      meta: { title: 'Détail Groupe' }
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../components/Messages.vue'),
      meta: { title: 'Messages' }
    },
    {
      path: '/demandes',
      name: 'demandes',
      component: () => import('../components/Demandes.vue'),
      meta: { title: 'Demandes d\'intégration' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/NotFound.vue'),
      meta: { title: 'Page non trouvée' }
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  // Mise à jour du titre de la page
  if (to.meta.title) {
    document.title = `${to.meta.title} - SJConnect`
  }
  
  next()
})

export default router