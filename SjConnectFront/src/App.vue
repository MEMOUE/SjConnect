<template>
  <div id="app">
    <!-- Barre de navigation principale pour les utilisateurs connectés -->
    <MenuBar 
      v-if="authStore.isAuthenticated" 
      :model="menuItems" 
      class="border-none"
    >
      <template #start>
        <div class="flex align-items-center">
          <Avatar 
            label="SJ" 
            class="mr-2"
            style="background-color: var(--primary-color); color: white"
          />
          <span class="font-bold text-xl">SJConnect</span>
        </div>
      </template>
      
      <template #end>
        <div class="flex align-items-center gap-3">
          <!-- Sélecteur d'entreprise -->
          <Dropdown
            v-model="selectedEntrepriseId"
            :options="entreprises"
            optionLabel="nom"
            optionValue="id"
            placeholder="Sélectionner une entreprise"
            @change="onEntrepriseChange"
            class="w-15rem"
          >
            <template #option="slotProps">
              <div class="flex align-items-center">
                <Avatar 
                  :label="slotProps.option.nom.charAt(0)" 
                  size="small"
                  class="mr-2"
                />
                <span>{{ slotProps.option.nom }}</span>
              </div>
            </template>
          </Dropdown>
          
          <!-- Menu utilisateur -->
          <Button
            @click="toggleUserMenu"
            text
            rounded
            severity="secondary"
            class="p-2"
          >
            <template #icon>
              <Avatar 
                :label="userInitials"
                size="small"
                style="background-color: var(--primary-color)"
              />
            </template>
          </Button>
          
          <OverlayPanel ref="userMenuPanel" class="w-20rem">
            <div class="p-3">
              <div class="flex align-items-center pb-3 border-bottom-1 surface-border">
                <Avatar 
                  :label="userInitials"
                  size="large"
                  class="mr-3"
                  style="background-color: var(--primary-color)"
                />
                <div>
                  <div class="font-semibold">{{ authStore.user?.username }}</div>
                  <div class="text-sm text-500">{{ authStore.user?.email }}</div>
                </div>
              </div>
              
              <div class="pt-3">
                <Button
                  @click="handleLogout"
                  text
                  class="w-full justify-content-start p-2"
                  severity="secondary"
                >
                  <i class="pi pi-sign-out mr-2"></i>
                  Se déconnecter
                </Button>
              </div>
            </div>
          </OverlayPanel>
        </div>
      </template>
    </MenuBar>

    <!-- Contenu principal -->
    <main class="flex-1">
      <!-- Message d'erreur global -->
      <div v-if="appStore.error" class="max-w-7xl mx-auto p-4">
        <Message severity="error" :closable="true" @close="clearError">
          <i class="pi pi-exclamation-triangle"></i>
          {{ appStore.error }}
        </Message>
      </div>

      <!-- Indicateur de chargement global -->
      <div v-if="appStore.isLoading" class="flex justify-content-center align-items-center py-8">
        <ProgressSpinner />
      </div>

      <!-- Contenu des pages -->
      <div v-else>
        <router-view />
      </div>
    </main>

    <!-- Footer pour les utilisateurs connectés -->
    <footer v-if="authStore.isAuthenticated" class="surface-100 border-top-1 surface-border mt-8">
      <div class="max-w-7xl mx-auto p-4">
        <div class="text-center text-sm text-500">
          © 2025 SJConnect - Plateforme de communication inter-entreprises
        </div>
      </div>
    </footer>

    <!-- Toast pour les notifications -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAppStore, useEntreprisesStore } from './stores'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()

const { isLoading, error, currentEntreprise } = storeToRefs(appStore)
const { entreprises } = storeToRefs(entreprisesStore)

const selectedEntrepriseId = ref<number | ''>('')
const userMenuPanel = ref()

// Computed
const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return '?'
  
  const firstInitial = user.first_name?.charAt(0) || user.username?.charAt(0) || '?'
  const lastInitial = user.last_name?.charAt(0) || ''
  
  return (firstInitial + lastInitial).toUpperCase()
})

const menuItems = computed(() => [
  {
    label: 'Tableau de bord',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Entreprises',
    icon: 'pi pi-building',
    command: () => router.push('/entreprises')
  },
  {
    label: 'Groupes',
    icon: 'pi pi-users',
    command: () => router.push('/groupes')
  },
  {
    label: 'Messages',
    icon: 'pi pi-comments',
    command: () => router.push('/messages')
  },
  {
    label: 'Demandes',
    icon: 'pi pi-inbox',
    command: () => router.push('/demandes')
  }
])

// Méthodes
const clearError = () => {
  appStore.clearError()
}

const toggleUserMenu = (event: Event) => {
  userMenuPanel.value.toggle(event)
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
  userMenuPanel.value.hide()
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
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
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.p-menubar {
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>