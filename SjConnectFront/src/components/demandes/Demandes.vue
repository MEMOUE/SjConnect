<template>
  <div class="demandes-container p-4">
    <!-- En-tête -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold text-900 m-0">Demandes d'intégration</h2>
        <p class="text-600 mt-1 mb-0">Gérez les demandes d'accès aux groupes</p>
      </div>
      <Button
        v-if="currentEntreprise"
        @click="showJoinModal = true"
        label="Demander à rejoindre un groupe"
        icon="pi pi-plus"
      />
    </div>

    <!-- Message si aucune entreprise sélectionnée -->
    <Message 
      v-if="!currentEntreprise" 
      severity="warn" 
      class="mb-4"
    >
      <template #messageicon>
        <i class="pi pi-exclamation-triangle"></i>
      </template>
      <div>
        <h5 class="m-0">Sélectionnez une entreprise</h5>
        <p class="m-0 mt-1">Vous devez sélectionner une entreprise pour voir les demandes d'intégration.</p>
      </div>
    </Message>

    <div v-if="currentEntreprise" class="flex flex-column gap-6">
      <!-- Filtres -->
      <Card>
        <template #content>
          <div class="grid">
            <div class="col-12 md:col-4">
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search"></i>
                </InputGroupAddon>
                <InputText
                  v-model="searchQuery"
                  placeholder="Rechercher par nom de groupe ou d'entreprise..."
                />
              </InputGroup>
            </div>
            <div class="col-12 md:col-4">
              <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous les statuts"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-4">
              <Dropdown
                v-model="typeFilter"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous les types"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Statistiques -->
      <div class="grid">
        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center hover-lift">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-orange-100 p-3 border-round-lg">
                  <i class="pi pi-clock text-orange-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-orange-600 mb-1">{{ demandesEnAttente.length }}</div>
              <div class="text-600">En attente</div>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center hover-lift">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-green-100 p-3 border-round-lg">
                  <i class="pi pi-check text-green-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-green-600 mb-1">{{ demandesAcceptees.length }}</div>
              <div class="text-600">Acceptées</div>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center hover-lift">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-red-100 p-3 border-round-lg">
                  <i class="pi pi-times text-red-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-red-600 mb-1">{{ demandesRefusees.length }}</div>
              <div class="text-600">Refusées</div>
            </template>
          </Card>
        </div>

        <div class="col-12 md:col-6 lg:col-3">
          <Card class="stats-card text-center hover-lift">
            <template #content>
              <div class="flex align-items-center justify-content-center mb-3">
                <div class="bg-blue-100 p-3 border-round-lg">
                  <i class="pi pi-list text-blue-500 text-2xl"></i>
                </div>
              </div>
              <div class="text-2xl font-bold text-blue-600 mb-1">{{ demandes.length }}</div>
              <div class="text-600">Total</div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Liste des demandes -->
      <Card>
        <template #title>
          <div class="flex justify-content-between align-items-center">
            <span>Demandes d'intégration ({{ filteredDemandes.length }})</span>
          </div>
        </template>

        <template #content>
          <div v-if="loading" class="text-center py-6">
            <ProgressSpinner />
            <p class="mt-2 text-600">Chargement...</p>
          </div>

          <div v-else-if="filteredDemandes.length === 0" class="text-center py-8">
            <i class="pi pi-inbox text-6xl text-400 mb-4"></i>
            <h4 class="text-900 mb-2">Aucune demande trouvée</h4>
            <p class="text-600 mb-0">
              {{ searchQuery ? 'Aucune demande ne correspond à votre recherche.' : 'Aucune demande d\'intégration pour le moment.' }}
            </p>
          </div>

          <div v-else class="flex flex-column gap-4">
            <Card
              v-for="demande in filteredDemandes"
              :key="demande.id"
              class="demande-card hover-card"
            >
              <template #content>
                <div class="flex align-items-start justify-content-between p-3">
                  <div class="flex-1">
                    <div class="flex align-items-center mb-3">
                      <!-- Avatar du demandeur -->
                      <Avatar
                        :label="demande.entreprise_demandeur_nom.charAt(0)"
                        size="large"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        class="mr-4"
                      />
                      
                      <div class="flex-1">
                        <!-- En-tête de la demande -->
                        <div class="flex align-items-center gap-2 mb-1">
                          <h4 class="text-lg font-medium text-900 m-0">
                            {{ demande.entreprise_demandeur_nom }}
                          </h4>
                          <i class="pi pi-arrow-right text-500"></i>
                          <span class="text-lg font-medium text-primary">
                            {{ demande.groupe_cible_nom }}
                          </span>
                        </div>
                        
                        <!-- Type de demande -->
                        <div class="text-sm text-600 mb-2">
                          <span v-if="isReceivedDemande(demande)">
                            Demande pour rejoindre votre groupe
                          </span>
                          <span v-else>
                            Votre demande pour rejoindre le groupe de {{ demande.groupe_proprietaire_nom }}
                          </span>
                        </div>
                        
                        <!-- Message de la demande -->
                        <div v-if="demande.message_demande" class="p-3 surface-100 border-round mb-3">
                          <p class="text-sm text-700 m-0">{{ demande.message_demande }}</p>
                        </div>
                        
                        <!-- Métadonnées -->
                        <div class="flex align-items-center justify-content-between">
                          <div class="flex align-items-center gap-4 text-sm text-600">
                            <div class="flex align-items-center">
                              <i class="pi pi-calendar mr-1"></i>
                              {{ formatDate(demande.date_demande) }}
                            </div>
                            
                            <div v-if="demande.date_reponse" class="flex align-items-center">
                              <i class="pi pi-clock mr-1"></i>
                              Traitée le {{ formatDate(demande.date_reponse) }}
                            </div>
                          </div>
                          
                          <!-- Statut -->
                          <Tag
                            :value="getStatusText(demande.statut)"
                            :severity="getStatusSeverity(demande.statut)"
                            :icon="getStatusIcon(demande.statut)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex align-items-center gap-2 ml-4">
                    <!-- Bouton voir le groupe -->
                    <Button
                      @click="viewGroup(demande)"
                      icon="pi pi-eye"
                      text
                      rounded
                      severity="secondary"
                      v-tooltip="'Voir le groupe'"
                    />
                    
                    <!-- Actions pour les demandes reçues en attente -->
                    <div v-if="isReceivedDemande(demande) && demande.statut === 'EN_ATTENTE'" class="flex gap-2">
                      <Button
                        @click="respondToDemande(demande, true)"
                        label="Accepter"
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                      />
                      
                      <Button
                        @click="respondToDemande(demande, false)"
                        label="Refuser"
                        icon="pi pi-times"
                        severity="danger"
                        size="small"
                      />
                    </div>
                    
                    <!-- Indicateur pour les demandes envoyées -->
                    <div v-else-if="!isReceivedDemande(demande) && demande.statut === 'EN_ATTENTE'" class="text-sm text-600 italic">
                      En attente de réponse...
                    </div>
                  </div>
                </div>
                
                <!-- Informations supplémentaires selon le statut -->
                <div v-if="demande.statut !== 'EN_ATTENTE'" class="mt-4 p-3 border-round" :class="getStatusBgClass(demande.statut)">
                  <div class="flex align-items-center">
                    <i 
                      :class="[
                        'mr-2 text-lg',
                        demande.statut === 'ACCEPTEE' ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'
                      ]"
                    ></i>
                    <div class="text-sm">
                      <p :class="['m-0 font-medium', demande.statut === 'ACCEPTEE' ? 'text-green-700' : 'text-red-700']">
                        <span v-if="demande.statut === 'ACCEPTEE'">
                          {{ isReceivedDemande(demande) ? 'Vous avez accepté cette demande.' : 'Votre demande a été acceptée ! Vous pouvez maintenant participer aux discussions du groupe.' }}
                        </span>
                        <span v-else>
                          {{ isReceivedDemande(demande) ? 'Vous avez refusé cette demande.' : 'Votre demande a été refusée.' }}
                        </span>
                      </p>
                      <p v-if="demande.date_reponse" class="text-xs mt-1 mb-0 opacity-75">
                        {{ formatDateTime(demande.date_reponse) }}
                      </p>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </template>
      </Card>
    </div>

    <!-- Modal pour demander à rejoindre un groupe -->
    <Dialog 
      v-model:visible="showJoinModal" 
      :modal="true" 
      header="Demander à rejoindre un groupe"
      class="w-full max-w-3xl"
    >
      <JoinGroupForm
        :current-entreprise="currentEntreprise"
        @submitted="onJoinRequestSubmitted"
        @close="showJoinModal = false"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppStore, useDemandesStore } from '../../stores'
import type { DemandeIntegration } from '../../services/api'

const router = useRouter()
const toast = useToast()

const appStore = useAppStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { demandes, demandesEnAttente } = storeToRefs(demandesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const showJoinModal = ref(false)

// Options pour les dropdowns
const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Acceptées', value: 'ACCEPTEE' },
  { label: 'Refusées', value: 'REFUSEE' }
]

const typeOptions = [
  { label: 'Tous les types', value: '' },
  { label: 'Demandes reçues', value: 'received' },
  { label: 'Demandes envoyées', value: 'sent' }
]

// Computed
const filteredDemandes = computed(() => {
  return demandes.value.filter(demande => {
    const matchesSearch = 
      demande.groupe_cible_nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      demande.entreprise_demandeur_nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      demande.groupe_proprietaire_nom.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' || demande.statut === statusFilter.value
    
    const matchesType = typeFilter.value === '' ||
      (typeFilter.value === 'received' && isReceivedDemande(demande)) ||
      (typeFilter.value === 'sent' && isSentDemande(demande))
    
    return matchesSearch && matchesStatus && matchesType
  })
})

const demandesAcceptees = computed(() => 
  demandes.value.filter(d => d.statut === 'ACCEPTEE')
)

const demandesRefusees = computed(() => 
  demandes.value.filter(d => d.statut === 'REFUSEE')
)

// Méthodes
const isReceivedDemande = (demande: DemandeIntegration): boolean => {
  if (!currentEntreprise.value) return false
  return demande.groupe_proprietaire_nom === currentEntreprise.value.nom
}

const isSentDemande = (demande: DemandeIntegration): boolean => {
  if (!currentEntreprise.value) return false
  return demande.entreprise_demandeur === currentEntreprise.value.id
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Aujourd\'hui'
  } else if (diffDays === 2) {
    return 'Hier'
  } else if (diffDays <= 7) {
    return `Il y a ${diffDays - 1} jours`
  } else {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
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

const getStatusText = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'En attente'
    case 'ACCEPTEE':
      return 'Acceptée'
    case 'REFUSEE':
      return 'Refusée'
    default:
      return statut
  }
}

const getStatusSeverity = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'warning'
    case 'ACCEPTEE':
      return 'success'
    case 'REFUSEE':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusIcon = (statut: string): string => {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'pi pi-clock'
    case 'ACCEPTEE':
      return 'pi pi-check'
    case 'REFUSEE':
      return 'pi pi-times'
    default:
      return 'pi pi-info-circle'
  }
}

const getStatusBgClass = (statut: string): string => {
  switch (statut) {
    case 'ACCEPTEE':
      return 'surface-100 border-green-200 border-1'
    case 'REFUSEE':
      return 'surface-100 border-red-200 border-1'
    default:
      return 'surface-100 border-surface-200 border-1'
  }
}

const respondToDemande = async (demande: DemandeIntegration, accepter: boolean) => {
  try {
    await demandesStore.repondreDemande(demande.id, accepter)
    
    const action = accepter ? 'acceptée' : 'refusée'
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `Demande ${action} avec succès !`,
      life: 3000
    })
  } catch (error: any) {
    console.error('Erreur lors de la réponse:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Erreur lors de la réponse à la demande',
      life: 5000
    })
  }
}

const viewGroup = (demande: DemandeIntegration) => {
  router.push(`/groupes/${demande.groupe_cible}`)
}

const onJoinRequestSubmitted = () => {
  showJoinModal.value = false
  loadData()
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Demande envoyée avec succès !',
    life: 3000
  })
}

const loadData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    await demandesStore.loadDemandes(currentEntreprise.value.id)
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des demandes',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (currentEntreprise.value) {
    await loadData()
  }
})

// Watchers
watch(currentEntreprise, async (newEntreprise) => {
  if (newEntreprise) {
    await loadData()
  }
})
</script>

<style scoped>
.demandes-container {
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

.demande-card {
  transition: all 0.2s ease;
}

.hover-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>