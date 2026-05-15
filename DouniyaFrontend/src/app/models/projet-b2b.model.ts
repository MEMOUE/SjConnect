// ============================================
// MODÈLE : projet-b2b.model.ts
// Chemin : src/app/models/projet-b2b.model.ts
// ============================================

export interface PartenaireProjet {
  id: number;
  nom: string;
  role: string;
  logo: string;
  statut?: string;
}

export interface TacheProjet {
  id: number;
  titre: string;
  description: string;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE';
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE';
  assigneA: string;
  dateEcheance: string;
  projetId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProjet {
  id: number;
  nomFichier: string;
  nomOriginal: string;
  cheminFichier: string;
  typeMime: string;
  tailleFichier: number;
  uploadePar: string;
  projetId: number;
  createdAt: string;
  tailleFormatee: string;
  icone: string;
}

export interface ProjetB2B {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  priorite: string;
  statut: string;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  icone: string;
  partenaires: PartenaireProjet[];
  taches?: TacheProjet[];
  documents?: DocumentProjet[];
  createurId: number;
  createurUsername: string;
}

export interface CreateProjetB2BRequest {
  nom: string;
  description: string;
  categorie: string;
  priorite: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  icone: string;
  partenaires: { nom: string; role: string; logo: string }[];
  participantIds: number[];
}

export interface CreateTacheRequest {
  titre: string;
  description: string;
  priorite: string;
  assigneA: string;
  dateEcheance: string;
}

export interface AddPartenaireRequest {
  nom: string;
  role: string;
  logo: string;
}

export interface ProjetB2BStats {
  totalProjets: number;
  projetsActifs: number;
  totalPartenaires: number;
  tauxCompletion: number;
  budgetTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
