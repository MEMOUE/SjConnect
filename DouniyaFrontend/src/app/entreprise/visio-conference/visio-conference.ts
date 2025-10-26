import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  host: string;
  status: string;
  link: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost: boolean;
}

@Component({
  selector: 'app-visio-conference',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visio-conference.html',
  styleUrl: './visio-conference.css'
})
export class VisioConference implements OnInit {
  activeView: string = 'upcoming';

  // État de la réunion en cours
  isInMeeting: boolean = false;
  isMuted: boolean = false;
  isVideoOn: boolean = true;
  isScreenSharing: boolean = false;
  isRecording: boolean = false;
  showParticipants: boolean = false;
  showChat: boolean = false;

  // Formulaire nouvelle réunion
  showNewMeetingForm: boolean = false;
  newMeeting = {
    title: '',
    date: '',
    time: '',
    duration: 60,
    participants: ''
  };

  upcomingMeetings: Meeting[] = [
    {
      id: 'M001',
      title: 'Réunion d\'équipe hebdomadaire',
      date: '2024-10-27',
      time: '10:00',
      duration: 60,
      participants: 8,
      host: 'Mohamed Benali',
      status: 'scheduled',
      link: 'https://meet.douniya.com/abc123'
    },
    {
      id: 'M002',
      title: 'Présentation clients Q4',
      date: '2024-10-28',
      time: '14:30',
      duration: 90,
      participants: 12,
      host: 'Sarah Martin',
      status: 'scheduled',
      link: 'https://meet.douniya.com/xyz789'
    },
    {
      id: 'M003',
      title: 'Formation nouveaux outils',
      date: '2024-10-29',
      time: '09:00',
      duration: 120,
      participants: 15,
      host: 'Pierre Dubois',
      status: 'scheduled',
      link: 'https://meet.douniya.com/def456'
    }
  ];

  pastMeetings: Meeting[] = [
    {
      id: 'M004',
      title: 'Revue de projet',
      date: '2024-10-20',
      time: '15:00',
      duration: 45,
      participants: 6,
      host: 'Mohamed Benali',
      status: 'completed',
      link: 'https://meet.douniya.com/old123'
    },
    {
      id: 'M005',
      title: 'Brainstorming marketing',
      date: '2024-10-18',
      time: '11:00',
      duration: 60,
      participants: 10,
      host: 'Marie Laurent',
      status: 'completed',
      link: 'https://meet.douniya.com/old456'
    }
  ];

  participants: Participant[] = [
    {
      id: 'P001',
      name: 'Mohamed Benali',
      email: 'mohamed@douniya.com',
      avatar: '👨',
      isMuted: false,
      isVideoOn: true,
      isHost: true
    },
    {
      id: 'P002',
      name: 'Sarah Martin',
      email: 'sarah@douniya.com',
      avatar: '👩',
      isMuted: true,
      isVideoOn: true,
      isHost: false
    },
    {
      id: 'P003',
      name: 'Pierre Dubois',
      email: 'pierre@douniya.com',
      avatar: '👨',
      isMuted: false,
      isVideoOn: false,
      isHost: false
    },
    {
      id: 'P004',
      name: 'Marie Laurent',
      email: 'marie@douniya.com',
      avatar: '👩',
      isMuted: true,
      isVideoOn: true,
      isHost: false
    }
  ];

  chatMessages = [
    { sender: 'Sarah Martin', message: 'Bonjour à tous!', time: '10:02' },
    { sender: 'Pierre Dubois', message: 'Le lien du document est prêt?', time: '10:05' },
    { sender: 'Mohamed Benali', message: 'Oui, je le partage maintenant', time: '10:06' }
  ];

  stats = {
    totalMeetings: 15,
    hoursThisMonth: 24,
    avgParticipants: 9,
    upcomingToday: 2
  };

  ngOnInit(): void {
    this.calculateStats();
  }

  calculateStats(): void {
    this.stats.totalMeetings = this.upcomingMeetings.length + this.pastMeetings.length;
    this.stats.upcomingToday = this.upcomingMeetings.filter(m => {
      const today = new Date().toISOString().split('T')[0];
      return m.date === today;
    }).length;
  }

  startMeeting(meeting: Meeting): void {
    console.log('Démarrer réunion:', meeting);
    this.isInMeeting = true;
  }

  joinMeeting(meeting: Meeting): void {
    console.log('Rejoindre réunion:', meeting);
    this.isInMeeting = true;
  }

  endMeeting(): void {
    if (confirm('Voulez-vous vraiment terminer la réunion?')) {
      this.isInMeeting = false;
      this.isMuted = false;
      this.isVideoOn = true;
      this.isScreenSharing = false;
      this.isRecording = false;
      this.showParticipants = false;
      this.showChat = false;
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  toggleVideo(): void {
    this.isVideoOn = !this.isVideoOn;
  }

  toggleScreenShare(): void {
    this.isScreenSharing = !this.isScreenSharing;
    if (this.isScreenSharing) {
      alert('Partage d\'écran activé');
    }
  }

  toggleRecording(): void {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      alert('Enregistrement démarré');
    } else {
      alert('Enregistrement arrêté');
    }
  }

  toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
    if (this.showParticipants) {
      this.showChat = false;
    }
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
    if (this.showChat) {
      this.showParticipants = false;
    }
  }

  openNewMeetingForm(): void {
    this.showNewMeetingForm = true;
  }

  closeNewMeetingForm(): void {
    this.showNewMeetingForm = false;
    this.resetNewMeetingForm();
  }

  resetNewMeetingForm(): void {
    this.newMeeting = {
      title: '',
      date: '',
      time: '',
      duration: 60,
      participants: ''
    };
  }

  createMeeting(): void {
    console.log('Créer réunion:', this.newMeeting);
    // Ajouter la nouvelle réunion
    const meeting: Meeting = {
      id: 'M' + (this.upcomingMeetings.length + 1).toString().padStart(3, '0'),
      title: this.newMeeting.title,
      date: this.newMeeting.date,
      time: this.newMeeting.time,
      duration: this.newMeeting.duration,
      participants: 0,
      host: 'Mohamed Benali',
      status: 'scheduled',
      link: 'https://meet.douniya.com/' + Math.random().toString(36).substring(7)
    };
    this.upcomingMeetings.push(meeting);
    alert('Réunion créée avec succès!');
    this.closeNewMeetingForm();
  }

  copyLink(link: string): void {
    navigator.clipboard.writeText(link);
    alert('Lien copié dans le presse-papiers!');
  }

  editMeeting(meeting: Meeting): void {
    console.log('Éditer réunion:', meeting);
    alert(`Éditer: ${meeting.title}`);
  }

  deleteMeeting(meeting: Meeting): void {
    if (confirm(`Supprimer la réunion "${meeting.title}"?`)) {
      const index = this.upcomingMeetings.indexOf(meeting);
      if (index > -1) {
        this.upcomingMeetings.splice(index, 1);
      }
    }
  }

  getStatusClass(status: string): string {
    return status === 'scheduled' ? 'status-scheduled' : 'status-completed';
  }

  getStatusLabel(status: string): string {
    return status === 'scheduled' ? 'Planifiée' : 'Terminée';
  }
}
