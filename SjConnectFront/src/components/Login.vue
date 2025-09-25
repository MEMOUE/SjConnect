<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo et titre -->
      <div class="header">
        <div class="logo">
          <span class="logo-text">SJ</span>
        </div>
        <h2 class="title">
          {{ isRegistering ? 'Créer un compte' : 'Connexion à SJConnect' }}
        </h2>
        <p class="subtitle">
          {{ isRegistering 
            ? 'Rejoignez la plateforme de communication inter-entreprises' 
            : 'Connectez-vous à votre espace' 
          }}
        </p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleSubmit" class="form">
        <!-- Messages d'erreur -->
        <Message 
          v-if="authStore.error" 
          severity="error" 
          :closable="true"
          @close="authStore.clearError"
        >
          {{ authStore.error }}
        </Message>

        <div class="form-fields">
          <!-- Prénom et nom (inscription seulement) -->
          <div v-if="isRegistering" class="name-fields">
            <div class="field">
              <InputText
                id="first_name"
                v-model="form.first_name"
                placeholder="Prénom"
                class="w-full"
              />
            </div>
            <div class="field">
              <InputText
                id="last_name"
                v-model="form.last_name"
                placeholder="Nom"
                class="w-full"
              />
            </div>
          </div>

          <!-- Email (inscription seulement) -->
          <div v-if="isRegistering" class="field">
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="Adresse email"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

          <!-- Nom d'utilisateur -->
          <div class="field">
            <InputText
              id="username"
              v-model="form.username"
              required
              placeholder="Nom d'utilisateur"
              class="w-full"
              :class="{ 'p-invalid': errors.username }"
            />
            <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
          </div>

          <!-- Mot de passe -->
          <div class="field">
            <Password
              id="password"
              v-model="form.password"
              required
              :placeholder="isRegistering ? 'Mot de passe (8 caractères min.)' : 'Mot de passe'"
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :feedback="isRegistering"
              toggle-mask
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <!-- Confirmation mot de passe (inscription seulement) -->
          <div v-if="isRegistering" class="field">
            <Password
              id="confirmPassword"
              v-model="form.confirmPassword"
              required
              placeholder="Confirmer le mot de passe"
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :feedback="false"
              toggle-mask
            />
            <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
          </div>
        </div>

        <!-- Options supplémentaires pour la connexion -->
        <div v-if="!isRegistering" class="login-options">
          <div class="remember-me">
            <Checkbox
              id="remember-me"
              v-model="form.rememberMe"
              :binary="true"
            />
            <label for="remember-me" class="remember-label">
              Se souvenir de moi
            </label>
          </div>

          <div class="forgot-password">
            <a href="#" class="link">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <!-- Bouton de soumission -->
        <div class="submit-section">
          <Button
            type="submit"
            :disabled="authStore.isLoading || !isFormValid"
            :loading="authStore.isLoading"
            :label="isRegistering ? 'Créer le compte' : 'Se connecter'"
            class="w-full submit-button"
            icon="pi pi-sign-in"
            :loading-icon="authStore.isLoading ? 'pi pi-spinner pi-spin' : undefined"
          />
        </div>

        <!-- Lien pour basculer entre connexion et inscription -->
        <div class="toggle-mode">
          <Button
            type="button"
            @click="toggleMode"
            :label="isRegistering 
              ? 'Déjà un compte ? Se connecter' 
              : 'Pas encore de compte ? S\'inscrire'"
            class="p-button-text p-button-plain w-full"
          />
        </div>
      </form>

      <!-- Informations additionnelles -->
      <div class="footer-info">
        <p class="terms-text">
          En vous connectant, vous acceptez nos 
          <a href="#" class="link">conditions d'utilisation</a>
          et notre 
          <a href="#" class="link">politique de confidentialité</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Composants PrimeVue
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'

const router = useRouter()
const authStore = useAuthStore()

// État local
const isRegistering = ref(false)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  rememberMe: false
})

const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Computed
const isFormValid = computed(() => {
  const hasRequiredFields = form.value.username && form.value.password
  
  if (isRegistering.value) {
    return hasRequiredFields && 
           form.value.email && 
           form.value.password.length >= 8 &&
           form.value.password === form.value.confirmPassword
  }
  
  return hasRequiredFields
})

// Méthodes
const validateForm = () => {
  errors.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
  
  let isValid = true
  
  // Validation nom d'utilisateur
  if (!form.value.username.trim()) {
    errors.value.username = 'Le nom d\'utilisateur est obligatoire'
    isValid = false
  } else if (form.value.username.length < 3) {
    errors.value.username = 'Le nom d\'utilisateur doit faire au moins 3 caractères'
    isValid = false
  }
  
  // Validation email (inscription seulement)
  if (isRegistering.value) {
    if (!form.value.email.trim()) {
      errors.value.email = 'L\'email est obligatoire'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errors.value.email = 'Format d\'email invalide'
      isValid = false
    }
  }
  
  // Validation mot de passe
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est obligatoire'
    isValid = false
  } else if (isRegistering.value && form.value.password.length < 8) {
    errors.value.password = 'Le mot de passe doit faire au moins 8 caractères'
    isValid = false
  }
  
  // Validation confirmation mot de passe (inscription seulement)
  if (isRegistering.value) {
    if (form.value.password !== form.value.confirmPassword) {
      errors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
      isValid = false
    }
  }
  
  return isValid
}

const resetForm = () => {
  form.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    rememberMe: false
  }
  errors.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
  authStore.clearError()
}

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  resetForm()
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    if (isRegistering.value) {
      await authStore.register({
        username: form.value.username.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        first_name: form.value.first_name.trim() || undefined,
        last_name: form.value.last_name.trim() || undefined
      })
    } else {
      await authStore.login({
        username: form.value.username.trim(),
        password: form.value.password
      })
    }
    
    // Redirection vers le dashboard après connexion réussie
    router.push('/')
  } catch (error) {
    // L'erreur est déjà gérée dans le store
    console.error('Erreur d\'authentification:', error)
  }
}

// Watchers pour validation en temps réel
watch(() => form.value.username, () => {
  if (errors.value.username) {
    errors.value.username = ''
  }
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
  if (errors.value.confirmPassword && form.value.password === form.value.confirmPassword) {
    errors.value.confirmPassword = ''
  }
})

watch(() => form.value.confirmPassword, () => {
  if (errors.value.confirmPassword && form.value.password === form.value.confirmPassword) {
    errors.value.confirmPassword = ''
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: inline-block;
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
}

.title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #718096;
  font-size: 0.875rem;
  margin: 0;
}

.form {
  margin-top: 2rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.name-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.w-full {
  width: 100%;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remember-label {
  font-size: 0.875rem;
  color: #4a5568;
  cursor: pointer;
}

.forgot-password {
  font-size: 0.875rem;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.submit-section {
  margin: 1.5rem 0;
}

.submit-button {
  height: 3rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.toggle-mode {
  text-align: center;
  margin: 1rem 0;
}

.footer-info {
  margin-top: 2rem;
  text-align: center;
}

.terms-text {
  font-size: 0.75rem;
  color: #a0aec0;
  line-height: 1.4;
  margin: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .name-fields {
    grid-template-columns: 1fr;
  }
  
  .login-options {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
}
</style>