import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BusinessPartner {
  id: string;
  name: string;
  type: string;
  status: string;
  contractValue: number;
  startDate: string;
  logo: string;
}

interface Transaction {
  id: string;
  partner: string;
  amount: number;
  date: string;
  status: string;
  type: string;
}

interface Contract {
  id: string;
  partner: string;
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  status: string;
}

@Component({
  selector: 'app-espace-b2-b',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './espace-b2-b.html',
  styleUrl: './espace-b2-b.css'
})
export class EspaceB2B implements OnInit {
  activeTab: string = 'partners';
  searchTerm: string = '';
  filterStatus: string = 'all';

  partners: BusinessPartner[] = [
    {
      id: 'P001',
      name: 'TechCorp Solutions',
      type: 'Fournisseur',
      status: 'active',
      contractValue: 250000,
      startDate: '2024-01-15',
      logo: '🏢'
    },
    {
      id: 'P002',
      name: 'Global Trading Inc',
      type: 'Client',
      status: 'active',
      contractValue: 450000,
      startDate: '2023-11-20',
      logo: '🌐'
    },
    {
      id: 'P003',
      name: 'Logistics Pro',
      type: 'Partenaire',
      status: 'active',
      contractValue: 180000,
      startDate: '2024-03-10',
      logo: '🚚'
    },
    {
      id: 'P004',
      name: 'Digital Services Ltd',
      type: 'Fournisseur',
      status: 'pending',
      contractValue: 95000,
      startDate: '2024-08-01',
      logo: '💻'
    },
    {
      id: 'P005',
      name: 'Manufacturing Co',
      type: 'Client',
      status: 'inactive',
      contractValue: 320000,
      startDate: '2023-06-15',
      logo: '⚙️'
    }
  ];

  transactions: Transaction[] = [
    {
      id: 'T001',
      partner: 'TechCorp Solutions',
      amount: 25000,
      date: '2024-10-20',
      status: 'completed',
      type: 'Achat'
    },
    {
      id: 'T002',
      partner: 'Global Trading Inc',
      amount: 45000,
      date: '2024-10-18',
      status: 'completed',
      type: 'Vente'
    },
    {
      id: 'T003',
      partner: 'Logistics Pro',
      amount: 12500,
      date: '2024-10-15',
      status: 'pending',
      type: 'Service'
    },
    {
      id: 'T004',
      partner: 'Digital Services Ltd',
      amount: 8900,
      date: '2024-10-12',
      status: 'completed',
      type: 'Achat'
    },
    {
      id: 'T005',
      partner: 'Global Trading Inc',
      amount: 52000,
      date: '2024-10-10',
      status: 'processing',
      type: 'Vente'
    }
  ];

  contracts: Contract[] = [
    {
      id: 'C001',
      partner: 'TechCorp Solutions',
      title: 'Contrat de fourniture IT',
      value: 250000,
      startDate: '2024-01-15',
      endDate: '2025-01-14',
      status: 'active'
    },
    {
      id: 'C002',
      partner: 'Global Trading Inc',
      title: 'Accord commercial annuel',
      value: 450000,
      startDate: '2023-11-20',
      endDate: '2024-11-19',
      status: 'renewal'
    },
    {
      id: 'C003',
      partner: 'Logistics Pro',
      title: 'Services logistiques',
      value: 180000,
      startDate: '2024-03-10',
      endDate: '2025-03-09',
      status: 'active'
    }
  ];

  stats = {
    totalPartners: 5,
    activePartners: 3,
    totalRevenue: 1295000,
    monthlyRevenue: 143400,
    pendingDeals: 4
  };

  ngOnInit(): void {
    this.calculateStats();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  calculateStats(): void {
    this.stats.totalPartners = this.partners.length;
    this.stats.activePartners = this.partners.filter(p => p.status === 'active').length;
    this.stats.totalRevenue = this.partners.reduce((sum, p) => sum + p.contractValue, 0);
  }

  getFilteredPartners(): BusinessPartner[] {
    return this.partners.filter(partner => {
      const matchesSearch = partner.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        partner.type.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFilter = this.filterStatus === 'all' || partner.status === this.filterStatus;
      return matchesSearch && matchesFilter;
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'status-active',
      'pending': 'status-pending',
      'inactive': 'status-inactive',
      'completed': 'status-completed',
      'processing': 'status-processing',
      'renewal': 'status-renewal'
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Actif',
      'pending': 'En attente',
      'inactive': 'Inactif',
      'completed': 'Complété',
      'processing': 'En cours',
      'renewal': 'À renouveler'
    };
    return labels[status] || status;
  }

  addNewPartner(): void {
    console.log('Ajouter nouveau partenaire');
    alert('Formulaire d\'ajout de partenaire');
  }

  viewPartner(partner: BusinessPartner): void {
    console.log('Voir détails du partenaire:', partner);
    alert(`Détails de ${partner.name}`);
  }

  editPartner(partner: BusinessPartner): void {
    console.log('Éditer partenaire:', partner);
    alert(`Éditer ${partner.name}`);
  }

  viewTransaction(transaction: Transaction): void {
    console.log('Voir transaction:', transaction);
    alert(`Transaction ${transaction.id}`);
  }

  viewContract(contract: Contract): void {
    console.log('Voir contrat:', contract);
    alert(`Contrat ${contract.id}`);
  }

  exportData(): void {
    console.log('Export des données B2B');
    alert('Export en cours...');
  }
}
