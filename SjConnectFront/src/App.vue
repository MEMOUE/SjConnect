<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header pour les utilisateurs connectés -->
    <header v-if="authStore.isAuthenticated" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo et titre -->
          <div class="flex items-center">
            <router-link to="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">SJ</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">SJConnect</h1>
            </router-link>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-8">
            <router-link 
              to="/" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/' }"
            >
              Tableau de bord
            </router-link>
            <router-link 
              to="/entreprises" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/entreprises') }"
            >
              Entreprises
            </router-link>
            <router-link 
              to="/groupes" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/groupes') }"
            >
              Groupes
            </router-link>
            <router-link 
              to="/messages" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/messages') }"
            >
              Messages
            </router-link>
            <router-link 
              to="/demandes" 
              class="nav-link"
              :class="{ 'nav-link-active': $route.path.startsWith('/demandes') }"
            >
              Demandes
            </router-link>
          </nav>

          <!-- Menu utilisateur et sélecteur d'entreprise -->
          <div class="flex items-center space-x-4">
            <!-- Sélecteur d'entreprise -->
            <div class="relative">
              <select 
                v-model="selectedEntrepriseId"
                @change="onEntrepriseChange"
                class="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner une entreprise</option>
                <option 
                  v-for="entreprise in entreprises" 
                  :key="entreprise.id" 
                  :value="entreprise.id"
                >
                  {{ entreprise.nom }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Menu utilisateur -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100"
              >
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-bold text-sm">
                    {{ userInitials }}
                  </span>
                </div>
                <span class="hidden md:block">{{ authStore.user?.username }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Menu déroulant -->
              <div 
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
              >
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-900">{{ authStore.user?.username }}</p>
                  <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
                </div>
                
                <button
                  @click="handleLogout"
                  class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation mobile -->
        <div class="md:hidden">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Menu mobile -->
      <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200 bg-white">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link 
            v-for="link in navigationLinks"
            :key="link.path"
            :to="link.path"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="$route.path.startsWith(link.path) ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700'"
            @click="showMobileMenu = false"
          >
            {{ link.name }}
          </router-link>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="flex-1">
      <!-- Notification d'erreur globale -->
      <div 
        v-if="appStore.error" 
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      >
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ appStore.error }}</p>
            </div>
            <div class="ml-auto pl-3">
              <button 
                @click="clearError" 
                class="text-red-400 hover:text-red-600"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loader global -->
      <div 
        v-if="appStore.isLoading" 
        class="flex justify-center items-center py-12"
      >
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Vue courante -->
      <div v-else :class="authStore.isAuthenticated ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''">
        <router-view />
      </div>
    </main>

    <!-- Footer pour les utilisateurs connectés -->
    <footer v-if="authStore.isAuthenticated" class="bg-white border-t mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center text-sm text-gray-500">
          © 2025 SJConnect - Plateforme de communication inter-entreprises
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAppStore, useEntreprisesStore } from './stores'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()

const { isLoading, error, currentEntreprise } = storeToRefs(appStore)
const { entreprises } = storeToRefs(entreprisesStore)

const selectedEntrepriseId = ref<number | ''>('')
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

// Computed
const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return '?'
  
  const firstInitial = user.first_name?.charAt(0) || user.username?.charAt(0) || '?'
  const lastInitial = user.last_name?.charAt(0) || ''
  
  return (firstInitial + lastInitial).toUpperCase()
})

const navigationLinks = computed(() => [
  { path: '/', name: 'Tableau de bord' },
  { path: '/entreprises', name: 'Entreprises' },
  { path: '/groupes', name: 'Groupes' },
  { path: '/messages', name: 'Messages' },
  { path: '/demandes', name: 'Demandes' }
])

// Méthodes
const clearError = () => {
  appStore.clearError()
}

const onEntrepriseChange = async () => {
  if (selectedEntrepriseId.value) {
    try {
      const entreprise = await entreprisesStore.loadEntreprise(selectedEntrepriseId.value as number)
      appStore.setCurrentEntreprise(entreprise)
    } catch (err) {
      console.error('Erreur lors de la sélection de l\'entreprise:', err)
      appStore.setError('Erreur lors de la sélection de l\'entreprise')
    }
  } else {
    appStore.setCurrentEntreprise(null)
  }
}

const handleLogout = async () => {
  showUserMenu.value = false
  try {
    await authStore.logout()
    // La redirection se fait automatiquement via le router guard
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

// Watchers
watch(currentEntreprise, (newEntreprise) => {
  if (newEntreprise) {
    selectedEntrepriseId.value = newEntreprise.id
  } else {
    selectedEntrepriseId.value = ''
  }
})

// Lifecycle
onMounted(async () => {
  // L'authentification est déjà gérée par le router guard
  if (authStore.isAuthenticated) {
    try {
      appStore.setLoading(true)
      appStore.loadCurrentEntreprise()
      await entreprisesStore.loadEntreprises()
    } catch (err) {
      console.error('Erreur lors de l\'initialisation:', err)
      appStore.setError('Erreur lors du chargement des données')
    } finally {
      appStore.setLoading(false)
    }
  }

  // Écouter les clics pour fermer le menu utilisateur
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.nav-link {
  @apply text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.nav-link-active {
  @apply text-blue-600 bg-blue-50;
}
</style>