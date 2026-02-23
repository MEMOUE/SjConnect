import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { UserResponse } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

type Section = 'company' | 'security' | 'notifications' | 'appearance' | 'api';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres implements OnInit, OnDestroy {

  /* ─── UI ─────────────────────────────────────────────────── */
  activeSection: Section = 'company';
  isLoading   = true;
  isSaving    = false;
  successMsg  = '';
  errorMsg    = '';
  showPwdForm = false;

  /* ─── Profil ─────────────────────────────────────────────── */
  currentUser: UserResponse | null = null;

  profile = {
    nomEntreprise: '', typeEntreprise: '', secteurActivite: '',
    adressePhysique: '', telephone: '', email: '',
    username: '', numeroRegistreCommerce: '', description: '', siteWeb: ''
  };

  /* ─── Mot de passe ───────────────────────────────────────── */
  pwd = { current: '', newPwd: '', confirm: '' };
  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  /* ─── Préférences (persistées localStorage) ──────────────── */
  prefs = {
    theme:          'light' as 'light' | 'dark' | 'auto',
    language:       'fr'   as 'fr' | 'en' | 'ar',
    dateFormat:     'DD/MM/YYYY',
    currency:       'XOF',
    emailNotif:     true,
    smsNotif:       false,
    projectNotif:   true,
    newsletter:     false,
    twoFA:          false,
    sessionTimeout: '30'
  };

  /* ─── Clés API ───────────────────────────────────────────── */
  apiKeys: { name: string; key: string; created: string; lastUsed: string; masked: boolean }[] = [
    { name: 'Production',  key: 'sk_live_abc123def456ghi789', created: '15/01/2024', lastUsed: '25/10/2024', masked: true },
    { name: 'Development', key: 'sk_test_xyz789uvw456rst123', created: '20/02/2024', lastUsed: '20/10/2024', masked: true }
  ];

  /* ─── Données statiques ──────────────────────────────────── */
  readonly typesEntreprise = [
    { value: 'BANQUES',              label: 'Banque' },
    { value: 'ASSURANCES',           label: 'Assurance' },
    { value: 'SGI',                  label: 'SGI' },
    { value: 'SGO',                  label: 'SGO' },
    { value: 'FONDS_INVESTISSEMENT', label: "Fonds d'investissement" },
    { value: 'MICROFINANCE',         label: 'Microfinance' },
    { value: 'SOCIETES_BOURSE',      label: 'Société de bourse' },
    { value: 'COURTIERS',            label: 'Courtier' },
    { value: 'AUTRES',               label: 'Autres' }
  ];

  readonly secteurs = [
    'Finance & Banque','Assurance','Investissement','Microfinance',
    'Bourse & Valeurs','Courtage','Commerce','Technologie',
    'Industrie','Services','Santé','Éducation',
    'Agriculture','Immobilier','Transport & Logistique','Autres'
  ];

  readonly navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'company',       icon: 'pi pi-building',      label: 'Profil entreprise' },
    { id: 'security',      icon: 'pi pi-lock',          label: 'Sécurité' },
    { id: 'notifications', icon: 'pi pi-bell',          label: 'Notifications' },
    { id: 'appearance',    icon: 'pi pi-palette',       label: 'Apparence' },
    { id: 'api',           icon: 'pi pi-key',           label: 'Clés API' }
  ];

  readonly currencies: Record<string, string> = { XOF: 'FCFA', EUR: '€', USD: '$' };

  private sub!: Subscription;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private mql: MediaQueryList | null = null;
  private mqlListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(private authService: AuthService, private http: HttpClient) {}

  /* ════════════ INIT / DESTROY ════════════ */

  ngOnInit(): void {
    this.loadPrefs();
    this.applyTheme();
    this.applyLanguage();
    this.startSessionTimer();

    this.sub = this.authService.currentUser$.subscribe(u => {
      if (u) { this.currentUser = u; this.fillProfile(u); }
    });

    this.authService.getCurrentUser().subscribe({
      next:  u => { this.currentUser = u; this.fillProfile(u); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.mql && this.mqlListener) this.mql.removeEventListener('change', this.mqlListener);
  }

  /* ════════════ NAVIGATION ════════════ */

  goTo(s: Section): void {
    this.activeSection = s;
    this.clearMessages();
    this.showPwdForm = false;
  }

  /* ════════════ THÈME ════════════ */

  onThemeChange(v: string): void {
    this.prefs.theme = v as typeof this.prefs.theme;
    this.applyTheme();
  }

  applyTheme(): void {
    if (this.mql && this.mqlListener)
      this.mql.removeEventListener('change', this.mqlListener);

    document.body.classList.remove('theme-dark', 'theme-light');

    if (this.prefs.theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else if (this.prefs.theme === 'auto') {
      this.mql = window.matchMedia('(prefers-color-scheme: dark)');
      const set = (dark: boolean) => document.body.classList.toggle('theme-dark', dark);
      set(this.mql.matches);
      this.mqlListener = (e: MediaQueryListEvent) => set(e.matches);
      this.mql.addEventListener('change', this.mqlListener);
    } else {
      document.body.classList.add('theme-light');
    }
  }

  /* ════════════ LANGUE ════════════ */

  onLanguageChange(v: string): void {
    this.prefs.language = v as typeof this.prefs.language;
    this.applyLanguage();
  }

  applyLanguage(): void {
    document.documentElement.lang = this.prefs.language;
    document.documentElement.dir  = this.prefs.language === 'ar' ? 'rtl' : 'ltr';
  }

  /* ════════════ SESSION TIMEOUT ════════════ */

  private startSessionTimer(): void {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    const ms = parseInt(this.prefs.sessionTimeout, 10) * 60_000;
    if (!ms) return;
    this.sessionTimer = setTimeout(() => {
      this.flash('error', 'Session expirée. Déconnexion dans 3 secondes…');
      setTimeout(() => this.authService.logout().subscribe(), 3000);
    }, ms);
  }

  /* ════════════ SAUVEGARDE — PROFIL ════════════ */

  saveCompanyInfo(): void {
    if (!this.profile.nomEntreprise?.trim()) return this.flash('error', "Nom de l'entreprise requis.");
    if (!this.profile.typeEntreprise)        return this.flash('error', "Type d'entreprise requis.");
    if (!this.profile.secteurActivite)       return this.flash('error', "Secteur d'activité requis.");

    this.isSaving = true;
    const { username, ...payload } = this.profile;

    this.http.put<{ success: boolean; data: UserResponse }>(
      `${environment.apiUrl}/entreprise/profil`, payload
    ).subscribe({
      next: res => {
        this.isSaving = false;
        this.flash('ok', 'Profil mis à jour avec succès !');
        if (res?.data) { this.currentUser = res.data; this.fillProfile(res.data); }
      },
      error: err => {
        this.isSaving = false;
        this.flash('error', err.error?.message ?? 'Erreur lors de la sauvegarde.');
      }
    });
  }

  /* ════════════ SAUVEGARDE — MOT DE PASSE ════════════ */

  savePassword(): void {
    if (!this.pwd.current)                              return this.flash('error', 'Mot de passe actuel requis.');
    if (!this.pwd.newPwd || this.pwd.newPwd.length < 8) return this.flash('error', 'Nouveau mot de passe : min 8 caractères.');
    if (this.pwd.newPwd !== this.pwd.confirm)           return this.flash('error', 'Les mots de passe ne correspondent pas.');

    this.isSaving = true;
    this.http.post(`${environment.apiUrl}/entreprise/change-password`, {
      currentPassword: this.pwd.current,
      newPassword:     this.pwd.newPwd,
      confirmPassword: this.pwd.confirm
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.flash('ok', 'Mot de passe modifié avec succès !');
        this.pwd = { current: '', newPwd: '', confirm: '' };
        this.showPwdForm = false;
      },
      error: err => {
        this.isSaving = false;
        this.flash('error', err.error?.message ?? 'Mot de passe actuel incorrect.');
      }
    });
  }

  pwdStrength(): number {
    const p = this.pwd.newPwd;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s += 25;
    if (p.length >= 12)          s += 15;
    if (/[A-Z]/.test(p))        s += 20;
    if (/[0-9]/.test(p))        s += 20;
    if (/[^a-zA-Z0-9]/.test(p)) s += 20;
    return Math.min(s, 100);
  }

  pwdStrengthLabel(): string {
    const s = this.pwdStrength();
    if (s < 40) return 'Faible';
    if (s < 70) return 'Moyen';
    return 'Fort';
  }

  pwdStrengthColor(): string {
    const s = this.pwdStrength();
    if (s < 40) return 'bg-red-500';
    if (s < 70) return 'bg-amber-400';
    return 'bg-green-500';
  }

  pwdStrengthTextColor(): string {
    const s = this.pwdStrength();
    if (s < 40) return 'text-red-500';
    if (s < 70) return 'text-amber-500';
    return 'text-green-600';
  }

  /* ════════════ SAUVEGARDE — NOTIFICATIONS ════════════ */

  saveNotifications(): void {
    this.savePrefs();
    this.flash('ok', 'Notifications sauvegardées !');
  }

  /* ════════════ SAUVEGARDE — APPARENCE ════════════ */

  saveAppearance(): void {
    this.savePrefs();
    this.applyTheme();
    this.applyLanguage();
    this.flash('ok', 'Apparence sauvegardée !');
  }

  /* ════════════ SAUVEGARDE — SÉCURITÉ ════════════ */

  saveSecurity(): void {
    this.savePrefs();
    this.startSessionTimer();
    this.flash('ok', 'Paramètres de sécurité sauvegardés !');
  }

  /* ════════════ CLÉS API ════════════ */

  generateKey(): void {
    const rand = (n: number) => Math.random().toString(36).slice(2, 2 + n);
    this.apiKeys.push({
      name:     `Clé ${this.apiKeys.length + 1}`,
      key:      `sk_new_${rand(8)}${rand(8)}`,
      created:  new Date().toLocaleDateString('fr-FR'),
      lastUsed: 'Jamais',
      masked:   false
    });
    this.flash('ok', 'Nouvelle clé API générée !');
  }

  revokeKey(k: typeof this.apiKeys[0]): void {
    if (!confirm(`Révoquer la clé "${k.name}" ?`)) return;
    this.apiKeys = this.apiKeys.filter(x => x !== k);
    this.flash('ok', `Clé "${k.name}" révoquée.`);
  }

  copyKey(key: string): void {
    navigator.clipboard.writeText(key).then(
      ()  => this.flash('ok', 'Clé copiée dans le presse-papiers !'),
      ()  => this.flash('error', 'Impossible de copier la clé.')
    );
  }

  maskedKey(k: typeof this.apiKeys[0]): string {
    return k.masked
      ? k.key.slice(0, 7) + '••••••••••' + k.key.slice(-4)
      : k.key;
  }

  /* ════════════ EXPORT / SUPPRESSION / DÉCONNEXION ════════════ */

  exportData(): void {
    const blob = new Blob([
      JSON.stringify({ profile: this.currentUser, prefs: this.prefs, date: new Date().toISOString() }, null, 2)
    ], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `douniya_export_${new Date().toISOString().split('T')[0]}.json`
    });
    a.click();
    URL.revokeObjectURL(a.href);
    this.flash('ok', 'Données exportées avec succès !');
  }

  deleteAccount(): void {
    if (confirm('⚠️ Supprimer définitivement le compte ? Cette action est irréversible.'))
      this.flash('error', 'Contactez le support pour finaliser la suppression du compte.');
  }

  logout(): void { this.authService.logout().subscribe(); }

  /* ════════════ UTILITAIRES TEMPLATE ════════════ */

  initiales(): string {
    const n = (this.profile.nomEntreprise || this.currentUser?.nomEntreprise || '').trim();
    if (!n) return '??';
    const parts = n.split(' ');
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : n.substring(0, 2)).toUpperCase();
  }

  getCurrencySymbol(): string {
    return this.currencies[this.prefs.currency] ?? this.prefs.currency;
  }

  formatDatePreview(): string {
    const d = new Date();
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    if (this.prefs.dateFormat === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
    if (this.prefs.dateFormat === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
    return `${dd}/${mm}/${yyyy}`;
  }

  /* ════════════ PRIVÉ ════════════ */

  private fillProfile(u: UserResponse): void {
    this.profile = {
      nomEntreprise:          u.nomEntreprise          ?? '',
      typeEntreprise:         u.typeEntreprise          ?? '',
      secteurActivite:        u.secteurActivite         ?? '',
      adressePhysique:        u.adressePhysique         ?? '',
      telephone:              u.telephone               ?? '',
      email:                  u.email                   ?? '',
      username:               u.username                ?? '',
      numeroRegistreCommerce: u.numeroRegistreCommerce  ?? '',
      description:            u.description             ?? '',
      siteWeb:                u.siteWeb                 ?? ''
    };
  }

  private loadPrefs(): void {
    try {
      const raw = localStorage.getItem('douniya_prefs');
      if (raw) Object.assign(this.prefs, JSON.parse(raw));
    } catch { /* ignore */ }
  }

  private savePrefs(): void {
    try { localStorage.setItem('douniya_prefs', JSON.stringify(this.prefs)); }
    catch { /* ignore */ }
  }

  private flash(type: 'ok' | 'error', msg: string): void {
    this.successMsg = type === 'ok' ? msg : '';
    this.errorMsg   = type === 'error' ? msg : '';
    setTimeout(() => { this.successMsg = ''; this.errorMsg = ''; }, type === 'ok' ? 4000 : 5000);
  }

  private clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
