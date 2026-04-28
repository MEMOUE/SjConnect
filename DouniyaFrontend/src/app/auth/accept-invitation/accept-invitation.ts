import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeService } from '../../services/auth/employe.service';
import { AcceptInvitationRequest } from '../../models/auth.model';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitation implements OnInit {

  // Token
  invitationToken = '';
  isCheckingToken = true;
  tokenValid = false;

  // Champs du formulaire
  username = '';
  password = '';
  confirmPassword = '';

  // États UI
  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeService: EmployeService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.invitationToken = params['token'] || '';
      if (this.invitationToken) {
        this.checkInvitation();
      } else {
        this.isCheckingToken = false;
        this.tokenValid = false;
      }
    });
  }

  checkInvitation(): void {
    this.employeService.checkInvitation(this.invitationToken).subscribe({
      next: () => {
        this.tokenValid = true;
        this.isCheckingToken = false;
      },
      error: (err) => {
        this.tokenValid = false;
        this.isCheckingToken = false;
        this.errorMessage = err.error?.message || '';
      }
    });
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.username.trim().length < 3) {
      this.errorMessage = 'Le nom d\'utilisateur doit contenir au moins 3 caractères.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (!this.passwordsMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;

    const request: AcceptInvitationRequest = {
      invitationToken: this.invitationToken,
      username: this.username.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    this.employeService.acceptInvitation(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.successMessage = response.message || 'Compte activé avec succès.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/connexion']);
  }
}
