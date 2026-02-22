import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Meeting {
  id?: number;
  titre: string;
  description?: string;
  roomName: string;
  dateDebut: string;
  dateFin?: string;
  organisateurId?: number;
  organisateurNom?: string;
  participants: MeetingParticipant[];
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE';
  createdAt?: string;
}

export interface MeetingParticipant {
  userId?: number;
  nom: string;
  email?: string;
  statut: 'INVITE' | 'ACCEPTE' | 'REFUSE' | 'PRESENT';
}

export interface CreateMeetingRequest {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin?: string;
  participantIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private apiUrl = `${environment.apiUrl}/meetings`;

  constructor(private http: HttpClient) {}

  getMesMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(this.apiUrl);
  }

  creerMeeting(request: CreateMeetingRequest): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, request);
  }

  terminerMeeting(id: number): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.apiUrl}/${id}/terminer`, {});
  }
}
