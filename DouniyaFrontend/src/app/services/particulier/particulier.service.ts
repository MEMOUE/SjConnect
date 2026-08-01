import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  ChangePasswordRequest,
  UpdateParticulierProfilRequest,
  UserResponse
} from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class ParticulierService {

  private apiUrl = `${environment.apiUrl}/particulier`;

  constructor(private http: HttpClient) {}

  updateProfil(request: UpdateParticulierProfilRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/profil`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, request);
  }
}
