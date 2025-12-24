import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { ButtonDirective } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth/auth.service';
import { RegisterEntrepriseRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register-entrprise',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Textarea,
    Select,
    Password,
    Checkbox,
    ButtonDirective,
  ],
  providers: [MessageService],
  templateUrl: './register-entrprise.html',
  styleUrl: './register-entrprise.css'
})
export class RegisterEntrprise {
  registerForm: FormGroup;
  isLoading = false;

  typesEntreprise = [
    { label: 'PME', value: 'pme' },
    { label: 'Institution', value: 'institution' },
    { label: 'ONG', value: 'ong' },
    { label: 'Grande entreprise', value: 'grande_entreprise' },
    { label: 'Startup', value: 'startup' },
    { label: 'Autre', value: 'autre' }
  ];

  secteursActivite = [
    { label: 'Banque', value: 'banque' },
    { label: 'Assurance', value: 'assurance' },
    { label: 'SGI/SGO', value: 'sgi_sgo' },
    { label: 'Industriel', value: 'industriel' },
    { label: 'Transport', value: 'transport' },
    { label: 'Agricole', value: 'agricole' },
    { label: 'Santé', value: 'sante' },
    { label: 'Education', value: 'education' },
    { label: 'Autre', value: 'autre' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      nomEntreprise: ['', Validators.required],
      typeEntreprise: ['', Validators.required],
      secteurActivite: ['', Validators.required],
      adressePhysique: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      numeroRegistreCommerce: [''],
      description: [''],
      siteWeb: ['']
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

      const request: RegisterEntrepriseRequest = {
        nomEntreprise: this.registerForm.value.nomEntreprise,
        typeEntreprise: this.registerForm.value.typeEntreprise,
        secteurActivite: this.registerForm.value.secteurActivite,
        adressePhysique: this.registerForm.value.adressePhysique,
        telephone: this.registerForm.value.telephone,
        email: this.registerForm.value.email,
        username: this.registerForm.value.username,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        acceptTerms: this.registerForm.value.acceptTerms,
        numeroRegistreCommerce: this.registerForm.value.numeroRegistreCommerce || undefined,
        description: this.registerForm.value.description || undefined,
        siteWeb: this.registerForm.value.siteWeb || undefined
      };

      this.authService.registerEntreprise(request).subscribe({
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
            // Erreurs de validation
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
