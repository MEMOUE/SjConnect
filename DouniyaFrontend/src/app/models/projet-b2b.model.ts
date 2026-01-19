// Models pour les Projets B2B

export interface ProjetB2B {
  id: number;
  nom: string;
  description: string;
  statut: StatutProjet;
  priorite: PrioriteProjet;
  categorie: string;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  icone: string;
  createur: {
    id: number;
    username: string;
  };
  participants: Participant[];
  partenaires: PartenaireProjet[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  role: string;
}

export interface PartenaireProjet {
  id: number;
  nom: string;
  role: string;
  logo: string;
  statut: StatutPartenaire;
}

export enum StatutProjet {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIF = 'ACTIF',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ARCHIVE = 'ARCHIVE'
}

export enum PrioriteProjet {
  BASSE = 'BASSE',
  MOYENNE = 'MOYENNE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

export enum StatutPartenaire {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU'
}

// DTOs pour les requêtes

export interface CreateProjetB2BRequest {
  nom: string;
  description: string;
  categorie: string;
  priorite: string; // 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'
  dateDebut?: string;
  dateFin?: string;
  budget?: number;
  icone?: string;
  partenaires?: PartenaireDTO[];
  participantIds?: number[];
}

export interface PartenaireDTO {
  nom: string;
  role: string;
  logo?: string;
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
  data?: T;
  timestamp: string;
}
