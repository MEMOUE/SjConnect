import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjetB2BService } from '../../services/projet-b2b/projet-b2b.service';
import {
  ProjetB2B,
  CreateProjetB2BRequest,
  ProjetB2BStats,
  PartenaireDTO
} from '../../models/projet-b2b.model';

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
  loading: boolean = false;

  // Modal & Form
  showCreateModal: boolean = false;
  editingProject: Project | null = null;
  progressValue: number = 0;

  projectForm: CreateProjetB2BRequest = this.getEmptyForm();

  // Données du backend
  projetsBackend: ProjetB2B[] = [];

  projects: Project[] = [];
  documents: Document[] = [];
  tasks: Task[] = [];
  messages: Message[] = [];

  stats = {
    activeProjects: 0,
    totalPartners: 0,
    completionRate: 0,
    totalBudget: 0
  };

  constructor(private projetService: ProjetB2BService) {}

  ngOnInit(): void {
    this.loadProjets();
    this.loadStats();
  }

  // ============================================
  // HELPER POUR FORMULAIRE VIDE
  // ============================================

  private getEmptyForm(): CreateProjetB2BRequest {
    return {
      nom: '',
      description: '',
      categorie: '',
      priorite: 'MOYENNE',
      dateDebut: '',
      dateFin: '',
      budget: 0,
      icone: '📁',
      partenaires: [], // Toujours initialisé comme tableau vide
      participantIds: []
    };
  }

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  loadProjets(): void {
    this.loading = true;
    console.log('🔄 Chargement des projets...');

    this.projetService.getMesProjets().subscribe({
      next: (projets) => {
        console.log('✅ Projets chargés:', projets);
        this.projetsBackend = projets;
        this.projects = this.mapProjetsToProjects(projets);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des projets:', error);
        this.loading = false;
        this.initDemoData();
      }
    });
  }

  loadStats(): void {
    this.projetService.getStats().subscribe({
      next: (stats) => {
        console.log('✅ Stats chargées:', stats);
        this.stats = {
          activeProjects: stats.projetsActifs,
          totalPartners: stats.totalPartenaires,
          completionRate: stats.tauxCompletion,
          totalBudget: stats.budgetTotal
        };
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des stats:', error);
        this.calculateStats();
      }
    });
  }

  // ============================================
  // MAPPING BACKEND -> FRONTEND
  // ============================================

  mapProjetsToProjects(projets: ProjetB2B[]): Project[] {
    return projets.map(p => ({
      id: p.id.toString(),
      name: p.nom,
      description: p.description || '',
      status: this.mapStatutToStatus(p.statut),
      progress: p.progression,
      startDate: p.dateDebut || '',
      endDate: p.dateFin || '',
      partners: p.partenaires?.map(pa => ({
        id: pa.id.toString(),
        name: pa.nom,
        logo: pa.logo || '🏢',
        role: pa.role,
        status: pa.statut === 'ACTIF' ? 'active' : 'inactive'
      })) || [],
      category: p.categorie,
      priority: this.mapPrioriteToLocal(p.priorite),
      budget: p.budget,
      documents: 0,
      tasks: 0,
      icon: p.icone || '📁'
    }));
  }

  mapStatutToStatus(statut: string): 'active' | 'completed' | 'pending' | 'archived' {
    const mapping: any = {
      'ACTIF': 'active',
      'TERMINE': 'completed',
      'EN_ATTENTE': 'pending',
      'ARCHIVE': 'archived',
      'EN_PAUSE': 'pending'
    };
    return mapping[statut] || 'pending';
  }

  mapPrioriteToLocal(priorite: string): 'high' | 'medium' | 'low' {
    const mapping: any = {
      'HAUTE': 'high',
      'CRITIQUE': 'high',
      'MOYENNE': 'medium',
      'BASSE': 'low'
    };
    return mapping[priorite] || 'medium';
  }

  mapStatusToStatut(status: string): string {
    const mapping: any = {
      'active': 'ACTIF',
      'completed': 'TERMINE',
      'pending': 'EN_ATTENTE',
      'archived': 'ARCHIVE'
    };
    return mapping[status] || 'EN_ATTENTE';
  }

  // ============================================
  // ACTIONS CRUD
  // ============================================

  saveProject(): void {
    if (!this.projectForm.nom || !this.projectForm.categorie) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.editingProject) {
      // Mise à jour
      const id = parseInt(this.editingProject.id);
      this.projetService.updateProjet(id, this.projectForm).subscribe({
        next: (response) => {
          console.log('✅ Projet mis à jour:', response);
          alert('Projet modifié avec succès !');
          this.closeModal();
          this.loadProjets();
        },
        error: (error) => {
          console.error('❌ Erreur modification projet:', error);
          alert('Erreur lors de la modification du projet');
        }
      });
    } else {
      // Création
      this.projetService.createProjet(this.projectForm).subscribe({
        next: (response) => {
          console.log('✅ Projet créé:', response);
          alert('Projet créé avec succès !');
          this.closeModal();
          this.loadProjets();
        },
        error: (error) => {
          console.error('❌ Erreur création projet:', error);
          alert('Erreur lors de la création du projet');
        }
      });
    }
  }

  editProject(project: Project): void {
    this.editingProject = project;
    this.projectForm = {
      nom: project.name,
      description: project.description,
      categorie: project.category,
      priorite: this.mapLocalPriorityToBackend(project.priority),
      dateDebut: project.startDate,
      dateFin: project.endDate,
      budget: project.budget,
      icone: project.icon,
      partenaires: project.partners.map(p => ({
        nom: p.name,
        role: p.role,
        logo: p.logo
      })),
      participantIds: []
    };
    this.showCreateModal = true;
  }

  mapLocalPriorityToBackend(priority: string): string {
    const mapping: any = {
      'high': 'HAUTE',
      'medium': 'MOYENNE',
      'low': 'BASSE'
    };
    return mapping[priority] || 'MOYENNE';
  }

  confirmDeleteProject(project: Project): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      const id = parseInt(project.id);
      this.projetService.deleteProjet(id).subscribe({
        next: () => {
          console.log('✅ Projet supprimé');
          alert('Projet supprimé avec succès !');
          this.selectedProject = null;
          this.loadProjets();
        },
        error: (error) => {
          console.error('❌ Erreur suppression projet:', error);
          alert('Erreur lors de la suppression du projet');
        }
      });
    }
  }

  updateProgress(): void {
    if (!this.selectedProject) return;

    const id = parseInt(this.selectedProject.id);
    this.projetService.updateProgression(id, this.progressValue).subscribe({
      next: () => {
        console.log('✅ Progression mise à jour');
        this.loadProjets();
        if (this.selectedProject) {
          this.selectedProject.progress = this.progressValue;
        }
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour progression:', error);
        alert('Erreur lors de la mise à jour de la progression');
      }
    });
  }

  changeStatus(status: string): void {
    if (!this.selectedProject) return;

    const id = parseInt(this.selectedProject.id);
    const statut = this.mapStatusToStatut(status);

    this.projetService.updateStatut(id, statut).subscribe({
      next: () => {
        console.log('✅ Statut mis à jour');
        this.loadProjets();
        if (this.selectedProject) {
          this.selectedProject.status = status as any;
        }
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour statut:', error);
        alert('Erreur lors de la mise à jour du statut');
      }
    });
  }

  // ============================================
  // GESTION DU FORMULAIRE
  // ============================================

  addPartnerToForm(): void {
    // S'assurer que partenaires existe
    if (!this.projectForm.partenaires) {
      this.projectForm.partenaires = [];
    }

    this.projectForm.partenaires.push({
      nom: '',
      role: '',
      logo: '🏢'
    });
  }

  removePartner(index: number): void {
    // S'assurer que partenaires existe avant de supprimer
    if (this.projectForm.partenaires && this.projectForm.partenaires.length > index) {
      this.projectForm.partenaires.splice(index, 1);
    }
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.editingProject = null;
    this.resetForm();
  }

  resetForm(): void {
    this.projectForm = this.getEmptyForm();
  }

  addPartner(): void {
    alert('Fonctionnalité à implémenter : Ajouter un partenaire');
  }

  // ============================================
  // RECHERCHE ET FILTRAGE
  // ============================================

  onSearchChange(): void {
    if (this.searchTerm.length >= 3) {
      this.projetService.searchProjets(this.searchTerm).subscribe({
        next: (projets) => {
          this.projects = this.mapProjetsToProjects(projets);
        },
        error: (error) => {
          console.error('❌ Erreur recherche:', error);
        }
      });
    } else if (this.searchTerm.length === 0) {
      this.loadProjets();
    }
  }

  onFilterChange(): void {
    if (this.filterStatus === 'all') {
      this.loadProjets();
    } else {
      const statut = this.mapStatusToStatut(this.filterStatus);
      this.projetService.filterByStatut(statut).subscribe({
        next: (projets) => {
          this.projects = this.mapProjetsToProjects(projets);
        },
        error: (error) => {
          console.error('❌ Erreur filtrage:', error);
        }
      });
    }
  }

  // ============================================
  // MÉTHODES EXISTANTES
  // ============================================

  calculateStats(): void {
    this.stats.activeProjects = this.projects.filter(p => p.status === 'active').length;
    this.stats.totalPartners = new Set(
      this.projects.flatMap(p => p.partners.map(pa => pa.id))
    ).size;
    const totalProgress = this.projects.reduce((sum, p) => sum + p.progress, 0);
    this.stats.completionRate = Math.round(totalProgress / this.projects.length) || 0;
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
    this.progressValue = project.progress;
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

  addNewDocument(): void {
    alert('Upload de document - À implémenter');
  }

  addNewTask(): void {
    alert('Création de tâche - À implémenter');
  }

  initDemoData(): void {
    this.projects = [
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
      }
    ];
    this.calculateStats();
  }
}
