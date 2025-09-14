<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Groupes</h2>
        <p class="text-gray-600">Gérez vos groupes de discussion</p>
      </div>
      <button
        v-if="currentEntreprise"
        @click="showCreateModal = true"
        class="btn-primary btn-md"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nouveau groupe
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
            Vous devez sélectionner une entreprise pour voir et gérer les groupes.
          </p>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div v-if="currentEntreprise" class="card">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un groupe..."
              class="form-input"
            >
          </div>
          <div class="flex gap-2">
            <select v-model="viewFilter" class="form-select">
              <option value="all">Tous les groupes</option>
              <option value="owned">Mes groupes</option>
              <option value="member">Groupes membre</option>
              <option value="public">Groupes publics</option>
            </select>
            <select v-model="statusFilter" class="form-select">
              <option value="">Tous les statuts</option>
              <option value="public">Publics</option>
              <option value="private">Privés</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Groupes possédés -->
    <div v-if="currentEntreprise && viewFilter === 'all' || viewFilter === 'owned'" class="card">
      <div class="card-header">
        <h3 class="text-lg font-medium text-gray-900">
          Groupes que vous possédez ({{ groupesPossedes.length }})
        </h3>
      </div>
      
      <div v-if="groupesPossedes.length === 0" class="card-body text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucun groupe créé</h3>
        <p class="mt-1 text-sm text-gray-500">Commencez par créer votre premier groupe.</p>
        <div class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary btn-md">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Créer un groupe
          </button>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <GroupeCard 
          v-for="groupe in filteredGroupesPossedes" 
          :key="groupe.id"
          :groupe="groupe"
          :is-owner="true"
          @edit="editGroupe"
          @delete="confirmDelete"
          @view="viewGroupe"
        />
      </div>
    </div>

    <!-- Groupes dont on est membre -->
    <div v-if="currentEntreprise && (viewFilter === 'all' || viewFilter === 'member')" class="card">
      <div class="card-header">
        <h3 class="text-lg font-medium text-gray-900">
          Groupes où vous êtes membre ({{ groupesMembres.length }})
        </h3>
      </div>
      
      <div v-if="groupesMembres.length === 0" class="card-body text-center py-8">
        <p class="text-gray-500">Vous n'êtes membre d'aucun groupe.</p>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <GroupeCard 
          v-for="groupe in filteredGroupesMembres" 
          :key="groupe.id"
          :groupe="groupe"
          :is-owner="false"
          @view="viewGroupe"
        />
      </div>
    </div>

    <!-- Groupes publics -->
    <div v-if="currentEntreprise && (viewFilter === 'all' || viewFilter === 'public')" class="card">
      <div class="card-header">
        <h3 class="text-lg font-medium text-gray-900">
          Groupes publics disponibles
        </h3>
      </div>
      
      <div v-if="loading" class="card-body text-center py-8">
        <div class="loader h-8 w-8 mx-auto"></div>
        <p class="mt-2 text-gray-500">Chargement...</p>
      </div>

      <div v-else-if="availablePublicGroups.length === 0" class="card-body text-center py-8">
        <p class="text-gray-500">Aucun groupe public disponible.</p>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <GroupeCard 
          v-for="groupe in filteredPublicGroups" 
          :key="groupe.id"
          :groupe="groupe"
          :is-owner="false"
          :show-join-button="true"
          @join="requestJoin"
          @view="viewGroupe"
        />
      </div>
    </div>

    <!-- Modal de création/édition -->
    <GroupeModal
      :show="showCreateModal || showEditModal"
      :groupe="editingGroupe"
      :entreprise="currentEntreprise"
      @close="closeModal"
      @submit="submitGroupe"
    />

    <!-- Modal de confirmation de suppression -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Supprimer le groupe"
      :message="`Êtes-vous sûr de vouloir supprimer le groupe '${groupeToDelete?.nom}' ? Cette action est irréversible.`"
      confirm-text="Supprimer"
      confirm-class="btn-danger"
      :loading="submitting"
      @confirm="deleteGroupe"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore, useGroupesStore, useDemandesStore } from '../stores'
import type { Groupe } from '../services/api'
import GroupeCard from './GroupeCard.vue'
import GroupeModal from './GroupeModal.vue'
import ConfirmModal from './ConfirmModal.vue'

const router = useRouter()
const appStore = useAppStore()
const groupesStore = useGroupesStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { groupes, groupesPossedes, groupesMembres } = storeToRefs(groupesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const viewFilter = ref('all')
const statusFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const editingGroupe = ref<Groupe | null>(null)
const groupeToDelete = ref<Groupe | null>(null)

// Computed
const filteredGroupesPossedes = computed(() => {
  return groupesPossedes.value.filter(groupe => {
    const matchesSearch = groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' ||
                         (statusFilter.value === 'public' && groupe.est_public) ||
                         (statusFilter.value === 'private' && !groupe.est_public)
    
    return matchesSearch && matchesStatus
  })
})

const filteredGroupesMembres = computed(() => {
  return groupesMembres.value.filter(groupe => {
    const matchesSearch = groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' ||
                         (statusFilter.value === 'public' && groupe.est_public) ||
                         (statusFilter.value === 'private' && !groupe.est_public)
    
    return matchesSearch && matchesStatus
  })
})

const availablePublicGroups = computed(() => {
  if (!currentEntreprise.value) return []
  
  return groupes.value.filter(groupe => {
    // Exclure les groupes dont on est propriétaire ou membre
    const isOwner = groupe.entreprise_proprietaire === currentEntreprise.value!.id
    const isMember = groupesMembres.value.some(g => g.id === groupe.id)
    
    return groupe.est_public && !isOwner && !isMember
  })
})

const filteredPublicGroups = computed(() => {
  return availablePublicGroups.value.filter(groupe => {
    return groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

// Méthodes
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingGroupe.value = null
}

const editGroupe = (groupe: Groupe) => {
  editingGroupe.value = groupe
  showEditModal.value = true
}

const confirmDelete = (groupe: Groupe) => {
  groupeToDelete.value = groupe
  showDeleteModal.value = true
}

const viewGroupe = (groupe: Groupe) => {
  router.push(`/groupes/${groupe.id}`)
}

const submitGroupe = async (groupeData: any) => {
  try {
    submitting.value = true
    
    if (showEditModal.value && editingGroupe.value) {
      await groupesStore.updateGroupe(editingGroupe.value.id, groupeData)
    } else {
      await groupesStore.createGroupe({
        ...groupeData,
        entreprise_proprietaire: currentEntreprise.value!.id
      })
    }
    
    closeModal()
    await loadData()
  } catch (error: any) {
    console.error('Erreur lors de la soumission:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'opération')
  } finally {
    submitting.value = false
  }
}

const deleteGroupe = async () => {
  if (!groupeToDelete.value) return
  
  try {
    submitting.value = true
    await groupesStore.deleteGroupe(groupeToDelete.value.id)
    showDeleteModal.value = false
    groupeToDelete.value = null
    await loadData()
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de la suppression')
  } finally {
    submitting.value = false
  }
}

const requestJoin = async (groupe: Groupe) => {
  if (!currentEntreprise.value) return
  
  try {
    await demandesStore.createDemande({
      entreprise_demandeur: currentEntreprise.value.id,
      groupe_cible: groupe.id,
      message_demande: `${currentEntreprise.value.nom} souhaite rejoindre le groupe "${groupe.nom}".`
    })
    
    appStore.setError(null)
    // Optionnel : afficher une notification de succès
    alert('Demande d\'intégration envoyée avec succès !')
  } catch (error: any) {
    console.error('Erreur lors de la demande:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de la demande d\'intégration')
  }
}

const loadData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    await Promise.all([
      groupesStore.loadGroupes(),
      groupesStore.loadGroupesPossedes(currentEntreprise.value.id),
      groupesStore.loadGroupesMembres(currentEntreprise.value.id)
    ])
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    appStore.setError('Erreur lors du chargement des groupes')
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