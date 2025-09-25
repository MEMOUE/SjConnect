<template>
  <div class="messages-container p-4">
    <!-- En-tête -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold text-900 m-0">Messages</h2>
        <p class="text-600 mt-1 mb-0">Gérez vos conversations et échangez avec d'autres entreprises</p>
      </div>
      <Button
        v-if="currentEntreprise"
        @click="showNewMessageModal = true"
        label="Nouveau message"
        icon="pi pi-plus"
      />
    </div>

    <!-- Message si aucune entreprise sélectionnée -->
    <Message 
      v-if="!currentEntreprise" 
      severity="warn" 
      class="mb-4"
    >
      <template #messageicon>
        <i class="pi pi-exclamation-triangle"></i>
      </template>
      <div>
        <h5 class="m-0">Sélectionnez une entreprise</h5>
        <p class="m-0 mt-1">Vous devez sélectionner une entreprise pour accéder aux messages.</p>
      </div>
    </Message>

    <div v-if="currentEntreprise" class="grid h-30rem">
      <!-- Liste des conversations -->
      <div class="col-12 lg:col-4">
        <Card class="h-full">
          <template #header>
            <div class="flex justify-content-between align-items-center p-3">
              <h3 class="text-lg font-semibold text-900 m-0">Conversations</h3>
              <div class="flex gap-2">
                <Button
                  :class="viewMode === 'direct' ? 'p-button-primary' : 'p-button-outlined'"
                  @click="viewMode = 'direct'"
                  label="Directes"
                  size="small"
                />
                <Button
                  :class="viewMode === 'groups' ? 'p-button-primary' : 'p-button-outlined'"
                  @click="viewMode = 'groups'"
                  label="Groupes"
                  size="small"
                />
              </div>
            </div>
          </template>
          
          <template #content>
            <ScrollPanel style="width: 100%; height: 400px;">
              <!-- Conversations directes -->
              <div v-if="viewMode === 'direct'">
                <div v-if="loading" class="text-center py-4">
                  <ProgressSpinner size="small" />
                  <p class="text-sm text-600 mt-2">Chargement...</p>
                </div>
                
                <div v-else-if="conversations.length === 0" class="text-center py-6">
                  <i class="pi pi-comments text-4xl text-400 mb-3"></i>
                  <h4 class="text-900 mb-2">Aucune conversation</h4>
                  <p class="text-600 mb-0">Commencez une nouvelle conversation.</p>
                </div>
                
                <div v-else>
                  <div 
                    v-for="conversation in conversations"
                    :key="conversation.id"
                    :class="[
                      'conversation-item p-3 cursor-pointer border-round mb-2 transition-colors',
                      selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-500' : 'hover:bg-surface-50'
                    ]"
                    @click="selectConversation(conversation)"
                  >
                    <div class="flex align-items-center">
                      <Avatar 
                        :label="getPartnerName(conversation).charAt(0)"
                        size="large"
                        style="background-color: var(--blue-500)"
                        class="mr-3"
                      />
                      
                      <div class="flex-1">
                        <div class="flex justify-content-between align-items-center">
                          <h5 class="text-sm font-medium text-900 m-0">
                            {{ getPartnerName(conversation) }}
                          </h5>
                          <span class="text-xs text-500">
                            {{ formatLastActivity(conversation.derniere_activite) }}
                          </span>
                        </div>
                        
                        <div class="mt-1">
                          <p class="text-sm text-600 m-0 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            {{ getLastMessagePreview(conversation) }}
                          </p>
                        </div>
                        
                        <div class="mt-2 flex justify-content-between align-items-center">
                          <div class="flex align-items-center gap-2">
                            <div class="w-2 h-2 bg-green-400 border-round"></div>
                            <span class="text-xs text-500">En ligne</span>
                          </div>
                          
                          <Badge 
                            v-if="getUnreadCount(conversation) > 0" 
                            :value="getUnreadCount(conversation) > 99 ? '99+' : getUnreadCount(conversation).toString()" 
                            severity="info"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Groupes -->
              <div v-if="viewMode === 'groups'">
                <div v-if="allGroups.length === 0" class="text-center py-6">
                  <i class="pi pi-users text-4xl text-400 mb-3"></i>
                  <h4 class="text-900 mb-2">Aucun groupe</h4>
                  <p class="text-600 mb-0">Vous n'êtes membre d'aucun groupe.</p>
                </div>
                
                <div v-else>
                  <div 
                    v-for="groupe in allGroups"
                    :key="groupe.id"
                    :class="[
                      'conversation-item p-3 cursor-pointer border-round mb-2 transition-colors',
                      selectedGroupe?.id === groupe.id ? 'bg-primary-50 border-primary-500' : 'hover:bg-surface-50'
                    ]"
                    @click="selectGroupe(groupe)"
                  >
                    <div class="flex align-items-center">
                      <Avatar 
                        :label="groupe.nom.charAt(0)"
                        size="large"
                        style="background-color: var(--green-500)"
                        class="mr-3"
                      />
                      
                      <div class="flex-1">
                        <div class="flex justify-content-between align-items-center">
                          <h5 class="text-sm font-medium text-900 m-0">
                            {{ groupe.nom }}
                          </h5>
                          <Tag
                            :value="groupe.est_public ? 'Public' : 'Privé'"
                            :severity="groupe.est_public ? 'success' : 'info'"
                            class="text-xs"
                          />
                        </div>
                        
                        <p class="text-xs text-600 m-0">
                          Par {{ groupe.entreprise_proprietaire_nom }}
                        </p>
                        
                        <div class="mt-2 flex align-items-center gap-3">
                          <div class="flex align-items-center text-xs text-500">
                            <i class="pi pi-users mr-1"></i>
                            {{ groupe.nombre_membres }}
                          </div>
                          
                          <div class="flex align-items-center text-xs text-500">
                            <div class="w-2 h-2 bg-green-400 border-round mr-1"></div>
                            Actif
                          </div>
                          
                          <Badge v-if="Math.random() > 0.7" value="2" severity="info" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollPanel>
          </template>
        </Card>
      </div>
      
      <!-- Zone de chat -->
      <div class="col-12 lg:col-8">
        <Card class="h-full">
          <!-- En-tête du chat -->
          <template v-if="selectedConversation || selectedGroupe" #header>
            <div class="flex justify-content-between align-items-center p-3">
              <div class="flex align-items-center">
                <Avatar 
                  :label="getChatTitle().charAt(0)"
                  size="large"
                  style="background-color: var(--primary-color)"
                  class="mr-3"
                />
                <div>
                  <h4 class="text-lg font-medium text-900 m-0">{{ getChatTitle() }}</h4>
                  <p class="text-sm text-600 m-0">{{ getChatSubtitle() }}</p>
                </div>
              </div>
              <div class="flex align-items-center gap-2">
                <Button
                  v-if="selectedGroupe"
                  @click="viewGroupDetails"
                  icon="pi pi-info-circle"
                  text
                  rounded
                  v-tooltip="'Détails du groupe'"
                />
              </div>
            </div>
          </template>
          
          <template #content>
            <!-- Messages -->
            <div class="messages-area" style="height: 300px; overflow-y: auto;" ref="messagesContainer">
              <div v-if="!selectedConversation && !selectedGroupe" class="h-full flex align-items-center justify-content-center">
                <div class="text-center">
                  <i class="pi pi-comments text-6xl text-400 mb-4"></i>
                  <h4 class="text-lg font-medium text-900 mb-2">Sélectionnez une conversation</h4>
                  <p class="text-600 mb-0">Choisissez une conversation ou un groupe pour commencer à discuter.</p>
                </div>
              </div>
              
              <div v-else-if="loadingMessages" class="h-full flex align-items-center justify-content-center">
                <div class="text-center">
                  <ProgressSpinner />
                  <p class="mt-2 text-600">Chargement des messages...</p>
                </div>
              </div>
              
              <div v-else class="p-3">
                <div 
                  v-for="message in currentMessages" 
                  :key="message.id" 
                  :class="[
                    'mb-4 flex',
                    isOwnMessage(message) ? 'justify-content-end' : 'justify-content-start'
                  ]"
                >
                  <div :class="['max-w-70', isOwnMessage(message) ? 'order-1' : 'order-2']">
                    <div 
                      :class="[
                        'p-3 border-round shadow-1',
                        isOwnMessage(message) 
                          ? 'bg-primary text-white' 
                          : 'surface-100 text-900'
                      ]"
                    >
                      <!-- En-tête du message (groupe uniquement) -->
                      <div v-if="shouldShowSender(message)" class="mb-2">
                        <p :class="['text-xs font-medium', isOwnMessage(message) ? 'text-primary-100' : 'text-600']">
                          {{ message.expediteur_nom }}
                        </p>
                      </div>
                      
                      <!-- Contenu du message -->
                      <div class="text-sm white-space-pre-wrap">{{ message.contenu }}</div>
                      
                      <!-- Métadonnées -->
                      <div :class="['flex align-items-center justify-content-between mt-2 text-xs', isOwnMessage(message) ? 'text-primary-100' : 'text-500']">
                        <span>{{ formatMessageTime(message.date_envoi) }}</span>
                        
                        <!-- Indicateurs pour les messages envoyés -->
                        <div v-if="isOwnMessage(message)" class="flex align-items-center ml-2">
                          <i 
                            v-if="message.est_modifie" 
                            class="pi pi-pencil mr-1"
                            v-tooltip="'Message modifié'"
                          ></i>
                          
                          <!-- Statut de lecture (pour les messages directs) -->
                          <div v-if="message.type_message === 'DIRECT'" class="flex align-items-center">
                            <i 
                              :class="[
                                'pi',
                                message.est_lu ? 'pi-check-circle text-green-300' : 'pi-check text-primary-200'
                              ]" 
                              :v-tooltip="message.est_lu ? 'Lu' : 'Envoyé'"
                            ></i>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Avatar pour les messages reçus -->
                    <div v-if="!isOwnMessage(message)" class="flex align-items-center mt-1">
                      <Avatar 
                        :label="message.expediteur_nom.charAt(0)"
                        size="small"
                        style="background-color: var(--surface-400)"
                        class="mr-2"
                      />
                      <span class="text-xs text-600">{{ message.expediteur_nom }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Zone de saisie -->
            <div v-if="selectedConversation || selectedGroupe" class="border-top-1 surface-border p-3">
              <form @submit.prevent="sendMessage" class="flex gap-3">
                <div class="flex-1">
                  <Textarea
                    v-model="newMessageContent"
                    placeholder="Tapez votre message..."
                    :rows="2"
                    class="w-full resize-none"
                    @keydown.enter.exact.prevent="sendMessage"
                    @keydown.enter.shift.exact="addNewLine"
                  />
                </div>
                <div class="flex flex-column justify-content-end">
                  <Button
                    type="submit"
                    icon="pi pi-send"
                    :loading="sendingMessage"
                    :disabled="!newMessageContent.trim()"
                  />
                </div>
              </form>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Modal nouveau message -->
    <Dialog 
      v-model:visible="showNewMessageModal" 
      :modal="true" 
      header="Nouveau message"
      class="w-full max-w-2xl"
    >
      <NewMessageForm
        :current-entreprise="currentEntreprise"
        @sent="onMessageSent"
        @close="showNewMessageModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppStore, useMessagesStore, useGroupesStore } from '../../stores'
import type { ConversationDirecte, Groupe, Message } from '../../services/api'

const router = useRouter()
const toast = useToast()

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
    return getPartnerName(selectedConversation.value)
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

const getPartnerName = (conversation: ConversationDirecte): string => {
  if (!currentEntreprise.value) return ''
  
  if (conversation.entreprise1 === currentEntreprise.value.id) {
    return conversation.entreprise2_nom
  } else {
    return conversation.entreprise1_nom
  }
}

const getLastMessagePreview = (conversation: ConversationDirecte): string => {
  if (conversation.derniers_messages && conversation.derniers_messages.length > 0) {
    const lastMessage = conversation.derniers_messages[0]
    const isOwn = lastMessage.expediteur === currentEntreprise.value?.id
    const prefix = isOwn ? 'Vous: ' : ''
    
    const content = lastMessage.contenu.length > 50 
      ? lastMessage.contenu.substring(0, 50) + '...'
      : lastMessage.contenu
    
    return prefix + content
  }
  return 'Aucun message'
}

const getUnreadCount = (conversation: ConversationDirecte): number => {
  if (conversation.derniers_messages && conversation.derniers_messages.length > 0) {
    const lastMessage = conversation.derniers_messages[0]
    if (lastMessage.expediteur !== currentEntreprise.value?.id && !lastMessage.est_lu) {
      return Math.floor(Math.random() * 5) + 1 // Nombre aléatoire pour la démo
    }
  }
  return 0
}

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

const formatMessageTime = (dateString: string): string => {
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

const isOwnMessage = (message: Message): boolean => {
  return message.expediteur === currentEntreprise.value?.id
}

const shouldShowSender = (message: Message): boolean => {
  return message.type_message.startsWith('GROUPE_')
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
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des messages',
      life: 5000
    })
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
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des messages du groupe',
      life: 5000
    })
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
      const otherEntrepriseId = selectedConversation.value.entreprise1 === currentEntreprise.value.id 
        ? selectedConversation.value.entreprise2 
        : selectedConversation.value.entreprise1
        
      messageData.type_message = 'DIRECT'
      messageData.destinataire_id = otherEntrepriseId
    } else if (selectedGroupe.value) {
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
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de l\'envoi du message',
      life: 5000
    })
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
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des données',
      life: 5000
    })
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

<style scoped>
.messages-container {
  max-width: 1400px;
  margin: 0 auto;
}

.conversation-item {
  border: 2px solid transparent;
}

.conversation-item:hover {
  background-color: var(--surface-50);
}

.conversation-item.bg-primary-50 {
  background-color: var(--primary-50);
  border-color: var(--primary-200);
}

.messages-area {
  min-height: 300px;
}

.max-w-70 {
  max-width: 70%;
}

.resize-none {
  resize: none;
}
</style>