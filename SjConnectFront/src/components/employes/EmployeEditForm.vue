<template>
  <div class="employe-edit-form">
    <!-- En-tête -->
    <div class="text-center mb-4">
      <Avatar 
        :label="getEmployeInitials(employe)"
        size="large"
        :style="`background: ${getAvatarColor(employe.username)}; color: white`"
        class="mb-3"
      />
      <h3 class="text-xl font-semibold text-900 m-0">Modifier {{ getFullName(employe) }}</h3>
      <p class="text-600 mt-1">Mettre à jour les informations de l'employé</p>
    </div>

    <!-- Messages -->
    <Message 
      v-if="error" 
      severity="error" 
      :closable="true"
      @close="clearError"
      class="mb-4"
    >
      {{ error }}
    </Message>

    <Message 
      v-if="success" 
      severity="success" 
      :closable="true"
      @close="success = null"
      class="mb-4"
    >
      {{ success }}
    </Message>

    <!-- Formulaire avec onglets -->
    <TabView>
      <!-- Onglet Informations personnelles -->
      <TabPanel header="Informations personnelles" leftIcon="pi pi-user">
        <form @submit.prevent="handleSubmit">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label for="first_name" class="block font-medium mb-2">
                <i class="pi pi-user mr-2"></i>Prénom
              </label>
              <InputText
                id="first_name"
                v-model="form.first_name"
                placeholder="Prénom"
                class="w-full"
              />
            </div>
            
            <div class="col-12 md:col-6">
              <label for="last_name" class="block font-medium mb-2">
                <i class="pi pi-user mr-2"></i>Nom
              </label>
              <InputText
                id="last_name"
                v-model="form.last_name"
                placeholder="Nom"
                class="w-full"
              />
            </div>

            <div class="col-12">
              <label for="email" class="block font-medium mb-2">
                <i class="pi pi-envelope mr-2"></i>Email *
              </label>
              <InputText
                id="email"
                v-model="form.email"
                type="email"
                placeholder="email@exemple.com"
                class="w-full"
                :class="{ 'p-invalid': errors.email }"
              />
              <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
            </div>

            <div class="col-12">
              <label for="poste" class="block font-medium mb-2">
                <i class="pi pi-briefcase mr-2"></i>Poste/Fonction
              </label>
              <Dropdown
                id="poste"
                v-model="form.poste"
                :options="posteOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un poste"
                class="w-full"
                showClear
                editable
              />
            </div>

            <div class="col-12">
              <label for="competences" class="block font-medium mb-2">
                <i class="pi pi-star mr-2"></i>Compétences
              </label>
              <Chips
                id="competences"
                v-model="form.competences"
                placeholder="Ajouter une compétence (Entrée pour valider)"
                class="w-full"
              />
              <small class="text-600">
                Appuyez sur Entrée pour ajouter chaque compétence
              </small>
            </div>
          </div>
        </form>
      </TabPanel>

      <!-- Onglet Accès et permissions -->
      <TabPanel header="Accès et permissions" leftIcon="pi pi-shield">
        <div class="grid">
          <div class="col-12">
            <label class="block font-medium mb-3">
              <i class="pi pi-shield mr-2"></i>Rôle dans l'entreprise
            </label>
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center">
                <RadioButton 
                  id="role_employee" 
                  v-model="form.role" 
                  value="EMPLOYEE"
                />
                <label for="role_employee" class="ml-2">
                  <span class="font-medium">Employé standard</span>
                  <div class="text-sm text-600 mt-1">
                    Peut participer aux groupes et envoyer des messages
                  </div>
                </label>
              </div>
              
              <div class="flex align-items-center">
                <RadioButton 
                  id="role_manager" 
                  v-model="form.role" 
                  value="MANAGER"
                />
                <label for="role_manager" class="ml-2">
                  <span class="font-medium">Manager</span>
                  <div class="text-sm text-600 mt-1">
                    Peut créer des groupes et gérer d'autres employés
                  </div>
                </label>
              </div>
              
              <div class="flex align-items-center" v-if="canAssignAdmin">
                <RadioButton 
                  id="role_admin" 
                  v-model="form.role" 
                  value="ADMIN"
                />
                <label for="role_admin" class="ml-2">
                  <span class="font-medium">Administrateur</span>
                  <div class="text-sm text-600 mt-1">
                    Accès complet à la gestion de l'entreprise
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="col-12">
            <Divider />
            <label class="block font-medium mb-3">
              <i class="pi pi-cog mr-2"></i>Statut du compte
            </label>
            <div class="flex align-items-center mb-3">
              <InputSwitch 
                id="is_active" 
                v-model="form.is_active"
              />
              <label for="is_active" class="ml-2">
                <span class="font-medium">Compte actif</span>
                <div class="text-sm text-600 mt-1">
                  {{ form.is_active ? 'L\'employé peut se connecter et accéder à la plateforme' : 'L\'employé ne peut pas se connecter' }}
                </div>
              </label>
            </div>

            <div v-if="!form.is_active" class="mb-3">
              <Message severity="warn" :closable="false">
                <template #icon>
                  <i class="pi pi-exclamation-triangle"></i>
                </template>
                La désactivation du compte empêchera l'employé de se connecter, mais conservera toutes ses données.
              </Message>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Onglet Sécurité -->
      <TabPanel header="Sécurité" leftIcon="pi pi-lock">
        <div class="flex flex-column gap-4">
          <div class="grid">
            <div class="col-12">
              <h5 class="text-900 mb-3">Gestion du mot de passe</h5>
              <div class="flex flex-column gap-3">
                <div class="flex align-items-center">
                  <Button
                    @click="sendPasswordReset"
                    label="Envoyer un lien de réinitialisation"
                    icon="pi pi-send"
                    outlined
                    :loading="sendingPasswordReset"
                  />
                </div>
                <small class="text-600">
                  Un email sera envoyé à l'employé avec un lien pour réinitialiser son mot de passe
                </small>
              </div>
            </div>
          </div>

          <Divider />

          <div class="grid">
            <div class="col-12">
              <h5 class="text-900 mb-3">Informations de connexion</h5>
              <div class="flex flex-column gap-3">
                <div>
                  <label class="font-semibold text-600 block mb-1">Dernière connexion</label>
                  <p class="text-900 m-0">
                    {{ employe.last_login ? formatDateTime(employe.last_login) : 'Jamais connecté' }}
                  </p>
                </div>
                <div>
                  <label class="font-semibold text-600 block mb-1">Date de création du compte</label>
                  <p class="text-900 m-0">{{ formatDateTime(employe.date_joined) }}</p>
                </div>
                <div>
                  <label class="font-semibold text-600 block mb-1">Statut actuel</label>
                  <div class="flex align-items-center">
                    <div :class="['status-indicator mr-2', employe.is_online ? 'online' : 'offline']"></div>
                    <span :class="employe.is_online ? 'text-green-600' : 'text-500'">
                      {{ employe.is_online ? 'En ligne' : 'Hors ligne' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Boutons d'action -->
    <div class="flex justify-content-between align-items-center mt-4 pt-4 border-top-1 surface-border">
      <div>
        <Button
          v-if="canDelete"
          @click="confirmDelete"
          label="Supprimer le compte"
          icon="pi pi-trash"
          severity="danger"
          outlined
          :disabled="loading"
        />
      </div>
      
      <div class="flex gap-2">
        <Button
          @click="$emit('close')"
          label="Annuler"
          outlined
          :disabled="loading"
        />
        <Button
          @click="handleSubmit"
          label="Enregistrer les modifications"
          icon="pi pi-check"
          :loading="loading"
          :disabled="!hasChanges"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Chips from 'primevue/chips'
import InputSwitch from 'primevue/inputswitch'

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

interface Props {
  employe: Employe
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updated: [data: any]
  close: []
  deleted: [employeId: number]
}>()

const confirm = useConfirm()
const toast = useToast()

// État local
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const sendingPasswordReset = ref(false)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  poste: '',
  role: 'EMPLOYEE',
  is_active: true,
  competences: [] as string[]
})

const originalForm = ref<typeof form.value>({
  first_name: '',
  last_name: '',
  email: '',
  poste: '',
  role: 'EMPLOYEE',
  is_active: true,
  competences: []
})

const errors = ref({
  email: ''
})

// Options pour les postes
const posteOptions = [
  { label: 'Développeur', value: 'Développeur' },
  { label: 'Développeur Senior', value: 'Développeur Senior' },
  { label: 'Chef de projet', value: 'Chef de projet' },
  { label: 'Designer', value: 'Designer' },
  { label: 'Designer UX/UI', value: 'Designer UX/UI' },
  { label: 'Analyste', value: 'Analyste' },
  { label: 'Comptable', value: 'Comptable' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Responsable RH', value: 'Responsable RH' },
  { label: 'Directeur', value: 'Directeur' },
  { label: 'Consultant', value: 'Consultant' }
]

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value)
})

const canAssignAdmin = computed(() => {
  // Seuls les admins peuvent assigner le rôle admin
  return true // Simplifié pour la démo
})

const canDelete = computed(() => {
  // Ne peut pas supprimer un admin ou soi-même
  return !props.employe.is_admin && props.employe.id !== 1
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
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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

const clearError = () => {
  error.value = null
}

const initializeForm = () => {
  form.value = {
    first_name: props.employe.first_name || '',
    last_name: props.employe.last_name || '',
    email: props.employe.email || '',
    poste: props.employe.poste || '',
    role: props.employe.role || 'EMPLOYEE',
    is_active: props.employe.is_active,
    competences: props.employe.competences ? [...props.employe.competences] : []
  }
  
  // Sauvegarder la version originale pour détecter les changements
  originalForm.value = JSON.parse(JSON.stringify(form.value))
}

const validateForm = (): boolean => {
  errors.value = {
    email: ''
  }
  
  let isValid = true
  
  if (!form.value.email.trim()) {
    errors.value.email = 'L\'email est obligatoire'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    error.value = null
    success.value = null
    
    // Préparer les données à envoyer
    const updateData = {
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email.trim(),
      poste: form.value.poste.trim(),
      role: form.value.role,
      is_active: form.value.is_active,
      competences: form.value.competences.filter(c => c.trim())
    }
    
    // Simuler l'appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    success.value = 'Modifications enregistrées avec succès !'
    
    // Mettre à jour la version originale
    originalForm.value = JSON.parse(JSON.stringify(form.value))
    
    // Émettre l'événement de mise à jour
    emit('updated', updateData)
    
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour:', err)
    error.value = 'Erreur lors de l\'enregistrement des modifications'
  } finally {
    loading.value = false
  }
}

const sendPasswordReset = async () => {
  try {
    sendingPasswordReset.value = true
    
    // Simuler l'envoi du lien de réinitialisation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.add({
      severity: 'success',
      summary: 'Email envoyé',
      detail: 'Un lien de réinitialisation a été envoyé à l\'employé',
      life: 5000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'envoyer l\'email de réinitialisation',
      life: 5000
    })
  } finally {
    sendingPasswordReset.value = false
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${getFullName(props.employe)} ? Cette action est irréversible.`,
    header: 'Supprimer le compte employé',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer définitivement',
    rejectLabel: 'Annuler',
    accept: handleDelete
  })
}

const handleDelete = async () => {
  try {
    loading.value = true
    
    // Simuler la suppression
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.add({
      severity: 'success',
      summary: 'Compte supprimé',
      detail: 'Le compte employé a été supprimé avec succès',
      life: 3000
    })
    
    emit('deleted', props.employe.id)
    
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le compte',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Watchers pour la validation en temps réel
watch(() => form.value.email, () => {
  if (errors.value.email) {
    errors.value.email = ''
  }
})

// Lifecycle
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
.employe-edit-form {
  max-width: 100%;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }
  
  &.offline {
    background-color: #6b7280;
  }
}

/* Style pour les panels d'onglets */
:deep(.p-tabview .p-tabview-panels) {
  padding: 1.5rem 0 0 0;
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  padding: 1rem 1.5rem;
}

/* Style pour les chips de compétences */
:deep(.p-chips .p-chips-multiple-container .p-chips-token) {
  background: var(--primary-color);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .grid .col-12 {
    padding: 0.5rem;
  }
  
  :deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
</style>