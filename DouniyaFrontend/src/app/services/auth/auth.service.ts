import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegisterEntrepriseRequest,
  RegisterParticulierRequest,
  LoginRequest,
  PasswordResetRequest,
  NewPasswordRequest,
  AuthResponse,
  ApiResponse,
  UserResponse
} from '../../models/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private currentUserSubject: BehaviorSubject<UserResponse | null>;
  public currentUser$: Observable<UserResponse | null>;

  constructor(private http: HttpClient) {
    // Initialiser avec l'utilisateur stocké localement
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<UserResponse | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    // Log pour vérifier l'URL (peut être retiré en production)
    console.log('🔧 AuthService initialized with API URL:', this.apiUrl);
  }

  // ============================================
  // MÉTHODES D'INSCRIPTION
  // ============================================

  /**
   * Inscription d'une entreprise
   */
  registerEntreprise(request: RegisterEntrepriseRequest): Observable<ApiResponse<void>> {
    console.log('📤 POST:', `${this.apiUrl}/register/entreprise`);
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/register/entreprise`, request);
  }

  /**
   * Inscription d'un particulier
   */
  registerParticulier(request: RegisterParticulierRequest): Observable<ApiResponse<void>> {
    console.log('📤 POST:', `${this.apiUrl}/register/particulier`);
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/register/particulier`, request);
  }

  // ============================================
  // MÉTHODES DE CONNEXION
  // ============================================

  /**
   * Connexion
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    console.log('📤 POST:', `${this.apiUrl}/login`);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        // Stocker les tokens et l'utilisateur
        this.storeAuthData(response);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
        this.currentUserSubject.next(null);
      })
    );
  }

  // ============================================
  // VÉRIFICATION EMAIL
  // ============================================

  /**
   * Vérifier l'email avec le token
   */
  verifyEmail(token: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.apiUrl}/verify-email?token=${token}`);
  }

  // ============================================
  // RÉINITIALISATION MOT DE PASSE
  // ============================================

  /**
   * Demander la réinitialisation du mot de passe
   */
  forgotPassword(request: PasswordResetRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, request);
  }

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword(request: NewPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, request);
  }

  // ============================================
  // GESTION DES TOKENS
  // ============================================

  /**
   * Rafraîchir le token d'accès
   */
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token?refreshToken=${refreshToken}`, {}).pipe(
      tap(response => {
        this.storeAuthData(response);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  /**
   * Obtenir l'utilisateur courant depuis l'API
   */
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  // ============================================
  // MÉTHODES UTILITAIRES LOCALES
  // ============================================

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Obtenir le token d'accès
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Obtenir le token de rafraîchissement
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Obtenir l'utilisateur courant (local)
   */
  getCurrentUserValue(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier le rôle de l'utilisateur
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    return user ? user.role === role : false;
  }

  /**
   * Vérifier si l'utilisateur est une entreprise
   */
  isEntreprise(): boolean {
    return this.hasRole('ENTREPRISE');
  }

  /**
   * Vérifier si l'utilisateur est un particulier
   */
  isParticulier(): boolean {
    return this.hasRole('PARTICULIER');
  }

  /**
   * Vérifier si l'utilisateur est un employé
   */
  isEmploye(): boolean {
    return this.hasRole('EMPLOYE');
  }

  // ============================================
  // MÉTHODES PRIVÉES DE STOCKAGE
  // ============================================

  private storeAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  private getStoredUser(): UserResponse | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }
}