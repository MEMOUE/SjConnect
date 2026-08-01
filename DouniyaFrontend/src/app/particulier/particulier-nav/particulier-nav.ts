import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserResponse } from '../../models/auth.model';

@Component({
  selector: 'app-particulier-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './particulier-nav.html'
})
export class ParticulierNav {

  @Input() unreadCount = 0;

  currentUser: UserResponse | null = null;

  readonly navItems = [
    { route: '/particulier/dashboard',      icon: 'pi-home',         label: 'Tableau de bord' },
    { route: '/particulier/marketplace',    icon: 'pi-shopping-bag', label: 'Marketplace' },
    { route: '/particulier/chat',           icon: 'pi-comments',     label: 'Messagerie' },
    { route: '/particulier/visio',          icon: 'pi-video',        label: 'Visioconférence' },
    { route: '/particulier/espace-partage', icon: 'pi-building',     label: 'Espace partagé' },
    { route: '/particulier/projet',         icon: 'pi-briefcase',    label: 'Projets' },
    { route: '/particulier/parametres',     icon: 'pi-cog',          label: 'Paramètres' },
  ];

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.getCurrentUserValue();
  }

  get displayName(): string {
    const u = this.currentUser;
    if (!u) return 'Mon compte';
    return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.username || 'Mon compte';
  }

  get initiales(): string {
    const n = this.displayName;
    const parts = n.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : n.substring(0, 2)).toUpperCase();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
