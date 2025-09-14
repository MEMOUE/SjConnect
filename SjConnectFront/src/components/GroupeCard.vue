<template>
  <div class="p-6 hover:bg-gray-50 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
            <span class="text-white font-bold text-lg">
              {{ groupe.nom.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h4 class="text-lg font-medium text-gray-900">{{ groupe.nom }}</h4>
            <p class="text-sm text-gray-500">
              Par {{ groupe.entreprise_proprietaire_nom }}
            </p>
          </div>
        </div>
        
        <div v-if="groupe.description" class="mt-3 ml-16">
          <p class="text-sm text-gray-600">{{ groupe.description }}</p>
        </div>
        
        <div class="mt-4 ml-16 flex items-center space-x-6">
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {{ groupe.nombre_membres }} {{ groupe.nombre_membres > 1 ? 'membres' : 'membre' }}
          </div>
          
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDate(groupe.date_creation) }}
          </div>
          
          <span 
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              groupe.est_public 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            ]"
          >
            <svg 
              :class="[
                'w-2 h-2 mr-1',
                groupe.est_public ? 'text-green-400' : 'text-gray-400'
              ]" 
              fill="currentColor" 
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            {{ groupe.est_public ? 'Public' : 'Privé' }}
          </span>
          
          <div v-if="isOwner" class="flex items-center text-sm">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg class="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              Propriétaire
            </span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-2 ml-4">
        <button
          @click="$emit('view', groupe)"
          class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Voir le groupe"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        
        <button
          v-if="showJoinButton"
          @click="$emit('join', groupe)"
          class="btn-primary btn-sm"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Demander à rejoindre
        </button>
        
        <div v-if="isOwner" class="flex items-center space-x-1">
          <button
            @click="$emit('edit', groupe)"
            class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            title="Modifier"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            @click="$emit('delete', groupe)"
            class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Supprimer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Groupe } from '../services/api'

interface Props {
  groupe: Groupe
  isOwner: boolean
  showJoinButton?: boolean
}

defineProps<Props>()
defineEmits<{
  view: [groupe: Groupe]
  edit: [groupe: Groupe]
  delete: [groupe: Groupe]
  join: [groupe: Groupe]
}>()

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
</script>