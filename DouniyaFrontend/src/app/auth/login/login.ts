import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { ButtonDirective } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth/auth.service';
import { LoginRequest } from '../../models/auth.interfaces';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Password,
    Checkbox,
    ButtonDirective,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  accountType: 'entreprise' | 'individuel' = 'entreprise';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginRequest: LoginRequest = {
        identifier: this.loginForm.value.identifier,
        password: this.loginForm.value.password,
        accountType: this.accountType,
        rememberMe: this.loginForm.value.rememberMe
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Connexion réussie',
            detail: `Bienvenue ${response.user.username} !`
          });

          // Rediriger selon le rôle
          setTimeout(() => {
            if (response.user.role === 'ENTREPRISE') {
              this.router.navigate(['/dashboard-entreprise']);
            } else if (response.user.role === 'PARTICULIER') {
              this.router.navigate(['/']);
            } else if (response.user.role === 'EMPLOYE') {
              this.router.navigate(['/entreprise/equipe']);
            }
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = 'Une erreur est survenue lors de la connexion';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Identifiants incorrects ou compte non activé';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur de connexion',
            detail: errorMessage
          });
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
