import { Component, signal } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Toast } from 'primeng/toast';
import { Footer } from './footer/footer';
import { AuthService } from './services/auth/auth.service';
import { NotificationCenterService } from './services/notification-center/notification-center.service';
import { CallService } from './services/call/call.service';
import { CallOverlay } from './shared/call-overlay/call-overlay';
import {filter, mergeMap} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Toast,
    CallOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  mobileMenuOpen = signal(false);
  routerLinkActiveOptions = { exact: true };

  showFooter = signal(true);

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationCenter: NotificationCenterService,
    public callService: CallService
  ) {
    // Logique pour détecter le flag hideFooter
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // Si hideFooter est à true dans la route, on met showFooter à false
      this.showFooter.set(data['hideFooter'] !== true);
      // Un appel en cours ne doit jamais se fermer en changeant de page :
      // s'il est encore plein écran, on le réduit au lieu de bloquer la
      // navigation vers la nouvelle page.
      this.callService.minimizeForNavigation();
    });

    // Notifications temps réel (messages/appels) tant que l'utilisateur est connecté
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.notificationCenter.start();
      } else {
        this.notificationCenter.stop();
      }
    });
  }

  // 🔐 connecté si token présent dans localStorage
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  goToChat(): void {
    const isParticulier = this.authService.isParticulier();
    this.router.navigate([isParticulier ? '/particulier/chat' : '/entreprise/chat']);
  }

  logout() {
    // AuthService.logout() nettoie la session et redirige vers /connexion
    // lui-même, y compris si l'appel API échoue.
    this.authService.logout().subscribe();
  }
}

