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
    ButtonDirective
  ],
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
    private router: Router
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
      acceptTerms: [false, Validators.requiredTrue]
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
      console.log('Formulaire soumis:', this.registerForm.value);
      
      // Simulation d'une requête API
      setTimeout(() => {
        this.isLoading = false;
        alert('Compte entreprise créé avec succès !');
        this.router.navigate(['/connexion']);
      }, 2000);
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}