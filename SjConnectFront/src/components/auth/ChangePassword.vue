<template>
  <div class="change-password-container">
    <Card class="max-w-md mx-auto">
      <template #header>
        <div class="text-center py-4">
          <Avatar 
            icon="pi pi-lock" 
            size="xlarge"
            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white"
            class="mb-4"
          />
          <h2 class="text-2xl font-bold text-900 m-0 mb-2">Changer le mot de passe</h2>
          <p class="text-600 m-0">
            Saisissez votre nouveau mot de passe
          </p>
        </div>
      </template>

      <template #content>
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

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit" class="flex flex-column gap-4">
          <div>
            <label for="currentPassword" class="block font-medium mb-2">
              <i class="pi pi-key mr-2"></i>Mot de passe actuel
            </label>
            <Password
              id="currentPassword"
              v-model="form.currentPassword"
              placeholder="Votre mot de passe actuel"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.currentPassword }"
            />
            <small v-if="errors.currentPassword" class="p-error">
              {{ errors.currentPassword }}
            </small>
          </div>

          <div>
            <label for="newPassword" class="block font-medium mb-2">
              <i class="pi pi-lock mr-2"></i>Nouveau mot de passe
            </label>
            <Password
              id="newPassword"
              v-model="form.newPassword"
              placeholder="Votre nouveau mot de passe"
              :feedback="true"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.newPassword }"
              promptLabel="Saisissez un mot de passe"
              weakLabel="Faible"
              mediumLabel="Moyen"
              strongLabel="Fort"
            />
            <small v-if="errors.newPassword" class="p-error">
              {{ errors.newPassword }}
            </small>
          </div>

          <div>
            <label for="confirmPassword" class="block font-medium mb-2">
              <i class="pi pi-verified mr-2"></i>Confirmer le mot de passe
            </label>
            <Password
              id="confirmPassword"
              v-model="form.confirmPassword"
              placeholder="Confirmez votre nouveau mot de passe"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
            />
            <small v-if="errors.confirmPassword" class="p-error">
              {{ errors.confirmPassword }}
            </small>
          </div>

          <!-- Règles de mot de passe -->
          <div class="bg-blue-50 border-blue-200 border-1 border-round p-3">
            <h5 class="text-blue-800 mb-2 mt-0">
              <i class="pi pi-info-circle mr-2"></i>Règles de mot de passe
            </h5>
            <ul class="text-blue-700 text-sm m-0 pl-4">
              <li>Au moins 8 caractères</li>
              <li>Au moins une lettre majuscule</li>
              <li>Au moins une lettre minuscule</li>
              <li>Au moins un chiffre</li>
              <li>Au moins un caractère spécial (!@#$%^&*)</li>
            </ul>
          </div>

          <Button
            type="submit"
            label="Changer le mot de passe"
            icon="pi pi-check"
            :loading="loading"
            :disabled="!isFormValid"
            class="w-full"
            size="large"
          />
        </form>
      </template>

      <template #footer>
        <div class="text-center">
          <Button
            @click="$router.go(-1)"
            label="Retour"
            icon="pi pi-arrow-left"
            text
            class="p-button-secondary"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Password from 'primevue/password'

const router = useRouter()
const toast = useToast()

// État local
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const isFormValid = computed(() => {
  return form.value.currentPassword.length > 0 && 
         form.value.newPassword.length >= 8 &&
         form.value.confirmPassword === form.value.newPassword &&
         isPasswordStrong(form.value.newPassword)
})

// Méthodes
const clearError = () => {
  error.value = null
}

const isPasswordStrong = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isLongEnough = password.length >= 8
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
}

const validateForm = (): boolean => {
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }

  let isValid = true

  if (!form.value.currentPassword) {
    errors.value.currentPassword = 'Le mot de passe actuel est requis'
    isValid = false
  }

  if (!form.value.newPassword) {
    errors.value.newPassword = 'Le nouveau mot de passe est requis'
    isValid = false
  } else if (form.value.newPassword.length < 8) {
    errors.value.newPassword = 'Le mot de passe doit faire au moins 8 caractères'
    isValid = false
  } else if (!isPasswordStrong(form.value.newPassword)) {
    errors.value.newPassword = 'Le mot de passe ne respecte pas les règles de sécurité'
    isValid = false
  }

  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'La confirmation du mot de passe est requise'
    isValid = false
  } else if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    isValid = false
  }

  if (form.value.currentPassword === form.value.newPassword) {
    errors.value.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    error.value = null

    const response = await fetch('/api/auth/change-password/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        current_password: form.value.currentPassword,
        new_password: form.value.newPassword
      })
    })

    const data = await response.json()

    if (response.ok) {
      success.value = 'Mot de passe changé avec succès !'
      form.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Mot de passe changé avec succès',
        life: 3000
      })

      setTimeout(() => {
        router.push('/profil')
      }, 2000)
    } else {
      error.value = data.error || 'Erreur lors du changement de mot de passe'
    }
  } catch (err: any) {
    console.error('Erreur:', err)
    error.value = 'Erreur de connexion au serveur'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.p-card {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
</style>