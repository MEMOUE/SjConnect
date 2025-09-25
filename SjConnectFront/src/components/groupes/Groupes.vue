<template>
  <div class="groupes-container p-4">
    <!-- En-tête -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold text-900 m-0">Groupes</h2>
        <p class="text-600 mt-1 mb-0">Gérez vos groupes de discussion</p>
      </div>
      <Button
        v-if="currentEntreprise"
        @click="showCreateModal = true"
        label="Nouveau groupe"
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
        <p class="m-0 mt-1">Vous devez sélectionner une entreprise pour voir et gérer les groupes.</p>
      </div>
    </Message>

    <div v-if="currentEntreprise" class="space-y-6">
      <!-- Filtres et recherche -->
      <Card class="mb-4">
        <template #content>
          <div class="grid">
            <div class="col-12 md:col-6">
              <InputGroup>
                <InputGroupAddon>
                  <i class="pi pi-search"></i>
                </InputGroupAddon>
                <InputText
                  v-model="searchQuery"
                  placeholder="Rechercher un groupe..."
                />
              </InputGroup>
            </div>
            <div class="col-12 md:col-3">
              <Dropdown
                v-model="viewFilter"
                :options="viewOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Filtrer par type"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-3">
              <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Filtrer par statut"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Groupes possédés -->
      <Card v-if="viewFilter === 'all' || viewFilter === 'owned'">
        <template #title>
          <div class="flex justify-content-between align-items-center">
            <span>Groupes que vous possédez ({{ groupesPossedes.length }})</span>
            <Button
              v-if="groupesPossedes.length === 0"
              @click="showCreateModal = true"
              label="Créer un groupe"
              icon="pi pi-plus"
              outlined
            />
          </div>
        </template>
        <template #content>
          <div v-if="groupesPossedes.length === 0" class="text-center py-8">
            <i class="pi pi-users text-6xl text-400 mb-4"></i>
            <h3 class="text-900 mb-2">Aucun groupe créé</h3>
            <p class="text-600 mb-4">Commencez par créer votre premier groupe.</p>
          </div>

          <div v-else class="space-y-4">
            <Card
              v-for="groupe in filteredGroupesPossedes"
              :key="groupe.id"
              class="hover-card cursor-pointer"
              @click="viewGroupe(groupe)"
            >
              <template #content>
                <div class="flex align-items-center justify-content-between p-2">
                  <div class="flex align-items-center">
                    <Avatar
                      :label="groupe.nom.charAt(0)"
                      size="large"
                      style="background-color: var(--green-500)"
                      class="mr-4"
                    />
                    <div>
                      <h4 class="text-lg font-semibold text-900 m-0">{{ groupe.nom }}</h4>
                      <p class="text-600 m-0 mb-2">{{ groupe.nombre_membres }} membres</p>
                      <div v-if="groupe.description" class="text-sm text-500 mb-2">
                        {{ groupe.description }}
                      </div>
                      <div class="flex align-items-center gap-3">
                        <Tag
                          :value="groupe.est_public ? 'Public' : 'Privé'"
                          :severity="groupe.est_public ? 'success' : 'info'"
                        />
                        <span class="text-xs text-500">
                          {{ formatDate(groupe.date_creation) }}
                        </span>
                        <Chip
                          label="Propriétaire"
                          class="bg-blue-100 text-blue-700"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div class="flex align-items-center gap-2">
                    <Button
                      @click.stop="editGroupe(groupe)"
                      icon="pi pi-pencil"
                      text
                      rounded
                      severity="secondary"
                      v-tooltip="'Modifier'"
                    />
                    <Button
                      @click.stop="confirmDelete(groupe)"
                      icon="pi pi-trash"
                      text
                      rounded
                      severity="danger"
                      v-tooltip="'Supprimer'"
                    />
                    <Button
                      icon="pi pi-eye"
                      text
                      rounded
                      v-tooltip="'Voir le groupe'"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </template>
      </Card>

      <!-- Groupes dont on est membre -->
      <Card v-if="viewFilter === 'all' || viewFilter === 'member'">
        <template #title>
          Groupes où vous êtes membre ({{ groupesMembres.length }})
        </template>
        <template #content>
          <div v-if="groupesMembres.length === 0" class="text-center py-6">
            <p class="text-600">Vous n'êtes membre d'aucun groupe.</p>
          </div>

          <div v-else class="space-y-4">
            <Card
              v-for="groupe in filteredGroupesMembres"
              :key="groupe.id"
              class="hover-card cursor-pointer"
              @click="viewGroupe(groupe)"
            >
              <template #content>
                <div class="flex align-items-center justify-content-between p-2">
                  <div class="flex align-items-center">
                    <Avatar
                      :label="groupe.nom.charAt(0)"
                      size="large"
                      style="background-color: var(--blue-500)"
                      class="mr-4"
                    />
                    <div>
                      <h4 class="text-lg font-semibold text-900 m-0">{{ groupe.nom }}</h4>
                      <p class="text-600 m-0 mb-2">
                        Par {{ groupe.entreprise_proprietaire_nom }} • {{ groupe.nombre_membres }} membres
                      </p>
                      <div v-if="groupe.description" class="text-sm text-500 mb-2">
                        {{ groupe.description }}
                      </div>
                      <div class="flex align-items-center gap-3">
                        <Tag
                          :value="groupe.est_public ? 'Public' : 'Privé'"
                          :severity="groupe.est_public ? 'success' : 'info'"
                        />
                        <span class="text-xs text-500">
                          {{ formatDate(groupe.date_creation) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    icon="pi pi-eye"
                    text
                    rounded
                    v-tooltip="'Voir le groupe'"
                  />
                </div>
              </template>
            </Card>
          </div>
        </template>
      </Card>

      <!-- Groupes publics disponibles -->
      <Card v-if="viewFilter === 'all' || viewFilter === 'public'">
        <template #title>
          Groupes publics disponibles
        </template>
        <template #content>
          <div v-if="loading" class="text-center py-6">
            <ProgressSpinner />
            <p class="mt-2 text-600">Chargement...</p>
          </div>

          <div v-else-if="availablePublicGroups.length === 0" class="text-center py-6">
            <p class="text-600">Aucun groupe public disponible.</p>
          </div>

          <div v-else class="space-y-4">
            <Card
              v-for="groupe in filteredPublicGroups"
              :key="groupe.id"
              class="hover-card"
            >
              <template #content>
                <div class="flex align-items-center justify-content-between p-2">
                  <div class="flex align-items-center">
                    <Avatar
                      :label="groupe.nom.charAt(0)"
                      size="large"
                      style="background-color: var(--orange-500)"
                      class="mr-4"
                    />
                    <div>
                      <h4 class="text-lg font-semibold text-900 m-0">{{ groupe.nom }}</h4>
                      <p class="text-600 m-0 mb-2">
                        Par {{ groupe.entreprise_proprietaire_nom }} • {{ groupe.nombre_membres }} membres
                      </p>
                      <div v-if="groupe.description" class="text-sm text-500 mb-2">
                        {{ groupe.description }}
                      </div>
                      <div class="flex align-items-center gap-3">
                        <Tag
                          value="Public"
                          severity="success"
                        />
                        <span class="text-xs text-500">
                          {{ formatDate(groupe.date_creation) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex align-items-center gap-2">
                    <Button
                      @click="requestJoin(groupe)"
                      label="Demander à rejoindre"
                      icon="pi pi-plus"
                      outlined
                    />
                    <Button
                      @click="viewGroupe(groupe)"
                      icon="pi pi-eye"
                      text
                      rounded
                      v-tooltip="'Voir le groupe'"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </template>
      </Card>
    </div>

    <!-- Modal de création/édition de groupe -->
    <Dialog 
      v-model:visible="showCreateModal" 
      :modal="true" 
      :header="isEditing ? 'Modifier le groupe' : 'Nouveau groupe'"
      class="w-full max-w-2xl"
    >
      <form @submit.prevent="submitGroupe" class="flex flex-column gap-4">
        <!-- Nom du groupe -->
        <div>
          <label for="groupe_nom" class="block font-medium mb-2">Nom du groupe *</label>
          <InputText
            id="groupe_nom"
            v-model="groupeForm.nom"
            type="text"
            required
            maxlength="200"
            class="w-full"
            placeholder="Nom du groupe"
          />
        </div>
        
        <!-- Description -->
        <div>
          <label for="groupe_description" class="block font-medium mb-2">Description</label>
          <Textarea
            id="groupe_description"
            v-model="groupeForm.description"
            :rows="4"
            class="w-full"
            placeholder="Description du groupe (optionnel)"
          />
          <small class="text-600">
            Décrivez le but et les sujets de discussion de ce groupe
          </small>
        </div>
        
        <!-- Visibilité du groupe -->
        <div>
          <label class="block font-medium mb-2">Visibilité</label>
          <div class="flex flex-column gap-3">
            <div class="flex align-items-center">
              <RadioButton 
                id="public" 
                v-model="groupeForm.est_public" 
                :value="true"
              />
              <label for="public" class="ml-2">
                <span class="font-medium">Public</span>
                <div class="text-sm text-600">
                  Toutes les entreprises peuvent voir ce groupe et demander à le rejoindre. 
                  Les messages publics sont visibles par tous.
                </div>
              </label>
            </div>
            
            <div class="flex align-items-center">
              <RadioButton 
                id="private" 
                v-model="groupeForm.est_public" 
                :value="false"
              />
              <label for="private" class="ml-2">
                <span class="font-medium">Privé</span>
                <div class="text-sm text-600">
                  Seuls les membres invités peuvent voir et participer à ce groupe. 
                  Toutes les discussions sont privées.
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Informations additionnelles -->
        <Message severity="info" :closable="false">
          <template #icon>
            <i class="pi pi-info-circle"></i>
          </template>
          <div>
            <h5 class="m-0 mb-2">À propos des groupes</h5>
            <ul class="m-0 pl-3">
              <li>Vous serez automatiquement le propriétaire de ce groupe</li>
              <li>Vous pourrez ajouter/retirer des membres</li>
              <li>Les groupes publics acceptent les demandes d'intégration</li>
              <li>Les groupes privés nécessitent une invitation directe</li>
            </ul>
          </div>
        </Message>
      </form>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button
            label="Annuler"
            outlined
            @click="closeModal"
          />
          <Button
            :label="isEditing ? 'Modifier' : 'Créer le groupe'"
            icon="pi pi-check"
            :loading="submitting"
            :disabled="!isFormValid"
            @click="submitGroupe"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAppStore, useGroupesStore, useDemandesStore } from '../../stores'
import type { Groupe } from '../../services/api'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const appStore = useAppStore()
const groupesStore = useGroupesStore()
const demandesStore = useDemandesStore()

const { currentEntreprise } = storeToRefs(appStore)
const { groupes, groupesPossedes, groupesMembres } = storeToRefs(groupesStore)

// État local
const loading = ref(false)
const searchQuery = ref('')
const viewFilter = ref('all')
const statusFilter = ref('')
const showCreateModal = ref(false)
const submitting = ref(false)
const isEditing = ref(false)
const editingGroupe = ref<Groupe | null>(null)

const groupeForm = ref({
  nom: '',
  description: '',
  est_public: true
})

// Options pour les dropdowns
const viewOptions = [
  { label: 'Tous les groupes', value: 'all' },
  { label: 'Mes groupes', value: 'owned' },
  { label: 'Groupes membre', value: 'member' },
  { label: 'Groupes publics', value: 'public' }
]

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Publics', value: 'public' },
  { label: 'Privés', value: 'private' }
]

// Computed
const filteredGroupesPossedes = computed(() => {
  return groupesPossedes.value.filter(groupe => {
    const matchesSearch = groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' ||
                         (statusFilter.value === 'public' && groupe.est_public) ||
                         (statusFilter.value === 'private' && !groupe.est_public)
    
    return matchesSearch && matchesStatus
  })
})

const filteredGroupesMembres = computed(() => {
  return groupesMembres.value.filter(groupe => {
    const matchesSearch = groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = statusFilter.value === '' ||
                         (statusFilter.value === 'public' && groupe.est_public) ||
                         (statusFilter.value === 'private' && !groupe.est_public)
    
    return matchesSearch && matchesStatus
  })
})

const availablePublicGroups = computed(() => {
  if (!currentEntreprise.value) return []
  
  return groupes.value.filter(groupe => {
    const isOwner = groupe.entreprise_proprietaire === currentEntreprise.value!.id
    const isMember = groupesMembres.value.some(g => g.id === groupe.id)
    
    return groupe.est_public && !isOwner && !isMember
  })
})

const filteredPublicGroups = computed(() => {
  return availablePublicGroups.value.filter(groupe => {
    return groupe.nom.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           (groupe.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const isFormValid = computed(() => {
  return groupeForm.value.nom.trim().length > 0 && 
         groupeForm.value.nom.trim().length <= 200
})

// Méthodes
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

const closeModal = () => {
  showCreateModal.value = false
  isEditing.value = false
  editingGroupe.value = null
  groupeForm.value = {
    nom: '',
    description: '',
    est_public: true
  }
}

const editGroupe = (groupe: Groupe) => {
  editingGroupe.value = groupe
  isEditing.value = true
  groupeForm.value = {
    nom: groupe.nom,
    description: groupe.description || '',
    est_public: groupe.est_public
  }
  showCreateModal.value = true
}

const confirmDelete = (groupe: Groupe) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer le groupe '${groupe.nom}' ? Cette action est irréversible.`,
    header: 'Supprimer le groupe',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => deleteGroupe(groupe)
  })
}

const viewGroupe = (groupe: Groupe) => {
  router.push(`/groupes/${groupe.id}`)
}

const submitGroupe = async () => {
  if (!isFormValid.value || !currentEntreprise.value) return
  
  try {
    submitting.value = true
    
    const groupeData = {
      nom: groupeForm.value.nom.trim(),
      description: groupeForm.value.description.trim() || undefined,
      est_public: groupeForm.value.est_public,
      entreprise_proprietaire: currentEntreprise.value.id
    }
    
    if (isEditing.value && editingGroupe.value) {
      await groupesStore.updateGroupe(editingGroupe.value.id, groupeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Groupe modifié avec succès',
        life: 3000
      })
    } else {
      await groupesStore.createGroupe(groupeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Groupe créé avec succès',
        life: 3000
      })
    }
    
    closeModal()
    await loadData()
  } catch (error: any) {
    console.error('Erreur lors de la soumission:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Erreur lors de l\'opération',
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

const deleteGroupe = async (groupe: Groupe) => {
  try {
    await groupesStore.deleteGroupe(groupe.id)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Groupe supprimé avec succès',
      life: 3000
    })
    await loadData()
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Erreur lors de la suppression',
      life: 5000
    })
  }
}

const requestJoin = async (groupe: Groupe) => {
  if (!currentEntreprise.value) return
  
  try {
    await demandesStore.createDemande({
      entreprise_demandeur: currentEntreprise.value.id,
      groupe_cible: groupe.id,
      message_demande: `${currentEntreprise.value.nom} souhaite rejoindre le groupe "${groupe.nom}".`
    })
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Demande d\'intégration envoyée avec succès !',
      life: 3000
    })
  } catch (error: any) {
    console.error('Erreur lors de la demande:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.response?.data?.message || 'Erreur lors de la demande d\'intégration',
      life: 5000
    })
  }
}

const loadData = async () => {
  if (!currentEntreprise.value) return
  
  try {
    loading.value = true
    await Promise.all([
      groupesStore.loadGroupes(),
      groupesStore.loadGroupesPossedes(currentEntreprise.value.id),
      groupesStore.loadGroupesMembres(currentEntreprise.value.id)
    ])
  } catch (error: any) {
    console.error('Erreur lors du chargement:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des groupes',
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
.groupes-container {
  max-width: 1200px;
  margin: 0 auto;
}

.hover-card {
  transition: all 0.2s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}
</style>