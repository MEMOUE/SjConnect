import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { ButtonDirective } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth/auth.service';
import { RegisterParticulierRequest } from '../../models/auth.interfaces';

@Component({
  selector: 'app-register-individu',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Select,
    Password,
    Checkbox,
    ButtonDirective,
    DatePicker,
  ],
  providers: [MessageService],
  templateUrl: './register-individu.html',
  styleUrl: './register-individu.css'
})
export class RegisterIndividu {
  registerForm: FormGroup;
  isLoading = false;
  maxDate = new Date();

  genres = [
    { label: 'Homme', value: 'homme' },
    { label: 'Femme', value: 'femme' },
    { label: 'Autre', value: 'autre' }
  ];

  secteursActivite = [
    { label: 'Technologie & IT', value: 'tech' },
    { label: 'Finance & Banque', value: 'finance' },
    { label: 'Commerce & Vente', value: 'commerce' },
    { label: 'Santé & Médical', value: 'sante' },
    { label: 'Education & Formation', value: 'education' },
    { label: 'Marketing & Communication', value: 'marketing' },
    { label: 'Industrie & Production', value: 'industrie' },
    { label: 'Agriculture', value: 'agricole' },
    { label: 'Transport & Logistique', value: 'transport' },
    { label: 'Autre', value: 'autre' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      genre: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      secteurActivite: ['', Validators.required],
      posteActuel: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      newsletter: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      // Convertir la date au format ISO (YYYY-MM-DD)
      const dateNaissance = this.registerForm.value.dateNaissance;
      const formattedDate = dateNaissance instanceof Date
        ? dateNaissance.toISOString().split('T')[0]
        : dateNaissance;

      const request: RegisterParticulierRequest = {
        prenom: this.registerForm.value.prenom,
        nom: this.registerForm.value.nom,
        genre: this.registerForm.value.genre,
        dateNaissance: formattedDate,
        telephone: this.registerForm.value.telephone,
        email: this.registerForm.value.email,
        secteurActivite: this.registerForm.value.secteurActivite,
        posteActuel: this.registerForm.value.posteActuel || undefined,
        username: this.registerForm.value.username,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        acceptTerms: this.registerForm.value.acceptTerms,
        newsletter: this.registerForm.value.newsletter
      };

      this.authService.registerParticulier(request).subscribe({
        next: (response) => {
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Inscription réussie',
            detail: response.message
          });

          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = 'Une erreur est survenue lors de l\'inscription';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.data) {
            const validationErrors = Object.values(error.error.data).join(', ');
            errorMessage = validationErrors;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur d\'inscription',
            detail: errorMessage,
            life: 5000
          });
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Veuillez remplir tous les champs requis'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}
