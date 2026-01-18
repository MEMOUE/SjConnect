import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

export interface Resource {
  id: number;
  name: string;
  type: 'FOLDER' | 'FILE';
  description?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
}

export interface Stats {
  folders: number;
  files: number;
  storage: number;
}

@Injectable({ providedIn: 'root' })
export class SharedService {
  private url = environment.apiUrl +'/shared';

  constructor(private http: HttpClient) {}

  createFolder(name: string, description?: string, parentId?: number): Observable<Resource> {
    let params = new HttpParams().set('name', name);
    if (description) params = params.set('description', description);
    if (parentId) params = params.set('parentId', parentId);
    return this.http.post<Resource>(`${this.url}/folder`, null, { params });
  }

  uploadFile(file: File, description?: string, parentId?: number): Observable<Resource> {
    const formData = new FormData();
    formData.append('file', file);
    let params = new HttpParams();
    if (description) params = params.set('description', description);
    if (parentId) params = params.set('parentId', parentId);
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

  share(id: number, userIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/share`, userIds);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.url}/stats`);
  }
}
