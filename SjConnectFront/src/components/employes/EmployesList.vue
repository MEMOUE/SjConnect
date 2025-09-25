<template>
  <div class="employes-container p-4">
    <!-- En-tête -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold text-900 m-0">Gestion des employés</h2>
        <p class="text-600 mt-1 mb-0">Gérez les comptes employés de votre entreprise</p>
      </div>
      <div class="flex gap-2">
        <Button
          @click="refreshData"
          icon="pi pi-refresh"
          outlined
          v-tooltip="'Actualiser'"
        />
        <Button
          v-if="canCreateEmploye"
          @click="showCreateModal = true"
          label="Nouvel employé"
          icon="pi pi-plus"
        />
      </div>
    </div>

    <!-- Message si aucune entreprise sélectionnée -->
    <Message 
      v-if="!currentEntreprise" 
      severity="warn" 
      class="mb-4"
    >
      <template #icon>
        <i class="pi pi-exclamation-triangle"></i>
      </template>
      <div>
        <h5 class="m-0">Sélectionnez une entreprise</h5>
        <p class="m-0 mt-1">Vous devez sélectionner une entreprise pour gérer les employés.</p>
      </div>
    </Message>

    <div v-if="currentEntreprise">
      <!-- Filtres et recherche -->
      <Card class="mb-4">
        <template #content>
          <div class="grid">
            <div class="col-12 md:col-4">
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search"></i>
                </InputGroupAddon>
                <InputText
                  v-model="searchQuery"
                  placeholder="Rechercher un employé..."
                />
              </InputGroup>
            </div>
            <div class="col-12 md:col-3">
              <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous les statuts"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-3">
              <Dropdown
                v-model="roleFilter"
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous les rôles"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-2">
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
                  <i class="pi pi-users text-blue-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-blue-600 mb-1">{{ employes.length }}</div>
              <div class="text-600">Total employés</div>
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
              <div class="text-2xl font-bold text-green-600 mb-1">{{ activeEmployes.length }}</div>
              <div class="text-600">Actifs</div>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-purple-100 p-3 border-round-lg">
                  <i class="pi pi-wifi text-purple-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-purple-600 mb-1">{{ onlineEmployes.length }}</div>
              <div class="text-600">En ligne</div>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-orange-100 p-3 border-round-lg">
                  <i class="pi pi-user-plus text-orange-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-orange-600 mb-1">{{ recentEmployes.length }}</div>
              <div class="text-600">Nouveaux (30j)</div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Liste des employés -->
      <Card>
        <template #title>
          <div class="flex justify-content-between align-items-center">
            <span>Employés ({{ filteredEmployes.length }})</span>
            <div class="flex align-items-center gap-2">
              <span class="text-sm text-600">Vue:</span>
              <SelectButton 
                v-model="viewMode" 
                :options="viewModeOptions" 
                optionLabel="icon" 
                optionValue="value"
              >
                <template #option="slotProps">
                  <i :class="slotProps.option.icon"></i>
                </template>
              </SelectButton>
            </div>
          </div>
        </template>

        <template #content>
          <div v-if="loading" class="text-center py-6">
            <ProgressSpinner />
            <p class="mt-2 text-600">Chargement des employés...</p>
          </div>

          <div v-else-if="filteredEmployes.length === 0" class="text-center py-8">
            <i class="pi pi-users text-6xl text-400 mb-4"></i>
            <h4 class="text-900 mb-2">Aucun employé trouvé</h4>
            <p class="text-600 mb-4">
              {{ searchQuery ? 'Aucun employé ne correspond à votre recherche.' : 'Aucun employé dans cette entreprise.' }}
            </p>
            <Button
              v-if="canCreateEmploye && !searchQuery"
              @click="showCreateModal = true"
              label="Créer le premier employé"
              icon="pi pi-plus"
            />
          </div>

          <!-- Vue en grille -->
          <div v-else-if="viewMode === 'grid'" class="grid">
            <div 
              v-for="employe in filteredEmployes" 
              :key="employe.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <EmployeCard
                :employe="employe"
                :can-edit="canEditEmploye(employe)"
                :can-delete="canDeleteEmploye(employe)"
                :can-message="canMessageEmploye(employe)"
                @view="viewEmploye"
                @edit="editEmploye"
                @delete="confirmDeleteEmploye"
                @message="messageEmploye"
              />
            </div>
          </div>

          <!-- Vue en liste -->
          <div v-else-if="viewMode === 'list'">
            <DataTable 
              :value="filteredEmployes" 
              :paginator="true" 
              :rows="10"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} employés"
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="avatar" header="" style="width: 60px">
                <template #body="slotProps">
                  <Avatar 
                    :label="getEmployeInitials(slotProps.data)"
                    size="normal"
                    :style="`background: ${getAvatarColor(slotProps.data.username)}`"
                  />
                </template>
              </Column>
              
              <Column field="name" header="Nom" sortable>
                <template #body="slotProps">
                  <div>
                    <div class="font-semibold">{{ getFullName(slotProps.data) }}</div>
                    <div class="text-sm text-600">{{ slotProps.data.username }}</div>
                  </div>
                </template>
              </Column>
              
              <Column field="email" header="Email" sortable>
                <template #body="slotProps">
                  <span class="text-sm">{{ slotProps.data.email }}</span>
                </template>
              </Column>
              
              <Column field="poste" header="Poste" sortable>
                <template #body="slotProps">
                  <span class="text-sm">{{ slotProps.data.poste || '-' }}</span>
                </template>
              </Column>
              
              <Column field="role" header="Rôle">
                <template #body="slotProps">
                  <Chip 
                    v-if="slotProps.data.role"
                    :label="getRoleLabel(slotProps.data.role)"
                    :class="getRoleClass(slotProps.data.role)"
                    class="text-xs"
                  />
                </template>
              </Column>
              
              <Column field="status" header="Statut">
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <div :class="['status-dot mr-2', slotProps.data.is_active ? 'active' : 'inactive']"></div>
                    <Tag 
                      :value="slotProps.data.is_active ? 'Actif' : 'Inactif'"
                      :severity="slotProps.data.is_active ? 'success' : 'danger'"
                      class="text-xs"
                    />
                  </div>
                </template>
              </Column>
              
              <Column field="last_login" header="Dernière visite" sortable>
                <template #body="slotProps">
                  <span class="text-xs">
                    {{ slotProps.data.last_login ? formatLastLogin(slotProps.data.last_login) : 'Jamais' }}
                  </span>
                </template>
              </Column>
              
              <Column field="actions" header="Actions" style="width: 150px">
                <template #body="slotProps">
                  <div class="flex gap-1">
                    <Button
                      @click="viewEmploye(slotProps.data)"
                      icon="pi pi-eye"
                      text
                      rounded
                      size="small"
                      v-tooltip="'Voir'"
                    />
                    <Button
                      v-if="canEditEmploye(slotProps.data)"
                      @click="editEmploye(slotProps.data)"
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      severity="secondary"
                      v-tooltip="'Modifier'"
                    />
                    <Button
                      v-if="canMessageEmploye(slotProps.data)"
                      @click="messageEmploye(slotProps.data)"
                      icon="pi pi-send"
                      text
                      rounded
                      size="small"
                      severity="info"
                      v-tooltip="'Message'"
                    />
                    <Button
                      v-if="canDeleteEmploye(slotProps.data)"
                      @click="confirmDeleteEmploye(slotProps.data)"
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      v-tooltip="'Supprimer'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>

    <!-- Modal de création d'employé -->
    <Dialog 
      v-model:visible="showCreateModal" 
      :modal="true" 
      header="Créer un compte employé"
      class="w-full max-w-2xl"
    >
      <CreateEmployeForm
        @created="onEmployeCreated"
        @close="showCreateModal = false"
      />
    </Dialog>

    <!-- Modal d'édition d'employé -->
    <Dialog 
      v-model:visible="showEditModal" 
      :modal="true" 
      header="Modifier l'employé"
      class="w-full max-w-2xl"
    >
      <EmployeEditForm
        v-if="selectedEmploye"
        :employe="selectedEmploye"
        @updated="onEmployeUpdated"
        @close="showEditModal = false"
      />
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAppStore } from '../../stores'
import EmployeCard from './EmployeCard.vue'
import CreateEmployeForm from './CreateEmployeModal.vue'
import SelectButton from 'primevue/selectbutton'

// Import des composants manquants (à créer)
// import EmployeEditForm from './EmployeEditForm.vue'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const appStore = useAppStore()
const { currentEntreprise } = storeToRefs(appStore)

// Interface pour un employé
interface Employe {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  poste?: string
  role?: string
  is_active: boolean
  is_admin: boolean
  is_online?: boolean
  date_joined: string
  last_login?: string
  competences?: string[]
  groupes_count?: number
  messages_count?: number
}

// État local
const loading = ref(false)
const employes = ref<Employe[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const viewMode = ref('grid')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedEmploye = ref<Employe | null>(null)

// Options pour les filtres
const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' }
]

const roleOptions = [
  { label: 'Tous les rôles', value: '' },
  { label: 'Administrateurs', value: 'admin' },
  { label: 'Managers', value: 'manager' },
  { label: 'Employés', value: 'employee' }
]

const viewModeOptions = [
  { label: 'Grille', value: 'grid', icon: 'pi pi-th-large' },
  { label: 'Liste', value: 'list', icon: 'pi pi-list' }
]

// Computed
const canCreateEmploye = computed(() => {
  // Logique pour vérifier si l'utilisateur peut créer des employés
  return true // Simplifié pour la démo
})

const filteredEmployes = computed(() => {
  return employes.value.filter(employe => {
    const matchesSearch = 
      employe.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      employe.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      `${employe.first_name} ${employe.last_name}`.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (employe.poste || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = 
      statusFilter.value === '' ||
      (statusFilter.value === 'active' && employe.is_active) ||
      (statusFilter.value === 'inactive' && !employe.is_active)
    
    const matchesRole = 
      roleFilter.value === '' ||
      employe.role === roleFilter.value
    
    return matchesSearch && matchesStatus && matchesRole
  })
})

const activeEmployes = computed(() => 
  employes.value.filter(e => e.is_active)
)

const onlineEmployes = computed(() => 
  employes.value.filter(e => e.is_online)
)

const recentEmployes = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return employes.value.filter(e => 
    new Date(e.date_joined) > thirtyDaysAgo
  )
})

// Méthodes
const getEmployeInitials = (employe: Employe): string => {
  if (employe.first_name || employe.last_name) {
    const first = employe.first_name?.charAt(0) || ''
    const last = employe.last_name?.charAt(0) || ''
    return (first + last).toUpperCase()
  }
  return employe.username.charAt(0).toUpperCase()
}

const getFullName = (employe: Employe): string => {
  if (employe.first_name || employe.last_name) {
    return `${employe.first_name || ''} ${employe.last_name || ''}`.trim()
  }
  return employe.username
}

const getAvatarColor = (username: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'admin': 'Admin',
    'manager': 'Manager', 
    'employee': 'Employé'
  }
  return labels[role] || role
}

const getRoleClass = (role: string): string => {
  const classes: Record<string, string> = {
    'admin': 'bg-red-100 text-red-700',
    'manager': 'bg-blue-100 text-blue-700',
    'employee': 'bg-green-100 text-green-700'
  }
  return classes[role] || 'bg-gray-100 text-gray-700'
}

const formatLastLogin = (lastLogin: string): string => {
  const date = new Date(lastLogin)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return "Aujourd'hui"
  } else if (diffDays === 2) {
    return "Hier"
  } else if (diffDays <= 30) {
    return `Il y a ${diffDays - 1} jours`
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

const canEditEmploye = (employe: Employe): boolean => {
  // Logique pour vérifier si on peut modifier cet employé
  return !employe.is_admin || employe.id === 1 // Exemple
}

const canDeleteEmploye = (employe: Employe): boolean => {
  // Logique pour vérifier si on peut supprimer cet employé
  return !employe.is_admin && employes.value.length > 1
}

const canMessageEmploye = (employe: Employe): boolean => {
  return employe.is_active
}

const viewEmploye = (employe: Employe) => {
  router.push(`/employes/${employe.id}`)
}

const editEmploye = (employe: Employe) => {
  selectedEmploye.value = employe
  showEditModal.value = true
}

const confirmDeleteEmploye = (employe: Employe) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le compte de ${getFullName(employe)} ? Cette action est irréversible.`,
    header: 'Supprimer l\'employé',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => deleteEmploye(employe)
  })
}

const deleteEmploye = async (employe: Employe) => {
  try {
    // Logique de suppression API ici
    employes.value = employes.value.filter(e => e.id !== employe.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Employé supprimé avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la suppression',
      life: 5000
    })
  }
}

const messageEmploye = (employe: Employe) => {
  router.push(`/messages?user=${employe.id}`)
}

const refreshData = async () => {
  await loadEmployes()
  toast.add({
    severity: 'success',
    summary: 'Données actualisées',
    life: 2000
  })
}

const onEmployeCreated = () => {
  showCreateModal.value = false
  loadEmployes()
  toast.add({
    severity: 'success',
    summary: 'Employé créé avec succès',
    life: 3000
  })
}

const onEmployeUpdated = () => {
  showEditModal.value = false
  selectedEmploye.value = null
  loadEmployes()
  toast.add({
    severity: 'success',
    summary: 'Employé modifié avec succès',
    life: 3000
  })
}

const loadEmployes = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    // Simulation de données d'employés
    employes.value = [
      {
        id: 1,
        username: 'john.doe',
        email: 'john.doe@entreprise.com',
        first_name: 'John',
        last_name: 'Doe',
        poste: 'Développeur Senior',
        role: 'admin',
        is_active: true,
        is_admin: true,
        is_online: true,
        date_joined: '2023-01-15T10:00:00Z',
        last_login: '2024-01-20T09:30:00Z',
        competences: ['Vue.js', 'Python', 'Docker'],
        groupes_count: 5,
        messages_count: 124
      },
      {
        id: 2,
        username: 'jane.smith',
        email: 'jane.smith@entreprise.com',
        first_name: 'Jane',
        last_name: 'Smith',
        poste: 'Designer UX/UI',
        role: 'employee',
        is_active: true,
        is_admin: false,
        is_online: false,
        date_joined: '2023-03-22T14:00:00Z',
        last_login: '2024-01-19T16:45:00Z',
        competences: ['Figma', 'Adobe XD', 'Sketch'],
        groupes_count: 3,
        messages_count: 87
      }
    ]
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des employés',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (currentEntreprise.value) {
    await loadEmployes()
  }
})

// Watchers
watch(currentEntreprise, async (newEntreprise) => {
  if (newEntreprise) {
    await loadEmployes()
  }
})
</script>

<style scoped>
.employes-container {
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.active {
    background-color: #10b981;
  }
  
  &.inactive {
    background-color: #6b7280;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .grid .col-12 {
    padding: 0.5rem;
  }
}
</style>