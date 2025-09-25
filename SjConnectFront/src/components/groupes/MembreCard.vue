<template>
  <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    <div class="flex items-center space-x-4">
      <!-- Avatar -->
      <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <span class="text-white font-bold text-lg">
          {{ membre.entreprise_nom.charAt(0).toUpperCase() }}
        </span>
      </div>
      
      <div class="flex-1">
        <!-- Nom de l'entreprise -->
        <h4 class="text-base font-medium text-gray-900">{{ membre.entreprise_nom }}</h4>
        
        <!-- Statut et date d'ajout -->
        <div class="mt-1 flex items-center space-x-4">
          <span :class="getStatusClass(membre.statut)">
            {{ getStatusText(membre.statut) }}
          </span>
          
          <span class="text-sm text-gray-500">
            Membre depuis {{ formatDate(membre.date_ajout) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex items-center space-x-2">
      <!-- Indicateur si c'est l'utilisateur actuel -->
      <div v-if="isCurrentUser" class="text-sm text-blue-600 font-medium">
        Vous
      </div>
      
      <!-- Bouton de suppression pour les gestionnaires -->
      <button
        v-if="canManage && !isCurrentUser"
        @click="confirmRemove"
        class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
        title="Retirer du groupe"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
    
    <!-- Modal de confirmation -->
    <ConfirmModal
      :show="showConfirm"
      title="Retirer le membre"
      :message="`Êtes-vous sûr de vouloir retirer ${membre.entreprise_nom} de ce groupe ?`"
      confirm-text="Retirer"
      confirm-class="btn-danger"
      type="warning"
      @confirm="handleRemove"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MembreGroupe, Entreprise } from '../../services/api'
import ConfirmModal from './ConfirmModal.vue'

interface Props {
  membre: MembreGroupe
  canManage: boolean
  currentEntreprise?: Entreprise | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  remove: [membre: MembreGroupe]
}>()

// État local
const showConfirm = ref(false)

// Computed
const isCurrentUser = computed(() => {
  return props.currentEntreprise?.id === props.membre.entreprise
})

// Méthodes
const getStatusText = (statut: string): string => {
  switch (statut) {
    case 'PROPRIETAIRE':
      return 'Propriétaire'
    case 'MEMBRE':
      return 'Membre'
    case 'INVITE':
      return 'Invité'
    default:
      return statut
  }
}

const getStatusClass = (statut: string): string => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  
  switch (statut) {
    case 'PROPRIETAIRE':
      return `${baseClass} bg-blue-100 text-blue-800`
    case 'MEMBRE':
      return `${baseClass} bg-green-100 text-green-800`
    case 'INVITE':
      return `${baseClass} bg-purple-100 text-purple-800`
    default:
      return `${baseClass} bg-gray-100 text-gray-800`
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'aujourd\'hui'
  } else if (diffDays === 2) {
    return 'hier'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} jours`
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} mois`
  } else {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    })
  }
}

const confirmRemove = () => {
  showConfirm.value = true
}

const handleRemove = () => {
  emit('remove', props.membre)
  showConfirm.value = false
}
</script>