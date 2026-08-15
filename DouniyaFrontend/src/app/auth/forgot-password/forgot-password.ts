import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputText],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  form: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.get('email')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword({ email: this.form.value.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.isLoading = false;
        // On affiche quand même le message de succès pour ne pas révéler
        // si l'adresse email existe ou non, sauf en cas d'erreur serveur.
        if (err.status === 400 || err.status === 404) {
          this.submitted = true;
        } else {
          this.errorMessage = err.error?.message || "Une erreur est survenue, veuillez réessayer.";
        }
      }
    });
  }
}
