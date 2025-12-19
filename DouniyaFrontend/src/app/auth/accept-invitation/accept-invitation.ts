import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { ButtonDirective } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthEmployeService} from '../../services/auth/auth-employe.service'
import { AcceptInvitationRequest } from '../../models/auth.interfaces';

@Component({
  selector: 'app-accept-invitation',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Password,
  ],
  providers: [MessageService],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitation implements OnInit {
  acceptForm: FormGroup;
  isLoading = false;
  isCheckingToken = true;
  tokenValid = false;
  invitationToken: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private employeService: AuthEmployeService,
    private messageService: MessageService
  ) {
    this.acceptForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.invitationToken = params['token'];

      if (this.invitationToken) {
        this.checkInvitation();
      } else {
        this.isCheckingToken = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Token d\'invitation manquant'
        });
      }
    });
  }

  checkInvitation() {
    this.employeService.checkInvitation(this.invitationToken).subscribe({
      next: () => {
        this.isCheckingToken = false;
        this.tokenValid = true;
      },
      error: (error) => {
        this.isCheckingToken = false;
        this.tokenValid = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Invitation invalide',
          detail: error.error?.message || 'Le token d\'invitation est invalide ou a expiré'
        });
      }
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
    if (this.acceptForm.valid) {
      this.isLoading = true;

      const request: AcceptInvitationRequest = {
        invitationToken: this.invitationToken,
        username: this.acceptForm.value.username,
        password: this.acceptForm.value.password,
        confirmPassword: this.acceptForm.value.confirmPassword
      };

      this.employeService.acceptInvitation(request).subscribe({
        next: (response) => {
          this.isLoading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Compte activé',
            detail: response.message
          });

          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = 'Une erreur est survenue';

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
      Object.keys(this.acceptForm.controls).forEach(key => {
        this.acceptForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.router.navigate(['/']);
  }
}
