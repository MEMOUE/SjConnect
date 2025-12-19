import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthEmployeService } from '../../services/auth/auth-employe.service';
import { EmployeResponse } from '../../models/auth.interfaces';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface Employee {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  departement: string;
  poste: string;
  dateCreation: string;
  statut: string;
  invitationAccepted: boolean;
  initiales: string;
  color: string;
  role: string;
  numeroMatricule?: string;
}

@Component({
  selector: 'app-equipe',
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './equipe.html',
  styleUrl: './equipe.css'
})
export class Equipe implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading = true;

  stats = [
    { label: 'Total employés', value: '0', icon: 'pi-users', color: 'blue' },
    { label: 'Actifs', value: '0', icon: 'pi-check-circle', color: 'green' },
    { label: 'En attente', value: '0', icon: 'pi-clock', color: 'yellow' },
    { label: 'Départements', value: '0', icon: 'pi-building', color: 'purple' }
  ];

  departements: string[] = [];

  searchTerm = '';
  filterDepartement = '';
  filterStatut = '';

  constructor(
    private employeService: AuthEmployeService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  /**
   * Charger tous les employés depuis l'API
   */
  loadEmployees(): void {
    this.isLoading = true;

    this.employeService.getAllEmployes().subscribe({
      next: (employes: EmployeResponse[]) => {
        // Transformer les données de l'API en format local
        this.employees = employes.map(emp => this.transformEmploye(emp));
        this.filteredEmployees = [...this.employees];

        // Calculer les statistiques
        this.calculateStats();

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la liste des employés',
          life: 5000
        });

        this.isLoading = false;
      }
    });
  }

  /**
   * Transformer un EmployeResponse en Employee local
   */
  private transformEmploye(emp: EmployeResponse): Employee {
    const nomComplet = `${emp.prenom} ${emp.nom}`;

    return {
      id: emp.id,
      nom: emp.nom,
      prenom: emp.prenom,
      nomComplet: nomComplet,
      email: emp.email,
      telephone: emp.telephone,
      departement: this.formatDepartement(emp.departement),
      poste: emp.poste,
      dateCreation: this.formatDate(emp.createdAt),
      statut: emp.invitationAccepted ? 'Actif' : 'En attente',
      invitationAccepted: emp.invitationAccepted,
      initiales: this.getInitials(nomComplet),
      color: this.getRandomColor(),
      role: emp.rolePlateforme,
      numeroMatricule: emp.numeroMatricule
    };
  }

  /**
   * Formater le département
   */
  private formatDepartement(dept: string): string {
    const departementMap: { [key: string]: string } = {
      'direction': 'Direction Générale',
      'rh': 'Ressources Humaines',
      'finance': 'Finance & Comptabilité',
      'it': 'IT & Technologie',
      'commercial': 'Commercial & Ventes',
      'marketing': 'Marketing & Communication',
      'production': 'Production',
      'logistique': 'Logistique',
      'service_client': 'Service Client',
      'autre': 'Autre'
    };

    return departementMap[dept] || dept;
  }

  /**
   * Formater la date
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calculer les statistiques
   */
  private calculateStats(): void {
    const totalEmployees = this.employees.length;
    const activeEmployees = this.employees.filter(e => e.invitationAccepted).length;
    const pendingEmployees = this.employees.filter(e => !e.invitationAccepted).length;

    // Compter les départements uniques
    const uniqueDepartements = new Set(this.employees.map(e => e.departement));
    this.departements = Array.from(uniqueDepartements);

    this.stats = [
      { label: 'Total employés', value: totalEmployees.toString(), icon: 'pi-users', color: 'blue' },
      { label: 'Actifs', value: activeEmployees.toString(), icon: 'pi-check-circle', color: 'green' },
      { label: 'En attente', value: pendingEmployees.toString(), icon: 'pi-clock', color: 'yellow' },
      { label: 'Départements', value: this.departements.length.toString(), icon: 'pi-building', color: 'purple' }
    ];
  }

  /**
   * Filtrer les employés
   */
  filterEmployees(): void {
    this.filteredEmployees = this.employees.filter(emp => {
      const matchSearch = !this.searchTerm ||
        emp.nomComplet.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.poste.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchDepartement = !this.filterDepartement || emp.departement === this.filterDepartement;
      const matchStatut = !this.filterStatut || emp.statut === this.filterStatut;

      return matchSearch && matchDepartement && matchStatut;
    });
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(statut: string): string {
    switch(statut) {
      case 'Actif':
        return 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
      case 'En attente':
        return 'px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700';
      case 'Inactif':
        return 'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
      default:
        return 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700';
    }
  }

  /**
   * Obtenir la couleur du département
   */
  getDepartmentColor(departement: string): string {
    const colors: {[key: string]: string} = {
      'Direction Générale': 'gray',
      'Ressources Humaines': 'green',
      'Finance & Comptabilité': 'orange',
      'IT & Technologie': 'blue',
      'Commercial & Ventes': 'pink',
      'Marketing & Communication': 'purple',
      'Production': 'indigo',
      'Logistique': 'yellow',
      'Service Client': 'teal',
      'Autre': 'gray'
    };
    return colors[departement] || 'gray';
  }

  /**
   * Voir les détails d'un employé
   */
  viewEmployee(employee: Employee): void {
    console.log('Voir employé:', employee);
    // TODO: Implémenter la navigation vers la page de détails
    // this.router.navigate(['/entreprise/employe', employee.id]);
  }

  /**
   * Modifier un employé
   */
  editEmployee(employee: Employee): void {
    console.log('Modifier employé:', employee);
    // TODO: Implémenter la navigation vers la page de modification
    // this.router.navigate(['/entreprise/employe/modifier', employee.id]);
  }

  /**
   * Supprimer un employé
   */
  deleteEmployee(employee: Employee): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.nomComplet} ?`)) {
      this.employeService.deleteEmploye(employee.id).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Employé supprimé',
            detail: response.message,
            life: 3000
          });

          // Recharger la liste
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer l\'employé',
            life: 5000
          });
        }
      });
    }
  }

  /**
   * Renvoyer l'invitation à un employé
   */
  resendInvitation(employee: Employee): void {
    if (!employee.invitationAccepted) {
      this.employeService.resendInvitation(employee.id).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Invitation renvoyée',
            detail: response.message,
            life: 3000
          });
        },
        error: (error) => {
          console.error('Erreur lors du renvoi de l\'invitation:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de renvoyer l\'invitation',
            life: 5000
          });
        }
      });
    }
  }

  /**
   * Obtenir les initiales d'un nom
   */
  private getInitials(nom: string): string {
    return nom
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Obtenir une couleur aléatoire
   */
  private getRandomColor(): string {
    const colors = ['blue-600', 'purple-600', 'green-600', 'orange-600', 'pink-600', 'indigo-600', 'red-600', 'teal-600'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
