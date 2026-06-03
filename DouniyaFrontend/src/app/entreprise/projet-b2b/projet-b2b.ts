import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjetB2BService } from '../../services/projet-b2b/projet-b2b.service';
import { TranslationService, Language } from '../../services/translation/translation.service';
import {
  ProjetB2B,
  CreateProjetB2BRequest,
  TacheProjet,
  DocumentProjet,
  MessageProjet,
  PersonnelItem,
  AddPartenaireRequest
} from '../../models/projet-b2b.model';

// ── Interfaces internes (front) ──
interface Project {
  id: string; name: string; description: string;
  status: 'active' | 'completed' | 'pending' | 'archived';
  progress: number; startDate: string; endDate: string;
  partners: Partner[]; category: string;
  priority: 'high' | 'medium' | 'low'; budget: number; icon: string;
}
interface Partner { id: string; name: string; logo: string; role: string; utilisateurId?: number; }
interface Doc {
  id: string; name: string; icon: string; size: string;
  uploadedBy: string; uploadDate: string; projectId: string;
  backendId?: number;
}
interface Task {
  id: string; title: string; description: string;
  status: string; assignedTo: string; dueDate: string;
  priority: string; projectId: string; backendId?: number;
}
interface ChatMessage {
  id: string; sender: string; content: string; timestamp: string; projectId: string;
  translated?: string;       // texte traduit (langue courante)
  showOriginal?: boolean;    // affiche l'original malgré la traduction
}
interface Toast { id: number; type: 'success' | 'error' | 'info'; message: string; }

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'En attente', icon: 'pi pi-clock',        cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { value: 'active',    label: 'Actif',       icon: 'pi pi-play-circle',  cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { value: 'completed', label: 'Terminé',     icon: 'pi pi-check-circle', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100'   },
  { value: 'archived',  label: 'Archivé',     icon: 'pi pi-inbox',        cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200'},
];
const TABS = [
  { key: 'documents', label: 'Documents', icon: 'pi pi-file' },
  { key: 'tasks',     label: 'Tâches',    icon: 'pi pi-check-square' },
  { key: 'messages',  label: 'Messages',  icon: 'pi pi-comments' },
];
const TASK_STATUS_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  { value: 'EN_COURS',   label: 'En cours',   cls: 'bg-blue-100 text-blue-700' },
  { value: 'TERMINEE',   label: 'Terminée',   cls: 'bg-green-100 text-green-700' },
];

@Component({
  selector: 'app-projet-b2b',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projet-b2b.html',
  styleUrl: './projet-b2b.css'
})
export class ProjetB2b implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  loading = false;
  saving = false;
  showCreateModal = false;
  showTaskModal = false;
  showPartnerModal = false;
  editingProject: Project | null = null;
  selectedProject: Project | null = null;
  activeTab = 'documents';
  searchTerm = '';
  filterStatus = 'all';
  newMessage = '';
  progressValue = 0;
  uploadingFile = false;

  toasts: Toast[] = [];
  private toastCounter = 0;

  readonly statusOptions = STATUS_OPTIONS;
  readonly tabs = TABS;
  readonly taskStatusOptions = TASK_STATUS_OPTIONS;

  projects: Project[] = [];
  documents: Doc[] = [];
  tasks: Task[] = [];
  messages: ChatMessage[] = [];
  stats = { activeProjects: 0, totalPartners: 0, completionRate: 0, totalBudget: 0 };
  projectForm: CreateProjetB2BRequest = this.emptyForm();

  // Formulaire tâche
  taskForm = { titre: '', description: '', priorite: 'MOYENNE', assigneA: '', dateEcheance: '' };

  // ── Traduction des messages ──
  readonly languages: Language[];
  msgLang = 'original';
  sendingMessage = false;

  // ── Modal partenaire (3 modes) ──
  partnerMode: 'personnel' | 'email' | 'manuel' = 'personnel';
  personnel: PersonnelItem[] = [];
  personnelLoading = false;
  personnelSearch = '';
  partnerRole = '';               // rôle commun aux modes personnel/email
  emailQuery = '';
  emailSearching = false;
  emailResult: { found: boolean; id?: number; nom?: string; email?: string; message?: string } | null = null;
  partnerForm = { nom: '', role: '', logo: '🏢' };  // mode manuel
  addingPartner = false;

  constructor(
    private projetService: ProjetB2BService,
    private translation: TranslationService
  ) {
    this.languages = this.translation.languages;
  }

  ngOnInit(): void { this.loadProjets(); this.loadStats(); }

  // ════════════════════════════════════════════
  // TOAST
  // ════════════════════════════════════════════

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message });
    setTimeout(() => this.dismissToast(id), 4000);
  }
  dismissToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }
  getToastClass(type: string): string {
    return ({ success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' } as Record<string, string>)[type] ?? 'bg-slate-700';
  }
  getToastIcon(type: string): string {
    return ({ success: 'pi pi-check-circle', error: 'pi pi-times-circle', info: 'pi pi-info-circle' } as Record<string, string>)[type] ?? 'pi pi-bell';
  }

  // ════════════════════════════════════════════
  // CHARGEMENT
  // ════════════════════════════════════════════

  loadProjets(): void {
    this.loading = true;
    this.projetService.getMesProjets().subscribe({
      next: projets => {
        this.projects = this.mapProjets(projets);
        this.loading = false;
        this.calcStats();
        if (this.selectedProject) {
          const updated = this.projects.find(p => p.id === this.selectedProject!.id);
          if (updated) {
            this.selectedProject = updated;
            this.progressValue = updated.progress;
          }
        }
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

  /** Charge tâches, documents ET messages d'un projet sélectionné */
  loadProjectData(projectId: string): void {
    const numId = +projectId;

    this.projetService.getTaches(numId).subscribe({
      next: taches => this.tasks = taches.map(t => this.mapTache(t, projectId)),
      error: err => console.error('Erreur chargement tâches:', err)
    });

    this.projetService.getDocuments(numId).subscribe({
      next: docs => this.documents = docs.map(d => this.mapDocument(d, projectId)),
      error: err => console.error('Erreur chargement documents:', err)
    });

    this.loadMessages(projectId);
  }

  loadMessages(projectId: string): void {
    this.projetService.getMessages(+projectId).subscribe({
      next: msgs => {
        this.messages = msgs.map(m => this.mapMessage(m, projectId));
        if (this.msgLang !== 'original') { this.onMsgLangChange(); }
      },
      error: err => console.error('Erreur chargement messages:', err)
    });
  }

  // ════════════════════════════════════════════
  // MAPPING BACKEND → FRONT
  // ════════════════════════════════════════════

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
        id: String(pa.id), name: pa.nom, logo: pa.logo || '🏢', role: pa.role,
        utilisateurId: pa.utilisateurId
      }))
    }));
  }

  private mapTache(t: TacheProjet, projectId: string): Task {
    return {
      id: 'T' + t.id,
      backendId: t.id,
      title: t.titre,
      description: t.description || '',
      status: this.mapTaskStatutToFront(t.statut),
      assignedTo: t.assigneA || '—',
      dueDate: t.dateEcheance || '',
      priority: t.priorite?.toLowerCase() || 'moyenne',
      projectId: projectId
    };
  }

  private mapDocument(d: DocumentProjet, projectId: string): Doc {
    return {
      id: 'D' + d.id,
      backendId: d.id,
      name: d.nomFichier,
      icon: d.icone || 'pi pi-file',
      size: d.tailleFormatee || this.formatFileSize(d.tailleFichier),
      uploadedBy: d.uploadePar || '—',
      uploadDate: d.createdAt || '',
      projectId: projectId
    };
  }

  private mapMessage(m: MessageProjet, projectId: string): ChatMessage {
    let ts = '';
    if (m.createdAt) {
      const d = new Date(m.createdAt);
      ts = isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    }
    return {
      id: 'M' + m.id,
      sender: m.expediteurNom || 'Utilisateur',
      content: m.contenu,
      timestamp: ts,
      projectId,
      showOriginal: false
    };
  }

  private mapStatut(s: string): 'active' | 'completed' | 'pending' | 'archived' {
    const m: Record<string, 'active' | 'completed' | 'pending' | 'archived'> = {
      ACTIF: 'active', TERMINE: 'completed', EN_ATTENTE: 'pending', EN_PAUSE: 'pending', ARCHIVE: 'archived'
    };
    return m[s] ?? 'pending';
  }
  private mapPriorite(p: string): 'high' | 'medium' | 'low' {
    return ({ HAUTE: 'high', CRITIQUE: 'high', MOYENNE: 'medium', BASSE: 'low' } as Record<string, 'high' | 'medium' | 'low'>)[p] ?? 'medium';
  }
  private mapStatutBack(s: string): string {
    return ({ active: 'ACTIF', completed: 'TERMINE', pending: 'EN_ATTENTE', archived: 'ARCHIVE' } as Record<string, string>)[s] ?? 'EN_ATTENTE';
  }
  private mapPrioriteBack(p: string): string {
    return ({ high: 'HAUTE', medium: 'MOYENNE', low: 'BASSE' } as Record<string, string>)[p] ?? 'MOYENNE';
  }
  private mapTaskStatutToFront(s: string): string {
    return ({ EN_ATTENTE: 'todo', EN_COURS: 'in-progress', TERMINEE: 'done' } as Record<string, string>)[s] ?? 'todo';
  }

  private formatFileSize(bytes?: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ════════════════════════════════════════════
  // CRUD PROJETS
  // ════════════════════════════════════════════

  saveProject(): void {
    if (!this.projectForm.nom || !this.projectForm.categorie || this.saving) { return; }
    this.saving = true;
    if (this.editingProject) {
      this.projetService.updateProjet(+this.editingProject.id, this.projectForm).subscribe({
        next: () => {
          this.showToast('success', 'Projet "' + this.projectForm.nom + '" mis à jour');
          this.closeModal(); this.loadProjets(); this.saving = false;
        },
        error: err => { console.error(err); this.showToast('error', 'Erreur mise à jour'); this.saving = false; }
      });
    } else {
      this.projetService.createProjet(this.projectForm).subscribe({
        next: resp => {
          const name = resp?.data?.nom ?? this.projectForm.nom;
          this.showToast('success', 'Projet "' + name + '" créé avec succès');
          this.closeModal(); this.loadProjets(); this.saving = false;
        },
        error: err => { console.error(err); this.showToast('error', 'Erreur création projet'); this.saving = false; }
      });
    }
  }

  editProject(p: Project): void {
    this.editingProject = p;
    // On ne ré-envoie que les partenaires manuels (les internes/externes
    // sont gérés via le bouton "Ajouter" pour préserver le partage).
    this.projectForm = {
      nom: p.name, description: p.description, categorie: p.category,
      priorite: this.mapPrioriteBack(p.priority), dateDebut: p.startDate, dateFin: p.endDate,
      budget: p.budget, icone: p.icon,
      partenaires: p.partners.filter(pa => !pa.utilisateurId)
        .map(pa => ({ nom: pa.name, role: pa.role, logo: pa.logo })),
      participantIds: []
    };
    this.showCreateModal = true;
  }

  confirmDeleteProject(p: Project): void {
    if (!confirm('Supprimer "' + p.name + '" ?')) { return; }
    this.projetService.deleteProjet(+p.id).subscribe({
      next: () => {
        this.showToast('success', 'Projet "' + p.name + '" supprimé');
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
        this.showToast('info', 'Statut → ' + this.getStatusLabel(status));
        this.loadProjets();
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur statut'); }
    });
  }

  // ════════════════════════════════════════════
  // PARTENAIRES — modal multi-modes
  // ════════════════════════════════════════════

  openAddPartnerModal(): void {
    this.partnerMode = 'personnel';
    this.partnerRole = '';
    this.personnelSearch = '';
    this.emailQuery = '';
    this.emailResult = null;
    this.partnerForm = { nom: '', role: '', logo: '🏢' };
    this.showPartnerModal = true;
    this.loadPersonnel();
  }

  closePartnerModal(): void {
    this.showPartnerModal = false;
  }

  setPartnerMode(mode: 'personnel' | 'email' | 'manuel'): void {
    this.partnerMode = mode;
    if (mode === 'personnel' && this.personnel.length === 0) { this.loadPersonnel(); }
  }

  loadPersonnel(): void {
    this.personnelLoading = true;
    this.projetService.getPersonnel().subscribe({
      next: list => { this.personnel = list || []; this.personnelLoading = false; },
      error: err => {
        console.error(err);
        this.personnel = [];
        this.personnelLoading = false;
      }
    });
  }

  getFilteredPersonnel(): PersonnelItem[] {
    const q = this.personnelSearch.toLowerCase().trim();
    if (!q) { return this.personnel; }
    return this.personnel.filter(p =>
      p.nom.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }

  /** Évite d'ajouter un membre déjà présent comme partenaire. */
  isAlreadyPartner(userId: number): boolean {
    return !!this.selectedProject?.partners.some(p => p.utilisateurId === userId);
  }

  addInternalPartner(emp: PersonnelItem): void {
    this.submitPartner({
      userId: emp.id,
      role: this.partnerRole?.trim() || emp.poste || 'Partenaire'
    }, emp.nom);
  }

  searchExternalByEmail(): void {
    const email = this.emailQuery.trim();
    if (!email) { return; }
    this.emailSearching = true;
    this.emailResult = null;
    this.projetService.searchUserByEmail(email).subscribe({
      next: res => { this.emailResult = res; this.emailSearching = false; },
      error: err => {
        console.error(err);
        this.emailResult = { found: false, message: 'Erreur de recherche' };
        this.emailSearching = false;
      }
    });
  }

  addExternalPartner(): void {
    if (!this.emailResult?.found) { return; }
    this.submitPartner({
      email: this.emailQuery.trim(),
      role: this.partnerRole?.trim() || 'Partenaire'
    }, this.emailResult.nom || this.emailQuery);
  }

  addManualPartner(): void {
    if (!this.partnerForm.nom?.trim() || !this.partnerForm.role?.trim()) { return; }
    this.submitPartner({
      nom: this.partnerForm.nom.trim(),
      role: this.partnerForm.role.trim(),
      logo: this.partnerForm.logo || '🏢'
    }, this.partnerForm.nom);
  }

  private submitPartner(req: AddPartenaireRequest, label: string): void {
    if (!this.selectedProject || this.addingPartner) { return; }
    this.addingPartner = true;
    this.projetService.addPartenaire(+this.selectedProject.id, req).subscribe({
      next: () => {
        this.showToast('success', 'Partenaire "' + label + '" ajouté');
        this.addingPartner = false;
        this.closePartnerModal();
        this.loadProjets();
      },
      error: err => {
        console.error(err);
        this.addingPartner = false;
        const msg = err?.error?.message || 'Erreur ajout partenaire';
        this.showToast('error', msg);
      }
    });
  }

  removePartnerFromProject(partner: Partner): void {
    if (!this.selectedProject) { return; }
    const isUser = !!partner.utilisateurId;
    const confirmMsg = isUser
      ? 'Retirer "' + partner.name + '" du projet ? Son accès au projet sera révoqué.'
      : 'Retirer le partenaire "' + partner.name + '" ?';
    if (!confirm(confirmMsg)) { return; }

    this.projetService.removePartenaire(+this.selectedProject.id, +partner.id).subscribe({
      next: () => {
        this.showToast('success', 'Partenaire "' + partner.name + '" retiré');
        this.loadProjets();
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur suppression partenaire'); }
    });
  }

  // ════════════════════════════════════════════
  // TÂCHES — CRUD
  // ════════════════════════════════════════════

  openTaskModal(): void {
    this.taskForm = { titre: '', description: '', priorite: 'MOYENNE', assigneA: '', dateEcheance: '' };
    this.showTaskModal = true;
  }

  closeTaskModal(): void { this.showTaskModal = false; }

  createTask(): void {
    if (!this.selectedProject || !this.taskForm.titre) { return; }
    this.projetService.createTache(+this.selectedProject.id, this.taskForm).subscribe({
      next: () => {
        this.showToast('success', 'Tâche "' + this.taskForm.titre + '" créée');
        this.closeTaskModal();
        this.loadProjectData(this.selectedProject!.id);
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur création tâche'); }
    });
  }

  changeTaskStatus(task: Task, newStatus: string): void {
    if (!this.selectedProject || !task.backendId) { return; }
    this.projetService.updateStatutTache(+this.selectedProject.id, task.backendId, newStatus).subscribe({
      next: () => {
        task.status = this.mapTaskStatutToFront(newStatus);
        this.showToast('info', 'Tâche → ' + this.getTaskStatusLabel(newStatus));
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur changement statut tâche'); }
    });
  }

  deleteTask(task: Task): void {
    if (!this.selectedProject || !task.backendId) { return; }
    if (!confirm('Supprimer la tâche "' + task.title + '" ?')) { return; }
    this.projetService.deleteTache(+this.selectedProject.id, task.backendId).subscribe({
      next: () => {
        this.showToast('success', 'Tâche supprimée');
        this.loadProjectData(this.selectedProject!.id);
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur suppression tâche'); }
    });
  }

  getTaskStatusLabel(status: string): string {
    return ({ EN_ATTENTE: 'En attente', EN_COURS: 'En cours', TERMINEE: 'Terminée' } as Record<string, string>)[status] ?? status;
  }
  getTaskStatusBadge(status: string): string {
    const m: Record<string, string> = {
      todo: 'bg-amber-100 text-amber-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700',
    };
    return m[status] ?? 'bg-slate-100 text-slate-500';
  }
  getTaskStatusFrontLabel(status: string): string {
    return ({ todo: 'En attente', 'in-progress': 'En cours', done: 'Terminée' } as Record<string, string>)[status] ?? status;
  }

  // ════════════════════════════════════════════
  // DOCUMENTS
  // ════════════════════════════════════════════

  triggerFileUpload(): void {
    if (this.fileInput) { this.fileInput.nativeElement.click(); }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.selectedProject) { return; }
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('error', 'Le fichier dépasse 10 MB');
      input.value = '';
      return;
    }

    this.uploadingFile = true;
    this.projetService.uploadDocument(+this.selectedProject.id, file).subscribe({
      next: () => {
        this.showToast('success', 'Fichier "' + file.name + '" uploadé');
        this.loadProjectData(this.selectedProject!.id);
        this.uploadingFile = false;
        input.value = '';
      },
      error: err => {
        console.error(err);
        this.showToast('error', 'Erreur upload fichier');
        this.uploadingFile = false;
        input.value = '';
      }
    });
  }

  downloadDocument(doc: Doc): void {
    if (!this.selectedProject || !doc.backendId) { return; }
    this.projetService.downloadDocument(+this.selectedProject.id, doc.backendId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('success', 'Téléchargement : ' + doc.name);
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur téléchargement'); }
    });
  }

  deleteDocument(doc: Doc): void {
    if (!this.selectedProject || !doc.backendId) { return; }
    if (!confirm('Supprimer le document "' + doc.name + '" ?')) { return; }
    this.projetService.deleteDocument(+this.selectedProject.id, doc.backendId).subscribe({
      next: () => {
        this.showToast('success', 'Document supprimé');
        this.loadProjectData(this.selectedProject!.id);
      },
      error: err => { console.error(err); this.showToast('error', 'Erreur suppression document'); }
    });
  }

  // ════════════════════════════════════════════
  // FORMULAIRE PROJET — helpers
  // ════════════════════════════════════════════

  private emptyForm(): CreateProjetB2BRequest {
    return { nom: '', description: '', categorie: '', priorite: 'MOYENNE', dateDebut: '', dateFin: '', budget: 0, icone: '📁', partenaires: [], participantIds: [] };
  }
  addPartnerToForm(): void {
    if (!this.projectForm.partenaires) { this.projectForm.partenaires = []; }
    this.projectForm.partenaires.push({ nom: '', role: '', logo: '🏢' });
  }
  removePartner(i: number): void { this.projectForm.partenaires?.splice(i, 1); }
  closeModal(): void { this.showCreateModal = false; this.editingProject = null; this.projectForm = this.emptyForm(); }

  // ════════════════════════════════════════════
  // RECHERCHE / FILTRE
  // ════════════════════════════════════════════

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

  // ════════════════════════════════════════════
  // SÉLECTION
  // ════════════════════════════════════════════

  selectProject(p: Project): void {
    this.selectedProject = p;
    this.progressValue = p.progress;
    this.activeTab = 'documents';
    this.messages = [];
    this.loadProjectData(p.id);
  }

  getProjectDocuments(id: string): Doc[]         { return this.documents.filter(d => d.projectId === id); }
  getProjectTasks(id: string):     Task[]        { return this.tasks.filter(t => t.projectId === id); }
  getProjectMessages(id: string):  ChatMessage[] { return this.messages.filter(m => m.projectId === id); }

  // ════════════════════════════════════════════
  // MESSAGES + TRADUCTION
  // ════════════════════════════════════════════

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedProject || this.sendingMessage) { return; }
    const content = this.newMessage.trim();
    const projectId = this.selectedProject.id;
    this.newMessage = '';
    this.sendingMessage = true;

    this.projetService.sendMessage(+projectId, content).subscribe({
      next: () => {
        this.sendingMessage = false;
        this.loadMessages(projectId);
      },
      error: err => {
        console.error(err);
        this.sendingMessage = false;
        this.newMessage = content; // on restaure le texte
        this.showToast('error', 'Erreur envoi du message');
      }
    });
  }

  /** Recalcule les traductions de tous les messages selon la langue choisie. */
  onMsgLangChange(): void {
    if (this.msgLang === 'original') {
      this.messages.forEach(m => { m.translated = undefined; m.showOriginal = false; });
      return;
    }
    this.messages.forEach(m => {
      m.showOriginal = false;
      this.translation.translate(m.content, this.msgLang).subscribe(t => m.translated = t);
    });
  }

  toggleOriginal(m: ChatMessage): void { m.showOriginal = !m.showOriginal; }

  /** Texte à afficher pour un message (traduit ou original). */
  displayContent(m: ChatMessage): string {
    if (this.msgLang === 'original' || m.showOriginal || !m.translated) { return m.content; }
    return m.translated;
  }

  isTranslated(m: ChatMessage): boolean {
    return this.msgLang !== 'original' && !!m.translated && !m.showOriginal;
  }

  // ════════════════════════════════════════════
  // HELPERS STYLE
  // ════════════════════════════════════════════

  getStatusBadge(status: string): string {
    const m: Record<string, string> = {
      active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700', archived: 'bg-slate-100 text-slate-500',
      'in-progress': 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700',
      todo: 'bg-amber-100 text-amber-700', review: 'bg-purple-100 text-purple-700',
    };
    return m[status] ?? 'bg-slate-100 text-slate-500';
  }
  getPriorityBadge(priority: string): string {
    return ({ high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' } as Record<string, string>)[priority] ?? 'bg-slate-100 text-slate-500';
  }
  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      active: 'Actif', completed: 'Terminé', pending: 'En attente', archived: 'Archivé',
      'in-progress': 'En cours', done: 'Terminé', todo: 'À faire', review: 'En révision',
    };
    return m[status] ?? status;
  }
  getPriorityLabel(p: string): string {
    return ({ high: 'Haute', medium: 'Moyenne', low: 'Basse' } as Record<string, string>)[p] ?? p;
  }

  private calcStats(): void {
    const ps = this.projects;
    this.stats.activeProjects = ps.filter(p => p.status === 'active').length;
    this.stats.totalPartners  = new Set(ps.flatMap(p => p.partners.map(pa => pa.id))).size;
    this.stats.completionRate = ps.length ? Math.round(ps.reduce((s, p) => s + p.progress, 0) / ps.length) : 0;
    this.stats.totalBudget    = ps.reduce((s, p) => s + p.budget, 0);
  }

  private initDemo(): void {
    this.projects = [{
      id: 'P001', name: 'Plateforme Fintech (démo)', description: 'Solution de paiement B2B',
      status: 'active', progress: 65, startDate: '2024-09-01', endDate: '2025-03-31',
      category: 'Technologie', priority: 'high', budget: 500000, icon: '💳',
      partners: [
        { id: 'PA1', name: 'TechCorp',   logo: '🏢', role: 'Développement' },
        { id: 'PA2', name: 'FinanceHub', logo: '🏦', role: 'Financement' }
      ]
    }];
    this.calcStats();
  }
}
