<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-lg">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Ajouter un membre</h3>
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
        <!-- Recherche d'entreprise -->
        <div>
          <label class="form-label">Rechercher une entreprise</label>
          <div class="mt-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom ou email de l'entreprise..."
              class="form-input"
              @input="searchEntreprises"
              @focus="showResults = true"
            >
            
            <!-- Résultats de recherche -->
            <div 
              v-if="showResults && filteredEntreprises.length > 0"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            >
              <div
                v-for="entreprise in filteredEntreprises"
                :key="entreprise.id"
                @click="selectEntreprise(entreprise)"
                class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white font-bold text-sm">
                      {{ entreprise.nom.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <span class="font-medium block truncate">{{ entreprise.nom }}</span>
                    <span class="text-gray-500 block text-sm">{{ entreprise.email }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Message si aucun résultat -->
            <div 
              v-if="showResults && searchQuery && filteredEntreprises.length === 0"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-3 text-center text-sm text-gray-500"
            >
              Aucune entreprise trouvée pour "{{ searchQuery }}"
            </div>
          </div>
          
          <!-- Entreprise sélectionnée -->
          <div v-if="selectedEntreprise" class="mt-3 flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <span class="text-white font-bold">
                {{ selectedEntreprise.nom.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ selectedEntreprise.nom }}</p>
              <p class="text-xs text-gray-500">{{ selectedEntreprise.email }}</p>
            </div>
            <button
              type="button"
              @click="selectedEntreprise = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Statut du membre -->
        <div>
          <label class="form-label">Statut du membre</label>
          <div class="mt-2 space-y-2">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="membre"
                  v-model="form.statut"
                  value="MEMBRE"
                  type="radio"
                  name="statut"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="membre" class="font-medium text-gray-700">Membre</label>
                <p class="text-gray-500">
                  Accès complet aux discussions du groupe et peut inviter d'autres entreprises
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="invite"
                  v-model="form.statut"
                  value="INVITE"
                  type="radio"
                  name="statut"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="invite" class="font-medium text-gray-700">Invité</label>
                <p class="text-gray-500">
                  Accès limité aux discussions publiques du groupe uniquement
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Message de bienvenue (optionnel) -->
        <div>
          <label class="form-label">Message de bienvenue (optionnel)</label>
          <textarea
            v-model="form.messageAccueil"
            rows="3"
            class="form-textarea"
            placeholder="Message de bienvenue pour le nouveau membre..."
          ></textarea>
          <p class="mt-1 text-sm text-gray-500">
            Ce message sera affiché lors de l'ajout du membre au groupe
          </p>
        </div>
        
        <!-- Informations sur l'ajout -->
        <div v-if="selectedEntreprise" class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Ajout de {{ selectedEntreprise.nom }}
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>
                  Cette entreprise sera ajoutée au groupe "{{ groupe?.nom }}" avec le statut 
                  <strong>{{ form.statut === 'MEMBRE' ? 'Membre' : 'Invité' }}</strong>.
                </p>
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
          :disabled="!selectedEntreprise || loading"
          class="btn-primary btn-md"
        >
          <span v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ajout...
          </span>
          <span v-else>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter au groupe
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEntreprisesStore, useAppStore } from '../stores'
import apiService from '../services/api'
import type { Entreprise, Groupe } from '../services/api'

interface Props {
  show: boolean
  groupe?: Groupe | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  added: []
}>()

const entreprisesStore = useEntreprisesStore()
const appStore = useAppStore()

const { entreprises } = storeToRefs(entreprisesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const showResults = ref(false)
const selectedEntreprise = ref<Entreprise | null>(null)
const existingMembers = ref<number[]>([])

const form = ref({
  statut: 'MEMBRE',
  messageAccueil: ''
})

// Computed
const filteredEntreprises = computed(() => {
  if (!searchQuery.value) return []
  
  return entreprises.value
    .filter(entreprise => {
      // Exclure les entreprises déjà membres du groupe
      const isAlreadyMember = existingMembers.value.includes(entreprise.id)
      const matchesSearch = 
        entreprise.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        entreprise.email.toLowerCase().includes(searchQuery.value.toLowerCase())
      
      return !isAlreadyMember && matchesSearch
    })
    .slice(0, 10)
})

// Méthodes
const resetForm = () => {
  selectedEntreprise.value = null
  searchQuery.value = ''
  showResults.value = false
  form.value = {
    statut: 'MEMBRE',
    messageAccueil: ''
  }
}

const searchEntreprises = () => {
  showResults.value = true
}

const selectEntreprise = (entreprise: Entreprise) => {
  selectedEntreprise.value = entreprise
  searchQuery.value = entreprise.nom
  showResults.value = false
}

const loadExistingMembers = async () => {
  if (!props.groupe) return
  
  try {
    const membres = await apiService.getMembresDuGroupe(props.groupe.id)
    existingMembers.value = membres.map(m => m.entreprise)
  } catch (error) {
    console.error('Erreur lors du chargement des membres existants:', error)
  }
}

const handleSubmit = async () => {
  if (!selectedEntreprise.value || !props.groupe) return
  
  try {
    loading.value = true
    
    await apiService.ajouterMembreGroupe(
      props.groupe.id,
      selectedEntreprise.value.id,
      form.value.statut
    )
    
    // Optionnel : envoyer un message de bienvenue
    if (form.value.messageAccueil.trim()) {
      // Cette fonctionnalité pourrait être ajoutée à l'API
      console.log('Message de bienvenue:', form.value.messageAccueil)
    }
    
    emit('added')
    resetForm()
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'ajout du membre')
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
    loadExistingMembers()
    
    // Charger les entreprises si nécessaire
    if (entreprises.value.length === 0) {
      entreprisesStore.loadEntreprises()
    }
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