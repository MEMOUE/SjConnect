<template>
  <div class="dashboard">
    <!-- En-tête du dashboard -->
    <Card class="mb-4">
      <template #content>
        <div class="flex justify-content-between align-items-center">
          <div>
            <h1 class="text-3xl font-bold text-900 m-0">Tableau de bord</h1>
            <p class="text-600 mt-2 mb-0">
              Bienvenue sur SJConnect
              <Chip 
                v-if="currentEntreprise" 
                :label="currentEntreprise.nom" 
                icon="pi pi-building"
                class="ml-2"
              />
            </p>
          </div>
          <div class="flex gap-2">
            <Button 
              label="Actions rapides" 
              icon="pi pi-plus" 
              @click="toggleActionsMenu"
              severity="secondary"
            />
            <Button 
              label="Actualiser" 
              icon="pi pi-refresh" 
              @click="refreshData"
              outlined
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Menu d'actions rapides -->
    <OverlayPanel ref="actionsMenu" class="w-20rem">
      <div class="p-3">
        <h6>Actions rapides</h6>
        <div class="flex flex-column gap-2">
          <Button 
            label="Créer un groupe" 
            icon="pi pi-users" 
            text 
            class="justify-content-start"
            @click="navigateTo('/groupes')"
          />
          <Button 
            label="Envoyer un message" 
            icon="pi pi-send" 
            text 
            class="justify-content-start"
            @click="navigateTo('/messages')"
          />
          <Button 
            label="Ajouter une entreprise" 
            icon="pi pi-building" 
            text 
            class="justify-content-start"
            @click="navigateTo('/entreprises')"
          />
        </div>
      </div>
    </OverlayPanel>

    <!-- Message si aucune entreprise sélectionnée -->
    <Message 
      v-if="!currentEntreprise" 
      severity="warn" 
      icon="pi pi-exclamation-triangle"
      class="mb-4"
    >
      <template #container>
        <div class="flex align-items-center gap-3 p-3">
          <i class="pi pi-exclamation-triangle text-2xl"></i>
          <div>
            <h5 class="m-0">Sélectionnez une entreprise</h5>
            <p class="m-0">Veuillez sélectionner une entreprise dans le menu du haut pour accéder aux fonctionnalités complètes.</p>
          </div>
        </div>
      </template>
    </Message>

    <!-- Statistiques globales -->
    <div v-if="!currentEntreprise" class="grid mb-4">
      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card">
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <div class="text-500 font-medium mb-2">Entreprises</div>
                <div class="text-900 font-bold text-3xl">{{ entreprises.length }}</div>
              </div>
              <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 3rem; height: 3rem">
                <i class="pi pi-building text-blue-500 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card">
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <div class="text-500 font-medium mb-2">Groupes</div>
                <div class="text-900 font-bold text-3xl">{{ groupes.length }}</div>
              </div>
              <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width: 3rem; height: 3rem">
                <i class="pi pi-users text-green-500 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card">
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <div class="text-500 font-medium mb-2">Messages</div>
                <div class="text-900 font-bold text-3xl">{{ messages.length }}</div>
              </div>
              <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 3rem; height: 3rem">
                <i class="pi pi-comments text-purple-500 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <Card class="stats-card">
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <div class="text-500 font-medium mb-2">Demandes</div>
                <div class="text-900 font-bold text-3xl">{{ demandesEnAttente.length }}</div>
              </div>
              <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 3rem; height: 3rem">
                <i class="pi pi-inbox text-orange-500 text-xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Dashboard spécifique à l'entreprise -->
    <div v-if="currentEntreprise" class="grid">
      <!-- Statistiques de l'entreprise -->
      <div class="col-12 mb-4">
        <Card>
          <template #title>
            <div class="flex align-items-center gap-2">
              <Avatar 
                :label="currentEntreprise.nom.charAt(0)" 
                size="large"
                style="background-color: var(--primary-color)"
              />
              <div>
                <div class="text-xl font-bold">{{ currentEntreprise.nom }}</div>
                <div class="text-500">Vue d'ensemble des activités</div>
              </div>
            </div>
          </template>
          <template #content>
            <div class="grid">
              <div class="col-12 md:col-3">
                <div class="text-center p-3 border-round bg-blue-50">
                  <i class="pi pi-building text-4xl text-blue-500 mb-3"></i>
                  <div class="text-900 font-bold text-2xl">{{ groupesPossedes.length }}</div>
                  <div class="text-500">Groupes possédés</div>
                </div>
              </div>
              <div class="col-12 md:col-3">
                <div class="text-center p-3 border-round bg-green-50">
                  <i class="pi pi-users text-4xl text-green-500 mb-3"></i>
                  <div class="text-900 font-bold text-2xl">{{ groupesMembres.length }}</div>
                  <div class="text-500">Membre de</div>
                </div>
              </div>
              <div class="col-12 md:col-3">
                <div class="text-center p-3 border-round bg-purple-50">
                  <i class="pi pi-comments text-4xl text-purple-500 mb-3"></i>
                  <div class="text-900 font-bold text-2xl">{{ conversations.length }}</div>
                  <div class="text-500">Conversations</div>
                </div>
              </div>
              <div class="col-12 md:col-3">
                <div class="text-center p-3 border-round bg-orange-50">
                  <i class="pi pi-clock text-4xl text-orange-500 mb-3"></i>
                  <div class="text-900 font-bold text-2xl">{{ demandesEnAttente.length }}</div>
                  <div class="text-500">En attente</div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Actions rapides -->
      <div class="col-12 md:col-4 mb-4">
        <Card>
          <template #title>Actions rapides</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <Button 
                label="Créer un groupe" 
                icon="pi pi-plus" 
                class="w-full justify-content-start"
                @click="navigateTo('/groupes')"
                outlined
              />
              <Button 
                label="Envoyer un message" 
                icon="pi pi-send" 
                class="w-full justify-content-start"
                @click="navigateTo('/messages')"
                outlined
              />
              <Button 
                label="Voir les demandes" 
                icon="pi pi-inbox" 
                class="w-full justify-content-start"
                @click="navigateTo('/demandes')"
                outlined
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Groupes récents -->
      <div class="col-12 md:col-8 mb-4">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Groupes récents</span>
              <Button 
                label="Voir tout" 
                text 
                size="small"
                @click="navigateTo('/groupes')"
              />
            </div>
          </template>
          <template #content>
            <div v-if="groupesPossedes.length > 0" class="flex flex-column gap-3">
              <div 
                v-for="groupe in groupesPossedes.slice(0, 3)" 
                :key="groupe.id"
                class="flex align-items-center justify-content-between p-3 border-1 surface-border border-round hover:surface-hover cursor-pointer"
                @click="navigateTo(`/groupes/${groupe.id}`)"
              >
                <div class="flex align-items-center gap-3">
                  <Avatar 
                    :label="groupe.nom.charAt(0)" 
                    style="background-color: var(--green-500)"
                  />
                  <div>
                    <div class="font-semibold">{{ groupe.nom }}</div>
                    <div class="text-500 text-sm">{{ groupe.nombre_membres }} membres</div>
                  </div>
                </div>
                <div class="flex align-items-center gap-2">
                  <Tag 
                    :value="groupe.est_public ? 'Public' : 'Privé'" 
                    :severity="groupe.est_public ? 'success' : 'info'"
                  />
                  <i class="pi pi-chevron-right text-400"></i>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="pi pi-users text-4xl text-400 mb-3"></i>
              <div class="text-500">Aucun groupe créé</div>
              <Button 
                label="Créer votre premier groupe" 
                icon="pi pi-plus" 
                text 
                class="mt-2"
                @click="navigateTo('/groupes')"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Conversations récentes -->
      <div class="col-12 md:col-6 mb-4">
        <Card>
          <template #title>
            <div class="flex justify-content-between align-items-center">
              <span>Conversations récentes</span>
              <Button 
                label="Voir tout" 
                text 
                size="small"
                @click="navigateTo('/messages')"
              />
            </div>
          </template>
          <template #content>
            <div v-if="conversations.length > 0" class="flex flex-column gap-3">
              <div 
                v-for="conversation in conversations.slice(0, 4)" 
                :key="conversation.id"
                class="flex align-items-center gap-3 p-2 border-round hover:surface-hover cursor-pointer"
                @click="navigateTo('/messages')"
              >
                <Avatar 
                  :label="getConversationPartner(conversation).charAt(0)"
                  style="background-color: var(--blue-500)"
                />
                <div class="flex-1">
                  <div class="font-semibold text-sm">{{ getConversationPartner(conversation) }}</div>
                  <div class="text-500 text-xs">{{ formatDate(conversation.derniere_activite) }}</div>
                </div>
                <Badge v-if="Math.random() > 0.5" value="2" severity="info" />
              </div>
            </div>
            <div v-else class="text-center py-4">
              <i class="pi pi-comments text-4xl text-400 mb-3"></i>
              <div class="text-500">Aucune conversation</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Activité récente -->
      <div class="col-12 md:col-6 mb-4">
        <Card>
          <template #title>Activité récente</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex align-items-start gap-3">
                <Avatar 
                  icon="pi pi-users" 
                  size="small"
                  style="background-color: var(--green-500)"
                />
                <div class="flex-1">
                  <div class="font-semibold text-sm">Nouveau membre ajouté</div>
                  <div class="text-500 text-xs">Innovation Lab a rejoint le groupe "Tech Innovators"</div>
                  <div class="text-400 text-xs mt-1">Il y a 2 heures</div>
                </div>
              </div>
              
              <div class="flex align-items-start gap-3">
                <Avatar 
                  icon="pi pi-envelope" 
                  size="small"
                  style="background-color: var(--blue-500)"
                />
                <div class="flex-1">
                  <div class="font-semibold text-sm">Message reçu</div>
                  <div class="text-500 text-xs">StartupXYZ vous a envoyé un message</div>
                  <div class="text-400 text-xs mt-1">Il y a 5 heures</div>
                </div>
              </div>
              
              <div class="flex align-items-start gap-3">
                <Avatar 
                  icon="pi pi-check" 
                  size="small"
                  style="background-color: var(--orange-500)"
                />
                <div class="flex-1">
                  <div class="font-semibold text-sm">Demande acceptée</div>
                  <div class="text-500 text-xs">Votre demande pour rejoindre "Business Network" a été acceptée</div>
                  <div class="text-400 text-xs mt-1">Il y a 1 jour</div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore, useEntreprisesStore, useGroupesStore, useMessagesStore, useDemandesStore } from '../stores'
import type { ConversationDirecte } from '../services/api'

const router = useRouter()
const appStore = useAppStore()
const entreprisesStore = useEntreprisesStore()
const groupesStore = useGroupesStore()
const messagesStore = useMessagesStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { entreprises } = storeToRefs(entreprisesStore)
const { groupes, groupesPossedes, groupesMembres } = storeToRefs(groupesStore)
const { messages, conversations } = storeToRefs(messagesStore)
const { demandesEnAttente } = storeToRefs(demandesStore)

const actionsMenu = ref()

// Méthodes
const toggleActionsMenu = (event: Event) => {
  actionsMenu.value.toggle(event)
}

const navigateTo = (path: string) => {
  router.push(path)
  actionsMenu.value?.hide()
}

const refreshData = async () => {
  if (currentEntreprise.value) {
    await loadEntrepriseData()
  }
}

const getConversationPartner = (conversation: ConversationDirecte): string => {
  if (!currentEntreprise.value) return ''
  
  if (conversation.entreprise1 === currentEntreprise.value.id) {
    return conversation.entreprise2_nom
  } else {
    return conversation.entreprise1_nom
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return 'Aujourd\'hui'
  } else if (days === 1) {
    return 'Hier'
  } else if (days < 7) {
    return `Il y a ${days} jours`
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

const loadEntrepriseData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    await Promise.all([
      groupesStore.loadGroupesPossedes(currentEntreprise.value.id),
      groupesStore.loadGroupesMembres(currentEntreprise.value.id),
      messagesStore.loadConversations(currentEntreprise.value.id),
      demandesStore.loadDemandes(currentEntreprise.value.id)
    ])
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      groupesStore.loadGroupes(),
      messagesStore.loadMessages(currentEntreprise.value?.id || 0)
    ])
    
    if (currentEntreprise.value) {
      await loadEntrepriseData()
    }
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error)
  }
})

// Watch pour recharger les données quand l'entreprise change
watch(currentEntreprise, async (newEntreprise) => {
  if (newEntreprise) {
    await loadEntrepriseData()
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-card {
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
}

.stats-card .p-card-content {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0 0.5rem;
  }
}
</style>