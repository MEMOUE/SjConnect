import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { ParticulierService } from '../../services/particulier/particulier.service';
import { UserResponse } from '../../models/auth.model';
import { SECTEURS_ACTIVITE } from '../../shared/constants/secteurs-activite';
import { ParticulierNav } from '../particulier-nav/particulier-nav';

type Section = 'profil' | 'securite';

@Component({
  selector: 'app-parametres-particulier',
  standalone: true,
  imports: [CommonModule, FormsModule, ParticulierNav],
  templateUrl: './parametres-particulier.html',
  styleUrl: './parametres-particulier.css'
})
export class ParametresParticulier implements OnInit, OnDestroy {

  activeSection: Section = 'profil';
  isLoading  = true;
  isSaving   = false;
  successMsg = '';
  errorMsg   = '';

  currentUser: UserResponse | null = null;

  profile = {
    prenom: '', nom: '', email: '', telephone: '',
    secteurActivite: '', posteActuel: '', bio: '', newsletter: false
  };

  pwd = { current: '', newPwd: '', confirm: '' };
  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  readonly secteurs = SECTEURS_ACTIVITE;

  readonly navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'profil',   icon: 'pi pi-user', label: 'Profil' },
    { id: 'securite', icon: 'pi pi-lock', label: 'Sécurité' },
  ];

  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private particulierService: ParticulierService
  ) {}

  ngOnInit(): void {
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
  }

  goTo(s: Section): void {
    this.activeSection = s;
    this.clearMessages();
  }

  saveProfile(): void {
    if (!this.profile.prenom?.trim())          return this.flash('error', 'Le prénom est requis.');
    if (!this.profile.nom?.trim())              return this.flash('error', 'Le nom est requis.');
    if (!this.profile.secteurActivite)          return this.flash('error', "Le secteur d'activité est requis.");

    this.isSaving = true;
    this.particulierService.updateProfil(this.profile).subscribe({
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

  savePassword(): void {
    if (!this.pwd.current)                              return this.flash('error', 'Mot de passe actuel requis.');
    if (!this.pwd.newPwd || this.pwd.newPwd.length < 8)  return this.flash('error', 'Nouveau mot de passe : min 8 caractères.');
    if (this.pwd.newPwd !== this.pwd.confirm)            return this.flash('error', 'Les mots de passe ne correspondent pas.');

    this.isSaving = true;
    this.particulierService.changePassword({
      currentPassword: this.pwd.current,
      newPassword:     this.pwd.newPwd,
      confirmPassword: this.pwd.confirm
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.flash('ok', 'Mot de passe modifié avec succès !');
        this.pwd = { current: '', newPwd: '', confirm: '' };
      },
      error: err => {
        this.isSaving = false;
        this.flash('error', err.error?.message ?? 'Mot de passe actuel incorrect.');
      }
    });
  }

  logout(): void { this.authService.logout().subscribe(); }

  initiales(): string {
    const n = `${this.profile.prenom} ${this.profile.nom}`.trim();
    if (!n) return '??';
    const parts = n.split(' ');
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : n.substring(0, 2)).toUpperCase();
  }

  private fillProfile(u: UserResponse): void {
    this.profile = {
      prenom:          u.prenom          ?? '',
      nom:             u.nom             ?? '',
      email:           u.email           ?? '',
      telephone:       u.telephone       ?? '',
      secteurActivite: u.secteurActivite ?? '',
      posteActuel:     u.posteActuel     ?? '',
      bio:             u.bio             ?? '',
      newsletter:      u.newsletter      ?? false
    };
  }

  private flash(type: 'ok' | 'error', msg: string): void {
    this.successMsg = type === 'ok' ? msg : '';
    this.errorMsg   = type === 'error' ? msg : '';
    setTimeout(() => { this.successMsg = ''; this.errorMsg = ''; }, type === 'ok' ? 4000 : 5000);
  }

  private clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }
}
