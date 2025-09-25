<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-lg">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">
            Nouveau message - {{ groupe?.nom }}
          </h3>
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
        <!-- Type de message (si groupe public) -->
        <div v-if="groupe?.est_public">
          <label class="form-label">Visibilité du message</label>
          <div class="mt-2 space-y-3">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="public"
                  v-model="form.type_message"
                  value="GROUPE_PUBLIC"
                  type="radio"
                  name="messageType"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="public" class="font-medium text-gray-700">Message public</label>
                <p class="text-gray-500">
                  Visible par tous, y compris les entreprises non-membres du groupe
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="private"
                  v-model="form.type_message"
                  value="GROUPE_PRIVE"
                  type="radio"
                  name="messageType"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="private" class="font-medium text-gray-700">Message privé</label>
                <p class="text-gray-500">
                  Visible uniquement par les membres du groupe
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Message automatique pour groupes privés -->
        <div v-else class="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-700">
                Ce groupe est <strong>privé</strong>. Votre message ne sera visible que par les membres du groupe.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Contenu du message -->
        <div>
          <label class="form-label">Message *</label>
          <textarea
            v-model="form.contenu"
            rows="6"
            class="form-textarea"
            placeholder="Tapez votre message ici..."
            required
            maxlength="2000"
          ></textarea>
          <div class="mt-1 flex justify-between">
            <p class="text-sm text-gray-500">
              Utilisez Shift + Entrée pour une nouvelle ligne
            </p>
            <p class="text-sm text-gray-500">
              {{ form.contenu.length }}/2000
            </p>
          </div>
        </div>
        
        <!-- Prévisualisation du destinataire -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold">
                  {{ groupe?.nom.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                Destinataire : {{ groupe?.nom }}
              </h3>
              <div class="mt-1 text-sm text-blue-700">
                <p>Par {{ groupe?.entreprise_proprietaire_nom }}</p>
                <p>{{ groupe?.nombre_membres }} membres</p>
                <p v-if="form.type_message === 'GROUPE_PUBLIC'">
                  <span class="inline-flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Message public
                  </span>
                </p>
                <p v-else>
                  <span class="inline-flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Message privé (membres seulement)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Conseils pour le message -->
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Conseils pour un bon message
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Soyez clair et précis dans votre communication</li>
                  <li>Mentionnez le contexte si nécessaire</li>
                  <li>Utilisez un ton professionnel et respectueux</li>
                  <li>Posez des questions spécifiques si vous cherchez une réponse</li>
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
            Envoyer le message
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessagesStore, useAppStore } from '../../stores'
import type { Groupe, Entreprise } from '../../services/api'

interface Props {
  show: boolean
  groupe?: Groupe | null
  currentEntreprise?: Entreprise | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  sent: []
}>()

const messagesStore = useMessagesStore()
const appStore = useAppStore()

// État local
const loading = ref(false)
const form = ref({
  contenu: '',
  type_message: 'GROUPE_PRIVE'
})

// Computed
const isFormValid = computed(() => {
  return form.value.contenu.trim().length > 0 && 
         form.value.contenu.length <= 2000
})

// Méthodes
const resetForm = () => {
  form.value = {
    contenu: '',
    type_message: props.groupe?.est_public ? 'GROUPE_PUBLIC' : 'GROUPE_PRIVE'
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value || !props.groupe || !props.currentEntreprise) return
  
  try {
    loading.value = true
    
    await messagesStore.envoyerMessage({
      expediteur_id: props.currentEntreprise.id,
      contenu: form.value.contenu.trim(),
      type_message: form.value.type_message,
      groupe_id: props.groupe.id
    })
    
    emit('sent')
    resetForm()
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'envoi du message')
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

watch(() => props.groupe?.est_public, (isPublic) => {
  if (isPublic === false) {
    form.value.type_message = 'GROUPE_PRIVE'
  }
})

watch(() => form.value.contenu, (newContent) => {
  // Limiter à 2000 caractères
  if (newContent.length > 2000) {
    form.value.contenu = newContent.substring(0, 2000)
  }
})
</script>