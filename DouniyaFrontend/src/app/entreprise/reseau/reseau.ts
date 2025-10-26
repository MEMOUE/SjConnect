import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
    company: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

interface Connection {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  mutualConnections: number;
  status: string;
}

interface Notification {
  id: string;
  type: string;
  user: string;
  avatar: string;
  action: string;
  timestamp: string;
  isRead: boolean;
}

interface Group {
  id: string;
  name: string;
  icon: string;
  members: number;
  posts: number;
  category: string;
}

@Component({
  selector: 'app-reseau',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reseau.html',
  styleUrl: './reseau.css'
})
export class Reseau implements OnInit {
  activeTab: string = 'feed';
  showNewPostModal: boolean = false;
  newPostContent: string = '';
  searchTerm: string = '';

  currentUser = {
    name: 'Mohamed Benali',
    avatar: '👨‍💼',
    title: 'CEO & Founder',
    company: 'Douniya Enterprise',
    connections: 850,
    followers: 1250
  };

  posts: Post[] = [
    {
      id: 'P001',
      author: {
        name: 'Sarah Martin',
        avatar: '👩‍💼',
        title: 'Marketing Director',
        company: 'TechCorp'
      },
      content: 'Excellente conférence aujourd\'hui sur l\'innovation dans le secteur B2B. Les opportunités de croissance sont immenses! 🚀 #Innovation #B2B',
      image: '🎯',
      timestamp: 'Il y a 2 heures',
      likes: 45,
      comments: 12,
      shares: 8,
      isLiked: false
    },
    {
      id: 'P002',
      author: {
        name: 'Pierre Dubois',
        avatar: '👨‍💻',
        title: 'CTO',
        company: 'Digital Solutions'
      },
      content: 'Notre nouvelle plateforme SaaS est enfin disponible! Merci à toute l\'équipe pour ce travail formidable. 💪 #SaaS #Technologie',
      timestamp: 'Il y a 4 heures',
      likes: 89,
      comments: 23,
      shares: 15,
      isLiked: true
    },
    {
      id: 'P003',
      author: {
        name: 'Marie Laurent',
        avatar: '👩‍🔬',
        title: 'Data Scientist',
        company: 'AI Labs'
      },
      content: 'Intéressant article sur l\'IA et son impact sur le e-commerce. Le futur est maintenant! 🤖',
      image: '📊',
      timestamp: 'Il y a 6 heures',
      likes: 67,
      comments: 18,
      shares: 11,
      isLiked: false
    },
    {
      id: 'P004',
      author: {
        name: 'Ahmed Hassan',
        avatar: '👨‍🏫',
        title: 'Business Coach',
        company: 'Success Academy'
      },
      content: 'Les 5 clés pour réussir en tant qu\'entrepreneur:\n1. Vision claire\n2. Résilience\n3. Innovation\n4. Réseau solide\n5. Apprentissage continu\n\nQu\'en pensez-vous? 💡',
      timestamp: 'Il y a 1 jour',
      likes: 156,
      comments: 42,
      shares: 28,
      isLiked: true
    }
  ];

  connections: Connection[] = [
    {
      id: 'C001',
      name: 'Sophie Bernard',
      avatar: '👩‍💼',
      title: 'HR Manager',
      company: 'Global Corp',
      mutualConnections: 45,
      status: 'connected'
    },
    {
      id: 'C002',
      name: 'Thomas Petit',
      avatar: '👨‍💼',
      title: 'Sales Director',
      company: 'TechStart',
      mutualConnections: 23,
      status: 'connected'
    },
    {
      id: 'C003',
      name: 'Fatima Zahra',
      avatar: '👩‍🔬',
      title: 'Research Lead',
      company: 'Innovation Lab',
      mutualConnections: 12,
      status: 'pending'
    },
    {
      id: 'C004',
      name: 'Lucas Moreau',
      avatar: '👨‍💻',
      title: 'Full Stack Developer',
      company: 'Code Masters',
      mutualConnections: 8,
      status: 'suggested'
    }
  ];

  notifications: Notification[] = [
    {
      id: 'N001',
      type: 'like',
      user: 'Sarah Martin',
      avatar: '👩‍💼',
      action: 'a aimé votre publication',
      timestamp: 'Il y a 10 min',
      isRead: false
    },
    {
      id: 'N002',
      type: 'comment',
      user: 'Pierre Dubois',
      avatar: '👨‍💻',
      action: 'a commenté votre article',
      timestamp: 'Il y a 1 heure',
      isRead: false
    },
    {
      id: 'N003',
      type: 'connection',
      user: 'Marie Laurent',
      avatar: '👩‍🔬',
      action: 'a accepté votre invitation',
      timestamp: 'Il y a 2 heures',
      isRead: true
    },
    {
      id: 'N004',
      type: 'share',
      user: 'Ahmed Hassan',
      avatar: '👨‍🏫',
      action: 'a partagé votre publication',
      timestamp: 'Il y a 5 heures',
      isRead: true
    }
  ];

  groups: Group[] = [
    {
      id: 'G001',
      name: 'Entrepreneurs Innovants',
      icon: '🚀',
      members: 2450,
      posts: 156,
      category: 'Business'
    },
    {
      id: 'G002',
      name: 'Tech & Digital',
      icon: '💻',
      members: 3890,
      posts: 289,
      category: 'Technologie'
    },
    {
      id: 'G003',
      name: 'Marketing B2B',
      icon: '📈',
      members: 1680,
      posts: 124,
      category: 'Marketing'
    },
    {
      id: 'G004',
      name: 'IA & Data Science',
      icon: '🤖',
      members: 5240,
      posts: 467,
      category: 'Science'
    }
  ];

  stats = {
    profileViews: 234,
    postImpressions: 1850,
    searchAppearances: 67,
    newConnections: 12
  };

  ngOnInit(): void {
    // Initialisation
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  openNewPostModal(): void {
    this.showNewPostModal = true;
  }

  closeNewPostModal(): void {
    this.showNewPostModal = false;
    this.newPostContent = '';
  }

  createPost(): void {
    if (this.newPostContent.trim()) {
      const newPost: Post = {
        id: 'P' + (this.posts.length + 1).toString().padStart(3, '0'),
        author: {
          name: this.currentUser.name,
          avatar: this.currentUser.avatar,
          title: this.currentUser.title,
          company: this.currentUser.company
        },
        content: this.newPostContent,
        timestamp: 'À l\'instant',
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false
      };
      this.posts.unshift(newPost);
      this.closeNewPostModal();
      alert('Publication partagée avec succès!');
    }
  }

  likePost(post: Post): void {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
  }

  commentPost(post: Post): void {
    console.log('Commenter:', post);
    alert('Fenêtre de commentaire');
  }

  sharePost(post: Post): void {
    post.shares += 1;
    alert('Publication partagée!');
  }

  connect(connection: Connection): void {
    if (connection.status === 'suggested') {
      connection.status = 'pending';
      alert(`Invitation envoyée à ${connection.name}`);
    }
  }

  acceptConnection(connection: Connection): void {
    connection.status = 'connected';
    this.currentUser.connections += 1;
    alert(`Vous êtes maintenant connecté avec ${connection.name}`);
  }

  removeConnection(connection: Connection): void {
    if (confirm(`Supprimer ${connection.name} de vos relations?`)) {
      const index = this.connections.indexOf(connection);
      if (index > -1) {
        this.connections.splice(index, 1);
      }
    }
  }

  markNotificationAsRead(notification: Notification): void {
    notification.isRead = true;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
  }

  joinGroup(group: Group): void {
    alert(`Vous avez rejoint le groupe "${group.name}"`);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'like': '❤️',
      'comment': '💬',
      'connection': '👥',
      'share': '🔄',
      'mention': '@',
      'message': '✉️'
    };
    return icons[type] || '🔔';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'connected': 'status-connected',
      'pending': 'status-pending',
      'suggested': 'status-suggested'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'connected': 'Connecté',
      'pending': 'En attente',
      'suggested': 'Suggéré'
    };
    return labels[status] || status;
  }

  viewProfile(name: string): void {
    alert(`Voir le profil de ${name}`);
  }
}
