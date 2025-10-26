import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'pending' | 'archived';
  progress: number;
  startDate: string;
  endDate: string;
  partners: Partner[];
  category: string;
  priority: 'high' | 'medium' | 'low';
  budget: number;
  documents: number;
  tasks: number;
  icon: string;
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  role: string;
  status: 'active' | 'inactive';
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  projectId: string;
  icon: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignedTo: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  projectId: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  projectId: string;
  avatar: string;
}

@Component({
  selector: 'app-projet-b2b',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projet-b2b.html',
  styleUrl: './projet-b2b.css'
})
export class ProjetB2b implements OnInit {
  activeTab: 'projects' | 'documents' | 'tasks' | 'messages' = 'projects';
  selectedProject: Project | null = null;
  searchTerm: string = '';
  filterStatus: string = 'all';
  newMessage: string = '';

  projects: Project[] = [
    {
      id: 'P001',
      name: 'Plateforme Fintech Collaborative',
      description: 'Développement d\'une solution de paiement B2B innovante',
      status: 'active',
      progress: 65,
      startDate: '2024-09-01',
      endDate: '2025-03-31',
      category: 'Technologie',
      priority: 'high',
      budget: 500000,
      documents: 24,
      tasks: 18,
      icon: '💳',
      partners: [
        { id: 'PA1', name: 'TechCorp', logo: '🏢', role: 'Développement', status: 'active' },
        { id: 'PA2', name: 'FinanceHub', logo: '🏦', role: 'Financement', status: 'active' }
      ]
    },
    {
      id: 'P002',
      name: 'Programme de Formation Inter-entreprises',
      description: 'Formation continue pour employés des entreprises partenaires',
      status: 'active',
      progress: 45,
      startDate: '2024-10-01',
      endDate: '2025-06-30',
      category: 'Formation',
      priority: 'medium',
      budget: 150000,
      documents: 12,
      tasks: 8,
      icon: '📚',
      partners: [
        { id: 'PA3', name: 'EduTech', logo: '🎓', role: 'Formation', status: 'active' },
        { id: 'PA4', name: 'HR Solutions', logo: '👥', role: 'RH', status: 'active' }
      ]
    },
    {
      id: 'P003',
      name: 'Initiative Développement Durable',
      description: 'Projet RSE commun pour réduire l\'empreinte carbone',
      status: 'pending',
      progress: 20,
      startDate: '2024-11-15',
      endDate: '2026-12-31',
      category: 'RSE',
      priority: 'high',
      budget: 800000,
      documents: 8,
      tasks: 15,
      icon: '🌱',
      partners: [
        { id: 'PA5', name: 'GreenTech', logo: '♻️', role: 'Conseil', status: 'active' },
        { id: 'PA6', name: 'EcoSolutions', logo: '🌍', role: 'Mise en œuvre', status: 'active' }
      ]
    },
    {
      id: 'P004',
      name: 'Supply Chain Optimization',
      description: 'Optimisation de la chaîne logistique inter-entreprises',
      status: 'completed',
      progress: 100,
      startDate: '2023-06-01',
      endDate: '2024-05-31',
      category: 'Logistique',
      priority: 'medium',
      budget: 350000,
      documents: 45,
      tasks: 32,
      icon: '📦',
      partners: [
        { id: 'PA7', name: 'LogiPro', logo: '🚚', role: 'Logistique', status: 'active' },
        { id: 'PA8', name: 'DataAnalytics', logo: '📊', role: 'Analyse', status: 'active' }
      ]
    }
  ];

  documents: Document[] = [
    {
      id: 'D001',
      name: 'Cahier des charges technique.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedBy: 'TechCorp',
      uploadDate: '2024-10-15',
      projectId: 'P001',
      icon: '📄'
    },
    {
      id: 'D002',
      name: 'Présentation financière Q3.pptx',
      type: 'PowerPoint',
      size: '5.1 MB',
      uploadedBy: 'FinanceHub',
      uploadDate: '2024-10-20',
      projectId: 'P001',
      icon: '📊'
    },
    {
      id: 'D003',
      name: 'Contrat partenariat.docx',
      type: 'Word',
      size: '856 KB',
      uploadedBy: 'HR Solutions',
      uploadDate: '2024-10-10',
      projectId: 'P002',
      icon: '📝'
    }
  ];

  tasks: Task[] = [
    {
      id: 'T001',
      title: 'Finaliser l\'architecture système',
      description: 'Compléter le design de l\'architecture technique',
      status: 'in-progress',
      assignedTo: 'TechCorp',
      dueDate: '2024-11-15',
      priority: 'high',
      projectId: 'P001'
    },
    {
      id: 'T002',
      title: 'Révision budgétaire',
      description: 'Revoir et valider le budget pour Q4',
      status: 'review',
      assignedTo: 'FinanceHub',
      dueDate: '2024-11-10',
      priority: 'high',
      projectId: 'P001'
    },
    {
      id: 'T003',
      title: 'Créer modules de formation',
      description: 'Développer les 5 premiers modules de formation',
      status: 'todo',
      assignedTo: 'EduTech',
      dueDate: '2024-11-30',
      priority: 'medium',
      projectId: 'P002'
    }
  ];

  messages: Message[] = [
    {
      id: 'M001',
      sender: 'Jean Dupont (TechCorp)',
      content: 'La nouvelle version du prototype est prête pour les tests.',
      timestamp: '2024-11-02 10:30',
      projectId: 'P001',
      avatar: '👤'
    },
    {
      id: 'M002',
      sender: 'Marie Martin (FinanceHub)',
      content: 'Le budget a été approuvé par le comité de direction.',
      timestamp: '2024-11-02 09:15',
      projectId: 'P001',
      avatar: '👩'
    }
  ];

  stats = {
    activeProjects: 0,
    totalPartners: 0,
    completionRate: 0,
    totalBudget: 0
  };

  ngOnInit(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    this.stats.activeProjects = this.projects.filter(p => p.status === 'active').length;
    this.stats.totalPartners = new Set(
      this.projects.flatMap(p => p.partners.map(pa => pa.id))
    ).size;
    const totalProgress = this.projects.reduce((sum, p) => sum + p.progress, 0);
    this.stats.completionRate = Math.round(totalProgress / this.projects.length);
    this.stats.totalBudget = this.projects.reduce((sum, p) => sum + p.budget, 0);
  }

  getFilteredProjects(): Project[] {
    return this.projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.filterStatus === 'all' || project.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.activeTab = 'projects';
  }

  getProjectDocuments(projectId: string): Document[] {
    return this.documents.filter(d => d.projectId === projectId);
  }

  getProjectTasks(projectId: string): Task[] {
    return this.tasks.filter(t => t.projectId === projectId);
  }

  getProjectMessages(projectId: string): Message[] {
    return this.messages.filter(m => m.projectId === projectId);
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800',
      'todo': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-yellow-100 text-yellow-800',
      'done': 'bg-green-100 text-green-800',
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'En cours',
      'completed': 'Terminé',
      'pending': 'En attente',
      'archived': 'Archivé',
      'todo': 'À faire',
      'in-progress': 'En cours',
      'review': 'En révision',
      'done': 'Terminé',
      'high': 'Haute',
      'medium': 'Moyenne',
      'low': 'Basse'
    };
    return labels[status] || status;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedProject) return;

    const message: Message = {
      id: `M${Date.now()}`,
      sender: 'Vous',
      content: this.newMessage,
      timestamp: new Date().toLocaleString('fr-FR'),
      projectId: this.selectedProject.id,
      avatar: '👤'
    };

    this.messages.unshift(message);
    this.newMessage = '';
  }

  downloadDocument(doc: Document): void {
    alert(`Téléchargement de ${doc.name}`);
  }

  addNewProject(): void {
    alert('Formulaire de création de projet');
  }

  addNewDocument(): void {
    alert('Upload de document');
  }

  addNewTask(): void {
    alert('Création de tâche');
  }
}
