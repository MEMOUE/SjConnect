import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule],
  templateUrl: './verify-email.html'
})
export class VerifyEmail implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.status = 'error';
      this.message = 'Token manquant';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.status = 'success';
        this.message = response.message;
        setTimeout(() => this.router.navigate(['/connexion']), 3000);
      },
      error: (err) => {
        this.status = 'error';
        this.message = err.error?.message || 'Token invalide ou expiré';
      }
    });
  }
}