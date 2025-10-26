import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-entreprise',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-entreprise.html',
  styleUrl: './dashboard-entreprise.css'
})
export class DashboardEntreprise {
  // Données de l'entreprise
  entreprise = {
    nom: 'TechCorp CI',
    logo: 'DC',
    plan: 'Premium',
    secteur: 'Technologie & IT',
    type: 'PME'
  };

  // KPIs alignés avec les objectifs du document
  stats = [
    {
      label: 'Employés actifs',
      value: '45',
      icon: 'pi-users',
      color: 'blue',
      trend: '+5 ce mois',
      trendPositive: true,
      description: 'Collaboration interne'
    },
    {
      label: 'Connexions B2B',
      value: '12',
      icon: 'pi-building',
      color: 'purple',
      trend: '+3 nouvelles',
      trendPositive: true,
      description: 'Partenariats actifs'
    },
    {
      label: 'Transactions Marketplace',
      value: '234',
      icon: 'pi-shopping-cart',
      color: 'green',
      trend: '+89 cette semaine',
      trendPositive: true,
      description: 'B2B & B2C'
    },
    {
      label: 'Documents partagés',
      value: '1.2k',
      icon: 'pi-file',
      color: 'orange',
      trend: '+156 ce mois',
      trendPositive: true,
      description: 'Gestion documentaire'
    }
  ];

  // Actions rapides selon les fonctionnalités du document
  quickActions = [
    {
      label: 'Ajouter un employé',
      icon: 'pi-user-plus',
      route: '/ajouter-employe',
      color: 'blue',
      description: 'Gérer votre équipe'
    },
    {
      label: 'Espace B2B',
      icon: 'pi-building',
      route: '/entreprise/espace-b2b',
      color: 'purple',
      description: 'Collaboration inter-entreprises'
    },
    {
      label: 'Visioconférence',
      icon: 'pi-video',
      route: '/entreprise/visio',
      color: 'green',
      description: 'Jusqu\'à 500 participants'
    },
    {
      label: 'Marketplace',
      icon: 'pi-shopping-bag',
      route: '/entreprise/marketplace',
      color: 'orange',
      description: 'Appels d\'offres & services'
    }
  ];

  // Modules avancés du document
  modulesAvances = [
    {
      titre: 'Visioconférence HD',
      description: 'Jusqu\'à 500 participants avec cryptage E2E',
      icon: 'pi-video',
      color: 'blue',
      statut: 'Actif'
    },
    {
      titre: 'Traduction automatique',
      description: 'Français, anglais, portugais, arabe',
      icon: 'pi-language',
      color: 'green',
      statut: 'Actif'
    },
    {
      titre: 'Sécurité MFA',
      description: 'Authentification multi-facteurs, hébergement local',
      icon: 'pi-shield',
      color: 'purple',
      statut: 'Actif'
    },
    {
      titre: 'Analytics & KPI',
      description: 'Tableaux de bord et suivi d\'activité',
      icon: 'pi-chart-bar',
      color: 'orange',
      statut: 'Actif'
    }
  ];

  // Activités récentes
  recentActivities = [
    {
      user: 'Kouassi Jean',
      action: 'a créé un espace B2B avec',
      target: 'Banque Atlantique',
      time: 'Il y a 2 heures',
      icon: 'pi-building',
      color: 'purple',
      type: 'b2b'
    },
    {
      user: 'Aminata Diallo',
      action: 'a publié une offre sur',
      target: 'Marketplace',
      time: 'Il y a 3 heures',
      icon: 'pi-shopping-cart',
      color: 'green',
      type: 'marketplace'
    },
    {
      user: 'Mohamed Traoré',
      action: 'a rejoint l\'équipe',
      target: 'Département IT',
      time: 'Il y a 5 heures',
      icon: 'pi-user-plus',
      color: 'blue',
      type: 'team'
    },
    {
      user: 'Fatou Koné',
      action: 'a lancé une visioconférence',
      target: '45 participants',
      time: 'Il y a 1 jour',
      icon: 'pi-video',
      color: 'green',
      type: 'video'
    }
  ];

  // Projets collaboratifs (B2B)
  projetsCollaboratifs = [
    {
      name: 'Consortium Fintech UEMOA',
      partenaires: 5,
      secteur: 'Banque',
      statut: 'En cours',
      progression: 75,
      priority: 'high'
    },
    {
      name: 'Marketplace agricole régionale',
      partenaires: 8,
      secteur: 'Agricole',
      statut: 'En cours',
      progression: 45,
      priority: 'medium'
    },
    {
      name: 'Plateforme e-santé Afrique',
      partenaires: 3,
      secteur: 'Santé',
      statut: 'En cours',
      progression: 90,
      priority: 'high'
    }
  ];

  // Alias pour activeProjects (pour compatibilité)
  get activeProjects() {
    return this.projetsCollaboratifs;
  }

  // Informations UEMOA (selon le document)
  infoUEMOA = {
    pays: ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo'],
    entreprisesConnectees: 1250,
    objectifUtilisateurs: '100K+',
    conformite: ['BCEAO', 'ARTCI']
  };

  // Notifications
  notifications = [
    {
      message: 'Nouvelle demande de partenariat B2B de Orange CI',
      time: 'Il y a 1 heure',
      type: 'info',
      icon: 'pi-building'
    },
    {
      message: 'Visioconférence régionale dans 30 minutes',
      time: 'Il y a 30 min',
      type: 'warning',
      icon: 'pi-video'
    },
    {
      message: 'Nouvelle transaction marketplace : 500 000 FCFA',
      time: 'Il y a 2 heures',
      type: 'success',
      icon: 'pi-money-bill'
    }
  ];

  sidebarOpen = true;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getPriorityClass(priority: string): string {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}
