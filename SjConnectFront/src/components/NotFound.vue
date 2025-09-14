<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Illustration d'erreur -->
      <div>
        <div class="mx-auto h-32 w-32 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <!-- Code d'erreur 404 -->
        <div class="mt-6">
          <h1 class="text-9xl font-bold text-gray-300">404</h1>
        </div>
      </div>

      <!-- Titre et description -->
      <div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Page non trouvée
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Désolé, nous n'avons pas pu trouver la page que vous recherchez. 
          Elle a peut-être été déplacée, supprimée ou l'URL est incorrecte.
        </p>
      </div>

      <!-- Actions -->
      <div class="mt-8 space-y-4">
        <div class="flex justify-center space-x-4">
          <router-link
            to="/"
            class="btn-primary btn-md"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour à l'accueil
          </router-link>
          
          <button
            @click="goBack"
            class="btn-secondary btn-md"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Page précédente
          </button>
        </div>
      </div>

      <!-- Liens utiles -->
      <div class="mt-12">
        <h3 class="text-sm font-medium text-gray-900 mb-4">
          Peut-être que vous cherchiez :
        </h3>
        <div class="space-y-2">
          <router-link
            to="/entreprises"
            class="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            📋 Voir toutes les entreprises
          </router-link>
          <router-link
            to="/groupes"
            class="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            👥 Explorer les groupes
          </router-link>
          <router-link
            to="/messages"
            class="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            💬 Accéder aux messages
          </router-link>
          <router-link
            to="/demandes"
            class="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            📩 Gérer les demandes d'intégration
          </router-link>
        </div>
      </div>

      <!-- Informations de contact ou support -->
      <div class="mt-12 p-4 bg-gray-100 rounded-lg">
        <p class="text-xs text-gray-500">
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'équipe technique.
        </p>
        <div class="mt-2 flex justify-center space-x-4">
          <a 
            href="mailto:support@sjconnect.com" 
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            📧 Support technique
          </a>
          <a 
            href="/aide" 
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            ❓ Centre d'aide
          </a>
        </div>
      </div>

      <!-- Animation de chargement décorative -->
      <div class="mt-8">
        <div class="flex justify-center space-x-1">
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  // Vérifier s'il y a une page précédente dans l'historique
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // Sinon rediriger vers l'accueil
    router.push('/')
  }
}
</script>

<style scoped>
/* Animation personnalisée pour les points de chargement */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.animate-bounce {
  animation: bounce 1.5s infinite;
}
</style>