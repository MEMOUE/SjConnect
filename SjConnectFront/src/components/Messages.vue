<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Messages</h2>
        <p class="text-gray-600">Gérez vos conversations et échangez avec d'autres entreprises</p>
      </div>
      <button
        v-if="currentEntreprise"
        @click="showNewMessageModal = true"
        class="btn-primary btn-md"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nouveau message
      </button>
    </div>

    <!-- Message si aucune entreprise sélectionnée -->
    <div v-if="!currentEntreprise" class="alert-warning">
      <div class="flex">
        <svg class="h-5 w-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-yellow-800">Sélectionnez une entreprise</h3>
          <p class="mt-1 text-sm text-yellow-700">
            Vous devez sélectionner une entreprise pour accéder aux messages.
          </p>
        </div>
      </div>
    </div>

    <div v-if="currentEntreprise" class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      <!-- Liste des conversations -->
      <div class="lg:col-span-1">
        <div class="card h-full flex flex-col">
          <div class="card-header">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Conversations</h3>
              <div class="flex space-x-2">
                <button
                  @click="viewMode = 'direct'"
                  :class="[
                    'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'direct' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                >
                  Directes
                </button>
                <button
                  @click="viewMode = 'groups'"
                  :class="[
                    'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'groups' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  ]"
                >
                  Groupes
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto">
            <!-- Conversations directes -->
            <div v-if="viewMode === 'direct'">
              <div v-if="loading" class="p-4 text-center">
                <div class="loader h-6 w-6 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-500">Chargement...</p>
              </div>
              
              <div v-else-if="conversations.length === 0" class="p-6 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune conversation</h3>
                <p class="mt-1 text-sm text-gray-500">Commencez une nouvelle conversation.</p>
              </div>
              
              <div v-else class="divide-y divide-gray-200">
                <ConversationItem
                  v-for="conversation in conversations"
                  :key="conversation.id"
                  :conversation="conversation"
                  :current-entreprise="currentEntreprise"
                  :is-active="selectedConversation?.id === conversation.id"
                  @select="selectConversation"
                />
              </div>
            </div>
            
            <!-- Groupes -->
            <div v-if="viewMode === 'groups'">
              <div v-if="groupesMembres.length === 0" class="p-6 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun groupe</h3>
                <p class="mt-1 text-sm text-gray-500">Vous n'êtes membre d'aucun groupe.</p>
              </div>
              
              <div v-else class="divide-y divide-gray-200">
                <GroupeItem
                  v-for="groupe in allGroups"
                  :key="groupe.id"
                  :groupe="groupe"
                  :is-active="selectedGroupe?.id === groupe.id"
                  @select="selectGroupe"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Zone de chat -->
      <div class="lg:col-span-2">
        <div class="card h-full flex flex-col">
          <!-- En-tête du chat -->
          <div v-if="selectedConversation || selectedGroupe" class="card-header">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white font-bold text-lg">
                    {{ getChatTitle().charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900">{{ getChatTitle() }}</h3>
                  <p class="text-sm text-gray-500">{{ getChatSubtitle() }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  v-if="selectedGroupe"
                  @click="viewGroupDetails"
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50"
                  title="Détails du groupe"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
            <div v-if="!selectedConversation && !selectedGroupe" class="h-full flex items-center justify-center">
              <div class="text-center">
                <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900">Sélectionnez une conversation</h3>
                <p class="mt-1 text-gray-500">Choisissez une conversation ou un groupe pour commencer à discuter.</p>
              </div>
            </div>
            
            <div v-else-if="loadingMessages" class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="loader h-8 w-8 mx-auto"></div>
                <p class="mt-2 text-gray-500">Chargement des messages...</p>
              </div>
            </div>
            
            <div v-else class="space-y-4">
              <MessageBubble
                v-for="message in currentMessages"
                :key="message.id"
                :message="message"
                :current-entreprise="currentEntreprise"
              />
            </div>
          </div>
          
          <!-- Zone de saisie -->
          <div v-if="selectedConversation || selectedGroupe" class="border-t border-gray-200 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-4">
              <div class="flex-1">
                <textarea
                  v-model="newMessageContent"
                  placeholder="Tapez votre message..."
                  class="form-textarea resize-none"
                  rows="2"
                  @keydown.enter.exact.prevent="sendMessage"
                  @keydown.enter.shift.exact="addNewLine"
                ></textarea>
              </div>
              <div class="flex flex-col justify-end">
                <button
                  type="submit"
                  :disabled="!newMessageContent.trim() || sendingMessage"
                  class="btn-primary btn-md"
                >
                  <svg v-if="sendingMessage" class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nouveau message -->
    <NewMessageModal
      :show="showNewMessageModal"
      :current-entreprise="currentEntreprise"
      @close="showNewMessageModal = false"
      @sent="onMessageSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore, useMessagesStore, useGroupesStore } from '../stores'
import type { ConversationDirecte, Groupe, Message } from '../services/api'
import ConversationItem from './ConversationItem.vue'
import GroupeItem from './GroupeItem.vue'
import MessageBubble from './MessageBubble.vue'
import NewMessageModal from './NewMessageModal.vue'

const router = useRouter()
const appStore = useAppStore()
const messagesStore = useMessagesStore()
const groupesStore = useGroupesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { conversations, currentConversation } = storeToRefs(messagesStore)
const { groupesPossedes, groupesMembres } = storeToRefs(groupesStore)

// État local
const loading = ref(false)
const loadingMessages = ref(false)
const sendingMessage = ref(false)
const showNewMessageModal = ref(false)
const viewMode = ref<'direct' | 'groups'>('direct')
const selectedConversation = ref<ConversationDirecte | null>(null)
const selectedGroupe = ref<Groupe | null>(null)
const currentMessages = ref<Message[]>([])
const newMessageContent = ref('')
const messagesContainer = ref<HTMLElement>()

// Computed
const allGroups = computed(() => {
  return [...groupesPossedes.value, ...groupesMembres.value]
})

// Méthodes
const getChatTitle = (): string => {
  if (selectedConversation.value && currentEntreprise.value) {
    if (selectedConversation.value.entreprise1 === currentEntreprise.value.id) {
      return selectedConversation.value.entreprise2_nom
    } else {
      return selectedConversation.value.entreprise1_nom
    }
  }
  if (selectedGroupe.value) {
    return selectedGroupe.value.nom
  }
  return ''
}

const getChatSubtitle = (): string => {
  if (selectedConversation.value) {
    return 'Conversation directe'
  }
  if (selectedGroupe.value) {
    return `Groupe • ${selectedGroupe.value.nombre_membres} membres`
  }
  return ''
}

const selectConversation = async (conversation: ConversationDirecte) => {
  selectedConversation.value = conversation
  selectedGroupe.value = null
  await loadConversationMessages(conversation)
}

const selectGroupe = async (groupe: Groupe) => {
  selectedGroupe.value = groupe
  selectedConversation.value = null
  await loadGroupeMessages(groupe)
}

const loadConversationMessages = async (conversation: ConversationDirecte) => {
  if (!currentEntreprise.value) return
  
  try {
    loadingMessages.value = true
    const otherEntrepriseId = conversation.entreprise1 === currentEntreprise.value.id 
      ? conversation.entreprise2 
      : conversation.entreprise1
    
    await messagesStore.loadConversation(currentEntreprise.value.id, otherEntrepriseId)
    currentMessages.value = currentConversation.value
    
    await nextTick()
    scrollToBottom()
  } catch (error: any) {
    console.error('Erreur lors du chargement des messages:', error)
    appStore.setError('Erreur lors du chargement des messages')
  } finally {
    loadingMessages.value = false
  }
}

const loadGroupeMessages = async (groupe: Groupe) => {
  if (!currentEntreprise.value) return
  
  try {
    loadingMessages.value = true
    const messages = await groupesStore.loadMessagesGroupe(groupe.id, currentEntreprise.value.id)
    currentMessages.value = messages
    
    await nextTick()
    scrollToBottom()
  } catch (error: any) {
    console.error('Erreur lors du chargement des messages du groupe:', error)
    appStore.setError('Erreur lors du chargement des messages du groupe')
  } finally {
    loadingMessages.value = false
  }
}

const sendMessage = async () => {
  if (!newMessageContent.value.trim() || !currentEntreprise.value) return
  
  try {
    sendingMessage.value = true
    
    let messageData: any = {
      expediteur_id: currentEntreprise.value.id,
      contenu: newMessageContent.value.trim()
    }
    
    if (selectedConversation.value) {
      // Message direct
      const otherEntrepriseId = selectedConversation.value.entreprise1 === currentEntreprise.value.id 
        ? selectedConversation.value.entreprise2 
        : selectedConversation.value.entreprise1
        
      messageData.type_message = 'DIRECT'
      messageData.destinataire_id = otherEntrepriseId
    } else if (selectedGroupe.value) {
      // Message de groupe
      messageData.type_message = selectedGroupe.value.est_public ? 'GROUPE_PUBLIC' : 'GROUPE_PRIVE'
      messageData.groupe_id = selectedGroupe.value.id
    }
    
    await messagesStore.envoyerMessage(messageData)
    newMessageContent.value = ''
    
    // Recharger les messages
    if (selectedConversation.value) {
      await loadConversationMessages(selectedConversation.value)
    } else if (selectedGroupe.value) {
      await loadGroupeMessages(selectedGroupe.value)
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi:', error)
    appStore.setError('Erreur lors de l\'envoi du message')
  } finally {
    sendingMessage.value = false
  }
}

const addNewLine = () => {
  newMessageContent.value += '\n'
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const viewGroupDetails = () => {
  if (selectedGroupe.value) {
    router.push(`/groupes/${selectedGroupe.value.id}`)
  }
}

const onMessageSent = () => {
  showNewMessageModal.value = false
  loadData()
}

const loadData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    await Promise.all([
      messagesStore.loadConversations(currentEntreprise.value.id),
      groupesStore.loadGroupesPossedes(currentEntreprise.value.id),
      groupesStore.loadGroupesMembres(currentEntreprise.value.id)
    ])
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    appStore.setError('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (currentEntreprise.value) {
    await loadData()
  }
})

// Watchers
watch(currentEntreprise, async (newEntreprise) => {
  if (newEntreprise) {
    await loadData()
  } else {
    selectedConversation.value = null
    selectedGroupe.value = null
    currentMessages.value = []
  }
})

watch(currentMessages, async () => {
  await nextTick()
  scrollToBottom()
})
</script>