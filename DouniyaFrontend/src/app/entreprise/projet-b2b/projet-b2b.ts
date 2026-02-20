import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjetB2BService } from '../../services/projet-b2b/projet-b2b.service';
import { ProjetB2B, CreateProjetB2BRequest } from '../../models/projet-b2b.model';

interface Project {
  id: string; name: string; description: string;
  status: 'active' | 'completed' | 'pending' | 'archived';
  progress: number; startDate: string; endDate: string;
  partners: Partner[]; category: string;
  priority: 'high' | 'medium' | 'low'; budget: number; icon: string;
}
interface Partner { id: string; name: string; logo: string; role: string; }
interface Doc { id: string; name: string; icon: string; size: string; uploadedBy: string; uploadDate: string; projectId: string; }
interface Task { id: string; title: string; description: string; status: string; assignedTo: string; dueDate: string; priority: string; projectId: string; }
interface ChatMessage { id: string; sender: string; content: string; timestamp: string; projectId: string; }
interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; }

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'En attente', icon: 'pi pi-clock',        cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { value: 'active',    label: 'Actif',       icon: 'pi pi-play-circle',  cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { value: 'completed', label: 'Termine',     icon: 'pi pi-check-circle', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100'   },
  { value: 'archived',  label: 'Archive',     icon: 'pi pi-inbox',        cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200'},
];
const TABS = [
  { key: 'documents', label: 'Documents', icon: 'pi pi-file' },
  { key: 'tasks',     label: 'Taches',    icon: 'pi pi-check-square' },
  { key: 'messages',  label: 'Messages',  icon: 'pi pi-comments' },
];

@Component({
  selector: 'app-projet-b2b',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projet-b2b.html',
  styleUrl: './projet-b2b.css'
})
export class ProjetB2b implements OnInit {
  loading = false;
  saving = false;
  showCreateModal = false;
  editingProject: Project | null = null;
  selectedProject: Project | null = null;
  activeTab = 'documents';
  searchTerm = '';
  filterStatus = 'all';
  newMessage = '';
  progressValue = 0;

  toasts: Toast[] = [];
  private toastCounter = 0;

  readonly statusOptions = STATUS_OPTIONS;
  readonly tabs = TABS;

  projects: Project[] = [];
  documents: Doc[] = [];
  tasks: Task[] = [];
  messages: ChatMessage[] = [];
  stats = { activeProjects: 0, totalPartners: 0, completionRate: 0, totalBudget: 0 };
  projectForm: CreateProjetB2BRequest = this.emptyForm();

  constructor(private projetService: ProjetB2BService) {}

  ngOnInit(): void { this.loadProjets(); this.loadStats(); }

  // ---- Toast -------------------------------------------------------
  showToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message });
    setTimeout(() => this.dismissToast(id), 4000);
  }
  dismissToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }
  getToastClass(type: string): string {
    const m: Record<string, string> = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    return m[type] ?? 'bg-slate-700';
  }
  getToastIcon(type: string): string {
    const m: Record<string, string> = { success: 'pi pi-check-circle', error: 'pi pi-times-circle', info: 'pi pi-info-circle' };
    return m[type] ?? 'pi pi-bell';
  }

  // ---- Load --------------------------------------------------------
  loadProjets(): void {
    this.loading = true;
    this.projetService.getMesProjets().subscribe({
      next: projets => {
        this.projects = this.mapProjets(projets);
        this.loading = false;
        this.calcStats();
      },
      error: err => {
        console.error('Erreur chargement projets:', err);
        this.loading = false;
        this.showToast('error', 'Impossible de charger les projets');
        if (this.projects.length === 0) { this.initDemo(); }
      }
    });
  }

  loadStats(): void {
    this.projetService.getStats().subscribe({
      next: s => {
        this.stats = {
          activeProjects: s.projetsActifs    ?? 0,
          totalPartners:  s.totalPartenaires ?? 0,
          completionRate: s.tauxCompletion   ?? 0,
          totalBudget:    s.budgetTotal      ?? 0,
        };
      },
      error: () => this.calcStats()
    });
  }

  // ---- Mapping -----------------------------------------------------
  private mapProjets(list: ProjetB2B[]): Project[] {
    return list.map(p => ({
      id:          String(p.id),
      name:        p.nom,
      description: p.description || '',
      status:      this.mapStatut(p.statut),
      progress:    p.progression ?? 0,
      startDate:   p.dateDebut   || '',
      endDate:     p.dateFin     || '',
      category:    p.categorie,
      priority:    this.mapPriorite(p.priorite),
      budget:      p.budget      ?? 0,
      icon:        p.icone       || '📁',
      partners: (p.partenaires || []).map(pa => ({
        id: String(pa.id), name: pa.nom, logo: pa.logo || '🏢', role: pa.role
      }))
    }));
  }

  private mapStatut(s: string): 'active' | 'completed' | 'pending' | 'archived' {
    const m: Record<string, 'active' | 'completed' | 'pending' | 'archived'> = {
      ACTIF: 'active', TERMINE: 'completed', EN_ATTENTE: 'pending', EN_PAUSE: 'pending', ARCHIVE: 'archived'
    };
    return m[s] ?? 'pending';
  }
  private mapPriorite(p: string): 'high' | 'medium' | 'low' {
    const m: Record<string, 'high' | 'medium' | 'low'> = { HAUTE: 'high', CRITIQUE: 'high', MOYENNE: 'medium', BASSE: 'low' };
    return m[p] ?? 'medium';
  }
  private mapStatutBack(s: string): string {
    const m: Record<string, string> = { active: 'ACTIF', completed: 'TERMINE', pending: 'EN_ATTENTE', archived: 'ARCHIVE' };
    return m[s] ?? 'EN_ATTENTE';
  }
  private mapPrioriteBack(p: string): string {
    const m: Record<string, string> = { high: 'HAUTE', medium: 'MOYENNE', low: 'BASSE' };
    return m[p] ?? 'MOYENNE';
  }

  // ---- CRUD --------------------------------------------------------
  saveProject(): void {
    if (!this.projectForm.nom || !this.projectForm.categorie || this.saving) { return; }
    this.saving = true;
    if (this.editingProject) {
      this.projetService.updateProjet(+this.editingProject.id, this.projectForm).subscribe({
        next: () => {
          this.showToast('success', 'Projet "' + this.projectForm.nom + '" mis a jour');
          this.closeModal(); this.loadProjets(); this.saving = false;
        },
        error: err => { console.error(err); this.showToast('error', 'Erreur mise a jour'); this.saving = false; }
      });
    } else {
      this.projetService.createProjet(this.projectForm).subscribe({
        next: resp => {
          const name = resp?.data?.nom ?? this.projectForm.nom;
          this.showToast('success', 'Projet "' + name + '" cree avec succes');
          this.closeModal(); this.loadProjets(); this.saving = false;
        },
        error: err => { console.error(err); this.showToast('error', 'Erreur creation projet'); this.saving = false; }
      });
    }
  }

  editProject(p: Project): void {
    this.editingProject = p;
    this.projectForm = {
      nom: p.name, description: p.description, categorie: p.category,
      priorite: this.mapPrioriteBack(p.priority), dateDebut: p.startDate, dateFin: p.endDate,
      budget: p.budget, icone: p.icon,
      partenaires: p.partners.map(pa => ({ nom: pa.name, role: pa.role, logo: pa.logo })),
      participantIds: []
    };
    this.showCreateModal = true;
  }

  confirmDeleteProject(p: Project): void {
    if (!confirm('Supprimer "' + p.name + '" ?')) { return; }
    this.projetService.deleteProjet(+p.id).subscribe({
      next: () => {
        this.showToast('success', 'Projet "' + p.name + '" supprime');
        if (this.selectedProject?.id === p.id) { this.selectedProject = null; }
        this.loadProjets();
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur suppression'); }
    });
  }

  updateProgress(): void {
    if (!this.selectedProject) { return; }
    this.projetService.updateProgression(+this.selectedProject.id, this.progressValue).subscribe({
      next: () => {
        this.selectedProject!.progress = this.progressValue;
        this.showToast('success', 'Progression : ' + this.progressValue + '%');
        this.loadProjets();
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur progression'); }
    });
  }

  changeStatus(status: string): void {
    if (!this.selectedProject) { return; }
    this.projetService.updateStatut(+this.selectedProject.id, this.mapStatutBack(status)).subscribe({
      next: () => {
        this.selectedProject!.status = status as any;
        this.showToast('info', 'Statut -> ' + this.getStatusLabel(status));
        this.loadProjets();
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur statut'); }
    });
  }

  // ---- Form helpers ------------------------------------------------
  private emptyForm(): CreateProjetB2BRequest {
    return { nom: '', description: '', categorie: '', priorite: 'MOYENNE', dateDebut: '', dateFin: '', budget: 0, icone: '📁', partenaires: [], participantIds: [] };
  }
  addPartnerToForm(): void {
    if (!this.projectForm.partenaires) { this.projectForm.partenaires = []; }
    this.projectForm.partenaires.push({ nom: '', role: '', logo: '🏢' });
  }
  removePartner(i: number): void { this.projectForm.partenaires?.splice(i, 1); }
  closeModal(): void { this.showCreateModal = false; this.editingProject = null; this.projectForm = this.emptyForm(); }

  // ---- Search / filter ---------------------------------------------
  onSearchChange(): void {
    if (this.searchTerm.length >= 3) {
      this.projetService.searchProjets(this.searchTerm).subscribe({
        next: p => this.projects = this.mapProjets(p), error: e => console.error(e)
      });
    } else if (this.searchTerm.length === 0) { this.loadProjets(); }
  }
  onFilterChange(): void {
    if (this.filterStatus === 'all') { this.loadProjets(); }
    else {
      this.projetService.filterByStatut(this.mapStatutBack(this.filterStatus)).subscribe({
        next: p => this.projects = this.mapProjets(p), error: e => console.error(e)
      });
    }
  }
  getFilteredProjects(): Project[] {
    const q = this.searchTerm.toLowerCase();
    return this.projects.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchStatus = this.filterStatus === 'all' || p.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  // ---- Selection ---------------------------------------------------
  selectProject(p: Project): void { this.selectedProject = p; this.progressValue = p.progress; this.activeTab = 'documents'; }
  getProjectDocuments(id: string): Doc[]         { return this.documents.filter(d => d.projectId === id); }
  getProjectTasks(id: string):     Task[]        { return this.tasks.filter(t => t.projectId === id); }
  getProjectMessages(id: string):  ChatMessage[] { return this.messages.filter(m => m.projectId === id); }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedProject) { return; }
    this.messages.unshift({
      id: 'M' + Date.now(), sender: 'Vous', content: this.newMessage,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      projectId: this.selectedProject.id
    });
    this.newMessage = '';
  }

  // ---- Style helpers -----------------------------------------------
  getStatusBadge(status: string): string {
    const m: Record<string, string> = {
      active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700', archived: 'bg-slate-100 text-slate-500',
      'in-progress': 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700',
      todo: 'bg-slate-100 text-slate-500', review: 'bg-purple-100 text-purple-700',
    };
    return m[status] ?? 'bg-slate-100 text-slate-500';
  }
  getPriorityBadge(priority: string): string {
    const m: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
    return m[priority] ?? 'bg-slate-100 text-slate-500';
  }
  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      active: 'Actif', completed: 'Termine', pending: 'En attente', archived: 'Archive',
      'in-progress': 'En cours', done: 'Termine', todo: 'A faire', review: 'En revision',
    };
    return m[status] ?? status;
  }
  getPriorityLabel(p: string): string {
    return ({ high: 'Haute', medium: 'Moyenne', low: 'Basse' } as Record<string, string>)[p] ?? p;
  }

  addNewDocument(): void { this.showToast('info', 'Upload document a implementer'); }
  addNewTask():     void { this.showToast('info', 'Creation tache a implementer'); }
  downloadDocument(doc: Doc): void { this.showToast('info', 'Telechargement : ' + doc.name); }

  private calcStats(): void {
    const ps = this.projects;
    this.stats.activeProjects = ps.filter(p => p.status === 'active').length;
    this.stats.totalPartners  = new Set(ps.flatMap(p => p.partners.map(pa => pa.id))).size;
    this.stats.completionRate = ps.length ? Math.round(ps.reduce((s, p) => s + p.progress, 0) / ps.length) : 0;
    this.stats.totalBudget    = ps.reduce((s, p) => s + p.budget, 0);
  }

  private initDemo(): void {
    this.projects = [{
      id: 'P001', name: 'Plateforme Fintech (demo)', description: 'Solution de paiement B2B',
      status: 'active', progress: 65, startDate: '2024-09-01', endDate: '2025-03-31',
      category: 'Technologie', priority: 'high', budget: 500000, icon: '💳',
      partners: [
        { id: 'PA1', name: 'TechCorp',   logo: '🏢', role: 'Developpement' },
        { id: 'PA2', name: 'FinanceHub', logo: '🏦', role: 'Financement' }
      ]
    }];
    this.calcStats();
  }
}
