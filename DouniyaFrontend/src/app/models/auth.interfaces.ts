// ============================================
// INTERFACES POUR LES REQUÊTES (Request DTOs)
// ============================================

export interface RegisterEntrepriseRequest {
  nomEntreprise: string;
  typeEntreprise: string;
  secteurActivite: string;
  adressePhysique: string;
  telephone: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  numeroRegistreCommerce?: string;
  description?: string;
  siteWeb?: string;
}

export interface RegisterParticulierRequest {
  prenom: string;
  nom: string;
  genre: string;
  dateNaissance: string; // Format ISO: YYYY-MM-DD
  telephone: string;
  email: string;
  secteurActivite: string;
  posteActuel?: string;
  username: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter: boolean;
}

export interface LoginRequest {
  identifier: string; // Email ou username
  password: string;
  accountType?: string; // 'entreprise' ou 'individuel'
  rememberMe: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface NewPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface CreateEmployeRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  role: string;
  numeroMatricule?: string;
}

export interface AcceptInvitationRequest {
  invitationToken: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// ============================================
// INTERFACES POUR LES RÉPONSES (Response DTOs)
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  telephone: string;
  role: string;
  createdAt: string;

  // Champs spécifiques entreprise
  nomEntreprise?: string;
  typeEntreprise?: string;
  secteurActivite?: string;

  // Champs spécifiques particulier
  prenom?: string;
  nom?: string;
  genre?: string;

  // Champs spécifiques employé
  poste?: string;
  departement?: string;
  entrepriseId?: number;
  entrepriseNom?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface EmployeResponse {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  poste: string;
  departement: string;
  rolePlateforme: string;
  numeroMatricule?: string;
  username: string;
  invitationAccepted: boolean;
  enabled: boolean;
  createdAt: string;
}
