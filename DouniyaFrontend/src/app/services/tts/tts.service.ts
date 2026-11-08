import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface TtsResponse {
  audioContent: string;
  lang: string;
}

/** Synthèse vocale Google Cloud Text-to-Speech via le backend (POST /api/tts). */
@Injectable({ providedIn: 'root' })
export class TtsService {

  private readonly apiUrl = `${environment.apiUrl}/tts`;

  /** Cache : clé = "lang:texte" → data URL MP3 (une phrase n'est synthétisée qu'une fois). */
  private cache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  /**
   * Retourne l'audio MP3 du texte sous forme de data URL jouable par un élément Audio.
   * Erreur (503 clé Google absente, 502 Google KO…) : à l'appelant de prévoir un secours.
   */
  synthesize(text: string, lang: string): Observable<string> {
    const cle = `${lang}:${text}`;
    const enCache = this.cache.get(cle);
    if (enCache) return of(enCache);

    return this.http.post<TtsResponse>(this.apiUrl, { text, lang }).pipe(
      map(r => `data:audio/mp3;base64,${r.audioContent}`),
      tap(url => {
        if (this.cache.size >= 50) this.cache.delete(this.cache.keys().next().value as string);
        this.cache.set(cle, url);
      })
    );
  }
}
