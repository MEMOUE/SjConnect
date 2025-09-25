<template>
  <div class="entreprises-container p-4">
    <!-- En-tête -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold text-900 m-0">Entreprises</h2>
        <p class="text-600 mt-1 mb-0">Découvrez et gérez les entreprises du réseau</p>
      </div>
      <div class="flex gap-2">
        <Button
          @click="refreshData"
          icon="pi pi-refresh"
          outlined
          v-tooltip="'Actualiser'"
        />
        <Button
          v-if="currentEntreprise && canCreateEmploye"
          @click="showEmployeModal = true"
          label="Créer un employé"
          icon="pi pi-user-plus"
        />
      </div>
    </div>

    <!-- Filtres et recherche -->
    <Card class="mb-4">
      <template #content>
        <div class="grid">
          <div class="col-12 md:col-6">
            <InputGroup>
              <InputGroupAddon>
                <i class="pi pi-search"></i>
              </InputGroupAddon>
              <InputText
                v-model="searchQuery"
                placeholder="Rechercher une entreprise..."
              />
            </InputGroup>
          </div>
          <div class="col-12 md:col-3">
            <Dropdown
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Trier par..."
              class="w-full"
            />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown
              v-model="viewMode"
              :options="viewModeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Statistiques -->
    <div class="grid mb-4">
      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card text-center">
          <template #content>
            <div class="flex align-items-center justify-content-center mb-3">
              <div class="bg-blue-100 p-3 border-round-lg">
                <i class="pi pi-building text-blue-500 text-2xl"></i>
              </div>
            </div>
            <div class="text-2xl font-bold text-blue-600 mb-1">{{ entreprises.length }}</div>
            <div class="text-600">Entreprises totales</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card text-center">
          <template #content>
            <div class="flex align-items-center justify-content-center mb-3">
              <div class="bg-green-100 p-3 border-round-lg">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
            </div>
            <div class="text-2xl font-bold text-green-600 mb-1">{{ activeEntreprises.length }}</div>
            <div class="text-600">Entreprises actives</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card text-center">
          <template #content>
            <div class="flex align-items-center justify-content-center mb-3">
              <div class="bg-purple-100 p-3 border-round-lg">
                <i class="pi pi-users text-purple-500 text-2xl"></i>
              </div>
            </div>
            <div class="text-2xl font-bold text-purple-600 mb-1">{{ totalGroupes }}</div>
            <div class="text-600">Groupes créés</div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card text-center">
          <template #content>
            <div class="flex align-items-center justify-content-center mb-3">
              <div class="bg-orange-100 p-3 border-round-lg">
                <i class="pi pi-calendar text-orange-500 text-2xl"></i>
              </div>
            </div>
            <div class="text-2xl font-bold text-orange-600 mb-1">{{ recentEntreprises.length }}</div>
            <div class="text-600">Nouvelles (30j)</div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Liste ou grille des entreprises -->
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Entreprises ({{ filteredEntreprises.length }})</span>
        </div>
      </template>

      <template #content>
        <div v-if="loading" class="text-center py-6">
          <ProgressSpinner />
          <p class="mt-2 text-600">Chargement des entreprises...</p>
        </div>

        <div v-else-if="filteredEntreprises.length === 0" class="text-center py-8">
          <i class="pi pi-building text-6xl text-400 mb-4"></i>
          <h4 class="text-900 mb-2">Aucune entreprise trouvée</h4>
          <p class="text-600 mb-0">
            {{ searchQuery ? 'Aucune entreprise ne correspond à votre recherche.' : 'Aucune entreprise disponible.' }}
          </p>
        </div>

        <!-- Vue en grille -->
        <div v-else-if="viewMode === 'grid'" class="grid">
          <div 
            v-for="entreprise in filteredEntreprises" 
            :key="entreprise.id"
            class="col-12 md:col-6 lg:col-4"
          >
            <Card class="entreprise-card hover-card cursor-pointer h-full" @click="viewEntreprise(entreprise)">
              <template #header>
                <div class="flex justify-content-center pt-4">
                  <Avatar
                    :label="entreprise.nom.charAt(0)"
                    size="xlarge"
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  />
                </div>
              </template>
              
              <template #title>
                <div class="text-center">
                  <h4 class="text-lg font-semibold text-900 m-0 mb-1">{{ entreprise.nom }}</h4>
                  <p class="text-sm text-600 m-0">{{ entreprise.email }}</p>
                </div>
              </template>
              
              <template #content>
                <div class="text-center">
                  <div v-if="entreprise.description" class="mb-3">
                    <p class="text-sm text-700 line-height-3">
                      {{ truncateText(entreprise.description, 100) }}
                    </p>
                  </div>
                  
                  <div class="flex align-items-center justify-content-center gap-4 mb-3">
                    <div class="text-center">
                      <div class="text-lg font-bold text-primary">{{ entreprise.groupes_possedes_count }}</div>
                      <div class="text-xs text-600">Groupes</div>
                    </div>
                    <Divider layout="vertical" />
                    <div class="text-center">
                      <Tag
                        :value="entreprise.est_active ? 'Active' : 'Inactive'"
                        :severity="entreprise.est_active ? 'success' : 'danger'"
                      />
                    </div>
                  </div>
                  
                  <div class="text-xs text-500">
                    Créée le {{ formatDate(entreprise.date_creation) }}
                  </div>
                </div>
              </template>
              
              <template #footer>
                <div class="flex gap-2">
                  <Button
                    @click.stop="viewEntreprise(entreprise)"
                    label="Voir détails"
                    icon="pi pi-eye"
                    outlined
                    size="small"
                    class="flex-1"
                  />
                  <Button
                    v-if="currentEntreprise && canContactEntreprise(entreprise)"
                    @click.stop="contactEntreprise(entreprise)"
                    icon="pi pi-send"
                    outlined
                    size="small"
                    v-tooltip="'Envoyer un message'"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Vue en liste -->
        <div v-else class="flex flex-column gap-3">
          <Card
            v-for="entreprise in filteredEntreprises"
            :key="entreprise.id"
            class="entreprise-card hover-card cursor-pointer"
            @click="viewEntreprise(entreprise)"
          >
            <template #content>
              <div class="flex align-items-center justify-content-between p-3">
                <div class="flex align-items-center">
                  <Avatar
                    :label="entreprise.nom.charAt(0)"
                    size="large"
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    class="mr-4"
                  />
                  
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold text-900 m-0 mb-1">{{ entreprise.nom }}</h4>
                    <p class="text-sm text-600 m-0 mb-2">{{ entreprise.email }}</p>
                    
                    <div v-if="entreprise.description" class="mb-2">
                      <p class="text-sm text-700 m-0">
                        {{ truncateText(entreprise.description, 150) }}
                      </p>
                    </div>
                    
                    <div class="flex align-items-center gap-4">
                      <div class="flex align-items-center text-sm text-600">
                        <i class="pi pi-users mr-1"></i>
                        {{ entreprise.groupes_possedes_count }} groupes
                      </div>
                      
                      <div class="flex align-items-center text-sm text-600">
                        <i class="pi pi-calendar mr-1"></i>
                        {{ formatDate(entreprise.date_creation) }}
                      </div>
                      
                      <Tag
                        :value="entreprise.est_active ? 'Active' : 'Inactive'"
                        :severity="entreprise.est_active ? 'success' : 'danger'"
                      />
                    </div>
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="flex align-items-center gap-2">
                  <Button
                    @click.stop="viewEntreprise(entreprise)"
                    icon="pi pi-eye"
                    text
                    rounded
                    severity="secondary"
                    v-tooltip="'Voir détails'"
                  />
                  <Button
                    v-if="currentEntreprise && canContactEntreprise(entreprise)"
                    @click.stop="contactEntreprise(entreprise)"
                    icon="pi pi-send"
                    text
                    rounded
                    severity="primary"
                    v-tooltip="'Envoyer un message'"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </template>
    </Card>

    <!-- Modal de création d'employé -->
    <Dialog 
      v-model:visible="showEmployeModal" 
      :modal="true" 
      header="Créer un compte employé"
      class="w-full max-w-2xl"
    >
      <CreateEmployeForm
        @created="onEmployeCreated"
        @close="showEmployeModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppStore, useEntreprisesStore } from '../../stores'
import type { Entreprise } from '../../services/api'

const router = useRouter()
const toast = useToast()

const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { entreprises } = storeToRefs(entreprisesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('nom')
const viewMode = ref('grid')
const showEmployeModal = ref(false)

// Options pour les dropdowns
const sortOptions = [
  { label: 'Nom (A-Z)', value: 'nom' },
  { label: 'Date de création', value: 'date_creation' },
  { label: 'Nombre de groupes', value: 'groupes_possedes_count' }
]

const viewModeOptions = [
  { label: 'Grille', value: 'grid' },
  { label: 'Liste', value: 'list' }
]

// Computed
const filteredEntreprises = computed(() => {
  let filtered = entreprises.value.filter(entreprise =>
    entreprise.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    entreprise.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (entreprise.description && entreprise.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )

  // Tri
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'nom':
        return a.nom.localeCompare(b.nom)
      case 'date_creation':
        return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
      case 'groupes_possedes_count':
        return b.groupes_possedes_count - a.groupes_possedes_count
      default:
        return 0
    }
  })

  return filtered
})

const activeEntreprises = computed(() => 
  entreprises.value.filter(e => e.est_active)
)

const recentEntreprises = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return entreprises.value.filter(e => 
    new Date(e.date_creation) > thirtyDaysAgo
  )
})

const totalGroupes = computed(() => 
  entreprises.value.reduce((total, e) => total + e.groupes_possedes_count, 0)
)

const canCreateEmploye = computed(() => {
  // Logique pour vérifier si l'utilisateur peut créer des employés
  // Dépend du rôle de l'utilisateur dans l'entreprise
  return true // Simplifié pour la démo
})

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const canContactEntreprise = (entreprise: Entreprise): boolean => {
  return currentEntreprise.value?.id !== entreprise.id
}

const viewEntreprise = (entreprise: Entreprise) => {
  router.push(`/entreprises/${entreprise.id}`)
}

const contactEntreprise = (entreprise: Entreprise) => {
  // Logique pour contacter une entreprise
  router.push('/messages') // Simplifié
}

const refreshData = async () => {
  try {
    loading.value = true
    await entreprisesStore.loadEntreprises()
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Données actualisées',
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const onEmployeCreated = () => {
  showEmployeModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Employé créé avec succès',
    life: 3000
  })
}

// Lifecycle
onMounted(async () => {
  if (entreprises.value.length === 0) {
    try {
      loading.value = true
      await entreprisesStore.loadEntreprises()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors du chargement des entreprises',
        life: 5000
      })
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
.entreprises-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-card {
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
}

.entreprise-card {
  transition: all 0.2s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
</style>