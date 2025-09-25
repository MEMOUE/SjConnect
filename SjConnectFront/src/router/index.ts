// src/router/index.ts - VERSION MISE À JOUR COMPLÈTE
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
        //requiresAuth: false,
        redirectIfAuthenticated: true 
      }
    },
    
    // Routes protégées - Layout principal avec sous-routes
    {
      path: '/',
      name: 'app',
      component: () => import('../App.vue'),
      meta: { 
        requiresAuth: true 
      },
      children: [
        // Dashboard - Page d'accueil
        {
          path: '',
          name: 'dashboard',
          component: () => import('../components/layout/Dashboard.vue'),
          meta: { 
            title: 'Tableau de bord',
            //requiresAuth: true 
          }
        },
        
        // Routes des entreprises
        {
          path: 'entreprises',
          name: 'entreprises',
          component: () => import('../components/entreprise/Entreprises.vue'),
          meta: { 
            title: 'Entreprises',
            //requiresAuth: true 
          }
        },
        {
          path: 'entreprises/:id',
          name: 'entreprise-detail',
          component: () => import('../components/entreprise/EntrepriseDetail.vue'),
          meta: { 
            title: 'Détail Entreprise',
            requiresAuth: true 
          },
          props: true
        },
        
        // Routes des groupes
        {
          path: 'groupes',
          name: 'groupes',
          component: () => import('../components/groupes/Groupes.vue'),
          meta: { 
            title: 'Groupes',
            //requiresAuth: true 
          }
        },
        {
          path: 'groupes/:id',
          name: 'groupe-detail',
          component: () => import('../components/groupes/GroupeDetail.vue'),
          meta: { 
            title: 'Détail Groupe',
            requiresAuth: true 
          },
          props: true
        },
        
        // Routes des messages
        {
          path: 'messages',
          name: 'messages',
          component: () => import('../components/messages/Messages.vue'),
          meta: { 
            title: 'Messages',
            //requiresAuth: true 
          }
        },
        
        // Routes des demandes d'intégration
        {
          path: 'demandes',
          name: 'demandes',
          component: () => import('../components/demandes/Demandes.vue'),
          meta: { 
            title: 'Demandes d\'intégration',
            //requiresAuth: true 
          }
        },
        
        // Routes des employés (si implémentées)
        {
          path: 'employes',
          name: 'employes',
          component: () => import('../components/employes/EmployesList.vue'),
          meta: { 
            title: 'Employés',
            //requiresAuth: true 
          }
        },
        
        // Routes de profil utilisateur
        {
          path: 'profil',
          name: 'profil',
          component: () => import('../components/employes/EmployeProfile.vue'),
          meta: { 
            title: 'Mon Profil',
            //requiresAuth: true 
          }
        },
        
        // Routes des paramètres d'entreprise
        {
          path: 'entreprise/:id/parametres',
          name: 'entreprise-settings',
          component: () => import('../components/entreprise/EntrepriseSettings.vue'),
          meta: { 
            title: 'Paramètres Entreprise',
            requiresAuth: true 
          },
          props: true
        },
        
        // Routes des statistiques
        {
          path: 'entreprise/:id/statistiques',
          name: 'entreprise-stats',
          component: () => import('../components/entreprise/EntrepriseStats.vue'),
          meta: { 
            title: 'Statistiques',
            //requiresAuth: true 
          },
          props: true
        }
      ]
    },
    
    // Routes d'authentification additionnelles
    {
      path: '/changer-mot-de-passe',
      name: 'change-password',
      component: () => import('../components/auth/ChangePassword.vue'),
      meta: { 
        title: 'Changer le mot de passe',
        //requiresAuth: true 
      }
    },
    
    // Route d'inscription entreprise (publique)
    {
      path: '/inscription',
      name: 'register-entreprise',
      component: () => import('../components/auth/RegisterEntreprise.vue'),
      meta: { 
        title: 'Inscription Entreprise',
        requiresAuth: false,
        redirectIfAuthenticated: true 
      }
    },
    
    // Routes d'aide et support (publiques)
    {
      path: '/aide',
      name: 'help',
      component: () => import('../components/shared/Help.vue'),
      meta: { 
        title: 'Centre d\'aide',
        //requiresAuth: false 
      }
    },
    
    // Redirections pour compatibilité
    {
      path: '/dashboard',
      redirect: '/'
    },
    {
      path: '/home',
      redirect: '/'
    },
    
    // Route 404 - doit être en dernier
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/layout/NotFound.vue'),
      meta: { 
        title: 'Page non trouvée',
        //requiresAuth: false 
      }
    }
  ]
})

// Guard de navigation pour l'authentification
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Mise à jour du titre de la page
  if (to.meta.title) {
    document.title = `${to.meta.title} - SJConnect`
  } else {
    document.title = 'SJConnect - Plateforme de communication inter-entreprises'
  }
  
  // Vérifier l'authentification si l'utilisateur n'est pas encore chargé
  if (!authStore.isAuthenticated && !authStore.isLoading) {
    await authStore.checkAuth()
  }
  
  // Redirection si déjà authentifié et tentative d'accès aux routes publiques
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
  
  // Validation des paramètres de route pour les routes avec IDs
  if (to.params.id && isNaN(Number(to.params.id))) {
    next({ name: 'not-found' })
    return
  }
  
  // Gestion des permissions spéciales (exemple: admin)
  if (to.meta.requiresAdmin) {
    // Vérifier si l'utilisateur a les droits admin
    if (!authStore.user?.profil?.role || authStore.user.profil.role !== 'ADMIN') {
      next({ 
        name: 'dashboard', 
        query: { error: 'access_denied' }
      })
      return
    }
  }
  
  next()
})

// Guard après navigation pour analytics ou autres traitements
router.afterEach((to, from) => {
  // Analytics ou autres traitements post-navigation
  console.log(`Navigation: ${from.path} → ${to.path}`)
  
  // Scroll vers le haut après changement de route
  if (to.path !== from.path) {
    window.scrollTo(0, 0)
  }
})

export default router