<template>
  <div class="profile-container p-4">
    <!-- En-tête du profil -->
    <Card class="profile-header mb-4">
      <template #content>
        <div class="relative">
          <!-- Image de couverture -->
          <div class="profile-cover"></div>
          
          <!-- Informations utilisateur -->
          <div class="flex flex-column md:flex-row align-items-center md:align-items-end profile-info">
            <!-- Avatar -->
            <div class="profile-avatar-container">
              <Avatar 
                :label="userInitials"
                size="xlarge"
                :style="`background: ${avatarColor}; color: white`"
                class="profile-avatar"
              />
              <Button
                v-if="isOwnProfile"
                @click="changeAvatar"
                icon="pi pi-camera"
                rounded
                size="small"
                class="avatar-edit-btn"
                v-tooltip="'Changer la photo'"
              />
            </div>
            
            <!-- Informations de base -->
            <div class="flex-1 text-center md:text-left md:ml-4 mt-3 md:mt-0">
              <h1 class="text-2xl font-bold text-900 m-0 mb-1">{{ fullName }}</h1>
              <p class="text-lg text-600 m-0 mb-2">{{ user.username }}</p>
              <div class="flex flex-column md:flex-row align-items-center md:align-items-start gap-3">
                <div v-if="user.poste" class="flex align-items-center">
                  <i class="pi pi-briefcase text-500 mr-2"></i>
                  <span class="text-sm">{{ user.poste }}</span>
                </div>
                <div class="flex align-items-center">
                  <i class="pi pi-envelope text-500 mr-2"></i>
                  <span class="text-sm">{{ user.email }}</span>
                </div>
                <div class="flex align-items-center">
                  <i class="pi pi-calendar text-500 mr-2"></i>
                  <span class="text-sm">Membre depuis {{ formatDate(user.date_joined) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-2 mt-4 md:mt-0">
              <Button
                v-if="isOwnProfile"
                @click="editProfile"
                label="Modifier le profil"
                icon="pi pi-pencil"
                outlined
              />
              <Button
                v-if="isOwnProfile"
                @click="changePassword"
                label="Changer le mot de passe"
                icon="pi pi-lock"
                outlined
                severity="secondary"
              />
              <Button
                v-if="!isOwnProfile"
                @click="sendMessage"
                label="Envoyer un message"
                icon="pi pi-send"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <div class="grid">
      <!-- Colonne principale -->
      <div class="col-12 lg:col-8">
        <!-- Statistiques -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-chart-bar mr-2"></i>Statistiques
          </template>
          <template #content>
            <div class="grid">
              <div class="col-6 md:col-3 text-center">
                <div class="text-2xl font-bold text-blue-600 mb-1">{{ stats.groupes_count }}</div>
                <div class="text-sm text-600">Groupes</div>
              </div>
              <div class="col-6 md:col-3 text-center">
                <div class="text-2xl font-bold text-green-600 mb-1">{{ stats.messages_count }}</div>
                <div class="text-sm text-600">Messages</div>
              </div>
              <div class="col-6 md:col-3 text-center">
                <div class="text-2xl font-bold text-purple-600 mb-1">{{ stats.conversations_count }}</div>
                <div class="text-sm text-600">Conversations</div>
              </div>
              <div class="col-6 md:col-3 text-center">
                <div class="text-2xl font-bold text-orange-600 mb-1">{{ stats.connexions_count }}</div>
                <div class="text-sm text-600">Connexions</div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Activité récente -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-history mr-2"></i>Activité récente
          </template>
          <template #content>
            <div v-if="recentActivity.length === 0" class="text-center py-6">
              <i class="pi pi-info-circle text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune activité récente</p>
            </div>
            <div v-else class="flex flex-column gap-3">
              <div 
                v-for="activity in recentActivity" 
                :key="activity.id"
                class="flex align-items-start p-3 border-round hover:bg-surface-50 transition-colors"
              >
                <Avatar 
                  :icon="getActivityIcon(activity.type)"
                  :style="`background: ${getActivityColor(activity.type)}`"
                  size="normal"
                  class="mr-3"
                />
                <div class="flex-1">
                  <p class="text-sm font-medium text-900 m-0 mb-1">{{ activity.title }}</p>
                  <p class="text-sm text-600 m-0 mb-1">{{ activity.description }}</p>
                  <p class="text-xs text-500 m-0">{{ formatRelativeTime(activity.date) }}</p>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Groupes -->
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span><i class="pi pi-users mr-2"></i>Mes groupes ({{ userGroups.length }})</span>
              <Button
                @click="viewAllGroups"
                label="Voir tous"
                text
                size="small"
                class="p-button-primary"
              />
            </div>
          </template>
          <template #content>
            <div v-if="userGroups.length === 0" class="text-center py-6">
              <i class="pi pi-users text-4xl text-400 mb-3"></i>
              <p class="text-600 mb-3">Vous ne participez à aucun groupe</p>
              <Button
                @click="exploreGroups"
                label="Explorer les groupes"
                icon="pi pi-search"
                outlined
              />
            </div>
            <div v-else class="grid">
              <div 
                v-for="groupe in userGroups.slice(0, 6)" 
                :key="groupe.id"
                class="col-12 md:col-6"
              >
                <div class="group-item p-3 border-round hover:bg-surface-50 transition-colors cursor-pointer" @click="viewGroup(groupe)">
                  <div class="flex align-items-center">
                    <Avatar 
                      :label="groupe.nom.charAt(0)"
                      size="normal"
                      style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      class="mr-3"
                    />
                    <div class="flex-1">
                      <h5 class="text-sm font-semibold text-900 m-0 mb-1">{{ groupe.nom }}</h5>
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
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="col-12 lg:col-4">
        <!-- Informations personnelles -->
        <Card class="mb-4">
          <template #title>
            <i class="pi pi-user mr-2"></i>Informations personnelles
          </template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div>
                <label class="text-sm font-semibold text-600 block mb-1">Nom complet</label>
                <p class="text-900 m-0">{{ fullName || 'Non renseigné' }}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-600 block mb-1">Email</label>
                <p class="text-900 m-0">{{ user.email }}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-600 block mb-1">Nom d'utilisateur</label>
                <p class="text-900 m-0">{{ user.username }}</p>
              </div>
              <div v-if="user.poste">
                <label class="text-sm font-semibold text-600 block mb-1">Poste</label>
                <p class="text-900 m-0">{{ user.poste }}</p>
              </div>
              <div>
                <label class="text-sm font-semibold text-600 block mb-1">Statut</label>
                <div class="flex align-items-center">
                  <div :class="['status-indicator mr-2', user.is_active ? 'online' : 'offline']"></div>
                  <span :class="user.is_active ? 'text-green-600' : 'text-500'">
                    {{ user.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Entreprise -->
        <Card class="mb-4" v-if="userEntreprise">
          <template #title>
            <i class="pi pi-building mr-2"></i>Entreprise
          </template>
          <template #content>
            <div class="flex align-items-center">
              <Avatar 
                :label="userEntreprise.nom.charAt(0)"
                size="large"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                class="mr-3"
              />
              <div>
                <h5 class="text-lg font-semibold text-900 m-0 mb-1">{{ userEntreprise.nom }}</h5>
                <p class="text-sm text-600 m-0">{{ userEntreprise.email }}</p>
              </div>
            </div>
            <Button
              @click="viewEntreprise"
              label="Voir l'entreprise"
              icon="pi pi-external-link"
              text
              class="w-full mt-3 p-button-primary"
            />
          </template>
        </Card>

        <!-- Compétences -->
        <Card v-if="user.competences && user.competences.length">
          <template #title>
            <i class="pi pi-star mr-2"></i>Compétences
          </template>
          <template #content>
            <div class="flex flex-wrap gap-1">
              <Tag 
                v-for="competence in user.competences" 
                :key="competence"
                :value="competence"
                severity="info"
                class="text-xs"
              />
            </div>
            <Button
              v-if="isOwnProfile"
              @click="editCompetences"
              label="Modifier les compétences"
              text
              class="w-full mt-3 p-button-primary"
              size="small"
            />
          </template>
        </Card>
      </div>
    </div>

    <!-- Modal d'édition du profil -->
    <Dialog 
      v-model:visible="showEditModal" 
      :modal="true" 
      header="Modifier le profil"
      class="w-full max-w-2xl"
    >
      <ProfileEditForm
        v-if="user"
        :user="user"
        @updated="onProfileUpdated"
        @close="showEditModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useToast } from 'primevue/usetoast'

// Import des composants manquants (à créer)
// import ProfileEditForm from './ProfileEditForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Interface utilisateur étendue
interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  poste?: string
  role?: string
  is_active: boolean
  is_admin: boolean
  date_joined: string
  last_login?: string
  competences?: string[]
}

// État local
const showEditModal = ref(false)

// Données simulées
const user = ref<User>({
  id: 1,
  username: 'john.doe',
  email: 'john.doe@entreprise.com',
  first_name: 'John',
  last_name: 'Doe',
  poste: 'Développeur Senior',
  role: 'admin',
  is_active: true,
  is_admin: true,
  date_joined: '2023-01-15T10:00:00Z',
  last_login: '2024-01-20T09:30:00Z',
  competences: ['Vue.js', 'TypeScript', 'Python', 'Docker', 'AWS', 'PostgreSQL']
})

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
  },
  {
    id: 3,
    type: 'profile',
    title: 'Profil mis à jour',
    description: 'Compétences et poste mis à jour',
    date: '2024-01-18T14:20:00Z'
  }
])

const userGroups = ref([
  { id: 1, nom: 'Développement Frontend', est_public: true, nombre_membres: 12 },
  { id: 2, nom: 'Innovation IT', est_public: false, nombre_membres: 8 },
  { id: 3, nom: 'Équipe Technique', est_public: false, nombre_membres: 15 }
])

const userEntreprise = ref({
  id: 1,
  nom: 'TechCorp Solutions',
  email: 'contact@techcorp.com'
})

// Computed
const isOwnProfile = computed(() => {
  return authStore.user?.id === user.value.id
})

const fullName = computed(() => {
  if (user.value.first_name || user.value.last_name) {
    return `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim()
  }
  return user.value.username
})

const userInitials = computed(() => {
  if (user.value.first_name || user.value.last_name) {
    const first = user.value.first_name?.charAt(0) || ''
    const last = user.value.last_name?.charAt(0) || ''
    return (first + last).toUpperCase()
  }
  return user.value.username.charAt(0).toUpperCase()
})

const avatarColor = computed(() => {
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  
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
    'profile': 'pi pi-user',
    'login': 'pi pi-sign-in'
  }
  return icons[type] || 'pi pi-info-circle'
}

const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    'message': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'group': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'profile': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'login': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  }
  return colors[type] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
}

const editProfile = () => {
  showEditModal.value = true
}

const changePassword = () => {
  router.push('/changer-mot-de-passe')
}

const changeAvatar = () => {
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité en développement',
    detail: 'La modification d\'avatar sera bientôt disponible',
    life: 3000
  })
}

const sendMessage = () => {
  router.push(`/messages?user=${user.value.id}`)
}

const viewAllGroups = () => {
  router.push('/groupes')
}

const exploreGroups = () => {
  router.push('/groupes?tab=explore')
}

const viewGroup = (groupe: any) => {
  router.push(`/groupes/${groupe.id}`)
}

const viewEntreprise = () => {
  router.push(`/entreprises/${userEntreprise.value.id}`)
}

const editCompetences = () => {
  toast.add({
    severity: 'info',
    summary: 'Fonctionnalité en développement',
    detail: 'La modification des compétences sera bientôt disponible',
    life: 3000
  })
}

const onProfileUpdated = () => {
  showEditModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Profil mis à jour',
    detail: 'Vos informations ont été sauvegardées',
    life: 3000
  })
}

// Lifecycle
onMounted(() => {
  // Charger les données du profil
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  overflow: hidden;
}

.profile-cover {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.profile-info {
  position: relative;
  padding: 2rem;
  margin-top: -100px;
}

.profile-avatar-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: white;
  color: var(--primary-color);
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    animation: pulse-green 2s infinite;
  }
  
  &.offline {
    background-color: #6b7280;
  }
}

.group-item {
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.group-item:hover {
  border-color: var(--surface-300);
  transform: translateY(-1px);
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .profile-cover {
    height: 150px;
  }
  
  .profile-info {
    margin-top: -75px;
    padding: 1rem;
  }
  
  .profile-avatar {
    transform: scale(0.8);
  }
}
</style>