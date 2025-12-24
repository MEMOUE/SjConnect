import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonDirective } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { EmployeService} from '../../services/auth/employe.service'
import { CreateEmployeRequest } from '../../models/auth.model';

@Component({
  selector: 'app-new-employer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    ButtonDirective
  ],
  providers: [MessageService],
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
    private router: Router,
    private employeService: EmployeService,
    private messageService: MessageService
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

      const request: CreateEmployeRequest = {
        prenom: this.employerForm.value.prenom,
        nom: this.employerForm.value.nom,
        email: this.employerForm.value.email,
        telephone: this.employerForm.value.telephone,
        poste: this.employerForm.value.poste,
        departement: this.employerForm.value.departement,
        role: this.employerForm.value.role,
        numeroMatricule: this.employerForm.value.numeroMatricule || undefined
      };

      this.employeService.createEmploye(request).subscribe({
        next: (response) => {
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Employé ajouté',
            detail: response.message
          });

          setTimeout(() => {
            this.router.navigate(['/entreprise/equipe']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = 'Une erreur est survenue lors de l\'ajout de l\'employé';

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.data) {
            const validationErrors = Object.values(error.error.data).join(', ');
            errorMessage = validationErrors;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 5000
          });
        }
      });
    } else {
      Object.keys(this.employerForm.controls).forEach(key => {
        this.employerForm.get(key)?.markAsTouched();
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Veuillez remplir tous les champs requis'
      });
    }
  }

  onCancel() {
    this.router.navigate(['/entreprise/equipe']);
  }
}
