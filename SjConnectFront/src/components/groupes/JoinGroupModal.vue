<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-2xl">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Demander à rejoindre un groupe</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body space-y-6">
        <!-- Recherche et sélection du groupe -->
        <div>
          <label class="form-label">Rechercher un groupe public</label>
          <div class="mt-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par nom de groupe ou d'entreprise..."
              class="form-input"
              @input="searchGroups"
              @focus="showResults = true"
            >
            
            <!-- Résultats de recherche -->
            <div 
              v-if="showResults && filteredGroups.length > 0"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            >
              <div
                v-for="groupe in filteredGroups"
                :key="groupe.id"
                @click="selectGroupe(groupe)"
                class="cursor-pointer select-none relative py-3 pl-3 pr-9 hover:bg-gray-50"
              >
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-white font-bold text-sm">
                      {{ groupe.nom.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <span class="font-medium block truncate">{{ groupe.nom }}</span>
                      <span class="badge-green">Public</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      <span>Par {{ groupe.entreprise_proprietaire_nom }}</span>
                      <span class="mx-2">•</span>
                      <span>{{ groupe.nombre_membres }} membres</span>
                    </div>
                    <div v-if="groupe.description" class="text-sm text-gray-600 mt-1 truncate">
                      {{ groupe.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Message si aucun résultat -->
            <div 
              v-if="showResults && searchQuery && filteredGroups.length === 0"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-3 text-center text-sm text-gray-500"
            >
              Aucun groupe public trouvé pour "{{ searchQuery }}"
            </div>
          </div>
          
          <!-- Groupe sélectionné -->
          <div v-if="selectedGroupe" class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <span class="text-white font-bold">
                    {{ selectedGroupe.nom.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ selectedGroupe.nom }}</h4>
                  <p class="text-sm text-gray-600">
                    Par {{ selectedGroupe.entreprise_proprietaire_nom }} • {{ selectedGroupe.nombre_membres }} membres
                  </p>
                  <div v-if="selectedGroupe.description" class="mt-1">
                    <p class="text-sm text-gray-700">{{ selectedGroupe.description }}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="selectedGroupe = null"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Message de demande -->
        <div>
          <label class="form-label">Message de présentation</label>
          <textarea
            v-model="form.message_demande"
            rows="4"
            class="form-textarea"
            placeholder="Présentez-vous et expliquez pourquoi vous souhaitez rejoindre ce groupe..."
          ></textarea>
          <div class="mt-1 flex justify-between">
            <p class="text-sm text-gray-500">
              Décrivez votre entreprise et les raisons de votre demande (optionnel)
            </p>
            <p class="text-sm text-gray-500">{{ form.message_demande.length }}/500</p>
          </div>
        </div>
        
        <!-- Informations sur la demande -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                À propos des demandes d'intégration
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Votre demande sera envoyée au propriétaire du groupe</li>
                  <li>Un message de présentation peut améliorer vos chances d'acceptation</li>
                  <li>Seuls les groupes publics acceptent les demandes d'intégration</li>
                  <li>Vous serez notifié de la réponse du propriétaire</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      <div class="modal-footer">
        <button
          type="button"
          @click="$emit('close')"
          class="btn-secondary btn-md"
        >
          Annuler
        </button>
        <button
          @click="handleSubmit"
          :disabled="!selectedGroupe || loading"
          class="btn-primary btn-md"
        >
          <span v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Envoi...
          </span>
          <span v-else>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Envoyer la demande
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGroupesStore, useDemandesStore, useAppStore } from '../../stores'
import type { Entreprise, Groupe } from '../../services/api'

interface Props {
  show: boolean
  currentEntreprise?: Entreprise | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submitted: []
}>()

const groupesStore = useGroupesStore()
const demandesStore = useDemandesStore()
const appStore = useAppStore()

const { groupes, groupesMembres, groupesPossedes } = storeToRefs(groupesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const showResults = ref(false)
const selectedGroupe = ref<Groupe | null>(null)
const form = ref({
  message_demande: ''
})

// Computed
const availableGroups = computed(() => {
  if (!props.currentEntreprise) return []
  
  return groupes.value.filter(groupe => {
    // Exclure les groupes dont on est déjà propriétaire ou membre
    const isOwner = groupe.entreprise_proprietaire === props.currentEntreprise!.id
    const isMember = groupesMembres.value.some(g => g.id === groupe.id)
    const isOwned = groupesPossedes.value.some(g => g.id === groupe.id)
    
    // Inclure seulement les groupes publics où on n'est pas déjà
    return groupe.est_public && !isOwner && !isMember && !isOwned
  })
})

const filteredGroups = computed(() => {
  if (!searchQuery.value) return availableGroups.value.slice(0, 10)
  
  return availableGroups.value
    .filter(groupe => {
      return groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
             groupe.entreprise_proprietaire_nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
             (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    })
    .slice(0, 10)
})

// Méthodes
const resetForm = () => {
  selectedGroupe.value = null
  searchQuery.value = ''
  showResults.value = false
  form.value = {
    message_demande: ''
  }
}

const searchGroups = () => {
  showResults.value = true
}

const selectGroupe = (groupe: Groupe) => {
  selectedGroupe.value = groupe
  searchQuery.value = groupe.nom
  showResults.value = false
}

const handleSubmit = async () => {
  if (!selectedGroupe.value || !props.currentEntreprise) return
  
  try {
    loading.value = true
    
    await demandesStore.createDemande({
      entreprise_demandeur: props.currentEntreprise.id,
      groupe_cible: selectedGroupe.value.id,
      message_demande: form.value.message_demande.trim() || undefined
    })
    
    emit('submitted')
    resetForm()
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande')
  } finally {
    loading.value = false
  }
}

// Cacher les résultats quand on clique ailleurs
const handleClickOutside = (event: MouseEvent) => {
  if (!(event.target as Element).closest('.relative')) {
    showResults.value = false
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
    // Charger les groupes si nécessaire
    if (groupes.value.length === 0) {
      groupesStore.loadGroupes()
    }
    // Charger les groupes de l'utilisateur pour les exclure
    if (props.currentEntreprise) {
      Promise.all([
        groupesStore.loadGroupesPossedes(props.currentEntreprise.id),
        groupesStore.loadGroupesMembres(props.currentEntreprise.id)
      ])
    }
  }
})

watch(() => form.value.message_demande, (newMessage) => {
  // Limiter à 500 caractères
  if (newMessage.length > 500) {
    form.value.message_demande = newMessage.substring(0, 500)
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// Cleanup
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>