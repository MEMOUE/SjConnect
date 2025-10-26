import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Employee {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  departement: string;
  poste: string;
  dateEmbauche: string;
  statut: string;
  initiales: string;
  color: string;
}

@Component({
  selector: 'app-equipe',
  imports: [CommonModule, FormsModule],
  templateUrl: './equipe.html',
  styleUrl: './equipe.css'
})
export class Equipe {
  employees: Employee[] = [
    {
      id: 1,
      nom: 'Kouassi Jean',
      email: 'jean.kouassi@douniya.com',
      telephone: '+225 07 12 34 56 78',
      departement: 'IT',
      poste: 'Développeur Senior',
      dateEmbauche: '2023-01-15',
      statut: 'Actif',
      initiales: 'KJ',
      color: 'blue-600'
    },
    {
      id: 2,
      nom: 'Aminata Diallo',
      email: 'aminata.diallo@douniya.com',
      telephone: '+225 07 23 45 67 89',
      departement: 'Marketing',
      poste: 'Chef Marketing',
      dateEmbauche: '2022-11-20',
      statut: 'Actif',
      initiales: 'AD',
      color: 'purple-600'
    },
    {
      id: 3,
      nom: 'Mohamed Traoré',
      email: 'mohamed.traore@douniya.com',
      telephone: '+225 07 34 56 78 90',
      departement: 'RH',
      poste: 'Gestionnaire RH',
      dateEmbauche: '2023-03-10',
      statut: 'Actif',
      initiales: 'MT',
      color: 'green-600'
    },
    {
      id: 4,
      nom: 'Fatou Koné',
      email: 'fatou.kone@douniya.com',
      telephone: '+225 07 45 67 89 01',
      departement: 'Finance',
      poste: 'Comptable',
      dateEmbauche: '2022-09-05',
      statut: 'Actif',
      initiales: 'FK',
      color: 'orange-600'
    },
    {
      id: 5,
      nom: 'Ibrahim Sanogo',
      email: 'ibrahim.sanogo@douniya.com',
      telephone: '+225 07 56 78 90 12',
      departement: 'IT',
      poste: 'DevOps Engineer',
      dateEmbauche: '2023-06-01',
      statut: 'Actif',
      initiales: 'IS',
      color: 'blue-600'
    },
    {
      id: 6,
      nom: 'Mariam Ouattara',
      email: 'mariam.ouattara@douniya.com',
      telephone: '+225 07 67 89 01 23',
      departement: 'Ventes',
      poste: 'Commercial Senior',
      dateEmbauche: '2022-07-12',
      statut: 'En congé',
      initiales: 'MO',
      color: 'pink-600'
    },
    {
      id: 7,
      nom: 'Youssouf Bamba',
      email: 'youssouf.bamba@douniya.com',
      telephone: '+225 07 78 90 12 34',
      departement: 'Support',
      poste: 'Support Technique',
      dateEmbauche: '2023-02-20',
      statut: 'Actif',
      initiales: 'YB',
      color: 'indigo-600'
    },
    {
      id: 8,
      nom: 'Aïcha Touré',
      email: 'aicha.toure@douniya.com',
      telephone: '+225 07 89 01 23 45',
      departement: 'Marketing',
      poste: 'Designer UI/UX',
      dateEmbauche: '2023-04-15',
      statut: 'Actif',
      initiales: 'AT',
      color: 'purple-600'
    }
  ];

  filteredEmployees: Employee[] = [...this.employees];

  stats = [
    { label: 'Total employés', value: '45', icon: 'pi-users', color: 'blue' },
    { label: 'Actifs', value: '42', icon: 'pi-check-circle', color: 'green' },
    { label: 'En congé', value: '3', icon: 'pi-calendar', color: 'yellow' },
    { label: 'Départements', value: '8', icon: 'pi-building', color: 'purple' }
  ];

  departements = ['IT', 'Marketing', 'RH', 'Finance', 'Ventes', 'Support', 'Administration', 'Logistique'];

  searchTerm = '';
  filterDepartement = '';
  filterStatut = '';

  showAddDialog = false;
  selectedEmployee: Employee | null = null;

  formData: Partial<Employee> = {
    nom: '',
    email: '',
    telephone: '',
    departement: '',
    poste: '',
    dateEmbauche: '',
    statut: 'Actif'
  };

  filterEmployees() {
    this.filteredEmployees = this.employees.filter(emp => {
      const matchSearch = !this.searchTerm ||
        emp.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.poste.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchDepartement = !this.filterDepartement || emp.departement === this.filterDepartement;
      const matchStatut = !this.filterStatut || emp.statut === this.filterStatut;

      return matchSearch && matchDepartement && matchStatut;
    });
  }

  getStatusClass(statut: string): string {
    switch(statut) {
      case 'Actif': return 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
      case 'Inactif': return 'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
      case 'En congé': return 'px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700';
      default: return 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700';
    }
  }

  getDepartmentColor(departement: string): string {
    const colors: {[key: string]: string} = {
      'IT': 'blue',
      'Marketing': 'purple',
      'RH': 'green',
      'Finance': 'orange',
      'Ventes': 'pink',
      'Support': 'indigo',
      'Administration': 'gray',
      'Logistique': 'yellow'
    };
    return colors[departement] || 'gray';
  }

  viewEmployee(employee: Employee) {
    console.log('Voir employé:', employee);
    // Implémentation à venir
  }

  editEmployee(employee: Employee) {
    this.selectedEmployee = employee;
    this.formData = { ...employee };
    this.showAddDialog = true;
  }

  deleteEmployee(employee: Employee) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.nom} ?`)) {
      this.employees = this.employees.filter(e => e.id !== employee.id);
      this.filterEmployees();
    }
  }

  closeDialog() {
    this.showAddDialog = false;
    this.selectedEmployee = null;
    this.formData = {
      nom: '',
      email: '',
      telephone: '',
      departement: '',
      poste: '',
      dateEmbauche: '',
      statut: 'Actif'
    };
  }

  saveEmployee() {
    if (this.selectedEmployee) {
      // Modification
      const index = this.employees.findIndex(e => e.id === this.selectedEmployee!.id);
      if (index !== -1) {
        this.employees[index] = { ...this.employees[index], ...this.formData };
      }
    } else {
      // Ajout
      const newEmployee: Employee = {
        id: Math.max(...this.employees.map(e => e.id)) + 1,
        nom: this.formData.nom || '',
        email: this.formData.email || '',
        telephone: this.formData.telephone || '',
        departement: this.formData.departement || '',
        poste: this.formData.poste || '',
        dateEmbauche: this.formData.dateEmbauche || '',
        statut: this.formData.statut || 'Actif',
        initiales: this.getInitials(this.formData.nom || ''),
        color: this.getRandomColor()
      };
      this.employees.push(newEmployee);
    }

    this.filterEmployees();
    this.closeDialog();
  }

  getInitials(nom: string): string {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getRandomColor(): string {
    const colors = ['blue-600', 'purple-600', 'green-600', 'orange-600', 'pink-600', 'indigo-600'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
