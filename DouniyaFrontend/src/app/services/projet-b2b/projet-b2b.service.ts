import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProjetB2B,
  CreateProjetB2BRequest,
  CreateTacheRequest,
  AddPartenaireRequest,
  TacheProjet,
  DocumentProjet,
  MessageProjet,
  PersonnelItem,
  UserSearchResult,
  ProjetB2BStats,
  ApiResponse
} from '../../models/projet-b2b.model';

@Injectable({
  providedIn: 'root'
})
export class ProjetB2BService {
  private apiUrl = environment.apiUrl + '/projets-b2b';

  constructor(private http: HttpClient) {}

  // ============================================
  // GESTION DES PROJETS
  // ============================================

  createProjet(request: CreateProjetB2BRequest): Observable<ApiResponse<ProjetB2B>> {
    return this.http.post<ApiResponse<ProjetB2B>>(this.apiUrl, request);
  }

  getMesProjets(): Observable<ProjetB2B[]> {
    return this.http.get<ProjetB2B[]>(this.apiUrl);
  }

  getProjetById(projetId: number): Observable<ProjetB2B> {
    return this.http.get<ProjetB2B>(`${this.apiUrl}/${projetId}`);
  }

  updateProjet(projetId: number, request: CreateProjetB2BRequest): Observable<ApiResponse<ProjetB2B>> {
    return this.http.put<ApiResponse<ProjetB2B>>(`${this.apiUrl}/${projetId}`, request);
  }

  deleteProjet(projetId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${projetId}`);
  }

  // ============================================
  // STATUT ET PROGRESSION
  // ============================================

  updateStatut(projetId: number, statut: string): Observable<ApiResponse<ProjetB2B>> {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/statut`, null, { params }
    );
  }

  updateProgression(projetId: number, progression: number): Observable<ApiResponse<ProjetB2B>> {
    const params = new HttpParams().set('progression', progression.toString());
    return this.http.patch<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/progression`, null, { params }
    );
  }

  // ============================================
  // PARTICIPANTS
  // ============================================

  addParticipant(projetId: number, participantId: number): Observable<ApiResponse<ProjetB2B>> {
    return this.http.post<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/participants/${participantId}`, null
    );
  }

  removeParticipant(projetId: number, participantId: number): Observable<ApiResponse<ProjetB2B>> {
    return this.http.delete<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/participants/${participantId}`
    );
  }

  // ============================================
  // PARTENAIRES
  // ============================================

  addPartenaire(projetId: number, request: AddPartenaireRequest): Observable<ApiResponse<ProjetB2B>> {
    return this.http.post<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/partenaires`, request
    );
  }

  removePartenaire(projetId: number, partenaireId: number): Observable<ApiResponse<ProjetB2B>> {
    return this.http.delete<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/partenaires/${partenaireId}`
    );
  }

  /** Personnel de la structure de l'utilisateur courant. */
  getPersonnel(): Observable<PersonnelItem[]> {
    return this.http.get<PersonnelItem[]>(`${this.apiUrl}/personnel`);
  }

  /** Recherche d'un utilisateur externe par email. */
  searchUserByEmail(email: string): Observable<UserSearchResult> {
    const params = new HttpParams().set('email', email);
    return this.http.get<UserSearchResult>(`${this.apiUrl}/users/search-by-email`, { params });
  }

  // ============================================
  // MESSAGES (NOUVEAU)
  // ============================================

  getMessages(projetId: number): Observable<MessageProjet[]> {
    return this.http.get<MessageProjet[]>(`${this.apiUrl}/${projetId}/messages`);
  }

  sendMessage(projetId: number, contenu: string): Observable<ApiResponse<MessageProjet>> {
    return this.http.post<ApiResponse<MessageProjet>>(
      `${this.apiUrl}/${projetId}/messages`, { contenu }
    );
  }

  // ============================================
  // TÂCHES
  // ============================================

  createTache(projetId: number, request: CreateTacheRequest): Observable<ApiResponse<TacheProjet>> {
    return this.http.post<ApiResponse<TacheProjet>>(
      `${this.apiUrl}/${projetId}/taches`, request
    );
  }

  getTaches(projetId: number): Observable<TacheProjet[]> {
    return this.http.get<TacheProjet[]>(`${this.apiUrl}/${projetId}/taches`);
  }

  updateStatutTache(projetId: number, tacheId: number, statut: string): Observable<ApiResponse<TacheProjet>> {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<ApiResponse<TacheProjet>>(
      `${this.apiUrl}/${projetId}/taches/${tacheId}/statut`, null, { params }
    );
  }

  deleteTache(projetId: number, tacheId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${projetId}/taches/${tacheId}`
    );
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  uploadDocument(projetId: number, file: File): Observable<ApiResponse<DocumentProjet>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<DocumentProjet>>(
      `${this.apiUrl}/${projetId}/documents`, formData
    );
  }

  getDocuments(projetId: number): Observable<DocumentProjet[]> {
    return this.http.get<DocumentProjet[]>(`${this.apiUrl}/${projetId}/documents`);
  }

  downloadDocument(projetId: number, documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${projetId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
  }

  deleteDocument(projetId: number, documentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${projetId}/documents/${documentId}`
    );
  }

  // ============================================
  // STATISTIQUES ET RECHERCHE
  // ============================================

  getStats(): Observable<ProjetB2BStats> {
    return this.http.get<ProjetB2BStats>(`${this.apiUrl}/stats`);
  }

  searchProjets(searchTerm: string): Observable<ProjetB2B[]> {
    const params = new HttpParams().set('q', searchTerm);
    return this.http.get<ProjetB2B[]>(`${this.apiUrl}/search`, { params });
  }

  filterByStatut(statut: string): Observable<ProjetB2B[]> {
    const params = new HttpParams().set('statut', statut);
    return this.http.get<ProjetB2B[]>(`${this.apiUrl}/filter`, { params });
  }
}
