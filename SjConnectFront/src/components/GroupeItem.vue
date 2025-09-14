<template>
  <button
    @click="$emit('select', groupe)"
    :class="[
      'w-full p-4 text-left hover:bg-gray-50 transition-colors border-l-4',
      isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:border-gray-200'
    ]"
  >
    <div class="flex items-center space-x-3">
      <!-- Avatar du groupe -->
      <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-lg">
          {{ groupe.nom.charAt(0).toUpperCase() }}
        </span>
      </div>
      
      <div class="flex-1 min-w-0">
        <!-- Nom du groupe -->
        <div class="flex items-center justify-between">
          <h4 :class="['text-sm font-medium truncate', isActive ? 'text-blue-900' : 'text-gray-900']">
            {{ groupe.nom }}
          </h4>
          <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
            <!-- Badge de visibilité -->
            <span 
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                groupe.est_public 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ groupe.est_public ? 'Public' : 'Privé' }}
            </span>
          </div>
        </div>
        
        <!-- Propriétaire du groupe -->
        <div class="mt-1 flex items-center">
          <p :class="['text-xs truncate', isActive ? 'text-blue-600' : 'text-gray-500']">
            Par {{ groupe.entreprise_proprietaire_nom }}
          </p>
        </div>
        
        <!-- Informations du groupe -->
        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center space-x-3 text-xs">
            <!-- Nombre de membres -->
            <div :class="['flex items-center', isActive ? 'text-blue-600' : 'text-gray-500']">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {{ groupe.nombre_membres }}
            </div>
            
            <!-- Indicateur d'activité récente -->
            <div :class="['flex items-center', isActive ? 'text-blue-600' : 'text-gray-500']">
              <div class="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              <span>Actif</span>
            </div>
          </div>
          
          <!-- Nombre de messages non lus (optionnel) -->
          <div v-if="unreadCount > 0" class="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </div>
        </div>
        
        <!-- Description du groupe (si disponible et courte) -->
        <div v-if="groupe.description && groupe.description.length < 60" class="mt-1">
          <p :class="['text-xs truncate', isActive ? 'text-blue-700' : 'text-gray-600']">
            {{ groupe.description }}
          </p>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Groupe } from '../services/api'

interface Props {
  groupe: Groupe
  isActive: boolean
}

const props = defineProps<Props>()
defineEmits<{
  select: [groupe: Groupe]
}>()

// Computed
// Calcul fictif du nombre de messages non lus
const unreadCount = computed(() => {
  // Dans une vraie application, ceci viendrait de l'API
  // Pour la démo, on génère un nombre aléatoire parfois
  const hasUnread = Math.random() > 0.7 // 30% de chance d'avoir des messages non lus
  return hasUnread ? Math.floor(Math.random() * 10) + 1 : 0
})
</script>