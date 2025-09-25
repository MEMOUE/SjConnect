<template>
  <div class="p-6 hover:bg-gray-50 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center space-x-4">
          <!-- Avatar du demandeur -->
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-lg">
              {{ demande.entreprise_demandeur_nom.charAt(0).toUpperCase() }}
            </span>
          </div>
          
          <div class="flex-1 min-w-0">
            <!-- En-tête de la demande -->
            <div class="flex items-center space-x-2">
              <h4 class="text-lg font-medium text-gray-900">
                {{ demande.entreprise_demandeur_nom }}
              </h4>
              <span class="text-gray-500">→</span>
              <span class="text-lg font-medium text-blue-600">
                {{ demande.groupe_cible_nom }}
              </span>
            </div>
            
            <!-- Type de demande -->
            <div class="mt-1 flex items-center space-x-2 text-sm text-gray-600">
              <span v-if="isReceived">
                Demande pour rejoindre votre groupe
              </span>
              <span v-else>
                Votre demande pour rejoindre le groupe de {{ demande.groupe_proprietaire_nom }}
              </span>
            </div>
            
            <!-- Message de la demande -->
            <div v-if="demande.message_demande" class="mt-3 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700">{{ demande.message_demande }}</p>
            </div>
            
            <!-- Métadonnées -->
            <div class="mt-4 flex items-center justify-between">
              <div class="flex items-center space-x-6 text-sm text-gray-500">
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                  </svg>
                  {{ formatDate(demande.date_demande) }}
                </div>
                
                <div v-if="demande.date_reponse" class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Traitée le {{ formatDate(demande.date_reponse) }}
                </div>
              </div>
              
              <!-- Statut -->
              <div class="flex items-center">
                <span 
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    getStatusClass(demande.statut)
                  ]"
                >
                  <svg 
                    :class="['w-3 h-3 mr-1', getStatusIconClass(demande.statut)]" 
                    fill="currentColor" 
                    viewBox="0 0 8 8"
                  >
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  {{ getStatusText(demande.statut) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-2 ml-6">
        <!-- Bouton voir le groupe -->
        <button
          @click="$emit('viewGroup', demande)"
          class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Voir le groupe"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        
        <!-- Actions pour les demandes reçues en attente -->
        <div v-if="isReceived && demande.statut === 'EN_ATTENTE'" class="flex items-center space-x-2">
          <button
            @click="$emit('respond', demande, true)"
            class="btn-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            title="Accepter la demande"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Accepter
          </button>
          
          <button
            @click="$emit('respond', demande, false)"
            class="btn-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            title="Refuser la demande"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Refuser
          </button>
        </div>
        
        <!-- Indicateur pour les demandes envoyées -->
        <div v-else-if="!isReceived && demande.statut === 'EN_ATTENTE'" class="text-sm text-gray-500 italic">
          En attente de réponse...
        </div>
      </div>
    </div>
    
    <!-- Informations supplémentaires selon le statut -->
    <div v-if="demande.statut !== 'EN_ATTENTE'" class="mt-4 p-3 rounded-lg" :class="getStatusBgClass(demande.statut)">
      <div class="flex items-center">
        <svg 
          :class="['w-5 h-5 mr-2', getStatusIconClass(demande.statut)]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            v-if="demande.statut === 'ACCEPTEE'"
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
          <path 
            v-else
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <div class="text-sm">
          <p :class="getStatusTextClass(demande.statut)">
            <span v-if="demande.statut === 'ACCEPTEE'">
              {{ isReceived ? 'Vous avez accepté cette demande.' : 'Votre demande a été acceptée ! Vous pouvez maintenant participer aux discussions du groupe.' }}
            </span>
            <span v-else>
              {{ isReceived ? 'Vous avez refusé cette demande.' : 'Votre demande a été refusée.' }}
            </span>
          </p>
          <p v-if="demande.date_reponse" class="text-xs mt-1 opacity-75">
            {{ formatDateTime(demande.date_reponse) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DemandeIntegration, Entreprise } from '../../services/api'

interface Props {
  demande: DemandeIntegration
  currentEntreprise: Entreprise
}

const props = defineProps<Props>()
defineEmits<{
  respond: [demande: DemandeIntegration, accepter: boolean]
  viewGroup: [demande: DemandeIntegration]
}>()

// Computed
const isReceived = computed(() => {
  // Demande reçue si notre entreprise correspond au propriétaire du groupe
  return props.demande.groupe_proprietaire_nom === props.currentEntreprise.nom
})

// Méthodes
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Aujourd\'hui'
  } else if (diffDays === 2) {
    return 'Hier'
  } else if (diffDays <= 7) {
    return `Il y a ${diffDays - 1} jours`
  } else {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'En attente'
    case 'ACCEPTEE':
      return 'Acceptée'
    case 'REFUSEE':
      return 'Refusée'
    default:
      return statut
  }
}

const getStatusClass = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'bg-yellow-100 text-yellow-800'
    case 'ACCEPTEE':
      return 'bg-green-100 text-green-800'
    case 'REFUSEE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusBgClass = (statut: string): string => {
  switch (statut) {
    case 'ACCEPTEE':
      return 'bg-green-50 border border-green-200'
    case 'REFUSEE':
      return 'bg-red-50 border border-red-200'
    default:
      return 'bg-gray-50 border border-gray-200'
  }
}

const getStatusTextClass = (statut: string): string => {
  switch (statut) {
    case 'ACCEPTEE':
      return 'text-green-700 font-medium'
    case 'REFUSEE':
      return 'text-red-700 font-medium'
    default:
      return 'text-gray-700'
  }
}

const getStatusIconClass = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'text-yellow-400'
    case 'ACCEPTEE':
      return 'text-green-400'
    case 'REFUSEE':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}
</script>