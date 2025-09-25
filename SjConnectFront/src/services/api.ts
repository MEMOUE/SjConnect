// src/services/api.ts - VERSION MISE À JOUR
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Configuration d'axios avec authentification
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important pour les sessions Django
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirection vers login si non authentifié
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Intercepteur pour ajouter le token CSRF
apiClient.interceptors.request.use(async (config) => {
  // Récupérer le token CSRF pour les requêtes de modification
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    try {
      const csrfResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/csrf/`, { 
        withCredentials: true 
      })
      const csrfToken = csrfResponse.data.csrfToken
      config.headers['X-CSRFToken'] = csrfToken
    } catch (error) {
      console.warn('Impossible de récupérer le token CSRF:', error)
    }
  }
  return config
})

// Types TypeScript pour l'API
export interface Entreprise {
  id: number
  nom: string
  email: string
  description?: string
  date_creation: string
  est_active: boolean
  groupes_possedes_count: number
}

export interface Groupe {
  id: number
  nom: string
  description?: string
  entreprise_proprietaire: number
  entreprise_proprietaire_nom: string
  date_creation: string
  est_public: boolean
  membres: MembreGroupe[]
  nombre_membres: number
}

export interface MembreGroupe {
  id: number
  entreprise: number
  entreprise_nom: string
  groupe: number
  groupe_nom: string
  statut: 'PROPRIETAIRE' | 'MEMBRE' | 'INVITE'
  date_ajout: string
}

export interface DemandeIntegration {
  id: number
  entreprise_demandeur: number
  entreprise_demandeur_nom: string
  groupe_cible: number
  groupe_cible_nom: string
  groupe_proprietaire_nom: string
  message_demande?: string
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
  date_demande: string
  date_reponse?: string
}

export interface Message {
  id: number
  expediteur: number
  expediteur_nom: string
  contenu: string
  type_message: 'GROUPE_PUBLIC' | 'GROUPE_PRIVE' | 'DIRECT'
  date_envoi: string
  groupe?: number
  groupe_nom?: string
  destinataire?: number
  destinataire_nom?: string
  est_lu: boolean
  est_modifie: boolean
  date_modification?: string
}

export interface ConversationDirecte {
  id: number
  entreprise1: number
  entreprise1_nom: string
  entreprise2: number
  entreprise2_nom: string
  date_creation: string
  derniere_activite: string
  derniers_messages: Message[]
}

// Service API
class ApiService {
  // Entreprises
  async getEntreprises(): Promise<Entreprise[]> {
    const response = await apiClient.get('/entreprises/')
    return response.data.results || response.data
  }

  async getEntreprise(id: number): Promise<Entreprise> {
    const response = await apiClient.get(`/entreprises/${id}/`)
    return response.data
  }

  async createEntreprise(data: Partial<Entreprise>): Promise<Entreprise> {
    const response = await apiClient.post('/entreprises/', data)
    return response.data
  }

  async updateEntreprise(id: number, data: Partial<Entreprise>): Promise<Entreprise> {
    const response = await apiClient.put(`/entreprises/${id}/`, data)
    return response.data
  }

  async deleteEntreprise(id: number): Promise<void> {
    await apiClient.delete(`/entreprises/${id}/`)
  }

  async getGroupesPossedes(entrepriseId: number): Promise<Groupe[]> {
    const response = await apiClient.get(`/entreprises/${entrepriseId}/groupes_possedes/`)
    return response.data
  }

  async getGroupesMembres(entrepriseId: number): Promise<Groupe[]> {
    const response = await apiClient.get(`/entreprises/${entrepriseId}/groupes_membres/`)
    return response.data
  }

  // Groupes
  async getGroupes(): Promise<Groupe[]> {
    const response = await apiClient.get('/groupes/')
    return response.data.results || response.data
  }

  async getGroupe(id: number): Promise<Groupe> {
    const response = await apiClient.get(`/groupes/${id}/`)
    return response.data
  }

  async createGroupe(data: Partial<Groupe>): Promise<Groupe> {
    const response = await apiClient.post('/groupes/', data)
    return response.data
  }

  async updateGroupe(id: number, data: Partial<Groupe>): Promise<Groupe> {
    const response = await apiClient.put(`/groupes/${id}/`, data)
    return response.data
  }

  async deleteGroupe(id: number): Promise<void> {
    await apiClient.delete(`/groupes/${id}/`)
  }

  async getMembresDuGroupe(groupeId: number): Promise<MembreGroupe[]> {
    const response = await apiClient.get(`/groupes/${groupeId}/membres/`)
    return response.data
  }

  async ajouterMembreGroupe(groupeId: number, entrepriseId: number, statut: string = 'MEMBRE'): Promise<void> {
    await apiClient.post(`/groupes/${groupeId}/ajouter_membre/`, {
      entreprise_id: entrepriseId,
      statut
    })
  }

  async retirerMembreGroupe(groupeId: number, entrepriseId: number): Promise<void> {
    await apiClient.delete(`/groupes/${groupeId}/retirer_membre/?entreprise_id=${entrepriseId}`)
  }

  async getMessagesGroupe(groupeId: number, entrepriseId: number): Promise<Message[]> {
    const response = await apiClient.get(`/groupes/${groupeId}/messages/?entreprise_id=${entrepriseId}`)
    return response.data
  }

  // Demandes d'intégration
  async getDemandesIntegration(entrepriseId?: number): Promise<DemandeIntegration[]> {
    const params = entrepriseId ? `?entreprise_id=${entrepriseId}` : ''
    const response = await apiClient.get(`/demandes-integration/${params}`)
    return response.data.results || response.data
  }

  async createDemandeIntegration(data: Partial<DemandeIntegration>): Promise<DemandeIntegration> {
    const response = await apiClient.post('/demandes-integration/', data)
    return response.data
  }

  async repondreDemande(demandeId: number, accepter: boolean): Promise<void> {
    await apiClient.post(`/demandes-integration/${demandeId}/repondre/`, {
      accepter
    })
  }

  // Messages
  async getMessages(entrepriseId: number): Promise<Message[]> {
    const response = await apiClient.get(`/messages/?entreprise_id=${entrepriseId}`)
    return response.data.results || response.data
  }

  async envoyerMessage(data: {
    expediteur_id: number
    contenu: string
    type_message: string
    groupe_id?: number
    destinataire_id?: number
  }): Promise<Message> {
    const response = await apiClient.post('/messages/envoyer/', data)
    return response.data
  }

  async getConversation(entreprise1Id: number, entreprise2Id: number): Promise<Message[]> {
    const response = await apiClient.get(`/messages/conversation/?entreprise1_id=${entreprise1Id}&entreprise2_id=${entreprise2Id}`)
    return response.data
  }

  // Conversations directes
  async getConversations(entrepriseId: number): Promise<ConversationDirecte[]> {
    const response = await apiClient.get(`/conversations/?entreprise_id=${entrepriseId}`)
    return response.data.results || response.data
  }
}

export const apiService = new ApiService()
export default apiService