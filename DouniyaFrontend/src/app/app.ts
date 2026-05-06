import { Component, signal } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Footer } from './footer/footer';
import { AuthService } from './services/auth/auth.service';
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
    private activatedRoute: ActivatedRoute
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

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/connexion']);
      },
      error: () => {
        // même si l’API échoue, on force la déconnexion locale
        localStorage.clear();
        this.router.navigate(['/connexion']);
      }
    });
  }
}

