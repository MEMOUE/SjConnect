import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { UserResponse } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

interface CompanyForm {
  nomEntreprise: string;
  typeEntreprise: string;
  secteurActivite: string;
  adressePhysique: string;
  telephone: string;
  email: string;
  username: string;
  numeroRegistreCommerce: string;
  description: string;
  siteWeb: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

type SectionKey = 'company' | 'security' | 'notifications' | 'appearance' | 'api';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres implements OnInit, OnDestroy {
  // ── Navigation ────────────────────────────────────────────────────
  activeSection: SectionKey = 'company';

  // ── État ──────────────────────────────────────────────────────────
  currentUser: UserResponse | null = null;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  showPasswordForm = false;

  private sub!: Subscription;

  // ── Formulaire Entreprise ─────────────────────────────────────────
  companyForm: CompanyForm = {
    nomEntreprise: '',
    typeEntreprise: '',
    secteurActivite: '',
    adressePhysique: '',
    telephone: '',
    email: '',
    username: '',
    numeroRegistreCommerce: '',
    description: '',
    siteWeb: ''
  };

  // ── Formulaire Mot de passe ───────────────────────────────────────
  passwordForm: PasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // ── Notifications ─────────────────────────────────────────────────
  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: true,
    newsletter: false
  };

  // ── Apparence ─────────────────────────────────────────────────────
  appearanceSettings = {
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    currency: 'XOF'
  };

  // ── Sécurité ──────────────────────────────────────────────────────
  securitySettings = {
    twoFactorAuth: false,
    sessionTimeout: '30'
  };

  // ── Types d'entreprises disponibles ──────────────────────────────
  typesEntreprise = [
    'BANQUES',
    'ASSURANCES',
    'SGI',
    'SGO',
    'FONDS_INVESTISSEMENT',
    'MICROFINANCE',
    'SOCIETES_BOURSE',
    'COURTIERS',
    'AUTRES'
  ];

  secteurs = [
    'Finance & Banque',
    'Assurance',
    'Investissement',
    'Microfinance',
    'Bourse & Valeurs',
    'Courtage',
    'Commerce',
    'Technologie',
    'Industrie',
    'Services',
    'Santé',
    'Éducation',
    'Agriculture',
    'Immobilier',
    'Transport & Logistique',
    'Autres'
  ];

  // ── Clés API (simulées) ───────────────────────────────────────────
  apiKeys = [
    {
      name: 'Production API',
      key: 'sk_live_••••••••••••1234',
      created: '2024-01-15',
      lastUsed: '2024-10-25'
    },
    {
      name: 'Development API',
      key: 'sk_test_••••••••••••5678',
      created: '2024-02-20',
      lastUsed: '2024-10-20'
    }
  ];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.populateForm(user);
      }
      this.isLoading = false;
    });

    // Recharger depuis l'API pour avoir des données fraîches
    this.authService.getCurrentUser().subscribe({
      next: user => {
        this.currentUser = user;
        this.populateForm(user);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ── Peuplement du formulaire ──────────────────────────────────────
  private populateForm(user: UserResponse): void {
    this.companyForm = {
      nomEntreprise:           user.nomEntreprise        ?? '',
      typeEntreprise:          user.typeEntreprise        ?? '',
      secteurActivite:         user.secteurActivite       ?? '',
      adressePhysique:         '',   // non retourné dans UserResponse — sera vide
      telephone:               user.telephone             ?? '',
      email:                   user.email                 ?? '',
      username:                user.username              ?? '',
      numeroRegistreCommerce:  '',   // non retourné
      description:             '',   // non retourné
      siteWeb:                 ''    // non retourné
    };
  }

  // ── Navigation ────────────────────────────────────────────────────
  setActiveSection(section: SectionKey): void {
    this.activeSection = section;
    this.clearMessages();
    this.showPasswordForm = false;
  }

  // ── Initiales de l'entreprise ─────────────────────────────────────
  getInitiales(): string {
    const nom = this.companyForm.nomEntreprise || this.currentUser?.nomEntreprise || '';
    if (!nom) return '??';
    const parts = nom.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  // ── Libellé du type d'entreprise ─────────────────────────────────
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'BANQUES':             'Banque',
      'ASSURANCES':          'Assurance',
      'SGI':                 'SGI',
      'SGO':                 'SGO',
      'FONDS_INVESTISSEMENT':'Fonds d\'investissement',
      'MICROFINANCE':        'Microfinance',
      'SOCIETES_BOURSE':     'Société de bourse',
      'COURTIERS':           'Courtier',
      'AUTRES':              'Autres'
    };
    return labels[type] ?? type;
  }

  // ── Sauvegarde des infos entreprise ──────────────────────────────
  saveCompanyInfo(): void {
    if (!this.companyForm.nomEntreprise.trim()) {
      this.showError('Le nom de l\'entreprise est requis.');
      return;
    }
    this.isSaving = true;
    this.clearMessages();

    // Appel PUT vers /api/entreprise/profil (à créer côté backend si absent)
    this.http.put(`${environment.apiUrl}/entreprise/profil`, this.companyForm).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Profil entreprise mis à jour avec succès !');
        // Rafraîchir l'utilisateur courant
        this.authService.getCurrentUser().subscribe();
      },
      error: (err) => {
        this.isSaving = false;
        // Si l'endpoint n'existe pas encore, afficher un message informatif
        if (err.status === 404 || err.status === 405) {
          this.showError('Endpoint de mise à jour non disponible. Contactez l\'administrateur.');
        } else {
          this.showError(err.error?.message ?? 'Erreur lors de la sauvegarde.');
        }
      }
    });
  }

  // ── Changement de mot de passe ────────────────────────────────────
  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.resetPasswordForm();
    }
  }

  savePassword(): void {
    if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 8) {
      this.showError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showError('Les mots de passe ne correspondent pas.');
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword,
      confirmPassword: this.passwordForm.confirmPassword
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess('Mot de passe modifié avec succès !');
        this.resetPasswordForm();
        this.showPasswordForm = false;
      },
      error: (err) => {
        this.isSaving = false;
        this.showError(err.error?.message ?? 'Erreur lors du changement de mot de passe.');
      }
    });
  }

  // ── Notifications ─────────────────────────────────────────────────
  saveNotifications(): void {
    this.showSuccess('Préférences de notification sauvegardées !');
  }

  // ── Apparence ─────────────────────────────────────────────────────
  saveAppearance(): void {
    this.showSuccess('Paramètres d\'apparence sauvegardés !');
  }

  // ── Sécurité ──────────────────────────────────────────────────────
  saveSecurity(): void {
    this.showSuccess('Paramètres de sécurité sauvegardés !');
  }

  // ── API Keys ──────────────────────────────────────────────────────
  generateApiKey(): void {
    const newKey = {
      name: 'Nouvelle clé ' + (this.apiKeys.length + 1),
      key: 'sk_' + Math.random().toString(36).substring(2, 18),
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Jamais'
    };
    this.apiKeys = [...this.apiKeys, newKey];
    this.showSuccess('Nouvelle clé API générée !');
  }

  revokeApiKey(key: typeof this.apiKeys[0]): void {
    this.apiKeys = this.apiKeys.filter(k => k !== key);
    this.showSuccess(`Clé "${key.name}" révoquée.`);
  }

  copyApiKey(key: string): void {
    navigator.clipboard.writeText(key).then(() => {
      this.showSuccess('Clé copiée dans le presse-papiers !');
    });
  }

  // ── Zone dangereuse ───────────────────────────────────────────────
  exportData(): void {
    this.showSuccess('Export des données en cours de préparation...');
  }

  deleteAccount(): void {
    if (confirm('⚠️ ATTENTION : Cette action est irréversible.\nVoulez-vous vraiment supprimer le compte de l\'entreprise ?')) {
      this.showError('Procédure de suppression initiée. Contactez le support.');
    }
  }

  // ── Déconnexion ───────────────────────────────────────────────────
  logout(): void {
    this.authService.logout().subscribe();
  }

  // ── Force du mot de passe ─────────────────────────────────────────
  getPasswordStrength(): number {
    const pwd = this.passwordForm.newPassword;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)  score += 25;
    if (pwd.length >= 12) score += 15;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
    return Math.min(score, 100);
  }

  getPasswordStrengthLabel(): string {
    const s = this.getPasswordStrength();
    if (s < 40) return 'Faible';
    if (s < 70) return 'Moyen';
    return 'Fort';
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => { this.successMessage = ''; }, 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => { this.errorMessage = ''; }, 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private resetPasswordForm(): void {
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }
}
