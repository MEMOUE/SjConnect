<template>
  <div class="create-employe-form">
    <!-- En-tête -->
    <div class="text-center mb-4">
      <Avatar 
        icon="pi pi-user-plus" 
        size="large"
        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white"
        class="mb-3"
      />
      <h3 class="text-xl font-semibold text-900 m-0">Nouveau compte employé</h3>
      <p class="text-600 mt-1">Créez un compte pour un nouvel employé</p>
    </div>

    <!-- Messages d'erreur -->
    <Message 
      v-if="error" 
      severity="error" 
      :closable="true"
      @close="clearError"
      class="mb-4"
    >
      {{ error }}
    </Message>

    <!-- Formulaire -->
    <form @submit.prevent="handleSubmit" class="flex flex-column gap-4">
      <!-- Informations personnelles -->
      <Panel header="Informations personnelles" :toggleable="false">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="first_name" class="block font-medium mb-2">
              <i class="pi pi-user mr-2"></i>Prénom
            </label>
            <InputText
              id="first_name"
              v-model="form.first_name"
              placeholder="Prénom de l'employé"
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
              placeholder="Nom de l'employé"
              class="w-full"
            />
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
            <small class="text-600">Vous pouvez sélectionner ou saisir un poste personnalisé</small>
          </div>
        </div>
      </Panel>
      
      <!-- Informations de connexion -->
      <Panel header="Informations de connexion" :toggleable="false">
        <div class="grid">
          <div class="col-12">
            <label for="username" class="block font-medium mb-2">
              <i class="pi pi-at mr-2"></i>Nom d'utilisateur *
            </label>
            <InputText
              id="username"
              v-model="form.username"
              placeholder="Nom d'utilisateur pour se connecter"
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
              @blur="checkUsernameAvailability"
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
            <small v-else-if="usernameChecked && !errors.username" class="text-green-600">
              <i class="pi pi-check mr-1"></i>Nom d'utilisateur disponible
            </small>
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
            <label for="password" class="block font-medium mb-2">
              <i class="pi pi-lock mr-2"></i>Mot de passe temporaire *
            </label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Mot de passe temporaire"
              :feedback="true"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              promptLabel="Saisissez un mot de passe"
              weakLabel="Faible"
              mediumLabel="Moyen"
              strongLabel="Fort"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
            <small v-else class="text-600">
              L'employé pourra modifier son mot de passe lors de sa première connexion
            </small>
          </div>
        </div>
      </Panel>

      <!-- Permissions et rôle -->
      <Panel header="Permissions et accès" :toggleable="false">
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
              
              <div class="flex align-items-center">
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
            <div class="flex align-items-center">
              <Checkbox 
                id="send_invitation" 
                v-model="form.sendInvitation" 
                :binary="true"
              />
              <label for="send_invitation" class="ml-2">
                Envoyer un email d'invitation avec les informations de connexion
              </label>
            </div>
          </div>
        </div>
      </Panel>
      
      <!-- Informations sur l'accès -->
      <Message severity="info" :closable="false">
        <template #icon>
          <i class="pi pi-info-circle"></i>
        </template>
        <div>
          <h5 class="m-0 mb-2">Accès de l'employé</h5>
          <ul class="m-0 pl-3 text-sm">
            <li>L'employé pourra se connecter à SJConnect</li>
            <li>Il aura accès aux groupes où vous l'ajouterez</li>
            <li>Il pourra envoyer des messages privés (entreprise) et publics dans les groupes</li>
            <li>Les permissions dépendront de son rôle assigné</li>
          </ul>
        </div>
      </Message>

      <!-- Boutons d'action -->
      <div class="flex justify-content-end gap-2 mt-4">
        <Button
          @click="$emit('close')"
          label="Annuler"
          outlined
          :disabled="loading"
        />
        <Button
          type="submit"
          label="Créer le compte"
          icon="pi pi-check"
          :loading="loading"
          :disabled="!isFormValid"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Password from 'primevue/password'

const emit = defineEmits<{
  close: []
  created: [data: any]
}>()

// État local
const loading = ref(false)
const error = ref<string | null>(null)
const usernameChecked = ref(false)

const form = ref({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  poste: '',
  role: 'EMPLOYEE',
  sendInvitation: true
})

const errors = ref({
  username: '',
  email: '',
  password: ''
})

// Options pour les postes
const posteOptions = [
  { label: 'Développeur', value: 'Développeur' },
  { label: 'Développeur Senior', value: 'Développeur Senior' },
  { label: 'Chef de projet', value: 'Chef de projet' },
  { label: 'Designer', value: 'Designer' },
  { label: 'Analyste', value: 'Analyste' },
  { label: 'Comptable', value: 'Comptable' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Responsable RH', value: 'Responsable RH' },
  { label: 'Directeur', value: 'Directeur' }
]

// Computed
const isFormValid = computed(() => {
  return form.value.username.trim().length > 0 && 
         form.value.email.trim().length > 0 &&
         form.value.password.length >= 8 &&
         !Object.values(errors.value).some(error => error !== '')
})

// Méthodes
const clearError = () => {
  error.value = null
}

const resetForm = () => {
  form.value = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    poste: '',
    role: 'EMPLOYEE',
    sendInvitation: true
  }
  errors.value = {
    username: '',
    email: '',
    password: ''
  }
  error.value = null
  usernameChecked.value = false
}

const validateForm = () => {
  errors.value = {
    username: '',
    email: '',
    password: ''
  }
  
  let isValid = true
  
  // Validation nom d'utilisateur
  if (!form.value.username.trim()) {
    errors.value.username = 'Le nom d\'utilisateur est obligatoire'
    isValid = false
  } else if (form.value.username.length < 3) {
    errors.value.username = 'Le nom d\'utilisateur doit faire au moins 3 caractères'
    isValid = false
  } else if (!/^[a-zA-Z0-9._-]+$/.test(form.value.username)) {
    errors.value.username = 'Seuls les lettres, chiffres, points, tirets et underscores sont autorisés'
    isValid = false
  }
  
  // Validation email
  if (!form.value.email.trim()) {
    errors.value.email = 'L\'email est obligatoire'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
    isValid = false
  }
  
  // Validation mot de passe
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est obligatoire'
    isValid = false
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Le mot de passe doit faire au moins 8 caractères'
    isValid = false
  }
  
  return isValid
}

const checkUsernameAvailability = async () => {
  if (!form.value.username || form.value.username.length < 3) {
    usernameChecked.value = false
    return
  }

  try {
    // Simuler une vérification de disponibilité
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Ici, on ferait un appel API réel
    const isAvailable = !['admin', 'root', 'test', 'user'].includes(form.value.username.toLowerCase())
    
    if (!isAvailable) {
      errors.value.username = 'Ce nom d\'utilisateur n\'est pas disponible'
    } else {
      errors.value.username = ''
      usernameChecked.value = true
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du nom d\'utilisateur:', err)
  }
}

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = password
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    error.value = null
    
    // Préparer les données
    const employeData = {
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      poste: form.value.poste.trim(),
      role: form.value.role,
      send_invitation: form.value.sendInvitation
    }
    
    // Simuler l'appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Émettre l'événement de succès
    emit('created', employeData)
    resetForm()
    
  } catch (err: any) {
    console.error('Erreur lors de la création:', err)
    error.value = 'Erreur lors de la création du compte employé'
  } finally {
    loading.value = false
  }
}

// Watchers pour la validation en temps réel
watch(() => form.value.username, () => {
  if (errors.value.username) {
    errors.value.username = ''
  }
  usernameChecked.value = false
})

watch(() => form.value.email, () => {
  if (errors.value.email) {
    errors.value.email = ''
  }
})

watch(() => form.value.password, () => {
  if (errors.value.password) {
    errors.value.password = ''
  }
})

// Générer automatiquement le nom d'utilisateur basé sur le prénom/nom
watch([() => form.value.first_name, () => form.value.last_name], ([firstName, lastName]) => {
  if (firstName || lastName) {
    const username = `${firstName.toLowerCase().replace(/\s/g, '')}.${lastName.toLowerCase().replace(/\s/g, '')}`
    if (username !== '.' && !form.value.username) {
      form.value.username = username
    }
  }
})
</script>

<style scoped>
.create-employe-form {
  max-width: 100%;
}

/* Animation pour les champs validés */
.text-green-600 {
  animation: fadeInSuccess 0.3s ease-in;
}

@keyframes fadeInSuccess {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style pour les panels */
:deep(.p-panel .p-panel-header) {
  background: linear-gradient(135deg, var(--surface-50) 0%, var(--surface-100) 100%);
  border-bottom: 1px solid var(--surface-200);
}

/* Style pour les boutons radio */
.p-radiobutton .p-radiobutton-input:checked ~ .p-radiobutton-box {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

/* Responsive */
@media (max-width: 768px) {
  .grid .col-12 {
    padding: 0.5rem;
  }
}
</style>