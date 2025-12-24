import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateEmployeRequest,
  AcceptInvitationRequest,
  ApiResponse,
  EmployeResponse,
  EmployeSimple
} from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeService {
  private apiUrl = environment.apiUrl + '/entreprise/employes';
  private authApiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {
    console.log('🔧 EmployeService initialized with API URL:', this.apiUrl);
  }

  /**
   * Créer un nouvel employé (entreprise uniquement)
   */
  createEmploye(request: CreateEmployeRequest): Observable<ApiResponse<EmployeResponse>> {
    return this.http.post<ApiResponse<EmployeResponse>>(this.apiUrl, request);
  }

  /**
   * Accepter une invitation (employé)
   */
  acceptInvitation(request: AcceptInvitationRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.authApiUrl}/accept-invitation`, request);
  }

  /**
   * Vérifier la validité d'un token d'invitation
   */
  checkInvitation(token: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.authApiUrl}/check-invitation?token=${token}`);
  }

  /**
   * Obtenir tous les employés (sans pagination)
   */
  getAllEmployes(): Observable<EmployeResponse[]> {
    return this.http.get<EmployeResponse[]>(`${this.apiUrl}/all`);
  }

  /**
   * Obtenir la liste paginée des employés
   */
  getEmployes(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /**
   * Obtenir un employé par son ID
   */
  getEmployeById(id: number): Observable<EmployeResponse> {
    return this.http.get<EmployeResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mettre à jour un employé
   */
  updateEmploye(id: number, request: CreateEmployeRequest): Observable<ApiResponse<EmployeResponse>> {
    return this.http.put<ApiResponse<EmployeResponse>>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Supprimer un employé
   */
  deleteEmploye(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Renvoyer l'invitation à un employé
   */
  resendInvitation(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/resend-invitation`, {});
  }

  /**
   * Obtenir le nombre d'employés
   */
  getEmployeCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  /**
   * Récupérer tous les employés de l'entreprise (sans pagination)
   * Pour utilisation dans le chat
   */
  getAllEmployesForChat(): Observable<EmployeSimple[]> {
    console.log('📤 GET:', `${this.apiUrl}/all`);

    return this.http.get<EmployeResponse[]>(`${this.apiUrl}/all`).pipe(
      tap(employes => {
        console.log('✅ Réponse brute du backend:', employes);
        console.log('📊 Nombre d\'employés reçus:', employes?.length || 0);
      }),
      map(employes => {
        if (!employes || !Array.isArray(employes)) {
          console.warn('⚠️ La réponse n\'est pas un tableau:', employes);
          return [];
        }

        const mappedEmployes = employes.map(emp => {
          const fullName = `${emp.prenom} ${emp.nom}`;
          return {
            id: emp.id,
            name: fullName,
            email: emp.email,
            poste: emp.poste,
            departement: this.formatDepartement(emp.departement),
            avatar: this.getInitials(fullName)
          };
        });

        console.log('🔄 Employés transformés:', mappedEmployes);
        return mappedEmployes;
      }),
      catchError(error => {
        console.error('❌ Erreur lors du chargement des employés pour le chat:', error);
        console.error('📋 Détails de l\'erreur:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });

        // Retourner un tableau vide en cas d'erreur
        return of([]);
      })
    );
  }

  /**
   * Formater le département
   */
  private formatDepartement(dept: string): string {
    const departementMap: { [key: string]: string } = {
      'direction': 'Direction Générale',
      'rh': 'Ressources Humaines',
      'finance': 'Finance & Comptabilité',
      'it': 'IT & Technologie',
      'commercial': 'Commercial & Ventes',
      'marketing': 'Marketing & Communication',
      'production': 'Production',
      'logistique': 'Logistique',
      'service_client': 'Service Client',
      'autre': 'Autre'
    };

    return departementMap[dept] || dept;
  }

  /**
   * Générer les initiales à partir d'un nom
   */
  private getInitials(name: string): string {
    if (!name) {
      console.warn('⚠️ Nom vide pour la génération d\'initiales');
      return '??';
    }

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      const initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      return initials;
    }

    return name.substring(0, 2).toUpperCase();
  }
}
