<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-lg">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Modifier le groupe' : 'Nouveau groupe' }}
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
        <!-- Nom du groupe -->
        <div>
          <label class="form-label">Nom du groupe *</label>
          <input
            v-model="form.nom"
            type="text"
            required
            maxlength="200"
            class="form-input"
            placeholder="Nom du groupe"
            :class="{ 'border-red-300': errors.nom }"
          >
          <p v-if="errors.nom" class="mt-1 text-sm text-red-600">{{ errors.nom }}</p>
        </div>
        
        <!-- Description -->
        <div>
          <label class="form-label">Description</label>
          <textarea
            v-model="form.description"
            rows="4"
            class="form-textarea"
            placeholder="Description du groupe (optionnel)"
            :class="{ 'border-red-300': errors.description }"
          ></textarea>
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
          <p class="mt-1 text-sm text-gray-500">
            Décrivez le but et les sujets de discussion de ce groupe
          </p>
        </div>
        
        <!-- Visibilité du groupe -->
        <div>
          <label class="form-label">Visibilité</label>
          <div class="mt-2 space-y-4">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="public"
                  v-model="form.est_public"
                  :value="true"
                  type="radio"
                  name="visibility"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="public" class="font-medium text-gray-700">Public</label>
                <p class="text-gray-500">
                  Toutes les entreprises peuvent voir ce groupe et demander à le rejoindre. 
                  Les messages publics sont visibles par tous.
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="private"
                  v-model="form.est_public"
                  :value="false"
                  type="radio"
                  name="visibility"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="private" class="font-medium text-gray-700">Privé</label>
                <p class="text-gray-500">
                  Seuls les membres invités peuvent voir et participer à ce groupe. 
                  Toutes les discussions sont privées.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Informations additionnelles -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                À propos des groupes
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Vous serez automatiquement le propriétaire de ce groupe</li>
                  <li>Vous pourrez ajouter/retirer des membres</li>
                  <li>Les groupes publics acceptent les demandes d'intégration</li>
                  <li>Les groupes privés nécessitent une invitation directe</li>
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
          :disabled="loading || !isFormValid"
          class="btn-primary btn-md"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement...
          </span>
          <span v-else>
            {{ isEditing ? 'Modifier' : 'Créer le groupe' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Groupe, Entreprise } from '../services/api'

interface Props {
  show: boolean
  groupe?: Groupe | null
  entreprise?: Entreprise | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [data: any]
}>()

// État local
const loading = ref(false)
const form = ref({
  nom: '',
  description: '',
  est_public: true
})

const errors = ref({
  nom: '',
  description: ''
})

// Computed
const isEditing = computed(() => !!props.groupe)

const isFormValid = computed(() => {
  return form.value.nom.trim().length > 0 && 
         form.value.nom.trim().length <= 200 &&
         !Object.values(errors.value).some(error => error !== '')
})

// Méthodes
const resetForm = () => {
  form.value = {
    nom: '',
    description: '',
    est_public: true
  }
  errors.value = {
    nom: '',
    description: ''
  }
}

const validateForm = () => {
  errors.value = {
    nom: '',
    description: ''
  }
  
  // Validation du nom
  if (!form.value.nom.trim()) {
    errors.value.nom = 'Le nom du groupe est obligatoire'
  } else if (form.value.nom.trim().length > 200) {
    errors.value.nom = 'Le nom ne peut pas dépasser 200 caractères'
  }
  
  // Validation de la description (optionnelle)
  if (form.value.description && form.value.description.length > 1000) {
    errors.value.description = 'La description ne peut pas dépasser 1000 caractères'
  }
  
  return Object.values(errors.value).every(error => error === '')
}

const handleSubmit = async () => {
  if (!validateForm() || !props.entreprise) return
  
  try {
    loading.value = true
    
    const groupeData = {
      nom: form.value.nom.trim(),
      description: form.value.description.trim() || null,
      est_public: form.value.est_public,
      entreprise_proprietaire: props.entreprise.id
    }
    
    emit('submit', groupeData)
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.groupe) {
      // Mode édition
      form.value = {
        nom: props.groupe.nom,
        description: props.groupe.description || '',
        est_public: props.groupe.est_public
      }
    } else {
      // Mode création
      resetForm()
    }
  }
})

watch(() => form.value.nom, () => {
  if (errors.value.nom) {
    errors.value.nom = ''
  }
})

watch(() => form.value.description, () => {
  if (errors.value.description) {
    errors.value.description = ''
  }
})
</script>