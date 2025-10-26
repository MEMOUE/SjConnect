import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  siret: string;
  tva: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres implements OnInit {
  activeSection: string = 'company';

  companyInfo: CompanyInfo = {
    name: 'Douniya Enterprise',
    email: 'contact@douniya.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Avenue des Champs',
    city: 'Paris',
    zipCode: '75001',
    country: 'France',
    siret: '123 456 789 00012',
    tva: 'FR12 345678901'
  };

  userProfile: UserProfile = {
    firstName: 'Mohamed',
    lastName: 'Benali',
    email: 'mohamed.benali@douniya.com',
    phone: '+33 6 12 34 56 78',
    role: 'Administrateur',
    avatar: '👤'
  };

  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: true,
    newsletter: false
  };

  securitySettings = {
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordLastChanged: '2024-09-15'
  };

  appearanceSettings = {
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR'
  };

  integrations = [
    { name: 'Google Analytics', status: 'active', icon: '📊' },
    { name: 'Stripe', status: 'active', icon: '💳' },
    { name: 'Mailchimp', status: 'inactive', icon: '📧' },
    { name: 'Zapier', status: 'active', icon: '⚡' }
  ];

  apiKeys = [
    { name: 'Production API', key: 'sk_live_••••••••••••1234', created: '2024-01-15', lastUsed: '2024-10-25' },
    { name: 'Development API', key: 'sk_test_••••••••••••5678', created: '2024-02-20', lastUsed: '2024-10-20' }
  ];

  ngOnInit(): void {
    // Initialisation
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  saveCompanyInfo(): void {
    console.log('Sauvegarder infos entreprise:', this.companyInfo);
    alert('Informations de l\'entreprise sauvegardées avec succès!');
  }

  saveUserProfile(): void {
    console.log('Sauvegarder profil utilisateur:', this.userProfile);
    alert('Profil utilisateur sauvegardé avec succès!');
  }

  saveNotifications(): void {
    console.log('Sauvegarder notifications:', this.notificationSettings);
    alert('Préférences de notification sauvegardées!');
  }

  saveSecurity(): void {
    console.log('Sauvegarder sécurité:', this.securitySettings);
    alert('Paramètres de sécurité sauvegardés!');
  }

  saveAppearance(): void {
    console.log('Sauvegarder apparence:', this.appearanceSettings);
    alert('Paramètres d\'apparence sauvegardés!');
  }

  changePassword(): void {
    console.log('Changer mot de passe');
    alert('Formulaire de changement de mot de passe');
  }

  uploadLogo(): void {
    console.log('Télécharger logo');
    alert('Sélectionnez votre logo');
  }

  toggleIntegration(integration: any): void {
    integration.status = integration.status === 'active' ? 'inactive' : 'active';
    console.log('Toggle integration:', integration);
  }

  generateApiKey(): void {
    console.log('Générer nouvelle clé API');
    alert('Nouvelle clé API générée!');
  }

  revokeApiKey(key: any): void {
    if (confirm('Voulez-vous vraiment révoquer cette clé API?')) {
      console.log('Révoquer clé:', key);
      alert('Clé API révoquée!');
    }
  }

  exportData(): void {
    console.log('Exporter données');
    alert('Export des données en cours...');
  }

  deleteAccount(): void {
    if (confirm('ATTENTION: Cette action est irréversible. Voulez-vous vraiment supprimer votre compte?')) {
      console.log('Supprimer compte');
      alert('Procédure de suppression de compte initiée');
    }
  }
}
