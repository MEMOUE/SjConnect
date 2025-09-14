<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Demandes d'intégration</h2>
        <p class="text-gray-600">Gérez les demandes d'accès aux groupes</p>
      </div>
      <button
        v-if="currentEntreprise"
        @click="showJoinModal = true"
        class="btn-primary btn-md"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Demander à rejoindre un groupe
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
            Vous devez sélectionner une entreprise pour voir les demandes d'intégration.
          </p>
        </div>
      </div>
    </div>

    <div v-if="currentEntreprise" class="space-y-6">
      <!-- Filtres -->
      <div class="card">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher par nom de groupe ou d'entreprise..."
                class="form-input"
              >
            </div>
            <div class="flex gap-2">
              <select v-model="statusFilter" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="ACCEPTEE">Acceptées</option>
                <option value="REFUSEE">Refusées</option>
              </select>
              <select v-model="typeFilter" class="form-select">
                <option value="">Tous les types</option>
                <option value="received">Demandes reçues</option>
                <option value="sent">Demandes envoyées</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">En attente</p>
                <p class="text-2xl font-bold text-orange-600">{{ demandesEnAttente.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Acceptées</p>
                <p class="text-2xl font-bold text-green-600">{{ demandesAcceptees.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Refusées</p>
                <p class="text-2xl font-bold text-red-600">{{ demandesRefusees.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total</p>
                <p class="text-2xl font-bold text-blue-600">{{ demandes.length }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des demandes -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900">
            Demandes d'intégration ({{ filteredDemandes.length }})
          </h3>
        </div>

        <div v-if="loading" class="card-body text-center py-12">
          <div class="loader h-8 w-8 mx-auto"></div>
          <p class="mt-2 text-gray-500">Chargement...</p>
        </div>

        <div v-else-if="filteredDemandes.length === 0" class="card-body text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune demande trouvée</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ searchQuery ? 'Aucune demande ne correspond à votre recherche.' : 'Aucune demande d\'intégration pour le moment.' }}
          </p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <DemandeCard
            v-for="demande in filteredDemandes"
            :key="demande.id"
            :demande="demande"
            :current-entreprise="currentEntreprise"
            @respond="respondToDemande"
            @view-group="viewGroup"
          />
        </div>
      </div>
    </div>

    <!-- Modal pour demander à rejoindre un groupe -->
    <JoinGroupModal
      :show="showJoinModal"
      :current-entreprise="currentEntreprise"
      @close="showJoinModal = false"
      @submitted="onJoinRequestSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore, useDemandesStore } from '../stores'
import type { DemandeIntegration } from '../services/api'
import DemandeCard from './DemandeCard.vue'
import JoinGroupModal from './JoinGroupModal.vue'

const router = useRouter()
const appStore = useAppStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { demandes, demandesEnAttente } = storeToRefs(demandesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const showJoinModal = ref(false)

// Computed
const filteredDemandes = computed(() => {
  return demandes.value.filter(demande => {
    const matchesSearch = 
      demande.groupe_cible_nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      demande.entreprise_demandeur_nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      demande.groupe_proprietaire_nom.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' || demande.statut === statusFilter.value
    
    const matchesType = typeFilter.value === '' ||
      (typeFilter.value === 'received' && isReceivedDemande(demande)) ||
      (typeFilter.value === 'sent' && isSentDemande(demande))
    
    return matchesSearch && matchesStatus && matchesType
  })
})

const demandesAcceptees = computed(() => 
  demandes.value.filter(d => d.statut === 'ACCEPTEE')
)

const demandesRefusees = computed(() => 
  demandes.value.filter(d => d.statut === 'REFUSEE')
)

// Méthodes
const isReceivedDemande = (demande: DemandeIntegration): boolean => {
  if (!currentEntreprise.value) return false
  // Demande reçue si notre entreprise est propriétaire du groupe ciblé
  return demande.groupe_proprietaire_nom === currentEntreprise.value.nom
}

const isSentDemande = (demande: DemandeIntegration): boolean => {
  if (!currentEntreprise.value) return false
  // Demande envoyée si notre entreprise est le demandeur
  return demande.entreprise_demandeur === currentEntreprise.value.id
}

const respondToDemande = async (demande: DemandeIntegration, accepter: boolean) => {
  try {
    await demandesStore.repondreDemande(demande.id, accepter)
    appStore.setError(null)
    
    // Optionnel : afficher une notification de succès
    const action = accepter ? 'acceptée' : 'refusée'
    alert(`Demande ${action} avec succès !`)
  } catch (error: any) {
    console.error('Erreur lors de la réponse:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de la réponse à la demande')
  }
}

const viewGroup = (demande: DemandeIntegration) => {
  router.push(`/groupes/${demande.groupe_cible}`)
}

const onJoinRequestSubmitted = () => {
  showJoinModal.value = false
  loadData()
}

const loadData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    await demandesStore.loadDemandes(currentEntreprise.value.id)
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    appStore.setError('Erreur lors du chargement des demandes')
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
  }
})
</script>