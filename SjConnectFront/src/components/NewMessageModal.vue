<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-2xl">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Nouveau message</h3>
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
        <!-- Type de message -->
        <div>
          <label class="form-label">Type de message</label>
          <div class="mt-2 space-y-2">
            <div class="flex items-center">
              <input
                id="direct"
                v-model="form.type"
                value="direct"
                type="radio"
                name="messageType"
                class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              >
              <label for="direct" class="ml-3 block text-sm font-medium text-gray-700">
                Message direct
              </label>
            </div>
            <div class="flex items-center">
              <input
                id="group"
                v-model="form.type"
                value="group"
                type="radio"
                name="messageType"
                class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              >
              <label for="group" class="ml-3 block text-sm font-medium text-gray-700">
                Message de groupe
              </label>
            </div>
          </div>
        </div>
        
        <!-- Destinataire (message direct) -->
        <div v-if="form.type === 'direct'">
          <label class="form-label">Destinataire</label>
          <div class="mt-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une entreprise..."
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
          </div>
          
          <!-- Entreprise sélectionnée -->
          <div v-if="form.destinataire" class="mt-2 flex items-center p-2 bg-blue-50 rounded-lg">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <span class="text-white font-bold text-sm">
                {{ form.destinataire.nom.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ form.destinataire.nom }}</p>
              <p class="text-xs text-gray-500">{{ form.destinataire.email }}</p>
            </div>
            <button
              type="button"
              @click="form.destinataire = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Groupe (message de groupe) -->
        <div v-if="form.type === 'group'">
          <label class="form-label">Groupe</label>
          <select
            v-model="form.groupeId"
            class="form-select"
            required
          >
            <option value="">Sélectionner un groupe</option>
            <optgroup v-if="groupesPossedes.length > 0" label="Mes groupes">
              <option 
                v-for="groupe in groupesPossedes" 
                :key="groupe.id" 
                :value="groupe.id"
              >
                {{ groupe.nom }}
              </option>
            </optgroup>
            <optgroup v-if="groupesMembres.length > 0" label="Groupes où je suis membre">
              <option 
                v-for="groupe in groupesMembres" 
                :key="groupe.id" 
                :value="groupe.id"
              >
                {{ groupe.nom }} (par {{ groupe.entreprise_proprietaire_nom }})
              </option>
            </optgroup>
          </select>
        </div>
        
        <!-- Contenu du message -->
        <div>
          <label class="form-label">Message</label>
          <textarea
            v-model="form.contenu"
            rows="5"
            class="form-textarea"
            placeholder="Tapez votre message..."
            required
          ></textarea>
          <div class="mt-1 flex justify-between">
            <p class="text-sm text-gray-500">Utilisez Shift + Entrée pour une nouvelle ligne</p>
            <p class="text-sm text-gray-500">{{ form.contenu.length }}/1000</p>
          </div>
        </div>
        
        <!-- Type de message de groupe -->
        <div v-if="form.type === 'group' && selectedGroupe">
          <label class="form-label">Visibilité du message</label>
          <div class="mt-2 space-y-2">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="group_public"
                  v-model="form.messageType"
                  value="GROUPE_PUBLIC"
                  type="radio"
                  name="groupMessageType"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  :disabled="!selectedGroupe.est_public"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="group_public" :class="['font-medium', selectedGroupe.est_public ? 'text-gray-700' : 'text-gray-400']">
                  Message public
                </label>
                <p :class="selectedGroupe.est_public ? 'text-gray-500' : 'text-gray-400'">
                  Visible par tous, y compris les entreprises non-membres du groupe
                  {{ !selectedGroupe.est_public ? ' (non disponible pour les groupes privés)' : '' }}
                </p>
              </div>
            </div>
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="group_private"
                  v-model="form.messageType"
                  value="GROUPE_PRIVE"
                  type="radio"
                  name="groupMessageType"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="group_private" class="font-medium text-gray-700">
                  Message privé
                </label>
                <p class="text-gray-500">
                  Visible uniquement par les membres du groupe
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
          :disabled="!isFormValid || loading"
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
            Envoyer
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEntreprisesStore, useGroupesStore, useMessagesStore, useAppStore } from '../stores'
import type { Entreprise, Groupe } from '../services/api'

interface Props {
  show: boolean
  currentEntreprise?: Entreprise | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  sent: []
}>()

const entreprisesStore = useEntreprisesStore()
const groupesStore = useGroupesStore()
const messagesStore = useMessagesStore()
const appStore = useAppStore()

const { entreprises } = storeToRefs(entreprisesStore)
const { groupesPossedes, groupesMembres } = storeToRefs(groupesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const showResults = ref(false)
const form = ref({
  type: 'direct',
  destinataire: null as Entreprise | null,
  groupeId: '',
  contenu: '',
  messageType: 'GROUPE_PRIVE'
})

const filteredEntreprises = computed(() => {
  if (!searchQuery.value || !props.currentEntreprise) return []
  
  return entreprises.value
    .filter(entreprise =>
      entreprise.id !== props.currentEntreprise!.id && // Exclure l'entreprise courante
      (entreprise.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
       entreprise.email.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
    .slice(0, 10) // Limiter à 10 résultats
})

const selectedGroupe = computed(() => {
  if (!form.value.groupeId) return null
  
  const groupe = [...groupesPossedes.value, ...groupesMembres.value]
    .find(g => g.id.toString() === form.value.groupeId.toString())
  
  return groupe || null
})

const isFormValid = computed(() => {
  const hasContent = form.value.contenu.trim().length > 0 && form.value.contenu.length <= 1000
  
  if (form.value.type === 'direct') {
    return hasContent && form.value.destinataire !== null
  } else {
    return hasContent && form.value.groupeId !== ''
  }
})

// Méthodes
const resetForm = () => {
  form.value = {
    type: 'direct',
    destinataire: null,
    groupeId: '',
    contenu: '',
    messageType: 'GROUPE_PRIVE'
  }
  searchQuery.value = ''
  showResults.value = false
}

const searchEntreprises = () => {
  showResults.value = true
}

const selectEntreprise = (entreprise: Entreprise) => {
  form.value.destinataire = entreprise
  searchQuery.value = entreprise.nom
  showResults.value = false
}

const handleSubmit = async () => {
  if (!isFormValid.value || !props.currentEntreprise) return
  
  try {
    loading.value = true
    
    let messageData: any = {
      expediteur_id: props.currentEntreprise.id,
      contenu: form.value.contenu.trim()
    }
    
    if (form.value.type === 'direct' && form.value.destinataire) {
      messageData.type_message = 'DIRECT'
      messageData.destinataire_id = form.value.destinataire.id
    } else if (form.value.type === 'group' && form.value.groupeId) {
      messageData.type_message = form.value.messageType
      messageData.groupe_id = parseInt(form.value.groupeId)
    }
    
    await messagesStore.envoyerMessage(messageData)
    emit('sent')
    resetForm()
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'envoi du message')
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
    // Charger les données nécessaires si pas déjà chargées
    if (entreprises.value.length === 0) {
      entreprisesStore.loadEntreprises()
    }
  }
})

watch(() => form.value.type, () => {
  form.value.destinataire = null
  form.value.groupeId = ''
  searchQuery.value = ''
})

watch(() => selectedGroupe.value, (newGroupe) => {
  if (newGroupe && !newGroupe.est_public) {
    form.value.messageType = 'GROUPE_PRIVE'
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