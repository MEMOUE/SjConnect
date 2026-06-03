// ============================================================
// Modèles TypeScript du module Projet B2B
// ============================================================

export interface PartenaireProjet {
  id: number;
  nom: string;
  role: string;
  logo?: string;
  statut?: string;
  utilisateurId?: number;
}

export interface ProjetB2B {
  id: number;
  nom: string;
  description?: string;
  statut: string;        // EN_ATTENTE | ACTIF | EN_PAUSE | TERMINE | ARCHIVE
  priorite: string;      // BASSE | MOYENNE | HAUTE | CRITIQUE
  categorie: string;
  progression?: number;
  dateDebut?: string;
  dateFin?: string;
  budget?: number;
  icone?: string;
  createurId?: number;
  createurUsername?: string;
  partenaires?: PartenaireProjet[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjetB2BRequest {
  nom: string;
  description?: string;
  categorie: string;
  priorite: string;
  dateDebut?: string;
  dateFin?: string;
  budget?: number;
  icone?: string;
  partenaires?: { nom: string; role: string; logo?: string }[];
  participantIds?: number[];
}

/**
 * Ajout d'un partenaire — 3 modes mutuellement exclusifs :
 *  - userId : employé interne de la structure
 *  - email  : utilisateur externe disposant déjà d'un compte
 *  - nom    : saisie manuelle (partenaire hors plateforme)
 */
export interface AddPartenaireRequest {
  userId?: number;
  email?: string;
  nom?: string;
  role?: string;
  logo?: string;
}

export interface CreateTacheRequest {
  titre: string;
  description?: string;
  priorite?: string;
  assigneA?: string;
  dateEcheance?: string;
}

export interface TacheProjet {
  id: number;
  titre: string;
  description?: string;
  statut: string;
  priorite?: string;
  assigneA?: string;
  dateEcheance?: string;
  projetId?: number;
  createdAt?: string;
}

export interface DocumentProjet {
  id: number;
  nomFichier: string;
  nomOriginal?: string;
  icone?: string;
  typeMime?: string;
  tailleFichier?: number;
  tailleFormatee?: string;
  uploadePar?: string;
  createdAt?: string;
  projetId?: number;
}

export interface MessageProjet {
  id: number;
  contenu: string;
  expediteurId?: number;
  expediteurNom?: string;
  projetId?: number;
  createdAt?: string;
}

export interface PersonnelItem {
  id: number;
  nom: string;
  email: string;
  poste?: string;
  actif?: boolean;
}

export interface UserSearchResult {
  found: boolean;
  id?: number;
  username?: string;
  nom?: string;
  email?: string;
  message?: string;
}

export interface ProjetB2BStats {
  totalProjets?: number;
  projetsActifs?: number;
  totalPartenaires?: number;
  tauxCompletion?: number;
  budgetTotal?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}
