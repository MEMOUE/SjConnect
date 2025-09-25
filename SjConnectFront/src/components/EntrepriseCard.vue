<template>
  <div class="p-4 hover:bg-gray-50 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
            <span class="text-white font-bold text-lg">
              {{ entreprise.nom.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-base font-medium text-gray-900 truncate">{{ entreprise.nom }}</h4>
            <a 
              :href="`mailto:${entreprise.email}`"
              class="text-sm text-blue-600 hover:text-blue-800 truncate block"
            >
              {{ entreprise.email }}
            </a>
          </div>
        </div>
        
        <div v-if="entreprise.description" class="mt-3 ml-16">
          <p class="text-sm text-gray-600 line-clamp-2">{{ entreprise.description }}</p>
        </div>
        
        <div class="mt-4 ml-16 flex flex-wrap items-center gap-4">
          <!-- Statut -->
          <span 
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              entreprise.est_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            ]"
          >
            <svg 
              :class="[
                'w-2 h-2 mr-1',
                entreprise.est_active ? 'text-green-400' : 'text-red-400'
              ]" 
              fill="currentColor" 
              viewBox="0 0 8 8"
            >
              <circle cx="4" cy="4" r="3" />
            </svg>
            {{ entreprise.est_active ? 'Active' : 'Inactive' }}
          </span>
          
          <!-- Nombre de groupes -->
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {{ entreprise.groupes_possedes_count || 0 }} {{ (entreprise.groupes_possedes_count || 0) > 1 ? 'groupes' : 'groupe' }}
          </div>
          
          <!-- Date de création -->
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
            </svg>
            Créée le {{ formatDate(entreprise.date_creation) }}
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-2 ml-4">
        <button
          @click="$emit('view', entreprise)"
          class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Voir les détails"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        
        <button
          @click="$emit('edit', entreprise)"
          class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          title="Modifier"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          @click="$emit('delete', entreprise)"
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
</template>

<script setup lang="ts">
import type { Entreprise } from '../services/api'

interface Props {
  entreprise: Entreprise
}

defineProps<Props>()
defineEmits<{
  view: [entreprise: Entreprise]
  edit: [entreprise: Entreprise]
  delete: [entreprise: Entreprise]
}>()

// Méthodes
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
    return `il y a ${diffDays - 1} jours`
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7)
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30)
    return `il y a ${months} mois`
  } else {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>