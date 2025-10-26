import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompanyType {
  id: string;
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  subTypes: SubType[];
}

interface SubType {
  id: string;
  name: string;
  selected: boolean;
}

interface Message {
  id: string;
  content: string;
  date: string;
  recipients: string[];
  status: 'draft' | 'sent';
}

@Component({
  selector: 'app-market-pace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './market-pace.html',
  styleUrl: './market-pace.css'
})
export class MarketPace implements OnInit {
  messageContent: string = '';
  searchTerm: string = '';

  companyTypes: CompanyType[] = [
    {
      id: 'banques',
      name: 'BANQUES',
      icon: '🏦',
      color: '#1e40af',
      selected: false,
      subTypes: [
        { id: 'S1', name: 'S1', selected: false },
        { id: 'S2', name: 'S2', selected: false },
        { id: 'S3', name: 'S3', selected: false }
      ]
    },
    {
      id: 'assurances',
      name: 'ASSURANCES',
      icon: '🛡️',
      color: '#059669',
      selected: false,
      subTypes: [
        { id: 'S1', name: 'S1', selected: false },
        { id: 'S2', name: 'S2', selected: false },
        { id: 'S3', name: 'S3', selected: false }
      ]
    },
    {
      id: 'sgi',
      name: 'SGI',
      icon: '💼',
      color: '#7c3aed',
      selected: false,
      subTypes: [
        { id: 'S1', name: 'S1', selected: false },
        { id: 'S2', name: 'S2', selected: false },
        { id: 'S3', name: 'S3', selected: false }
      ]
    },
    {
      id: 'sgo',
      name: 'SGO',
      icon: '📊',
      color: '#dc2626',
      selected: false,
      subTypes: [
        { id: 'S1', name: 'S1', selected: false },
        { id: 'S2', name: 'S2', selected: false },
        { id: 'S3', name: 'S3', selected: false }
      ]
    },
    {
      id: 'fonds',
      name: "FONDS D'INVESTISSEMENT",
      icon: '💰',
      color: '#ea580c',
      selected: false,
      subTypes: [
        { id: 'S1', name: 'S1', selected: false },
        { id: 'S2', name: 'S2', selected: false },
        { id: 'S3', name: 'S3', selected: false }
      ]
    }
  ];

  messages: Message[] = [
    {
      id: 'M001',
      content: 'Nouvelle réglementation financière en vigueur...',
      date: '2024-11-01',
      recipients: ['banques', 'assurances'],
      status: 'sent'
    },
    {
      id: 'M002',
      content: 'Mise à jour des taux d\'intérêt...',
      date: '2024-10-30',
      recipients: ['banques'],
      status: 'sent'
    }
  ];

  stats = {
    totalRecipients: 0,
    totalCompanies: 15,
    messagesSent: 24,
    responseRate: 87
  };

  ngOnInit(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    this.stats.totalRecipients = this.getSelectedCount();
  }

  toggleCompanyType(company: CompanyType): void {
    company.selected = !company.selected;
    // Sélectionner/désélectionner tous les sous-types
    company.subTypes.forEach(sub => sub.selected = company.selected);
    this.calculateStats();
  }

  toggleSubType(company: CompanyType, subType: SubType): void {
    subType.selected = !subType.selected;
    // Si tous les sous-types sont sélectionnés, sélectionner le type principal
    company.selected = company.subTypes.every(sub => sub.selected);
    this.calculateStats();
  }

  getSelectedCount(): number {
    return this.companyTypes.reduce((count, company) => {
      return count + company.subTypes.filter(sub => sub.selected).length;
    }, 0);
  }

  getSelectedCompanies(): string[] {
    const selected: string[] = [];
    this.companyTypes.forEach(company => {
      company.subTypes.forEach(sub => {
        if (sub.selected) {
          selected.push(`${company.name} - ${sub.name}`);
        }
      });
    });
    return selected;
  }

  sendMessage(): void {
    if (!this.messageContent.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) {
      alert('Veuillez sélectionner au moins un destinataire');
      return;
    }

    const recipients = this.companyTypes
      .filter(c => c.subTypes.some(s => s.selected))
      .map(c => c.id);

    const newMessage: Message = {
      id: `M${Date.now()}`,
      content: this.messageContent,
      date: new Date().toISOString().split('T')[0],
      recipients: recipients,
      status: 'sent'
    };

    this.messages.unshift(newMessage);

    alert(`Message envoyé à ${selectedCount} entreprise(s) !`);

    // Réinitialiser le formulaire
    this.messageContent = '';
    this.clearSelection();
  }

  clearSelection(): void {
    this.companyTypes.forEach(company => {
      company.selected = false;
      company.subTypes.forEach(sub => sub.selected = false);
    });
    this.calculateStats();
  }

  selectAll(): void {
    const allSelected = this.isAllSelected();
    this.companyTypes.forEach(company => {
      company.selected = !allSelected;
      company.subTypes.forEach(sub => sub.selected = !allSelected);
    });
    this.calculateStats();
  }

  isAllSelected(): boolean {
    return this.companyTypes.every(c => c.selected);
  }

  getRecipientNames(recipients: string[]): string {
    return recipients
      .map(id => this.companyTypes.find(c => c.id === id)?.name)
      .filter(name => name)
      .join(', ');
  }

  deleteMessage(message: Message): void {
    if (confirm('Supprimer ce message ?')) {
      this.messages = this.messages.filter(m => m.id !== message.id);
    }
  }
}
