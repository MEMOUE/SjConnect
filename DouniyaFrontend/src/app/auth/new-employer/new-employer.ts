import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-new-employer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    ButtonDirective
  ],
  templateUrl: './new-employer.html',
  styleUrl: './new-employer.css'
})
export class NewEmployer {
  employerForm: FormGroup;
  isLoading = false;

  departements = [
    { label: 'Direction Générale', value: 'direction' },
    { label: 'Ressources Humaines', value: 'rh' },
    { label: 'Finance & Comptabilité', value: 'finance' },
    { label: 'IT & Technologie', value: 'it' },
    { label: 'Commercial & Ventes', value: 'commercial' },
    { label: 'Marketing & Communication', value: 'marketing' },
    { label: 'Production', value: 'production' },
    { label: 'Logistique', value: 'logistique' },
    { label: 'Service Client', value: 'service_client' },
    { label: 'Autre', value: 'autre' }
  ];

  roles = [
    { label: 'Administrateur', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Employé', value: 'employee' },
    { label: 'Collaborateur externe', value: 'external' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.employerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      poste: ['', Validators.required],
      departement: ['', Validators.required],
      role: ['', Validators.required],
      numeroMatricule: ['']
    });
  }

  onSubmit() {
    if (this.employerForm.valid) {
      this.isLoading = true;
      console.log('Employé ajouté:', this.employerForm.value);
      
      // Simulation d'une requête API
      setTimeout(() => {
        this.isLoading = false;
        alert('Employé ajouté avec succès ! Un email d\'invitation lui a été envoyé.');
        this.router.navigate(['/']); // Rediriger vers le dashboard
      }, 1500);
    } else {
      Object.keys(this.employerForm.controls).forEach(key => {
        this.employerForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.router.navigate(['/']); // Retour au dashboard
  }
}