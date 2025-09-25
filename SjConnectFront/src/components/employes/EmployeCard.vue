<template>
  <Card class="employe-card hover-lift">
    <template #header>
      <div class="relative">
        <div class="card-header-bg"></div>
        <div class="flex justify-content-center pt-4 relative">
          <Avatar 
            :label="employe.first_name ? `${employe.first_name.charAt(0)}${employe.last_name?.charAt(0) || ''}` : employe.username.charAt(0)"
            size="xlarge"
            :style="`background: ${getAvatarColor(employe.username)}; color: white`"
            class="avatar-shadow"
          />
          
          <!-- Badge de statut -->
          <div class="absolute" style="top: 1rem; right: 1rem;">
            <Badge 
              :value="employe.is_active ? 'Actif' : 'Inactif'"
              :severity="employe.is_active ? 'success' : 'danger'"
            />
          </div>

          <!-- Badge de rôle -->
          <div v-if="employe.role" class="absolute" style="top: 4rem; right: 1rem;">
            <Chip 
              :label="getRoleLabel(employe.role)"
              :class="getRoleClass(employe.role)"
            />
          </div>
        </div>
      </div>
    </template>
    
    <template #title>
      <div class="text-center">
        <h4 class="text-xl font-semibold text-900 m-0 mb-1">
          {{ getFullName(employe) }}
        </h4>
        <p class="text-sm text-600 m-0">{{ employe.username }}</p>
      </div>
    </template>
    
    <template #content>
      <div class="text-center">
        <!-- Informations principales -->
        <div class="mb-4">
          <div v-if="employe.email" class="flex align-items-center justify-content-center mb-2">
            <i class="pi pi-envelope text-500 mr-2"></i>
            <span class="text-sm text-700">{{ employe.email }}</span>
          </div>
          
          <div v-if="employe.poste" class="flex align-items-center justify-content-center mb-2">
            <i class="pi pi-briefcase text-500 mr-2"></i>
            <span class="text-sm text-700">{{ employe.poste }}</span>
          </div>
          
          <div class="flex align-items-center justify-content-center">
            <i class="pi pi-calendar text-500 mr-2"></i>
            <span class="text-xs text-600">
              Inscrit le {{ formatDate(employe.date_joined) }}
            </span>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="flex justify-content-around mb-4">
          <div class="text-center">
            <div class="text-lg font-bold text-primary">{{ employe.groupes_count || 0 }}</div>
            <div class="text-xs text-600">Groupes</div>
          </div>
          <Divider layout="vertical" />
          <div class="text-center">
            <div class="text-lg font-bold text-green-600">{{ employe.messages_count || 0 }}</div>
            <div class="text-xs text-600">Messages</div>
          </div>
          <Divider layout="vertical" />
          <div class="text-center">
            <div class="text-lg font-bold text-purple-600">
              {{ employe.last_login ? getLastLoginDays(employe.last_login) : 'N/A' }}
            </div>
            <div class="text-xs text-600">Dernière visite</div>
          </div>
        </div>

        <!-- Indicateur d'activité -->
        <div class="flex align-items-center justify-content-center mb-4">
          <div :class="['status-indicator mr-2', employe.is_online ? 'online' : 'offline']"></div>
          <span class="text-sm" :class="employe.is_online ? 'text-green-600' : 'text-500'">
            {{ employe.is_online ? 'En ligne' : 'Hors ligne' }}
          </span>
        </div>

        <!-- Tags/Compétences (si disponibles) -->
        <div v-if="employe.competences && employe.competences.length" class="mb-4">
          <div class="flex justify-content-center flex-wrap gap-1">
            <Tag 
              v-for="competence in employe.competences.slice(0, 3)" 
              :key="competence"
              :value="competence"
              severity="info"
              class="text-xs"
            />
            <Tag 
              v-if="employe.competences.length > 3"
              :value="`+${employe.competences.length - 3}`"
              severity="secondary"
              class="text-xs"
            />
          </div>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="flex gap-2">
        <Button
          @click="$emit('view', employe)"
          icon="pi pi-eye"
          label="Voir"
          outlined
          size="small"
          class="flex-1"
        />
        
        <Button
          v-if="canEdit"
          @click="$emit('edit', employe)"
          icon="pi pi-pencil"
          outlined
          size="small"
          severity="secondary"
          v-tooltip="'Modifier'"
        />
        
        <Button
          v-if="canMessage"
          @click="$emit('message', employe)"
          icon="pi pi-send"
          outlined
          size="small"
          severity="info"
          v-tooltip="'Envoyer un message'"
        />
        
        <Button
          v-if="canDelete && !employe.is_admin"
          @click="$emit('delete', employe)"
          icon="pi pi-trash"
          outlined
          size="small"
          severity="danger"
          v-tooltip="'Supprimer'"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

interface Props {
  employe: Employe
  canEdit?: boolean
  canDelete?: boolean
  canMessage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
  canDelete: false,
  canMessage: true
})

defineEmits<{
  view: [employe: Employe]
  edit: [employe: Employe]
  delete: [employe: Employe]
  message: [employe: Employe]
}>()

// Méthodes
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
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)'
  ]
  
  const index = username.charCodeAt(0) % colors.length
  return colors[index]
}

const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    'admin': 'Admin',
    'manager': 'Manager',
    'employee': 'Employé',
    'viewer': 'Lecteur'
  }
  return roleLabels[role] || role
}

const getRoleClass = (role: string): string => {
  const roleClasses: Record<string, string> = {
    'admin': 'bg-red-100 text-red-700',
    'manager': 'bg-blue-100 text-blue-700',
    'employee': 'bg-green-100 text-green-700',
    'viewer': 'bg-gray-100 text-gray-700'
  }
  return roleClasses[role] || 'bg-gray-100 text-gray-700'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getLastLoginDays = (lastLogin: string): string => {
  const loginDate = new Date(lastLogin)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - loginDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return "Aujourd'hui"
  } else if (diffDays === 2) {
    return "Hier"
  } else if (diffDays <= 7) {
    return `${diffDays - 1}j`
  } else if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)}sem`
  } else {
    return `${Math.ceil(diffDays / 30)}mois`
  }
}
</script>

<style scoped>
.employe-card {
  transition: all 0.3s ease;
  height: 100%;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.card-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(135deg, var(--surface-100) 0%, var(--surface-200) 100%);
  border-radius: 6px 6px 0 0;
}

.avatar-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  &.online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    animation: pulse-green 2s infinite;
  }
  
  &.offline {
    background-color: #6b7280;
  }
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

/* Effet hover sur les boutons */
.p-button:hover {
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .card-header-bg {
    height: 60px;
  }
  
  .avatar-shadow {
    transform: scale(0.9);
  }
}
</style>