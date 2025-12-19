import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
declare const require: any;
import { environment } from '../../../environments/environment';
import {
  CreateEmployeRequest,
  AcceptInvitationRequest,
  ApiResponse,
  EmployeResponse
} from '../../models/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthEmployeService {
  private apiUrl = environment.apiUrl + '/entreprise/employes';
  private authApiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

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
}
