// src/router/index.ts - VERSION MISE À JOUR
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Route de connexion (publique)
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/Login.vue'),
      meta: { 
        title: 'Connexion',
        requiresAuth: false,
        redirectIfAuthenticated: true 
      }
    },
    
    // Routes protégées
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../components/Dashboard.vue'),
      meta: { 
        title: 'Tableau de bord',
        requiresAuth: true 
      }
    },
    {
      path: '/entreprises',
      name: 'entreprises',
      component: () => import('../components/Entreprises.vue'),
      meta: { 
        title: 'Entreprises',
        requiresAuth: true 
      }
    },
    {
      path: '/entreprises/:id',
      name: 'entreprise-detail',
      component: () => import('../components/EntrepriseDetail.vue'),
      meta: { 
        title: 'Détail Entreprise',
        requiresAuth: true 
      }
    },
    {
      path: '/groupes',
      name: 'groupes',
      component: () => import('../components/Groupes.vue'),
      meta: { 
        title: 'Groupes',
        requiresAuth: true 
      }
    },
    {
      path: '/groupes/:id',
      name: 'groupe-detail',
      component: () => import('../components/GroupeDetail.vue'),
      meta: { 
        title: 'Détail Groupe',
        requiresAuth: true 
      }
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../components/Messages.vue'),
      meta: { 
        title: 'Messages',
        requiresAuth: true 
      }
    },
    {
      path: '/demandes',
      name: 'demandes',
      component: () => import('../components/Demandes.vue'),
      meta: { 
        title: 'Demandes d\'intégration',
        requiresAuth: true 
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/NotFound.vue'),
      meta: { 
        title: 'Page non trouvée',
        requiresAuth: false 
      }
    }
  ]
})

// Guard de navigation pour l'authentification
router.beforeEach(async (to, _unused, next) => {
  const authStore = useAuthStore()
  
  // Mise à jour du titre de la page
  if (to.meta.title) {
    document.title = `${to.meta.title} - SJConnect`
  }
  
  // Vérifier l'authentification si l'utilisateur n'est pas encore chargé
  if (!authStore.isAuthenticated && !authStore.isLoading) {
    await authStore.checkAuth()
  }
  
  // Redirection si déjà authentifié et route publique
  if (to.meta.redirectIfAuthenticated && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  // Protection des routes authentifiées
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  next()
})

export default router