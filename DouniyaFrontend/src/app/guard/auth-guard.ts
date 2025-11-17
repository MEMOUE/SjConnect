import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (this.authService.isAuthenticated()) {
      // Vérifier le rôle si spécifié dans les données de la route
      const requiredRole = route.data['role'];
      
      if (requiredRole) {
        const currentUser = this.authService.getCurrentUserValue();
        
        if (currentUser && currentUser.role === requiredRole) {
          return true;
        } else {
          // Rôle non autorisé, rediriger vers la page d'accueil
          this.router.navigate(['/']);
          return false;
        }
      }
      
      return true;
    }

    // Non authentifié, rediriger vers la connexion
    this.router.navigate(['/connexion'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class EntrepriseGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isEntreprise()) {
      return true;
    }
    
    this.router.navigate(['/']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParticulierGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isParticulier()) {
      return true;
    }
    
    this.router.navigate(['/']);
    return false;
  }
}