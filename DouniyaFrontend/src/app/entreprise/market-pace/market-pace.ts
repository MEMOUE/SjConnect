import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  icon: string;
  url?: string;
}

interface Message {
  id: string;
  content: string;
  date: string;
  recipients: string[];
  status: 'draft' | 'sent';
  time?: string;
  attachments?: Attachment[];
  isEditing?: boolean;
}

@Component({
  selector: 'app-market-pace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './market-pace.html',
  styleUrl: './market-pace.css'
})
export class MarketPace implements OnInit, AfterViewChecked {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  messageContent: string = '';
  searchTerm: string = '';
  selectedFiles: Attachment[] = [];
  showEmojiPicker: boolean = false;
  private shouldScrollToBottom = false;

  // Emojis populaires
  emojis: string[] = ['😊', '👍', '❤️', '🎉', '✅', '📌', '⚠️', '💼', '📊', '💡', '🔔', '⭐', '🚀', '💰', '📈', '📝'];

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
      content: 'Nouvelle réglementation financière en vigueur concernant les transactions internationales et la conformité bancaire.',
      date: '2024-11-08',
      time: '14:30',
      recipients: ['banques', 'assurances'],
      status: 'sent',
      attachments: [
        { id: 'A1', name: 'reglement_2024.pdf', size: '2.5 MB', type: 'pdf', icon: '📄' }
      ]
    },
    {
      id: 'M002',
      content: 'Mise à jour des taux d\'intérêt suite à la réunion de la banque centrale. Merci de prendre connaissance des nouvelles directives.',
      date: '2024-11-07',
      time: '10:15',
      recipients: ['banques'],
      status: 'sent',
      attachments: [
        { id: 'A2', name: 'taux_novembre_2024.xlsx', size: '156 KB', type: 'excel', icon: '📊' },
        { id: 'A3', name: 'analyse_marche.docx', size: '892 KB', type: 'word', icon: '📝' }
      ]
    },
    {
      id: 'M003',
      content: 'Rappel : Formation obligatoire sur la cybersécurité prévue pour tous les collaborateurs.',
      date: '2024-11-06',
      time: '16:45',
      recipients: ['banques', 'assurances', 'sgi'],
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

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  calculateStats(): void {
    this.stats.totalRecipients = this.getSelectedCount();
  }

  toggleCompanyType(company: CompanyType): void {
    company.selected = !company.selected;
    company.subTypes.forEach(sub => sub.selected = company.selected);
    this.calculateStats();
  }

  toggleSubType(company: CompanyType, subType: SubType): void {
    subType.selected = !subType.selected;
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

  // Gestion des fichiers
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const attachment: Attachment = {
          id: `F${Date.now()}_${Math.random()}`,
          name: file.name,
          size: this.formatFileSize(file.size),
          type: this.getFileType(file.name),
          icon: this.getFileIcon(file.name)
        };
        this.selectedFiles.push(attachment);
      });
    }
  }

  removeFile(fileId: string): void {
    this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: {[key: string]: string} = {
      'pdf': 'pdf',
      'doc': 'word', 'docx': 'word',
      'xls': 'excel', 'xlsx': 'excel',
      'ppt': 'powerpoint', 'pptx': 'powerpoint',
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
      'zip': 'archive', 'rar': 'archive', '7z': 'archive'
    };
    return types[ext || ''] || 'file';
  }

  getFileIcon(filename: string): string {
    const type = this.getFileType(filename);
    const icons: {[key: string]: string} = {
      'pdf': '📄',
      'word': '📝',
      'excel': '📊',
      'powerpoint': '📽️',
      'image': '🖼️',
      'archive': '🗜️',
      'file': '📎'
    };
    return icons[type] || '📎';
  }

  // Gestion des emojis
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  insertEmoji(emoji: string): void {
    this.messageContent += emoji;
    this.showEmojiPicker = false;
  }

  // Envoi du message
  sendMessage(): void {
    if (!this.messageContent.trim() && this.selectedFiles.length === 0) {
      alert('Veuillez saisir un message ou joindre un fichier');
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

    const now = new Date();
    const newMessage: Message = {
      id: `M${Date.now()}`,
      content: this.messageContent,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5),
      recipients: recipients,
      status: 'sent',
      attachments: [...this.selectedFiles]
    };

    this.messages.push(newMessage);
    this.stats.messagesSent++;
    this.shouldScrollToBottom = true;

    // Réinitialiser le formulaire
    this.messageContent = '';
    this.selectedFiles = [];
    this.clearSelection();
  }

  // Édition de message
  editMessage(message: Message): void {
    message.isEditing = true;
  }

  saveEdit(message: Message): void {
    message.isEditing = false;
    message.status = 'sent';
  }

  cancelEdit(message: Message): void {
    message.isEditing = false;
  }

  // Gestion des messages
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
      this.stats.messagesSent--;
    }
  }

  duplicateMessage(message: Message): void {
    this.messageContent = message.content;
    if (message.attachments) {
      this.selectedFiles = [...message.attachments];
    }
    // Restaurer la sélection des destinataires
    message.recipients.forEach(recipientId => {
      const company = this.companyTypes.find(c => c.id === recipientId);
      if (company) {
        company.selected = true;
        company.subTypes.forEach(sub => sub.selected = true);
      }
    });
    this.calculateStats();
  }

  saveDraft(): void {
    if (!this.messageContent.trim() && this.selectedFiles.length === 0) {
      alert('Aucun contenu à sauvegarder');
      return;
    }

    const recipients = this.companyTypes
      .filter(c => c.subTypes.some(s => s.selected))
      .map(c => c.id);

    const now = new Date();
    const draft: Message = {
      id: `D${Date.now()}`,
      content: this.messageContent,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5),
      recipients: recipients,
      status: 'draft',
      attachments: [...this.selectedFiles]
    };

    this.messages.push(draft);
    this.shouldScrollToBottom = true;
    alert('Brouillon sauvegardé avec succès !');

    // Réinitialiser le formulaire
    this.messageContent = '';
    this.selectedFiles = [];
    this.clearSelection();
  }

  onEnterPress(event: KeyboardEvent) {
    if (!event.shiftKey) {
      this.sendMessage();
    }
  }


  protected readonly KeyboardEvent = KeyboardEvent;
}
