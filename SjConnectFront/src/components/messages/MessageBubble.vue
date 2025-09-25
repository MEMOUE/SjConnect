<template>
  <div :class="['flex', isOwnMessage ? 'justify-end' : 'justify-start']">
    <div :class="['max-w-xs lg:max-w-md', isOwnMessage ? 'order-1' : 'order-2']">
      <div 
        :class="[
          'px-4 py-2 rounded-lg shadow-sm',
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        ]"
      >
        <!-- En-tête du message (groupe uniquement) -->
        <div v-if="showSender" class="mb-1">
          <p :class="['text-xs font-medium', isOwnMessage ? 'text-blue-100' : 'text-gray-600']">
            {{ message.expediteur_nom }}
          </p>
        </div>
        
        <!-- Contenu du message -->
        <div class="whitespace-pre-wrap text-sm">{{ message.contenu }}</div>
        
        <!-- Métadonnées -->
        <div :class="['flex items-center justify-between mt-1 text-xs', isOwnMessage ? 'text-blue-100' : 'text-gray-500']">
          <span>{{ formatTime(message.date_envoi) }}</span>
          
          <!-- Indicateurs pour les messages envoyés -->
          <div v-if="isOwnMessage" class="flex items-center ml-2">
            <svg 
              v-if="message.est_modifie" 
              class="w-3 h-3 mr-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              title="Message modifié"
            >
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            
            <!-- Statut de lecture (pour les messages directs) -->
            <div v-if="message.type_message === 'DIRECT'" class="flex items-center">
              <svg 
                :class="[
                  'w-3 h-3',
                  message.est_lu ? 'text-green-300' : 'text-blue-200'
                ]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                :title="message.est_lu ? 'Lu' : 'Envoyé'"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg 
                v-if="message.est_lu"
                class="w-3 h-3 -ml-1 text-green-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                title="Lu"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Avatar pour les messages reçus -->
      <div v-if="!isOwnMessage" class="flex items-center mt-1">
        <div class="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-2">
          <span class="text-white text-xs font-bold">
            {{ message.expediteur_nom.charAt(0).toUpperCase() }}
          </span>
        </div>
        <span class="text-xs text-gray-500">{{ message.expediteur_nom }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message, Entreprise } from '../services/api'

interface Props {
  message: Message
  currentEntreprise: Entreprise
  showSender?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSender: false
})

// Computed
const isOwnMessage = computed(() => {
  return props.message.expediteur === props.currentEntreprise.id
})

const showSender = computed(() => {
  // Afficher l'expéditeur pour les messages de groupe ou si explicitement demandé
  return props.showSender || props.message.type_message.startsWith('GROUPE_')
})

// Méthodes
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  if (messageDate.getTime() === today.getTime()) {
    return timeStr
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return `Hier ${timeStr}`
  } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return `${date.toLocaleDateString('fr-FR', { weekday: 'short' })} ${timeStr}`
  } else {
    return `${date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })} ${timeStr}`
  }
}
</script>