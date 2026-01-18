import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Footer } from './footer/footer';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  mobileMenuOpen = signal(false);
  routerLinkActiveOptions = { exact: true };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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

