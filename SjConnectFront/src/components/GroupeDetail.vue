<template>
  <div class="space-y-6">
    <!-- En-tête avec navigation -->
    <div class="flex items-center space-x-4">
      <button
        @click="$router.go(-1)"
        class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ groupe?.nom || 'Chargement...' }}</h1>
        <p class="text-gray-600">Détails et gestion du groupe</p>
      </div>
    </div>

    <!-- Message de chargement -->
    <div v-if="loading" class="text-center py-12">
      <div class="loader h-8 w-8 mx-auto"></div>
      <p class="mt-2 text-gray-500">Chargement du groupe...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="alert-error">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="text-sm font-medium text-red-800">Erreur</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else-if="groupe" class="space-y-6">
      <!-- Informations du groupe -->
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
              <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-2xl">
                  {{ groupe.nom.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ groupe.nom }}</h2>
                <p class="text-gray-600 mt-1">Par {{ groupe.entreprise_proprietaire_nom }}</p>
                <div v-if="groupe.description" class="mt-2">
                  <p class="text-gray-700">{{ groupe.description }}</p>
                </div>
                <div class="mt-3 flex items-center space-x-6">
                  <div class="flex items-center text-sm text-gray-500">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {{ groupe.nombre_membres }} membres
                  </div>
                  <div class="flex items-center text-sm text-gray-500">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                    </svg>
                    Créé le {{ formatDate(groupe.date_creation) }}
                  </div>
                  <span 
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      groupe.est_public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ groupe.est_public ? 'Public' : 'Privé' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div v-if="canManageGroup" class="flex items-center space-x-2">
              <button
                @click="editGroup"
                class="btn-secondary btn-sm"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="card">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <svg :class="['w-5 h-5 mr-2 inline', activeTab === tab.id ? 'text-blue-500' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
              </svg>
              {{ tab.name }}
              <span v-if="tab.count !== undefined" :class="['ml-2 py-0.5 px-2 rounded-full text-xs', activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600']">
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Contenu des onglets -->
        <div class="p-6">
          <!-- Onglet Membres -->
          <div v-if="activeTab === 'members'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Membres du groupe</h3>
              <button
                v-if="canManageGroup"
                @click="showAddMemberModal = true"
                class="btn-primary btn-sm"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un membre
              </button>
            </div>

            <div v-if="loadingMembers" class="text-center py-8">
              <div class="loader h-6 w-6 mx-auto"></div>
              <p class="mt-2 text-gray-500">Chargement des membres...</p>
            </div>

            <div v-else-if="membres.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun membre</h3>
              <p class="mt-1 text-sm text-gray-500">Ce groupe n'a pas encore de membres.</p>
            </div>

            <div v-else class="space-y-3">
              <MembreCard
                v-for="membre in membres"
                :key="membre.id"
                :membre="membre"
                :can-manage="canManageGroup && membre.statut !== 'PROPRIETAIRE'"
                :current-entreprise="currentEntreprise"
                @remove="removeMember"
              />
            </div>
          </div>

          <!-- Onglet Messages -->
          <div v-if="activeTab === 'messages'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Messages du groupe</h3>
              <button
                v-if="isMember"
                @click="showMessageModal = true"
                class="btn-primary btn-sm"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouveau message
              </button>
            </div>

            <div v-if="loadingMessages" class="text-center py-8">
              <div class="loader h-6 w-6 mx-auto"></div>
              <p class="mt-2 text-gray-500">Chargement des messages...</p>
            </div>

            <div v-else-if="messages.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun message</h3>
              <p class="mt-1 text-sm text-gray-500">Soyez le premier à envoyer un message dans ce groupe.</p>
            </div>

            <div v-else class="space-y-4">
              <MessageBubble
                v-for="message in messages"
                :key="message.id"
                :message="message"
                :current-entreprise="currentEntreprise"
                :show-sender="true"
              />
            </div>
          </div>

          <!-- Onglet Paramètres -->
          <div v-if="activeTab === 'settings' && canManageGroup" class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Paramètres du groupe</h3>
            
            <div class="space-y-6">
              <!-- Informations générales -->
              <div class="card">
                <div class="card-header">
                  <h4 class="text-base font-medium text-gray-900">Informations générales</h4>
                </div>
                <div class="card-body space-y-4">
                  <div>
                    <label class="form-label">Nom du groupe</label>
                    <input
                      v-model="settingsForm.nom"
                      type="text"
                      class="form-input"
                      maxlength="200"
                    >
                  </div>
                  
                  <div>
                    <label class="form-label">Description</label>
                    <textarea
                      v-model="settingsForm.description"
                      rows="3"
                      class="form-textarea"
                    ></textarea>
                  </div>
                  
                  <div class="flex items-center">
                    <input
                      v-model="settingsForm.est_public"
                      type="checkbox"
                      id="est_public"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    >
                    <label for="est_public" class="ml-2 block text-sm text-gray-900">
                      Groupe public (permet les demandes d'intégration)
                    </label>
                  </div>
                  
                  <div class="pt-4">
                    <button
                      @click="saveSettings"
                      :disabled="savingSettings"
                      class="btn-primary btn-md"
                    >
                      {{ savingSettings ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Zone de danger -->
              <div class="card border-red-200">
                <div class="card-header bg-red-50">
                  <h4 class="text-base font-medium text-red-900">Zone de danger</h4>
                </div>
                <div class="card-body">
                  <div class="flex items-center justify-between">
                    <div>
                      <h5 class="text-sm font-medium text-gray-900">Supprimer le groupe</h5>
                      <p class="text-sm text-gray-500">Cette action est irréversible. Tous les messages et membres seront perdus.</p>
                    </div>
                    <button
                      @click="confirmDeleteGroup"
                      class="btn-danger btn-md"
                    >
                      Supprimer le groupe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddMemberModal
      :show="showAddMemberModal"
      :groupe="groupe"
      @close="showAddMemberModal = false"
      @added="onMemberAdded"
    />

    <GroupMessageModal
      :show="showMessageModal"
      :groupe="groupe"
      :current-entreprise="currentEntreprise"
      @close="showMessageModal = false"
      @sent="onMessageSent"
    />

    <ConfirmModal
      :show="showDeleteConfirm"
      title="Supprimer le groupe"
      :message="`Êtes-vous sûr de vouloir supprimer le groupe '${groupe?.nom}' ? Cette action est irréversible et supprimera tous les messages et membres.`"
      confirm-text="Supprimer définitivement"
      confirm-class="btn-danger"
      type="danger"
      :loading="deletingGroup"
      @confirm="deleteGroup"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore, useGroupesStore } from '../stores'
import apiService from '../services/api'
import type { Groupe, MembreGroupe, Message } from '../services/api'
import MessageBubble from './MessageBubble.vue'
import MembreCard from './MembreCard.vue'
import AddMemberModal from './AddMembreModal.vue'
import GroupMessageModal from './GroupeMessageModal.vue'
import ConfirmModal from './ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const groupesStore = useGroupesStore()

const { currentEntreprise } = storeToRefs(appStore)

// État local
const loading = ref(false)
const loadingMembers = ref(false)
const loadingMessages = ref(false)
const savingSettings = ref(false)
const deletingGroup = ref(false)
const error = ref<string | null>(null)
const groupe = ref<Groupe | null>(null)
const membres = ref<MembreGroupe[]>([])
const messages = ref<Message[]>([])
const activeTab = ref('members')
const showAddMemberModal = ref(false)
const showMessageModal = ref(false)
const showDeleteConfirm = ref(false)

const settingsForm = ref({
  nom: '',
  description: '',
  est_public: false
})

// Computed
const groupeId = computed(() => parseInt(route.params.id as string))

const canManageGroup = computed(() => {
  if (!groupe.value || !currentEntreprise.value) return false
  return groupe.value.entreprise_proprietaire === currentEntreprise.value.id
})

const isMember = computed(() => {
  if (!currentEntreprise.value) return false
  return membres.value.some(m => m.entreprise === currentEntreprise.value!.id)
})

const tabs = computed(() => [
  {
    id: 'members',
    name: 'Membres',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    count: membres.value.length
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    count: messages.value.length
  },
  ...(canManageGroup.value ? [{
    id: 'settings',
    name: 'Paramètres',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }] : [])
])

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadGroupe = async () => {
  try {
    loading.value = true
    error.value = null
    groupe.value = await groupesStore.loadGroupe(groupeId.value)
    
    // Initialiser le formulaire des paramètres
    settingsForm.value = {
      nom: groupe.value.nom,
      description: groupe.value.description || '',
      est_public: groupe.value.est_public
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du groupe:', err)
    error.value = 'Groupe non trouvé ou accès non autorisé'
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  if (!groupe.value) return
  
  try {
    loadingMembers.value = true
    membres.value = await apiService.getMembresDuGroupe(groupe.value.id)
  } catch (err: any) {
    console.error('Erreur lors du chargement des membres:', err)
  } finally {
    loadingMembers.value = false
  }
}

const loadMessages = async () => {
  if (!groupe.value || !currentEntreprise.value) return
  
  try {
    loadingMessages.value = true
    messages.value = await apiService.getMessagesGroupe(groupe.value.id, currentEntreprise.value.id)
  } catch (err: any) {
    console.error('Erreur lors du chargement des messages:', err)
  } finally {
    loadingMessages.value = false
  }
}

const editGroup = () => {
  activeTab.value = 'settings'
}

const saveSettings = async () => {
  if (!groupe.value) return
  
  try {
    savingSettings.value = true
    await groupesStore.updateGroupe(groupe.value.id, settingsForm.value)
    groupe.value = { ...groupe.value, ...settingsForm.value }
    appStore.setError(null)
  } catch (err: any) {
    console.error('Erreur lors de la sauvegarde:', err)
    appStore.setError('Erreur lors de la sauvegarde des paramètres')
  } finally {
    savingSettings.value = false
  }
}

const confirmDeleteGroup = () => {
  showDeleteConfirm.value = true
}

const deleteGroup = async () => {
  if (!groupe.value) return
  
  try {
    deletingGroup.value = true
    await groupesStore.deleteGroupe(groupe.value.id)
    router.push('/groupes')
  } catch (err: any) {
    console.error('Erreur lors de la suppression:', err)
    appStore.setError('Erreur lors de la suppression du groupe')
  } finally {
    deletingGroup.value = false
    showDeleteConfirm.value = false
  }
}

const removeMember = async (membre: MembreGroupe) => {
  if (!groupe.value) return
  
  try {
    await apiService.retirerMembreGroupe(groupe.value.id, membre.entreprise)
    await loadMembers()
  } catch (err: any) {
    console.error('Erreur lors de la suppression du membre:', err)
    appStore.setError('Erreur lors de la suppression du membre')
  }
}

const onMemberAdded = () => {
  showAddMemberModal.value = false
  loadMembers()
}

const onMessageSent = () => {
  showMessageModal.value = false
  loadMessages()
}

// Watchers
watch(activeTab, async (newTab) => {
  if (newTab === 'members' && membres.value.length === 0) {
    await loadMembers()
  } else if (newTab === 'messages' && messages.value.length === 0) {
    await loadMessages()
  }
})

// Lifecycle
onMounted(async () => {
  await loadGroupe()
  if (groupe.value) {
    await loadMembers()
  }
})
</script>