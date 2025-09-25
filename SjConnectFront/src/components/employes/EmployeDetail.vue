<template>
  <div class="employe-detail-container p-4">
    <!-- En-tête avec navigation -->
    <div class="flex align-items-center mb-4">
      <Button
        @click="$router.go(-1)"
        icon="pi pi-chevron-left"
        text
        rounded
        class="mr-3"
        v-tooltip="'Retour'"
      />
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-900 m-0">Détail de l'employé</h2>
        <p class="text-600 mt-1 mb-0">Informations complètes et gestion du compte</p>
      </div>
    </div>

    <!-- Message de chargement -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
      <p class="mt-2 text-600">Chargement des informations...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="mb-4">
      <Message severity="error" :closable="false">
        <template #icon>
          <i class="pi pi-exclamation-triangle"></i>
        </template>
        {{ error }}
      </Message>
    </div>

    <!-- Contenu principal -->
    <div v-else-if="employe" class="grid">
      <!-- Colonne principale -->
      <div class="col-12 lg:col-8">
        <!-- Carte profil principal -->
        <Card class="mb-4">
          <template #content>
            <div class="flex flex-column md:flex-row align-items-center md:align-items-start">
              <!-- Avatar et statut -->
              <div class="text-center mb-4 md:mb-0 md:mr-4">
                <div class="relative inline-block">
                  <Avatar 
                    :label="getEmployeInitials(employe)"
                    size="xlarge"
                    :style="`background: ${getAvatarColor(employe.username)}; color: white`"
                    class="avatar-shadow mb-3"
                  />
                  <div class="absolute" style="bottom: 0.5rem; right: 0;">
                    <Badge 
                      :value="employe.is_online ? 'En ligne' : 'Hors ligne'"
                      :severity="employe.is_online ? 'success' : 'secondary'"
                    />
                  </div>
                </div>
                <div class="flex justify-content-center">
                  <Tag
                    :value="employe.is_active ? 'Actif' : 'Inactif'"
                    :severity="employe.is_active ? 'success' : 'danger'"
                  />
                </div>
              </div>

              <!-- Informations principales -->
              <div class="flex-1 text-center md:text-left">
                <h1 class="text-2xl font-bold text-900 m-0 mb-2">{{ getFullName(employe) }}</h1>
                <div class="flex flex-column gap-2 mb-4">
                  <div class="flex align-items-center justify-content-center md:justify-content-start">
                    <i class="pi pi-at text-500 mr-2"></i>
                    <span class="text-600">{{ employe.username }}</span>
                  </div>
                  <div class="flex align-items-center justify-content-center md:justify-content-start">
                    <i class="pi pi-envelope text-500 mr-2"></i>
                    <span class="text-600">{{ employe.email }}</span>
                  </div>
                  <div v-if="employe.poste" class="flex align-items-center justify-content-center md:justify-content-start">
                    <i class="pi pi-briefcase text-500 mr-2"></i>
                    <span class="text-600">{{ employe.poste }}</span>
                  </div>
                </div>

                <!-- Rôle et permissions -->
                <div v-if="employe.role" class="mb-4">
                  <Chip 
                    :label="getRoleLabel(employe.role)"
                    :class="getRoleClass(employe.role)"
                    icon="pi pi-shield"
                  />
                </div>

                <!-- Actions rapides -->
                <div class="flex flex-wrap justify-content-center md:justify-content-start gap-2">
                  <Button
                    @click="sendMessage"
                    label="Envoyer un message"
                    icon="pi pi-send"
                    size="small"
                  />
                  <Button
                    v-if="canEdit"
                    @click="editEmploye"
                    label="Modifier"
                    icon="pi pi-pencil"
                    outlined
                    size="small"
                  />
                  <Button
                    v-if="canManageAccess"
                    @click="manageAccess"
                    label="Gérer l'accès"
                    icon="pi pi-cog"
                    outlined
                    severity="secondary"
                    size="small"
                  />
                  <Button
                    v-if="canResetPassword"
                    @click="confirmResetPassword"
                    label="Réinitialiser le mot de passe"
                    icon="pi pi-refresh"
                    outlined
                    severity="warning"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Onglets avec informations détaillées -->
        <Card>
          <template #content>
            <TabView>
              <!-- Onglet Informations -->
              <TabPanel header="Informations" leftIcon="pi pi-user">
                <div class="grid">
                  <div class="col-12 md:col-6">
                    <h5 class="text-900 mb-3">Informations personnelles</h5>
                    <div class="flex flex-column gap-3">
                      <div>
                        <label class="font-semibold text-600 block mb-1">Nom complet</label>
                        <p class="text-900 m-0">{{ getFullName(employe) || 'Non renseigné' }}</p>
                      </div>
                      <div>
                        <label class="font-semibold text-600 block mb-1">Nom d'utilisateur</label>
                        <p class="text-900 m-0">{{ employe.username }}</p>
                      </div>
                      <div>
                        <label class="font-semibold text-600 block mb-1">Email</label>
                        <p class="text-900 m-0">{{ employe.email }}</p>
                      </div>
                      <div v-if="employe.poste">
                        <label class="font-semibold text-600 block mb-1">Poste</label>
                        <p class="text-900 m-0">{{ employe.poste }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 md:col-6">
                    <h5 class="text-900 mb-3">Informations système</h5>
                    <div class="flex flex-column gap-3">
                      <div>
                        <label class="font-semibold text-600 block mb-1">Rôle</label>
                        <Chip 
                          :label="getRoleLabel(employe.role)"
                          :class="getRoleClass(employe.role)"
                          class="text-xs"
                        />
                      </div>
                      <div>
                        <label class="font-semibold text-600 block mb-1">Date d'inscription</label>
                        <p class="text-900 m-0">{{ formatDate(employe.date_joined) }}</p>
                      </div>
                      <div v-if="employe.last_login">
                        <label class="font-semibold text-600 block mb-1">Dernière connexion</label>
                        <p class="text-900 m-0">{{ formatDateTime(employe.last_login) }}</p>
                      </div>
                      <div>
                        <label class="font-semibold text-600 block mb-1">Statut du compte</label>
                        <div class="flex align-items-center">
                          <div :class="['status-indicator mr-2', employe.is_active ? 'active' : 'inactive']"></div>
                          <span :class="employe.is_active ? 'text-green-600' : 'text-red-600'">
                            {{ employe.is_active ? 'Compte actif' : 'Compte désactivé' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <!-- Onglet Activité -->
              <TabPanel header="Activité" leftIcon="pi pi-chart-line">
                <!-- Statistiques -->
                <div class="grid mb-4">
                  <div class="col-12 md:col-3">
                    <div class="text-center p-3 border-round bg-blue-50">
                      <div class="text-2xl font-bold text-blue-600 mb-1">{{ stats.groupes_count }}</div>
                      <div class="text-sm text-600">Groupes</div>
                    </div>
                  </div>
                  <div class="col-12 md:col-3">
                    <div class="text-center p-3 border-round bg-green-50">
                      <div class="text-2xl font-bold text-green-600 mb-1">{{ stats.messages_count }}</div>
                      <div class="text-sm text-600">Messages</div>
                    </div>
                  </div>
                  <div class="col-12 md:col-3">
                    <div class="text-center p-3 border-round bg-purple-50">
                      <div class="text-2xl font-bold text-purple-600 mb-1">{{ stats.conversations_count }}</div>
                      <div class="text-sm text-600">Conversations</div>
                    </div>
                  </div>
                  <div class="col-12 md:col-3">
                    <div class="text-center p-3 border-round bg-orange-50">
                      <div class="text-2xl font-bold text-orange-600 mb-1">{{ stats.connexions_count }}</div>
                      <div class="text-sm text-600">Connexions</div>
                    </div>
                  </div>
                </div>

                <!-- Activité récente -->
                <h5 class="text-900 mb-3">Activité récente</h5>
                <div v-if="recentActivity.length === 0" class="text-center py-6">
                  <i class="pi pi-info-circle text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucune activité récente</p>
                </div>
                <div v-else class="flex flex-column gap-3">
                  <div 
                    v-for="activity in recentActivity" 
                    :key="activity.id"
                    class="flex align-items-start p-3 border-round surface-ground"
                  >
                    <Avatar 
                      :icon="getActivityIcon(activity.type)"
                      :style="`background: ${getActivityColor(activity.type)}`"
                      size="normal"
                      class="mr-3"
                    />
                    <div class="flex-1">
                      <p class="font-medium text-900 m-0 mb-1">{{ activity.title }}</p>
                      <p class="text-sm text-600 m-0 mb-1">{{ activity.description }}</p>
                      <p class="text-xs text-500 m-0">{{ formatRelativeTime(activity.date) }}</p>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <!-- Onglet Groupes -->
              <TabPanel header="Groupes" leftIcon="pi pi-users">
                <div class="flex justify-content-between align-items-center mb-4">
                  <h5 class="text-900 m-0">Groupes de l'employé ({{ employeGroupes.length }})</h5>
                  <Button
                    v-if="canManageAccess"
                    @click="manageGroupAccess"
                    label="Gérer l'accès"
                    icon="pi pi-cog"
                    outlined
                    size="small"
                  />
                </div>

                <div v-if="employeGroupes.length === 0" class="text-center py-6">
                  <i class="pi pi-users text-4xl text-400 mb-3"></i>
                  <p class="text-600">Cet employé ne participe à aucun groupe</p>
                </div>
                <div v-else class="grid">
                  <div 
                    v-for="groupe in employeGroupes" 
                    :key="groupe.id"
                    class="col-12 md:col-6"
                  >
                    <Card class="hover-lift cursor-pointer" @click="viewGroup(groupe)">
                      <template #content>
                        <div class="flex align-items-center p-2">
                          <Avatar 
                            :label="groupe.nom.charAt(0)"
                            size="large"
                            style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            class="mr-3"
                          />
                          <div class="flex-1">
                            <h5 class="font-semibold text-900 m-0 mb-1">{{ groupe.nom }}</h5>
                            <div class="flex align-items-center gap-2">
                              <Tag
                                :value="groupe.est_public ? 'Public' : 'Privé'"
                                :severity="groupe.est_public ? 'success' : 'info'"
                                class="text-xs"
                              />
                              <span class="text-xs text-600">{{ groupe.nombre_membres }} membres</span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="col-12 lg:col-4">
        <!-- Actions rapides -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-bolt mr-2"></i>Actions rapides
          </template>
          <template #content>
            <div class="flex flex-column gap-2">
              <Button
                @click="sendMessage"
                label="Envoyer un message"
                icon="pi pi-send"
                class="w-full"
              />
              <Button
                v-if="canEdit"
                @click="editEmploye"
                label="Modifier le profil"
                icon="pi pi-pencil"
                outlined
                class="w-full"
              />
              <Button
                v-if="canResetPassword"
                @click="confirmResetPassword"
                label="Réinitialiser le mot de passe"
                icon="pi pi-refresh"
                outlined
                severity="warning"
                class="w-full"
              />
              <Button
                v-if="canToggleStatus"
                @click="toggleStatus"
                :label="employe.is_active ? 'Désactiver le compte' : 'Activer le compte'"
                :icon="employe.is_active ? 'pi pi-ban' : 'pi pi-check'"
                outlined
                :severity="employe.is_active ? 'danger' : 'success'"
                class="w-full"
              />
            </div>
          </template>
        </Card>

        <!-- Entreprise -->
        <Card class="mb-4" v-if="employeEntreprise">
          <template #title>
            <i class="pi pi-building mr-2"></i>Entreprise
          </template>
          <template #content>
            <div class="flex align-items-center mb-3">
              <Avatar 
                :label="employeEntreprise.nom.charAt(0)"
                size="large"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                class="mr-3"
              />
              <div>
                <h5 class="font-semibold text-900 m-0 mb-1">{{ employeEntreprise.nom }}</h5>
                <p class="text-sm text-600 m-0">{{ employeEntreprise.email }}</p>
              </div>
            </div>
            <Button
              @click="viewEntreprise"
              label="Voir l'entreprise"
              icon="pi pi-external-link"
              text
              class="w-full"
            />
          </template>
        </Card>

        <!-- Compétences -->
        <Card v-if="employe.competences && employe.competences.length">
          <template #title>
            <i class="pi pi-star mr-2"></i>Compétences
          </template>
          <template #content>
            <div class="flex flex-wrap gap-1">
              <Tag 
                v-for="competence in employe.competences" 
                :key="competence"
                :value="competence"
                severity="info"
                class="text-xs"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Dialog de confirmation de réinitialisation du mot de passe -->
    <ConfirmDialog />

    <!-- Modal d'édition -->
    <Dialog 
      v-model:visible="showEditModal" 
      :modal="true" 
      header="Modifier l'employé"
      class="w-full max-w-2xl"
    >
      <EmployeEditForm
        v-if="employe"
        :employe="employe"
        @updated="onEmployeUpdated"
        @close="showEditModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

// Import des composants manquants (à créer)
// import EmployeEditForm from './EmployeEditForm.vue'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

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
}

// État local
const loading = ref(false)
const error = ref<string | null>(null)
const employe = ref<Employe | null>(null)
const showEditModal = ref(false)

// Données simulées
const stats = ref({
  groupes_count: 5,
  messages_count: 124,
  conversations_count: 8,
  connexions_count: 23
})

const recentActivity = ref([
  {
    id: 1,
    type: 'message',
    title: 'Message envoyé',
    description: 'Nouveau message dans le groupe "Développement Frontend"',
    date: '2024-01-20T10:30:00Z'
  },
  {
    id: 2,
    type: 'group',
    title: 'Rejoint un groupe',
    description: 'A rejoint le groupe "Innovation IT"',
    date: '2024-01-19T16:45:00Z'
  }
])

const employeGroupes = ref([
  { id: 1, nom: 'Développement Frontend', est_public: true, nombre_membres: 12 },
  { id: 2, nom: 'Innovation IT', est_public: false, nombre_membres: 8 }
])

const employeEntreprise = ref({
  id: 1,
  nom: 'TechCorp Solutions',
  email: 'contact@techcorp.com'
})

// Computed
const employeId = computed(() => parseInt(route.params.id as string))

const canEdit = computed(() => {
  // Logique pour vérifier si on peut modifier cet employé
  return true
})

const canManageAccess = computed(() => {
  // Logique pour gérer l'accès
  return true
})

const canResetPassword = computed(() => {
  return employe.value && !employe.value.is_admin
})

const canToggleStatus = computed(() => {
  return employe.value && !employe.value.is_admin
})

// Méthodes similaires à EmployeCard.vue
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
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

const getRoleLabel = (role?: string): string => {
  if (!role) return 'Employé'
  const labels: Record<string, string> = {
    'ADMIN': 'Administrateur',
    'MANAGER': 'Manager',
    'EMPLOYEE': 'Employé'
  }
  return labels[role] || role
}

const getRoleClass = (role?: string): string => {
  if (!role) return 'bg-gray-100 text-gray-700'
  const classes: Record<string, string> = {
    'ADMIN': 'bg-red-100 text-red-700',
    'MANAGER': 'bg-blue-100 text-blue-700',
    'EMPLOYEE': 'bg-green-100 text-green-700'
  }
  return classes[role] || 'bg-gray-100 text-gray-700'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffHours < 24) {
    return `Il y a ${diffHours} heures`
  } else if (diffDays <= 7) {
    return `Il y a ${diffDays} jours`
  } else {
    return formatDate(dateString)
  }
}

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'message': 'pi pi-send',
    'group': 'pi pi-users',
    'profile': 'pi pi-user'
  }
  return icons[type] || 'pi pi-info-circle'
}

const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    'message': '#10b981',
    'group': '#3b82f6',
    'profile': '#8b5cf6'
  }
  return colors[type] || '#6b7280'
}

const sendMessage = () => {
  router.push(`/messages?user=${employe.value?.id}`)
}

const editEmploye = () => {
  showEditModal.value = true
}

const manageAccess = () => {
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité en développement',
    detail: 'La gestion des accès sera bientôt disponible',
    life: 3000
  })
}

const manageGroupAccess = () => {
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité en développement',
    detail: 'La gestion des groupes sera bientôt disponible',
    life: 3000
  })
}

const confirmResetPassword = () => {
  confirm.require({
    message: 'Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet employé ?',
    header: 'Réinitialiser le mot de passe',
    icon: 'pi pi-refresh',
    acceptClass: 'p-button-warning',
    acceptLabel: 'Réinitialiser',
    rejectLabel: 'Annuler',
    accept: resetPassword
  })
}

const resetPassword = () => {
  toast.add({
    severity: 'success',
    summary: 'Mot de passe réinitialisé',
    detail: 'Un nouveau mot de passe temporaire a été envoyé par email',
    life: 5000
  })
}

const toggleStatus = () => {
  if (employe.value) {
    employe.value.is_active = !employe.value.is_active
    toast.add({
      severity: 'success',
      summary: 'Statut modifié',
      detail: `Le compte a été ${employe.value.is_active ? 'activé' : 'désactivé'}`,
      life: 3000
    })
  }
}

const viewGroup = (groupe: any) => {
  router.push(`/groupes/${groupe.id}`)
}

const viewEntreprise = () => {
  router.push(`/entreprises/${employeEntreprise.value.id}`)
}

const onEmployeUpdated = () => {
  showEditModal.value = false
  loadEmploye()
  toast.add({
    severity: 'success',
    summary: 'Employé modifié',
    detail: 'Les informations ont été mises à jour',
    life: 3000
  })
}

const loadEmploye = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Simulation de chargement
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Données simulées
    employe.value = {
      id: employeId.value,
      username: 'john.doe',
      email: 'john.doe@entreprise.com',
      first_name: 'John',
      last_name: 'Doe',
      poste: 'Développeur Senior',
      role: 'EMPLOYEE',
      is_active: true,
      is_admin: false,
      is_online: true,
      date_joined: '2023-01-15T10:00:00Z',
      last_login: '2024-01-20T09:30:00Z',
      competences: ['Vue.js', 'TypeScript', 'Python', 'Docker']
    }
  } catch (err) {
    error.value = 'Impossible de charger les informations de l\'employé'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadEmploye()
})
</script>

<style scoped>
.employe-detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.avatar-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.active {
    background-color: #10b981;
  }
  
  &.inactive {
    background-color: #6b7280;
  }
}

.hover-lift {
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .grid .col-12 {
    padding: 0.5rem;
  }
}
</style>