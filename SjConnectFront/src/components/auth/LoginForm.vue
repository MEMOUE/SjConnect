<template>
  <Card class="login-card max-w-md">
    <template #header>
      <div class="text-center py-4">
        <Avatar 
          label="SJ" 
          size="xlarge"
          style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white"
          class="mb-4"
        />
        <h2 class="text-2xl font-bold text-900 m-0 mb-2">Connexion</h2>
        <p class="text-600 m-0">
          Connectez-vous à votre compte SJConnect
        </p>
      </div>
    </template>

    <template #content>
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

      <!-- Formulaire de connexion -->
      <form @submit.prevent="handleLogin" class="flex flex-column gap-4">
        <div>
          <label for="username" class="block font-medium mb-2">
            <i class="pi pi-user mr-2"></i>Nom d'utilisateur
          </label>
          <InputText
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="Votre nom d'utilisateur"
            class="w-full"
            :class="{ 'p-invalid': errors.username }"
            @input="clearFieldError('username')"
          />
          <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
        </div>

        <div>
          <label for="password" class="block font-medium mb-2">
            <i class="pi pi-lock mr-2"></i>Mot de passe
          </label>
          <Password
            id="password"
            v-model="form.password"
            placeholder="Votre mot de passe"
            :feedback="false"
            toggleMask
            class="w-full"
            :class="{ 'p-invalid': errors.password }"
            @input="clearFieldError('password')"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>

        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center">
            <Checkbox 
              id="remember" 
              v-model="form.remember" 
              :binary="true"
            />
            <label for="remember" class="ml-2 text-sm">Se souvenir de moi</label>
          </div>
          
          <Button
            @click="$emit('forgotPassword')"
            label="Mot de passe oublié ?"
            text
            class="p-button-secondary p-0"
            size="small"
          />
        </div>

        <Button
          type="submit"
          label="Se connecter"
          icon="pi pi-sign-in"
          :loading="loading"
          class="w-full"
          size="large"
        />
      </form>

      <!-- Animation de chargement -->
      <div v-if="loading" class="text-center mt-4">
        <ProgressSpinner size="small" />
        <p class="text-sm text-600 mt-2">Connexion en cours...</p>
      </div>
    </template>

    <template #footer>
      <Divider align="center" class="my-4">
        <span class="text-600 text-sm">Nouveau sur SJConnect ?</span>
      </Divider>

      <div class="text-center">
        <Button
          @click="$emit('showRegister')"
          label="Créer un compte entreprise"
          icon="pi pi-plus"
          outlined
          class="w-full"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Password from 'primevue/password'

interface Props {
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<{
  login: [credentials: { username: string; password: string; remember: boolean }]
  forgotPassword: []
  showRegister: []
  clearError: []
}>()

const router = useRouter()
const authStore = useAuthStore()

// État local
const form = ref({
  username: '',
  password: '',
  remember: false
})

const errors = ref({
  username: '',
  password: ''
})

// Méthodes
const clearError = () => {
  emit('clearError')
}

const clearFieldError = (field: 'username' | 'password') => {
  errors.value[field] = ''
}

const validateForm = (): boolean => {
  errors.value = {
    username: '',
    password: ''
  }
  
  let isValid = true
  
  if (!form.value.username.trim()) {
    errors.value.username = 'Le nom d\'utilisateur est obligatoire'
    isValid = false
  }
  
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est obligatoire'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  emit('login', {
    username: form.value.username.trim(),
    password: form.value.password,
    remember: form.value.remember
  })
}

// Animation des erreurs
const animateError = (field: 'username' | 'password') => {
  const element = document.getElementById(field)
  if (element) {
    element.classList.add('animate-shake')
    setTimeout(() => {
      element.classList.remove('animate-shake')
    }, 500)
  }
}

// Watcher pour les erreurs externes
import { watch } from 'vue'
watch(() => props.error, (newError) => {
  if (newError) {
    // Animer les champs en cas d'erreur de connexion
    if (newError.includes('utilisateur') || newError.includes('identifiant')) {
      animateError('username')
    }
    if (newError.includes('mot de passe') || newError.includes('password')) {
      animateError('password')
    }
  }
})
</script>

<style scoped>
.login-card {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Animation de secousse pour les erreurs */
@keyframes shake {
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(0);
  }
  10% {
    transform: translateX(-5px);
  }
  30% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  90% {
    transform: translateX(3px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* Effet de focus amélioré */
.p-inputtext:focus,
.p-password:focus {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

/* Style pour le bouton de connexion */
.p-button-loading .p-button-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    margin: 1rem;
  }
}
</style>