import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Publication {
  id?: number;
  titre?: string;
  contenu: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaNom?: string;
  auteurId?: number;
  auteurNom?: string;
  auteurType?: string;
  auteurInitiales?: string;
  typesEntreprisesVisibles: string[];
  visibleParTous?: boolean;
  nombreVues?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePublicationRequest {
  titre?: string;
  contenu: string;
  typesEntreprisesVisibles: string[];
  mediaUrl?: string;
  mediaType?: string;
  mediaNom?: string;
  mediaTaille?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class PublicationService {

  private apiUrl = `${environment.apiUrl}/marketplace`;

  constructor(private http: HttpClient) {}

  getFeed(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.apiUrl);
  }

  createPublication(request: CreatePublicationRequest): Observable<ApiResponse<Publication>> {
    return this.http.post<ApiResponse<Publication>>(this.apiUrl, request);
  }

  getMesPublications(): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/mes-publications`);
  }

  search(q: string): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/search`, { params: { q } });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  uploadMedia(file: File): Observable<ApiResponse<{ fileUrl: string; fileType: string }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ fileUrl: string; fileType: string }>>(
      `${environment.apiUrl}/chat/upload`,
      form
    );
  }
}
