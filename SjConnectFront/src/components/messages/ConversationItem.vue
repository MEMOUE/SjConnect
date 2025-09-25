<template>
  <button
    @click="$emit('select', conversation)"
    :class="[
      'w-full p-4 text-left hover:bg-gray-50 transition-colors border-l-4',
      isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:border-gray-200'
    ]"
  >
    <div class="flex items-center space-x-3">
      <!-- Avatar -->
      <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span class="text-white font-bold text-lg">
          {{ partnerName.charAt(0).toUpperCase() }}
        </span>
      </div>
      
      <div class="flex-1 min-w-0">
        <!-- Nom du partenaire -->
        <div class="flex items-center justify-between">
          <h4 :class="['text-sm font-medium truncate', isActive ? 'text-blue-900' : 'text-gray-900']">
            {{ partnerName }}
          </h4>
          <span :class="['text-xs flex-shrink-0 ml-2', isActive ? 'text-blue-600' : 'text-gray-500']">
            {{ formatLastActivity(conversation.derniere_activite) }}
          </span>
        </div>
        
        <!-- Dernier message -->
        <div class="mt-1">
          <p :class="['text-sm truncate', isActive ? 'text-blue-700' : 'text-gray-600']">
            {{ lastMessagePreview }}
          </p>
        </div>
        
        <!-- Indicateurs -->
        <div class="mt-2 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <!-- Badge de statut en ligne (optionnel) -->
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span :class="['text-xs', isActive ? 'text-blue-600' : 'text-gray-500']">
              En ligne
            </span>
          </div>
          
          <!-- Nombre de messages non lus (optionnel) -->
          <div v-if="unreadCount > 0" class="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </div>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConversationDirecte, Entreprise } from '../services/api'

interface Props {
  conversation: ConversationDirecte
  currentEntreprise: Entreprise
  isActive: boolean
}

const props = defineProps<Props>()
defineEmits<{
  select: [conversation: ConversationDirecte]
}>()

// Computed
const partnerName = computed(() => {
  if (props.conversation.entreprise1 === props.currentEntreprise.id) {
    return props.conversation.entreprise2_nom
  } else {
    return props.conversation.entreprise1_nom
  }
})

const lastMessagePreview = computed(() => {
  if (props.conversation.derniers_messages && props.conversation.derniers_messages.length > 0) {
    const lastMessage = props.conversation.derniers_messages[0]
    const isOwn = lastMessage.expediteur === props.currentEntreprise.id
    const prefix = isOwn ? 'Vous: ' : ''
    
    // Limiter la longueur du message
    const content = lastMessage.contenu.length > 50 
      ? lastMessage.contenu.substring(0, 50) + '...'
      : lastMessage.contenu
    
    return prefix + content
  }
  return 'Aucun message'
})

// Calcul fictif du nombre de messages non lus
const unreadCount = computed(() => {
  // Dans une vraie application, ceci viendrait de l'API
  if (props.conversation.derniers_messages && props.conversation.derniers_messages.length > 0) {
    const lastMessage = props.conversation.derniers_messages[0]
    // Si le dernier message n'est pas de nous et n'est pas lu
    if (lastMessage.expediteur !== props.currentEntreprise.id && !lastMessage.est_lu) {
      return Math.floor(Math.random() * 5) + 1 // Nombre aléatoire pour la démo
    }
  }
  return 0
})

// Méthodes
const formatLastActivity = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) {
    return 'À l\'instant'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min`
  } else if (diffHours < 24) {
    return `${diffHours}h`
  } else if (diffDays < 7) {
    return `${diffDays}j`
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })
  }
}
</script>