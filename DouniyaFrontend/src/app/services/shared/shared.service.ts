import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resource {
  id: number;
  name: string;
  type: 'FOLDER' | 'FILE';
  description?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  ownerId?: number;
  ownerName?: string;
  publicAccess?: boolean;
  createdAt: string;
}

export interface Stats {
  folders: number;
  files: number;
  storage: number;
}

export interface ShareUser {
  id: number;
  name: string;
  email: string;
  poste?: string;
  departement?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class SharedService {
  private url = environment.apiUrl + '/shared';

  constructor(private http: HttpClient) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  createFolder(name: string, description?: string, parentId?: number): Observable<Resource> {
    let params = new HttpParams().set('name', name);
    if (description) params = params.set('description', description);
    if (parentId) params = params.set('parentId', parentId.toString());
    return this.http.post<Resource>(`${this.url}/folder`, null, { params });
  }

  uploadFile(file: File, description?: string, parentId?: number): Observable<Resource> {
    const formData = new FormData();
    formData.append('file', file);
    let params = new HttpParams();
    if (description) params = params.set('description', description);
    if (parentId) params = params.set('parentId', parentId.toString());
    return this.http.post<Resource>(`${this.url}/file`, formData, { params });
  }

  getRootResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.url}/root`);
  }

  getChildren(id: number): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.url}/${id}/children`);
  }

  search(q: string): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.url}/search`, { params: { q } });
  }

  getMyResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.url}/my`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.url}/stats`);
  }

  // ── TÉLÉCHARGEMENT (Blob + auth token via interceptor) ───────────────────

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/download/${id}`, {
      responseType: 'blob'
    });
  }

  // ── VISUALISATION (Blob + auth token via interceptor) ────────────────────

  viewFile(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/view/${id}`, {
      responseType: 'blob'
    });
  }

  // ── PARTAGE ──────────────────────────────────────────────────────────────

  share(id: number, userIds: number[]): Observable<any> {
    return this.http.post(`${this.url}/${id}/share`, userIds);
  }

  unshare(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.url}/${id}/share/${userId}`);
  }

  getSharedWith(id: number): Observable<ShareUser[]> {
    return this.http.get<ShareUser[]>(`${this.url}/${id}/shared-with`);
  }

  setPublicAccess(id: number, isPublic: boolean): Observable<any> {
    return this.http.put(`${this.url}/${id}/public-access`, null, {
      params: { isPublic: isPublic.toString() }
    });
  }

  // ── EMPLOYÉS POUR LE PARTAGE ─────────────────────────────────────────────

  getEmployeesForShare(): Observable<ShareUser[]> {
    return this.http.get<ShareUser[]>(`${this.url}/employees-for-share`);
  }

  // ── RENOMMER ─────────────────────────────────────────────────────────────

  rename(id: number, name: string): Observable<Resource> {
    return this.http.put<Resource>(`${this.url}/${id}/rename`, null, {
      params: { name }
    });
  }
}
