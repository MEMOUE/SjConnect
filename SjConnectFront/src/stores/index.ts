// src/stores/index.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Entreprise, 
  Groupe, 
  Message, 
  DemandeIntegration, 
  ConversationDirecte 
} from '../services/api'
import apiService from '../services/api'


// Store des groupes
export const useGroupesStore = defineStore('groupes', () => {
  const groupes = ref<Groupe[]>([])
  const selectedGroupe = ref<Groupe | null>(null)
  const groupesPossedes = ref<Groupe[]>([])
  const groupesMembres = ref<Groupe[]>([])

  const loadGroupes = async () => {
    try {
      groupes.value = await apiService.getGroupes()
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
      throw error
    }
  }

  const loadGroupe = async (id: number) => {
    try {
      selectedGroupe.value = await apiService.getGroupe(id)
      return selectedGroupe.value
    } catch (error) {
      console.error('Erreur lors du chargement du groupe:', error)
      throw error
    }
  }

  const loadGroupesPossedes = async (entrepriseId: number) => {
    try {
      groupesPossedes.value = await apiService.getGroupesPossedes(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes possédés:', error)
      throw error
    }
  }

  const loadGroupesMembres = async (entrepriseId: number) => {
    try {
      groupesMembres.value = await apiService.getGroupesMembres(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes membres:', error)
      throw error
    }
  }

  const createGroupe = async (data: Partial<Groupe>) => {
    try {
      const newGroupe = await apiService.createGroupe(data)
      groupes.value.push(newGroupe)
      return newGroupe
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error)
      throw error
    }
  }

  const updateGroupe = async (id: number, data: Partial<Groupe>) => {
    try {
      const updatedGroupe = await apiService.updateGroupe(id, data)
      const index = groupes.value.findIndex(g => g.id === id)
      if (index !== -1) {
        groupes.value[index] = updatedGroupe
      }
      if (selectedGroupe.value?.id === id) {
        selectedGroupe.value = updatedGroupe
      }
      return updatedGroupe
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe:', error)
      throw error
    }
  }

  const deleteGroupe = async (id: number) => {
    try {
      await apiService.deleteGroupe(id)
      groupes.value = groupes.value.filter(g => g.id !== id)
      groupesPossedes.value = groupesPossedes.value.filter(g => g.id !== id)
      groupesMembres.value = groupesMembres.value.filter(g => g.id !== id)
      if (selectedGroupe.value?.id === id) {
        selectedGroupe.value = null
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error)
      throw error
    }
  }

  const loadMessagesGroupe = async (groupeId: number, entrepriseId: number) => {
    try {
      return await apiService.getMessagesGroupe(groupeId, entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des messages du groupe:', error)
      throw error
    }
  }

  return {
    groupes,
    selectedGroupe,
    groupesPossedes,
    groupesMembres,
    loadGroupes,
    loadGroupe,
    loadGroupesPossedes,
    loadGroupesMembres,
    createGroupe,
    updateGroupe,
    deleteGroupe,
    loadMessagesGroupe
  }
})


// Store des entreprises
export const useEntreprisesStore = defineStore('entreprises', () => {
  const entreprises = ref<Entreprise[]>([])
  const selectedEntreprise = ref<Entreprise | null>(null)
  
  const loadEntreprises = async () => {
    try {
      entreprises.value = await apiService.getEntreprises()
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error)
      throw error
    }
  }

  const loadEntreprise = async (id: number) => {
    try {
      selectedEntreprise.value = await apiService.getEntreprise(id)
      return selectedEntreprise.value
    } catch (error) {
      console.error('Erreur lors du chargement de l\'entreprise:', error)
      throw error
    }
  }

  const createEntreprise = async (data: Partial<Entreprise>) => {
    try {
      const newEntreprise = await apiService.createEntreprise(data)
      entreprises.value.push(newEntreprise)
      return newEntreprise
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error)
      throw error
    }
  }

  const updateEntreprise = async (id: number, data: Partial<Entreprise>) => {
    try {
      const updatedEntreprise = await apiService.updateEntreprise(id, data)
      const index = entreprises.value.findIndex(e => e.id === id)
      if (index !== -1) {
        entreprises.value[index] = updatedEntreprise
      }
      if (selectedEntreprise.value?.id === id) {
        selectedEntreprise.value = updatedEntreprise
      }
      return updatedEntreprise
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'entreprise:', error)
      throw error
    }
  }

  const deleteEntreprise = async (id: number) => {
    try {
      await apiService.deleteEntreprise(id)
      entreprises.value = entreprises.value.filter(e => e.id !== id)
      if (selectedEntreprise.value?.id === id) {
        selectedEntreprise.value = null
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'entreprise:', error)
      throw error
    }
  }

  const loadGroupesPossedes = async (entrepriseId: number) => {
    try {
      return await apiService.getGroupesPossedes(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes possédés:', error)
      throw error
    }
  }

  const loadGroupesMembres = async (entrepriseId: number) => {
    try {
      return await apiService.getGroupesMembres(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des groupes membres:', error)
      throw error
    }
  }

  return {
    entreprises,
    selectedEntreprise,
    loadEntreprises,
    loadEntreprise,
    createEntreprise,
    updateEntreprise,
    deleteEntreprise,
    loadGroupesPossedes,
    loadGroupesMembres
  }
})

// Store principal de l'application
export const useAppStore = defineStore('app', () => {
  // État global
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentEntreprise = ref<Entreprise | null>(null)

  // Actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const clearError = () => {
    error.value = null
  }

  const setCurrentEntreprise = (entreprise: Entreprise | null) => {
    currentEntreprise.value = entreprise
    if (entreprise) {
      localStorage.setItem('currentEntreprise', JSON.stringify(entreprise))
    } else {
      localStorage.removeItem('currentEntreprise')
    }
  }

  const loadCurrentEntreprise = () => {
    const saved = localStorage.getItem('currentEntreprise')
    if (saved) {
      currentEntreprise.value = JSON.parse(saved)
    }
  }

  return {
    isLoading,
    error,
    currentEntreprise,
    setLoading,
    setError,
    clearError,
    setCurrentEntreprise,
    loadCurrentEntreprise
  }
})



// Store des messages
export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])
  const conversations = ref<ConversationDirecte[]>([])
  const currentConversation = ref<Message[]>([])

  const loadMessages = async (entrepriseId: number) => {
    try {
      messages.value = await apiService.getMessages(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      throw error
    }
  }

  const loadConversations = async (entrepriseId: number) => {
    try {
      conversations.value = await apiService.getConversations(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
      throw error
    }
  }

  const loadConversation = async (entreprise1Id: number, entreprise2Id: number) => {
    try {
      currentConversation.value = await apiService.getConversation(entreprise1Id, entreprise2Id)
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error)
      throw error
    }
  }

  const envoyerMessage = async (data: {
    expediteur_id: number
    contenu: string
    type_message: string
    groupe_id?: number
    destinataire_id?: number
  }) => {
    try {
      const newMessage = await apiService.envoyerMessage(data)
      messages.value.unshift(newMessage)
      
      // Ajouter à la conversation courante si c'est un message direct
      if (data.type_message === 'DIRECT' && currentConversation.value.length > 0) {
        currentConversation.value.unshift(newMessage)
      }
      
      return newMessage
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      throw error
    }
  }

  return {
    messages,
    conversations,
    currentConversation,
    loadMessages,
    loadConversations,
    loadConversation,
    envoyerMessage
  }
})

// Store des demandes d'intégration
export const useDemandesStore = defineStore('demandes', () => {
  const demandes = ref<DemandeIntegration[]>([])
  
  const loadDemandes = async (entrepriseId?: number) => {
    try {
      demandes.value = await apiService.getDemandesIntegration(entrepriseId)
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
      throw error
    }
  }

  const createDemande = async (data: Partial<DemandeIntegration>) => {
    try {
      const newDemande = await apiService.createDemandeIntegration(data)
      demandes.value.push(newDemande)
      return newDemande
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error)
      throw error
    }
  }

  const repondreDemande = async (demandeId: number, accepter: boolean) => {
    try {
      await apiService.repondreDemande(demandeId, accepter)
      const demande = demandes.value.find(d => d.id === demandeId)
      if (demande) {
        demande.statut = accepter ? 'ACCEPTEE' : 'REFUSEE'
        demande.date_reponse = new Date().toISOString()
      }
    } catch (error) {
      console.error('Erreur lors de la réponse à la demande:', error)
      throw error
    }
  }

  const demandesEnAttente = computed(() => 
    demandes.value.filter(d => d.statut === 'EN_ATTENTE')
  )

  const demandesTraitees = computed(() => 
    demandes.value.filter(d => d.statut !== 'EN_ATTENTE')
  )

  return {
    demandes,
    demandesEnAttente,
    demandesTraitees,
    loadDemandes,
    createDemande,
    repondreDemande
  }
})



