<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Entreprises</h2>
        <p class="text-gray-600">Gérez toutes les entreprises de la plateforme</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="btn-primary btn-md"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nouvelle entreprise
      </button>
    </div>

    <!-- Filtres et recherche -->
    <div class="card">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher une entreprise (nom ou email)..."
              class="form-input"
            >
          </div>
          <div class="flex gap-2">
            <select v-model="statusFilter" class="form-select">
              <option value="">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
            <select v-model="sortBy" class="form-select">
              <option value="nom">Trier par nom</option>
              <option value="date_creation">Trier par date</option>
              <option value="groupes_count">Trier par nb. groupes</option>
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
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Total</p>
              <p class="text-2xl font-bold text-blue-600">{{ entreprises.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Actives</p>
              <p class="text-2xl font-bold text-green-600">{{ entreprisesActives.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Inactives</p>
              <p class="text-2xl font-bold text-red-600">{{ entreprisesInactives.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Récentes (7j)</p>
              <p class="text-2xl font-bold text-purple-600">{{ entreprisesRecentes.length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des entreprises -->
    <div class="card">
      <div class="card-header">
        <h3 class="text-lg font-medium text-gray-900">
          Entreprises ({{ filteredEntreprises.length }})
        </h3>
      </div>

      <div v-if="loading" class="card-body text-center py-12">
        <div class="loader h-8 w-8 mx-auto"></div>
        <p class="mt-2 text-gray-500">Chargement...</p>
      </div>

      <div v-else-if="filteredEntreprises.length === 0" class="card-body text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune entreprise trouvée</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchQuery ? 'Aucune entreprise ne correspond à votre recherche.' : 'Commencez par créer votre première entreprise.' }}
        </p>
        <div v-if="!searchQuery" class="mt-6">
          <button @click="showCreateModal = true" class="btn-primary btn-md">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Créer une entreprise
          </button>
        </div>
      </div>

      <div v-else class="overflow-hidden">
        <!-- Vue liste pour desktop -->
        <div class="hidden md:block">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr 
                v-for="entreprise in paginatedEntreprises" 
                :key="entreprise.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span class="text-white font-bold text-sm">
                        {{ entreprise.nom.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ entreprise.nom }}</div>
                      <div v-if="entreprise.description" class="text-sm text-gray-500 truncate max-w-xs">
                        {{ entreprise.description }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <a 
                    :href="`mailto:${entreprise.email}`"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {{ entreprise.email }}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {{ entreprise.groupes_possedes_count || 0 }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(entreprise.date_creation) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="viewEntreprise(entreprise)"
                      class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Voir les détails"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      @click="editEntreprise(entreprise)"
                      class="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                      title="Modifier"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="confirmDelete(entreprise)"
                      class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="Supprimer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vue cartes pour mobile -->
        <div class="md:hidden divide-y divide-gray-200">
          <EntrepriseCard
            v-for="entreprise in paginatedEntreprises"
            :key="entreprise.id"
            :entreprise="entreprise"
            @view="viewEntreprise"
            @edit="editEntreprise"
            @delete="confirmDelete"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="currentPage > 1 && (currentPage--)"
              :disabled="currentPage <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              @click="currentPage < totalPages && (currentPage++)"
              :disabled="currentPage >= totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de
                <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                à
                <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredEntreprises.length) }}</span>
                sur
                <span class="font-medium">{{ filteredEntreprises.length }}</span>
                résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="currentPage > 1 && (currentPage--)"
                  :disabled="currentPage <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span
                  v-for="page in visiblePages"
                  :key="page"
                  @click="page !== '...' && (currentPage = page as number)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer',
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : page === '...'
                        ? 'border-gray-300 bg-white text-gray-700 cursor-default'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </span>
                <button
                  @click="currentPage < totalPages && (currentPage++)"
                  :disabled="currentPage >= totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <EntrepriseModal
      :show="showCreateModal || showEditModal"
      :entreprise="editingEntreprise"
      @close="closeModal"
      @submit="submitEntreprise"
    />

    <!-- Modal de confirmation de suppression -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Supprimer l'entreprise"
      :message="`Êtes-vous sûr de vouloir supprimer l'entreprise '${entrepriseToDelete?.nom}' ? Cette action est irréversible et supprimera aussi tous ses groupes et messages.`"
      confirm-text="Supprimer définitivement"
      confirm-class="btn-danger"
      type="danger"
      :loading="submitting"
      @confirm="deleteEntreprise"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore, useEntreprisesStore } from '../stores'
import type { Entreprise } from '../services/api'
import EntrepriseModal from './EntrepriseModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import EntrepriseCard from './EntrepriseCard.vue'

const router = useRouter()
const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()

const { entreprises } = storeToRefs(entreprisesStore)

// État local
const loading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('nom')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingEntreprise = ref<Entreprise | null>(null)
const entrepriseToDelete = ref<Entreprise | null>(null)

// Computed
const entreprisesActives = computed(() => 
  entreprises.value.filter(e => e.est_active)
)

const entreprisesInactives = computed(() => 
  entreprises.value.filter(e => !e.est_active)
)

const entreprisesRecentes = computed(() => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  return entreprises.value.filter(e => 
    new Date(e.date_creation) > sevenDaysAgo
  )
})

const filteredEntreprises = computed(() => {
  let result = [...entreprises.value]
  
  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.nom.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query))
    )
  }
  
  // Filtrage par statut
  if (statusFilter.value) {
    if (statusFilter.value === 'active') {
      result = result.filter(e => e.est_active)
    } else if (statusFilter.value === 'inactive') {
      result = result.filter(e => !e.est_active)
    }
  }
  
  // Tri
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'nom':
        return a.nom.localeCompare(b.nom)
      case 'date_creation':
        return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
      case 'groupes_count':
        return (b.groupes_possedes_count || 0) - (a.groupes_possedes_count || 0)
      default:
        return 0
    }
  })
  
  return result
})

const totalPages = computed(() => 
  Math.ceil(filteredEntreprises.value.length / itemsPerPage.value)
)

const paginatedEntreprises = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEntreprises.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingEntreprise.value = null
}

const editEntreprise = (entreprise: Entreprise) => {
  editingEntreprise.value = entreprise
  showEditModal.value = true
}

const confirmDelete = (entreprise: Entreprise) => {
  entrepriseToDelete.value = entreprise
  showDeleteModal.value = true
}

const viewEntreprise = (entreprise: Entreprise) => {
  router.push(`/entreprises/${entreprise.id}`)
}

const submitEntreprise = async (entrepriseData: any) => {
  try {
    submitting.value = true
    
    if (showEditModal.value && editingEntreprise.value) {
      await entreprisesStore.updateEntreprise(editingEntreprise.value.id, entrepriseData)
    } else {
      await entreprisesStore.createEntreprise(entrepriseData)
    }
    
    closeModal()
    appStore.setError(null)
  } catch (error: any) {
    console.error('Erreur lors de la soumission:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de l\'opération')
  } finally {
    submitting.value = false
  }
}

const deleteEntreprise = async () => {
  if (!entrepriseToDelete.value) return
  
  try {
    submitting.value = true
    await entreprisesStore.deleteEntreprise(entrepriseToDelete.value.id)
    showDeleteModal.value = false
    entrepriseToDelete.value = null
    appStore.setError(null)
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    appStore.setError(error.response?.data?.message || 'Erreur lors de la suppression')
  } finally {
    submitting.value = false
  }
}

const loadData = async () => {
  try {
    loading.value = true
    await entreprisesStore.loadEntreprises()
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    appStore.setError('Erreur lors du chargement des entreprises')
  } finally {
    loading.value = false
  }
}

// Réinitialiser la pagination quand les filtres changent
import { watch } from 'vue'
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  await loadData()
})
</script>