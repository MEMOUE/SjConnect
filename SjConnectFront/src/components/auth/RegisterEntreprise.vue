<template>
  <div class="register-container">
    <Card class="register-card max-w-4xl">
      <template #header>
        <div class="text-center py-4">
          <Avatar 
            icon="pi pi-building" 
            size="xlarge"
            style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white"
            class="mb-4"
          />
          <h2 class="text-2xl font-bold text-900 m-0 mb-2">Inscription de votre entreprise</h2>
          <p class="text-600 m-0">
            Rejoignez la plateforme SJConnect et connectez-vous avec d'autres entreprises
          </p>
        </div>
      </template>

      <template #content>
        <!-- Étapes du processus -->
        <div class="mb-6">
          <div class="flex justify-content-between align-items-center mb-4">
            <div 
              v-for="(step, index) in steps" 
              :key="index"
              :class="[
                'step-indicator',
                { 'active': currentStep === index, 'completed': currentStep > index }
              ]"
            >
              <div class="step-number">
                <i v-if="currentStep > index" class="pi pi-check"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="step-label">{{ step }}</span>
            </div>
          </div>
          <ProgressBar :value="((currentStep + 1) / steps.length) * 100" class="h-1rem" />
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

        <!-- Formulaire multi-étapes -->
        <form @submit.prevent="handleSubmit">
          <!-- Étape 1: Informations de l'entreprise -->
          <div v-show="currentStep === 0" class="step-content">
            <h3 class="text-xl font-semibold text-900 mb-4">
              <i class="pi pi-building mr-2"></i>Informations de l'entreprise
            </h3>
            
            <div class="grid">
              <div class="col-12">
                <label for="nom_entreprise" class="block font-medium mb-2">Nom de l'entreprise *</label>
                <InputText
                  id="nom_entreprise"
                  v-model="form.nom_entreprise"
                  placeholder="Nom de votre entreprise"
                  class="w-full"
                  :class="{ 'p-invalid': errors.nom_entreprise }"
                />
                <small v-if="errors.nom_entreprise" class="p-error">{{ errors.nom_entreprise }}</small>
              </div>
              
              <div class="col-12">
                <label for="email_entreprise" class="block font-medium mb-2">Email de l'entreprise *</label>
                <InputText
                  id="email_entreprise"
                  v-model="form.email_entreprise"
                  type="email"
                  placeholder="contact@entreprise.com"
                  class="w-full"
                  :class="{ 'p-invalid': errors.email_entreprise }"
                />
                <small v-if="errors.email_entreprise" class="p-error">{{ errors.email_entreprise }}</small>
                <small class="text-600 block mt-1">
                  Cet email sera utilisé pour les communications officielles
                </small>
              </div>
              
              <div class="col-12">
                <label for="description_entreprise" class="block font-medium mb-2">Description de l'entreprise</label>
                <Textarea
                  id="description_entreprise"
                  v-model="form.description_entreprise"
                  :rows="4"
                  placeholder="Décrivez brièvement votre entreprise, ses activités..."
                  class="w-full"
                />
                <small class="text-600">Optionnel - Aidez les autres entreprises à vous connaître</small>
              </div>
            </div>
          </div>

          <!-- Étape 2: Compte administrateur -->
          <div v-show="currentStep === 1" class="step-content">
            <h3 class="text-xl font-semibold text-900 mb-4">
              <i class="pi pi-user mr-2"></i>Compte administrateur
            </h3>
            <p class="text-600 mb-4">Ce sera votre compte personnel pour gérer l'entreprise</p>
            
            <div class="grid">
              <div class="col-12 md:col-6">
                <label for="first_name" class="block font-medium mb-2">Prénom</label>
                <InputText
                  id="first_name"
                  v-model="form.first_name"
                  placeholder="Votre prénom"
                  class="w-full"
                />
              </div>
              
              <div class="col-12 md:col-6">
                <label for="last_name" class="block font-medium mb-2">Nom</label>
                <InputText
                  id="last_name"
                  v-model="form.last_name"
                  placeholder="Votre nom"
                  class="w-full"
                />
              </div>

              <div class="col-12">
                <label for="register_username" class="block font-medium mb-2">Nom d'utilisateur *</label>
                <InputText
                  id="register_username"
                  v-model="form.username"
                  placeholder="Nom d'utilisateur pour vous connecter"
                  class="w-full"
                  :class="{ 'p-invalid': errors.username }"
                />
                <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
              </div>

              <div class="col-12">
                <label for="register_email" class="block font-medium mb-2">Email personnel *</label>
                <InputText
                  id="register_email"
                  v-model="form.email"
                  type="email"
                  placeholder="votre.email@example.com"
                  class="w-full"
                  :class="{ 'p-invalid': errors.email }"
                />
                <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
              </div>

              <div class="col-12">
                <label for="poste" class="block font-medium mb-2">Poste/Fonction</label>
                <InputText
                  id="poste"
                  v-model="form.poste"
                  placeholder="Directeur, CEO, Gérant..."
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Étape 3: Sécurité -->
          <div v-show="currentStep === 2" class="step-content">
            <h3 class="text-xl font-semibold text-900 mb-4">
              <i class="pi pi-shield mr-2"></i>Sécurité du compte
            </h3>
            
            <div class="grid">
              <div class="col-12 md:col-6">
                <label for="register_password" class="block font-medium mb-2">Mot de passe *</label>
                <Password
                  id="register_password"
                  v-model="form.password"
                  placeholder="Mot de passe sécurisé"
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
              </div>

              <div class="col-12 md:col-6">
                <label for="confirm_password" class="block font-medium mb-2">Confirmer le mot de passe *</label>
                <Password
                  id="confirm_password"
                  v-model="form.confirmPassword"
                  placeholder="Confirmez votre mot de passe"
                  :feedback="false"
                  toggleMask
                  class="w-full"
                  :class="{ 'p-invalid': errors.confirmPassword }"
                />
                <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
              </div>
            </div>

            <!-- Critères du mot de passe -->
            <div class="bg-blue-50 border-blue-200 border-1 border-round p-4 mt-4">
              <h5 class="text-blue-800 mb-3 mt-0">
                <i class="pi pi-info-circle mr-2"></i>Critères de sécurité
              </h5>
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div v-for="criterion in passwordCriteria" :key="criterion.label" class="flex align-items-center mb-2">
                    <i 
                      :class="[
                        'mr-2', 
                        criterion.valid(form.password) ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-gray-400'
                      ]"
                    ></i>
                    <span :class="criterion.valid(form.password) ? 'text-green-700' : 'text-gray-600'">
                      {{ criterion.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Étape 4: Confirmation -->
          <div v-show="currentStep === 3" class="step-content">
            <h3 class="text-xl font-semibold text-900 mb-4">
              <i class="pi pi-check-circle mr-2"></i>Confirmation
            </h3>

            <!-- Récapitulatif -->
            <div class="grid">
              <div class="col-12 md:col-6">
                <Panel header="Informations de l'entreprise" class="mb-4">
                  <div class="flex flex-column gap-2">
                    <div><strong>Nom:</strong> {{ form.nom_entreprise }}</div>
                    <div><strong>Email:</strong> {{ form.email_entreprise }}</div>
                    <div v-if="form.description_entreprise">
                      <strong>Description:</strong> {{ form.description_entreprise.substring(0, 100) }}{{ form.description_entreprise.length > 100 ? '...' : '' }}
                    </div>
                  </div>
                </Panel>
              </div>

              <div class="col-12 md:col-6">
                <Panel header="Compte administrateur" class="mb-4">
                  <div class="flex flex-column gap-2">
                    <div><strong>Nom complet:</strong> {{ form.first_name }} {{ form.last_name }}</div>
                    <div><strong>Nom d'utilisateur:</strong> {{ form.username }}</div>
                    <div><strong>Email:</strong> {{ form.email }}</div>
                    <div v-if="form.poste"><strong>Poste:</strong> {{ form.poste }}</div>
                  </div>
                </Panel>
              </div>
            </div>

            <!-- Informations importantes -->
            <Message severity="info" :closable="false" class="mb-4">
              <template #icon>
                <i class="pi pi-info-circle"></i>
              </template>
              <div>
                <h5 class="m-0 mb-2">À propos de votre inscription</h5>
                <ul class="m-0 pl-3">
                  <li>En tant qu'administrateur, vous pourrez créer des comptes pour vos employés</li>
                  <li>Vous pourrez créer et gérer des groupes de discussion</li>
                  <li>Votre entreprise pourra demander à rejoindre d'autres groupes</li>
                  <li>Les employés pourront échanger dans les groupes avec des messages privés (entreprise) ou publics</li>
                </ul>
              </div>
            </Message>

            <!-- Conditions d'utilisation -->
            <div class="flex align-items-start mb-4">
              <Checkbox 
                id="accept_terms" 
                v-model="form.acceptTerms" 
                :binary="true"
                class="mr-2"
                :class="{ 'p-invalid': errors.acceptTerms }"
              />
              <label for="accept_terms" class="text-sm">
                J'accepte les <a href="/conditions" target="_blank" class="text-primary">conditions d'utilisation</a> 
                et la <a href="/confidentialite" target="_blank" class="text-primary">politique de confidentialité</a> *
              </label>
            </div>
            <small v-if="errors.acceptTerms" class="p-error">{{ errors.acceptTerms }}</small>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-content-between align-items-center">
          <Button
            v-if="currentStep > 0"
            label="Précédent"
            icon="pi pi-chevron-left"
            outlined
            @click="previousStep"
            :disabled="loading"
          />
          <div v-else></div>

          <div class="flex gap-2">
            <Button
              label="Déjà inscrit ?"
              text
              @click="$emit('showLogin')"
              class="p-button-secondary"
            />
            
            <Button
              v-if="currentStep < steps.length - 1"
              label="Suivant"
              icon="pi pi-chevron-right"
              iconPos="right"
              @click="nextStep"
              :disabled="!isCurrentStepValid"
            />
            
            <Button
              v-else
              label="Créer l'entreprise"
              icon="pi pi-check"
              :loading="loading"
              :disabled="!isFormComplete"
              @click="handleSubmit"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Password from 'primevue/password'

const router = useRouter()

const emit = defineEmits<{
  register: [data: any]
  showLogin: []
  clearError: []
}>()

interface Props {
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

// État local
const currentStep = ref(0)
const steps = ['Entreprise', 'Compte', 'Sécurité', 'Confirmation']

const form = ref({
  // Données entreprise
  nom_entreprise: '',
  email_entreprise: '',
  description_entreprise: '',
  
  // Données utilisateur admin
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  poste: 'Administrateur',
  
  // Conditions
  acceptTerms: false
})

const errors = ref({
  nom_entreprise: '',
  email_entreprise: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// Critères du mot de passe
const passwordCriteria = [
  { label: 'Au moins 8 caractères', valid: (password: string) => password.length >= 8 },
  { label: 'Une lettre majuscule', valid: (password: string) => /[A-Z]/.test(password) },
  { label: 'Une lettre minuscule', valid: (password: string) => /[a-z]/.test(password) },
  { label: 'Un chiffre', valid: (password: string) => /\d/.test(password) },
  { label: 'Un caractère spécial', valid: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password) }
]

// Computed
const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 0:
      return form.value.nom_entreprise.trim() && 
             form.value.email_entreprise.trim() && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email_entreprise)
    case 1:
      return form.value.username.trim() && 
             form.value.email.trim() && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
    case 2:
      return form.value.password.length >= 8 && 
             form.value.password === form.value.confirmPassword &&
             passwordCriteria.every(criterion => criterion.valid(form.value.password))
    case 3:
      return form.value.acceptTerms
    default:
      return true
  }
})

const isFormComplete = computed(() => {
  return form.value.nom_entreprise.trim() &&
         form.value.email_entreprise.trim() &&
         form.value.username.trim() &&
         form.value.email.trim() &&
         form.value.password &&
         form.value.confirmPassword &&
         form.value.password === form.value.confirmPassword &&
         passwordCriteria.every(criterion => criterion.valid(form.value.password)) &&
         form.value.acceptTerms
})

// Méthodes
const clearError = () => {
  emit('clearError')
}

const nextStep = () => {
  if (isCurrentStepValid.value && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const validateForm = (): boolean => {
  errors.value = {
    nom_entreprise: '',
    email_entreprise: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: ''
  }

  let isValid = true

  if (!form.value.nom_entreprise.trim()) {
    errors.value.nom_entreprise = 'Le nom de l\'entreprise est requis'
    isValid = false
  }

  if (!form.value.email_entreprise.trim()) {
    errors.value.email_entreprise = 'L\'email de l\'entreprise est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email_entreprise)) {
    errors.value.email_entreprise = 'Format d\'email invalide'
    isValid = false
  }

  if (!form.value.username.trim()) {
    errors.value.username = 'Le nom d\'utilisateur est requis'
    isValid = false
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'L\'email personnel est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
    isValid = false
  }

  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est requis'
    isValid = false
  } else if (!passwordCriteria.every(criterion => criterion.valid(form.value.password))) {
    errors.value.password = 'Le mot de passe ne respecte pas les critères de sécurité'
    isValid = false
  }

  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    isValid = false
  }

  if (!form.value.acceptTerms) {
    errors.value.acceptTerms = 'Vous devez accepter les conditions d\'utilisation'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    // Aller à la première étape avec des erreurs
    for (let i = 0; i < steps.length; i++) {
      currentStep.value = i
      if (!isCurrentStepValid.value) break
    }
    return
  }

  const registrationData = {
    nom_entreprise: form.value.nom_entreprise.trim(),
    email_entreprise: form.value.email_entreprise.trim(),
    description_entreprise: form.value.description_entreprise.trim(),
    username: form.value.username.trim(),
    email: form.value.email.trim(),
    password: form.value.password,
    first_name: form.value.first_name.trim(),
    last_name: form.value.last_name.trim(),
    poste: form.value.poste.trim() || 'Administrateur'
  }

  emit('register', registrationData)
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.register-card {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

/* Indicateurs d'étapes */
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-indicator:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 60%;
  right: -40%;
  height: 2px;
  background-color: var(--surface-300);
  z-index: 1;
}

.step-indicator.completed:not(:last-child)::after,
.step-indicator.active:not(:last-child)::after {
  background-color: var(--primary-color);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-200);
  color: var(--surface-600);
  font-weight: bold;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.step-indicator.active .step-number {
  background-color: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

.step-indicator.completed .step-number {
  background-color: var(--green-500);
  color: white;
}

.step-label {
  font-size: 0.875rem;
  text-align: center;
  color: var(--surface-600);
}

.step-indicator.active .step-label {
  color: var(--primary-color);
  font-weight: 600;
}

.step-indicator.completed .step-label {
  color: var(--green-600);
}

/* Contenu des étapes */
.step-content {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .register-card {
    margin: 1rem;
  }
  
  .step-label {
    display: none;
  }
  
  .step-indicator {
    flex-direction: row;
    justify-content: center;
  }
}
</style>