import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProjetB2B,
  CreateProjetB2BRequest,
  ProjetB2BStats,
  ApiResponse
} from '../../models/projet-b2b.model';

@Injectable({
  providedIn: 'root'
})
export class ProjetB2BService {
  private apiUrl = environment.apiUrl + '/projets-b2b';

  constructor(private http: HttpClient) {
    console.log('🚀 ProjetB2BService initialized with API URL:', this.apiUrl);
  }

  // ============================================
  // GESTION DES PROJETS
  // ============================================

  /**
   * Créer un nouveau projet B2B
   */
  createProjet(request: CreateProjetB2BRequest): Observable<ApiResponse<ProjetB2B>> {
    console.log('📤 POST:', `${this.apiUrl}`, request);
    return this.http.post<ApiResponse<ProjetB2B>>(this.apiUrl, request);
  }

  /**
   * Obtenir la liste de mes projets
   */
  getMesProjets(): Observable<ProjetB2B[]> {
    console.log('📤 GET:', `${this.apiUrl}`);
    return this.http.get<ProjetB2B[]>(this.apiUrl);
  }

  /**
   * Obtenir les détails d'un projet
   */
  getProjetById(projetId: number): Observable<ProjetB2B> {
    console.log('📤 GET:', `${this.apiUrl}/${projetId}`);
    return this.http.get<ProjetB2B>(`${this.apiUrl}/${projetId}`);
  }

  /**
   * Modifier un projet
   */
  updateProjet(projetId: number, request: CreateProjetB2BRequest): Observable<ApiResponse<ProjetB2B>> {
    console.log('📤 PUT:', `${this.apiUrl}/${projetId}`, request);
    return this.http.put<ApiResponse<ProjetB2B>>(`${this.apiUrl}/${projetId}`, request);
  }

  /**
   * Supprimer un projet
   */
  deleteProjet(projetId: number): Observable<ApiResponse<void>> {
    console.log('📤 DELETE:', `${this.apiUrl}/${projetId}`);
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${projetId}`);
  }

  // ============================================
  // GESTION DU STATUT ET PROGRESSION
  // ============================================

  /**
   * Modifier le statut d'un projet
   */
  updateStatut(projetId: number, statut: string): Observable<ApiResponse<ProjetB2B>> {
    const params = new HttpParams().set('statut', statut);
    console.log('📤 PATCH:', `${this.apiUrl}/${projetId}/statut`, { statut });
    return this.http.patch<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/statut`,
      null,
      { params }
    );
  }

  /**
   * Modifier la progression d'un projet
   */
  updateProgression(projetId: number, progression: number): Observable<ApiResponse<ProjetB2B>> {
    const params = new HttpParams().set('progression', progression.toString());
    console.log('📤 PATCH:', `${this.apiUrl}/${projetId}/progression`, { progression });
    return this.http.patch<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/progression`,
      null,
      { params }
    );
  }

  // ============================================
  // GESTION DES PARTICIPANTS
  // ============================================

  /**
   * Ajouter un participant au projet
   */
  addParticipant(projetId: number, participantId: number): Observable<ApiResponse<ProjetB2B>> {
    console.log('📤 POST:', `${this.apiUrl}/${projetId}/participants/${participantId}`);
    return this.http.post<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/participants/${participantId}`,
      null
    );
  }

  /**
   * Retirer un participant du projet
   */
  removeParticipant(projetId: number, participantId: number): Observable<ApiResponse<ProjetB2B>> {
    console.log('📤 DELETE:', `${this.apiUrl}/${projetId}/participants/${participantId}`);
    return this.http.delete<ApiResponse<ProjetB2B>>(
      `${this.apiUrl}/${projetId}/participants/${participantId}`
    );
  }

  // ============================================
  // STATISTIQUES ET RECHERCHE
  // ============================================

  /**
   * Obtenir les statistiques des projets
   */
  getStats(): Observable<ProjetB2BStats> {
    console.log('📤 GET:', `${this.apiUrl}/stats`);
    return this.http.get<ProjetB2BStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Rechercher des projets
   */
  searchProjets(searchTerm: string): Observable<ProjetB2B[]> {
    const params = new HttpParams().set('q', searchTerm);
    console.log('📤 GET:', `${this.apiUrl}/search?q=${searchTerm}`);
    return this.http.get<ProjetB2B[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Filtrer les projets par statut
   */
  filterByStatut(statut: string): Observable<ProjetB2B[]> {
    const params = new HttpParams().set('statut', statut);
    console.log('📤 GET:', `${this.apiUrl}/filter?statut=${statut}`);
    return this.http.get<ProjetB2B[]>(`${this.apiUrl}/filter`, { params });
  }
}
