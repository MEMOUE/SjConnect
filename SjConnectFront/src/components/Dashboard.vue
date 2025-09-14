<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
      <p class="text-gray-600">
        Bienvenue sur SJConnect
        <span v-if="currentEntreprise" class="font-medium text-blue-600">
          - {{ currentEntreprise.nom }}
        </span>
      </p>
    </div>

    <!-- Message si aucune entreprise sélectionnée -->
    <div v-if="!currentEntreprise" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">
            Sélectionnez une entreprise
          </h3>
          <p class="mt-1 text-sm text-yellow-700">
            Veuillez sélectionner une entreprise dans le menu du haut pour accéder aux fonctionnalités complètes.
          </p>
        </div>
      </div>
    </div>

    <!-- Statistiques générales -->
    <div v-if="!currentEntreprise" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Entreprises</h3>
            <p class="text-2xl font-bold text-gray-600">{{ entreprises.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Groupes</h3>
            <p class="text-2xl font-bold text-gray-600">{{ groupes.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Messages</h3>
            <p class="text-2xl font-bold text-gray-600">{{ messages.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">Demandes</h3>
            <p class="text-2xl font-bold text-gray-600">{{ demandesEnAttente.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau de bord spécifique à l'entreprise -->
    <div v-else class="space-y-6">
      <!-- Statistiques de l'entreprise -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Groupes possédés</h3>
              <p class="text-2xl font-bold text-blue-600">{{ groupesPossedes.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Membre de</h3>
              <p class="text-2xl font-bold text-green-600">{{ groupesMembres.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Conversations</h3>
              <p class="text-2xl font-bold text-purple-600">{{ conversations.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Demandes en attente</h3>
              <p class="text-2xl font-bold text-orange-600">{{ demandesEnAttente.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <router-link
            to="/groupes"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-900">Créer un groupe</h4>
              <p class="text-sm text-gray-500">Nouveau groupe de discussion</p>
            </div>
          </router-link>

          <router-link
            to="/messages"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-900">Envoyer un message</h4>
              <p class="text-sm text-gray-500">Démarrer une conversation</p>
            </div>
          </router-link>

          <router-link
            to="/demandes"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-900">Voir les demandes</h4>
              <p class="text-sm text-gray-500">Gérer les intégrations</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Groupes récents -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Groupes récents</h3>
          <div v-if="groupesPossedes.length > 0" class="space-y-3">
            <div 
              v-for="groupe in groupesPossedes.slice(0, 5)" 
              :key="groupe.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ groupe.nom }}</h4>
                <p class="text-sm text-gray-500">{{ groupe.nombre_membres }} membres</p>
              </div>
              <router-link 
                :to="`/groupes/${groupe.id}`"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Voir
              </router-link>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm">Aucun groupe créé</p>
        </div>

        <!-- Conversations récentes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Conversations récentes</h3>
          <div v-if="conversations.length > 0" class="space-y-3">
            <div 
              v-for="conversation in conversations.slice(0, 5)" 
              :key="conversation.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <h4 class="text-sm font-medium text-gray-900">
                  {{ getConversationPartner(conversation) }}
                </h4>
                <p class="text-sm text-gray-500">
                  {{ formatDate(conversation.derniere_activite) }}
                </p>
              </div>
              <router-link 
                to="/messages"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Voir
              </router-link>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm">Aucune conversation</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore, useEntreprisesStore, useGroupesStore, useMessagesStore, useDemandesStore } from '../stores'
import type { ConversationDirecte } from '../services/api'

const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()
const groupesStore = useGroupesStore()
const messagesStore = useMessagesStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { entreprises } = storeToRefs(entreprisesStore)
const { groupes, groupesPossedes, groupesMembres } = storeToRefs(groupesStore)
const { messages, conversations } = storeToRefs(messagesStore)
const { demandesEnAttente } = storeToRefs(demandesStore)

// Méthodes
const getConversationPartner = (conversation: ConversationDirecte): string => {
  if (!currentEntreprise.value) return ''
  
  if (conversation.entreprise1 === currentEntreprise.value.id) {
    return conversation.entreprise2_nom
  } else {
    return conversation.entreprise1_nom
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return 'Aujourd\'hui'
  } else if (days === 1) {
    return 'Hier'
  } else if (days < 7) {
    return `Il y a ${days} jours`
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

const loadEntrepriseData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    await Promise.all([
      groupesStore.loadGroupesPossedes(currentEntreprise.value.id),
      groupesStore.loadGroupesMembres(currentEntreprise.value.id),
      messagesStore.loadConversations(currentEntreprise.value.id),
      demandesStore.loadDemandes(currentEntreprise.value.id)
    ])
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      groupesStore.loadGroupes(),
      messagesStore.loadMessages(currentEntreprise.value?.id || 0)
    ])
    
    if (currentEntreprise.value) {
      await loadEntrepriseData()
    }
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error)
  }
})

// Watch pour recharger les données quand l'entreprise change
import { watch } from 'vue'
watch(currentEntreprise, async (newEntreprise) => {
  if (newEntreprise) {
    await loadEntrepriseData()
  }
})
</script>