<template>
  <div class="space-y-6">
    <!-- En-tête avec navigation -->
    <div class="flex items-center space-x-4">
      <button
        @click="$router.go(-1)"
        class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ entreprise?.nom || 'Chargement...' }}</h1>
        <p class="text-gray-600">Détails de l'entreprise</p>
      </div>
    </div>

    <!-- Message de chargement -->
    <div v-if="loading" class="text-center py-12">
      <div class="loader h-8 w-8 mx-auto"></div>
      <p class="mt-2 text-gray-500">Chargement de l'entreprise...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="alert-error">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">Erreur</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else-if="entreprise" class="space-y-6">
      <!-- Profil de l'entreprise -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-6">
              <!-- Avatar de l'entreprise -->
              <div class="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span class="text-white font-bold text-3xl">
                  {{ entreprise.nom.charAt(0).toUpperCase() }}
                </span>
              </div>
              
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h2 class="text-2xl font-bold text-gray-900">{{ entreprise.nom }}</h2>
                  <span 
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      entreprise.est_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ entreprise.est_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                
                <div class="mt-2 space-y-2">
                  <div class="flex items-center text-gray-600">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a :href="`mailto:${entreprise.email}`" class="hover:text-blue-600 transition-colors">
                      {{ entreprise.email }}
                    </a>
                  </div>
                  
                  <div class="flex items-center text-gray-600">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                    </svg>
                    <span>Créée le {{ formatDate(entreprise.date_creation) }}</span>
                  </div>
                  
                  <div v-if="entreprise.description" class="mt-4">
                    <p class="text-gray-700 leading-relaxed">{{ entreprise.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <button
                v-if="canSendMessage"
                @click="startConversation"
                class="btn-primary btn-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Envoyer un message
              </button>
              
              <button
                v-if="isCurrentEntreprise"
                @click="editEntreprise"
                class="btn-secondary btn-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Groupes créés</p>
                <p class="text-2xl font-bold text-blue-600">{{ groupesPossedes.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Membre de</p>
                <p class="text-2xl font-bold text-green-600">{{ groupesMembres.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Messages envoyés</p>
                <p class="text-2xl font-bold text-purple-600">{{ totalMessages }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Groupes créés -->
      <div v-if="groupesPossedes.length > 0" class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900">
            Groupes créés par {{ entreprise.nom }}
          </h3>
        </div>
        <div class="divide-y divide-gray-200">
          <div 
            v-for="groupe in groupesPossedes" 
            :key="groupe.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold">
                    {{ groupe.nom.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h4 class="text-base font-medium text-gray-900">{{ groupe.nom }}</h4>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{{ groupe.nombre_membres }} membres</span>
                    <span :class="groupe.est_public ? 'text-green-600' : 'text-gray-600'">
                      {{ groupe.est_public ? 'Public' : 'Privé' }}
                    </span>
                    <span>Créé le {{ formatDate(groupe.date_creation) }}</span>
                  </div>
                  <div v-if="groupe.description" class="mt-1">
                    <p class="text-sm text-gray-600">{{ groupe.description }}</p>
                  </div>
                </div>
              </div>
              <router-link
                :to="`/groupes/${groupe.id}`"
                class="btn-secondary btn-sm"
              >
                Voir le groupe
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Groupes dont l'entreprise est membre -->
      <div v-if="groupesMembres.length > 0" class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900">
            Groupes où {{ entreprise.nom }} est membre
          </h3>
        </div>
        <div class="divide-y divide-gray-200">
          <div 
            v-for="groupe in groupesMembres" 
            :key="groupe.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold">
                    {{ groupe.nom.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h4 class="text-base font-medium text-gray-900">{{ groupe.nom }}</h4>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Par {{ groupe.entreprise_proprietaire_nom }}</span>
                    <span>{{ groupe.nombre_membres }} membres</span>
                    <span :class="groupe.est_public ? 'text-green-600' : 'text-gray-600'">
                      {{ groupe.est_public ? 'Public' : 'Privé' }}
                    </span>
                  </div>
                  <div v-if="groupe.description" class="mt-1">
                    <p class="text-sm text-gray-600">{{ groupe.description }}</p>
                  </div>
                </div>
              </div>
              <router-link
                :to="`/groupes/${groupe.id}`"
                class="btn-secondary btn-sm"
              >
                Voir le groupe
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Message si aucun groupe -->
      <div v-if="groupesPossedes.length === 0 && groupesMembres.length === 0" class="card">
        <div class="card-body text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun groupe</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ entreprise.nom }} n'a créé aucun groupe et n'est membre d'aucun groupe pour le moment.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal d'édition -->
    <EntrepriseModal
      v-if="isCurrentEntreprise"
      :show="showEditModal"
      :entreprise="entreprise"
      @close="showEditModal = false"
      @submit="onEntrepriseUpdated"
    />

    <!-- Modal nouveau message -->
    <NewMessageModal
      :show="showMessageModal"
      :current-entreprise="currentEntreprise"
      @close="showMessageModal = false"
      @sent="onMessageSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore, useEntreprisesStore, useGroupesStore } from '../stores'
import type { Entreprise, Groupe } from '../services/api'
import EntrepriseModal from './EntrepriseModal.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()
const groupesStore = useGroupesStore()

const { currentEntreprise } = storeToRefs(appStore)

// État local
const loading = ref(false)
const error = ref<string | null>(null)
const entreprise = ref<Entreprise | null>(null)
const groupesPossedes = ref<Groupe[]>([])
const groupesMembres = ref<Groupe[]>([])
const showEditModal = ref(false)
const showMessageModal = ref(false)

// Computed
const entrepriseId = computed(() => parseInt(route.params.id as string))

const isCurrentEntreprise = computed(() => {
  return currentEntreprise.value?.id === entreprise.value?.id
})

const canSendMessage = computed(() => {
  return currentEntreprise.value && !isCurrentEntreprise.value
})

const totalMessages = computed(() => {
  // Dans une vraie application, cette valeur viendrait de l'API
  return Math.floor(Math.random() * 500) + 50 // Valeur fictive pour la démo
})

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadEntreprise = async () => {
  try {
    loading.value = true
    error.value = null
    entreprise.value = await entreprisesStore.loadEntreprise(entrepriseId.value)
  } catch (err: any) {
    console.error('Erreur lors du chargement de l\'entreprise:', err)
    error.value = 'Entreprise non trouvée'
  } finally {
    loading.value = false
  }
}

const loadGroupes = async () => {
  if (!entreprise.value) return
  
  try {
    const [possedes, membres] = await Promise.all([
      entreprisesStore.loadGroupesPossedes(entreprise.value.id),
      entreprisesStore.loadGroupesMembres(entreprise.value.id)
    ])
    
    groupesPossedes.value = possedes
    groupesMembres.value = membres
  } catch (err: any) {
    console.error('Erreur lors du chargement des groupes:', err)
  }
}

const editEntreprise = () => {
  showEditModal.value = true
}

const startConversation = () => {
  showMessageModal.value = true
}

const onEntrepriseUpdated = async (updatedData: any) => {
  if (!entreprise.value) return
  
  try {
    await entreprisesStore.updateEntreprise(entreprise.value.id, updatedData)
    entreprise.value = { ...entreprise.value, ...updatedData }
    showEditModal.value = false
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour:', err)
    appStore.setError('Erreur lors de la mise à jour de l\'entreprise')
  }
}

const onMessageSent = () => {
  showMessageModal.value = false
  // Optionnel : rediriger vers la page des messages
  router.push('/messages')
}

// Lifecycle
onMounted(async () => {
  await loadEntreprise()
  if (entreprise.value) {
    await loadGroupes()
  }
})
</script>