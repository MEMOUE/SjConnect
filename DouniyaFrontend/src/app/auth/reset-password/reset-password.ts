import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Password } from 'primeng/password';
import { AuthService } from '../../services/auth/auth.service';
import { passwordComplexityValidators } from '../../shared/validators/password.validator';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Password],
  templateUrl: './reset-password.html'
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  token = '';
  isLoading = false;
  status: 'form' | 'success' | 'invalid-token' = 'form';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      password: ['', passwordComplexityValidators()],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.status = 'invalid-token';
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => this.form.get(key)?.markAsTouched());
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      token: this.token,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.status = 'success';
        setTimeout(() => this.router.navigate(['/connexion']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Le lien est invalide ou a expiré.';
      }
    });
  }
}
