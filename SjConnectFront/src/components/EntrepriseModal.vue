<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal max-w-lg">
      <div class="modal-header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Modifier l\'entreprise' : 'Nouvelle entreprise' }}
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
        <!-- Nom de l'entreprise -->
        <div>
          <label class="form-label">Nom de l'entreprise *</label>
          <input
            v-model="form.nom"
            type="text"
            required
            maxlength="200"
            class="form-input"
            placeholder="Nom de l'entreprise"
            :class="{ 'border-red-300': errors.nom }"
          >
          <p v-if="errors.nom" class="mt-1 text-sm text-red-600">{{ errors.nom }}</p>
        </div>
        
        <!-- Email -->
        <div>
          <label class="form-label">Email *</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="form-input"
            placeholder="contact@entreprise.com"
            :class="{ 'border-red-300': errors.email }"
          >
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
          <p class="mt-1 text-sm text-gray-500">
            Cet email sera utilisé pour les communications officielles
          </p>
        </div>
        
        <!-- Description -->
        <div>
          <label class="form-label">Description</label>
          <textarea
            v-model="form.description"
            rows="4"
            class="form-textarea"
            placeholder="Décrivez votre entreprise, ses activités, sa mission..."
            :class="{ 'border-red-300': errors.description }"
          ></textarea>
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
          <div class="mt-1 flex justify-between">
            <p class="text-sm text-gray-500">
              Une bonne description aide les autres entreprises à mieux vous connaître
            </p>
            <p class="text-sm text-gray-500">
              {{ form.description?.length || 0 }}/1000
            </p>
          </div>
        </div>
        
        <!-- Statut actif -->
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              v-model="form.est_active"
              type="checkbox"
              id="est_active"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
          </div>
          <div class="ml-3 text-sm">
            <label for="est_active" class="font-medium text-gray-700">Entreprise active</label>
            <p class="text-gray-500">
              Les entreprises actives peuvent participer aux groupes et recevoir des messages
            </p>
          </div>
        </div>
        
        <!-- Informations supplémentaires pour les nouvelles entreprises -->
        <div v-if="!isEditing" class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                Création d'entreprise
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <ul class="list-disc list-inside space-y-1">
                  <li>Une fois créée, l'entreprise pourra créer des groupes</li>
                  <li>Elle pourra rejoindre des groupes publics</li>
                  <li>Les autres entreprises pourront lui envoyer des messages</li>
                  <li>Le nom et l'email doivent être uniques</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Informations sur la modification -->
        <div v-if="isEditing" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">
                Modification d'entreprise
              </h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>
                  Les modifications seront visibles par toutes les autres entreprises. 
                  Assurez-vous que les informations sont correctes.
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
          :disabled="loading || !isFormValid"
          class="btn-primary btn-md"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isEditing ? 'Modification...' : 'Création...' }}
          </span>
          <span v-else>
            {{ isEditing ? 'Modifier l\'entreprise' : 'Créer l\'entreprise' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Entreprise } from '../services/api'

interface Props {
  show: boolean
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
  email: '',
  description: '',
  est_active: true
})

const errors = ref({
  nom: '',
  email: '',
  description: ''
})

// Computed
const isEditing = computed(() => !!props.entreprise)

const isFormValid = computed(() => {
  return form.value.nom.trim().length > 0 && 
         form.value.nom.trim().length <= 200 &&
         form.value.email.trim().length > 0 &&
         isValidEmail(form.value.email) &&
         (form.value.description?.length || 0) <= 1000 &&
         !Object.values(errors.value).some(error => error !== '')
})

// Méthodes
const resetForm = () => {
  form.value = {
    nom: '',
    email: '',
    description: '',
    est_active: true
  }
  errors.value = {
    nom: '',
    email: '',
    description: ''
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = () => {
  errors.value = {
    nom: '',
    email: '',
    description: ''
  }
  
  // Validation du nom
  if (!form.value.nom.trim()) {
    errors.value.nom = 'Le nom de l\'entreprise est obligatoire'
  } else if (form.value.nom.trim().length > 200) {
    errors.value.nom = 'Le nom ne peut pas dépasser 200 caractères'
  }
  
  // Validation de l'email
  if (!form.value.email.trim()) {
    errors.value.email = 'L\'email est obligatoire'
  } else if (!isValidEmail(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
  }
  
  // Validation de la description
  if (form.value.description && form.value.description.length > 1000) {
    errors.value.description = 'La description ne peut pas dépasser 1000 caractères'
  }
  
  return Object.values(errors.value).every(error => error === '')
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    
    const entrepriseData = {
      nom: form.value.nom.trim(),
      email: form.value.email.trim(),
      description: form.value.description?.trim() || null,
      est_active: form.value.est_active
    }
    
    emit('submit', entrepriseData)
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.entreprise) {
      // Mode édition
      form.value = {
        nom: props.entreprise.nom,
        email: props.entreprise.email,
        description: props.entreprise.description || '',
        est_active: props.entreprise.est_active
      }
    } else {
      // Mode création
      resetForm()
    }
    // Réinitialiser les erreurs
    errors.value = {
      nom: '',
      email: '',
      description: ''
    }
  }
})

// Validation en temps réel
watch(() => form.value.nom, () => {
  if (errors.value.nom) {
    errors.value.nom = ''
  }
})

watch(() => form.value.email, () => {
  if (errors.value.email) {
    errors.value.email = ''
  }
})

watch(() => form.value.description, (newDescription) => {
  if (errors.value.description) {
    errors.value.description = ''
  }
  // Limiter à 1000 caractères
  if (newDescription && newDescription.length > 1000) {
    form.value.description = newDescription.substring(0, 1000)
  }
})
</script>