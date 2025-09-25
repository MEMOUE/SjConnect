<template>
  <div class="login-page flex align-items-center justify-content-center min-h-screen">
    <Card class="login-card w-full max-w-26rem p-4">
      <template #header>
        <div class="text-center py-4">
          <Avatar 
            label="SJ Connect" 
            size="xlarge"
            class="avatar-logo mb-3"
          />
          <h2 class="title">Bienvenue</h2>
          <p class="subtitle">Connectez-vous à votre espace SJConnect</p>
        </div>
      </template>

      <template #content>
        <!-- Message d'erreur -->
        <Message 
          v-if="error" 
          severity="error" 
          :closable="true"
          @close="clearError"
          class="mb-3"
        >
          {{ error }}
        </Message>

        <!-- Formulaire -->
        <form @submit.prevent="handleLogin" class="flex flex-column gap-4">
          <div>
            <label for="email" class="block font-medium mb-2">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full"
              placeholder="exemple@email.com"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>

          <div>
           <template>
    <div class="card flex justify-center">
        <Password v-model="form.password" promptLabel="Choose a password" weakLabel="Too simple" mediumLabel="Average complexity" strongLabel="Complex password" />
    </div>
</template>
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>

          <div class="flex align-items-center justify-content-between text-sm">
            <div class="flex align-items-center">
              <Checkbox id="remember" v-model="form.remember" :binary="true" />
              <label for="remember" class="ml-2">Se souvenir de moi</label>
            </div>
            <a href="#" class="forgot-link">Mot de passe oublié ?</a>
          </div>

          <Button
            type="submit"
            label="Se connecter"
            icon="pi pi-sign-in"
            :loading="loading"
            class="btn-primary w-full"
          />
        </form>

        <!-- Divider -->
        <Divider align="center" class="my-4">
          <span class="text-600 text-sm color-black">Nouveau sur SJConnect ?</span>
        </Divider>

        <Button
          @click="showRegisterForm = true"
          label="Créer un compte entreprise"
          icon="pi pi-plus"
          outlined
          class="btn-outline w-full"
        />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref<string | null>(null)
const showRegisterForm = ref(false)

const form = ref({
  email: '',
  password: '',
  remember: false
})

const errors = ref({
  email: '',
  password: ''
})

const clearError = () => {
  error.value = null
}

const validateLoginForm = () => {
  errors.value = { email: '', password: '' }
  let isValid = true

  if (!form.value.email.trim()) {
    errors.value.email = 'L’email est obligatoire'
    isValid = false
  }
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est obligatoire'
    isValid = false
  }
  return isValid
}

const handleLogin = async () => {
  if (!validateLoginForm()) return
  try {
    loading.value = true
    clearError()

    await authStore.login({
      username: form.value.email,
      password: form.value.password
    })

    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Fond dégradé moderne */
/* Styles professionnels pour la page Formulaire */
:host {
  --primary: #2C4A87;         
  --primary-dark: #1E3260;    
  --secondary: #F4A261;       
  --secondary-dark: #E76F51;  
  --bg: #F9FAFB;              
  --text: #212529;            
  --border: #B0B8C5;          /* Bordure plus visible */
  --input-bg: #FFFFFF;        
  --input-focus: #2C4A87;     
  --radius: 8px;              
  --shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* Container principal */
.page-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  background: var(--bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Titre */
.page-container h1 {
  font-size: 26px;
  margin-bottom: 25px;
  color: var(--primary-dark);
  border-bottom: 2px solid var(--primary);
  padding-bottom: 10px;
}

/* Labels */
.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
  font-size: 14px;
}

/* Champs (inputs, selects, textarea) */
.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  border: 2px solid var(--border);   /* Bordure visible */
  border-radius: var(--radius);
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.3s, box-shadow 0.3s;
  margin-bottom: 18px;
  box-sizing: border-box;
}

.form-input:focus, 
.form-select:focus, 
.form-textarea:focus {
  border-color: var(--input-focus);
  outline: none;
  box-shadow: 0 0 6px rgba(44, 74, 135, 0.25);
}

/* Bouton */
.form-button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  border: 2px solid var(--primary-dark);  /* Bordure ajoutée */
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.3s, transform 0.2s, border-color 0.3s;
  box-shadow: var(--shadow);
}

.form-button:hover {
  background: var(--primary-dark);
  border-color: var(--primary); /* Changement subtil au hover */
  transform: translateY(-2px);
}

/* Message d’erreur */
.form-error {
  color: var(--secondary-dark);
  font-size: 13px;
  margin-top: -12px;
  margin-bottom: 12px;
}

:deep(.p-divider .p-divider-content) {
  background: #0e0d0d;   /* Fond blanc (ou couleur de ta card) */
  padding: 0 8px;     /* Petit espace autour du texte */
  font-weight: 500;
  color: var(--text);
}


</style>
