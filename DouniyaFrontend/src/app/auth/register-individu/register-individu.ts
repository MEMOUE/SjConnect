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
    DatePicker
  ],
  templateUrl: './register-individu.html',
  styleUrl: './register-individu.css'
})
export class RegisterIndividu {
  registerForm: FormGroup;
  isLoading = false;
  maxDate = new Date(); // Date maximale = aujourd'hui

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
    private router: Router
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
      console.log('Formulaire soumis:', this.registerForm.value);
      
      // Simulation d'une requête API
      setTimeout(() => {
        this.isLoading = false;
        alert('Compte individuel créé avec succès !');
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