import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Language {
  code: string;
  label: string;
  flag: string;
}

interface TranslationResponse {
  originalText:   string;
  translatedText: string;
  targetLang:     string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {

  private readonly apiUrl = `${environment.apiUrl}/translate`;

  /** Cache : clé = "targetLang:texte" → texte traduit */
  private cache = new Map<string, string>();

  readonly languages: Language[] = [
    { code: 'original', label: 'Original',  flag: '🌐' },
    { code: 'fr',       label: 'Français',  flag: '🇫🇷' },
    { code: 'en',       label: 'English',   flag: '🇬🇧' },
    { code: 'ar',       label: 'العربية',   flag: '🇸🇦' },
    { code: 'es',       label: 'Español',   flag: '🇪🇸' },
    { code: 'pt',       label: 'Português', flag: '🇵🇹' },
    { code: 'zh',       label: '中文',       flag: '🇨🇳' },
    { code: 'de',       label: 'Deutsch',   flag: '🇩🇪' },
    { code: 'ru',       label: 'Русский',   flag: '🇷🇺' },
    { code: 'it',       label: 'Italiano',  flag: '🇮🇹' },
    { code: 'hi',       label: 'हिन्दी',    flag: '🇮🇳' },
    { code: 'tr',       label: 'Türkçe',    flag: '🇹🇷' },
  ];

  constructor(private http: HttpClient) {}

  /**
   * Traduit un texte via le backend Spring Boot (POST /api/translate).
   * Le backend gère LibreTranslate + fallback MyMemory.
   * Le JWT est ajouté automatiquement par l'authInterceptor.
   */
  translate(text: string, targetLang: string): Observable<string> {
    if (!text?.trim() || targetLang === 'original') {
      return of(text);
    }

    const cacheKey = `${targetLang}:${text}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return of(cached);
    }

    return this.http
      .post<TranslationResponse>(this.apiUrl, { text, targetLang })
      .pipe(
        map(res => {
          const translated = res?.translatedText ?? text;
          this.cache.set(cacheKey, translated);
          return translated;
        }),
        catchError(err => {
          console.warn('[TranslationService] Erreur backend:', err?.status, err?.message);
          return of(text);
        })
      );
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.languages.find(l => l.code === code);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
