import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface KPI {
  id: string;
  title: string;
  value: number | string;
  change: number;
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
}

@Component({
  selector: 'app-analetic-kpi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analetic-kpi.html',
  styleUrl: './analetic-kpi.css'
})
export class AnaleticKpi implements OnInit {
  selectedPeriod: string = 'month';

  kpis: KPI[] = [
    {
      id: 'revenue',
      title: 'Chiffre d\'affaires',
      value: '125 450 €',
      change: 12.5,
      icon: '💰',
      color: '#10b981'
    },
    {
      id: 'orders',
      title: 'Commandes',
      value: 1247,
      change: 8.3,
      icon: '📦',
      color: '#3b82f6'
    },
    {
      id: 'customers',
      title: 'Clients actifs',
      value: 856,
      change: -3.2,
      icon: '👥',
      color: '#8b5cf6'
    },
    {
      id: 'satisfaction',
      title: 'Satisfaction',
      value: '94%',
      change: 2.1,
      icon: '⭐',
      color: '#f59e0b'
    }
  ];

  revenueData: ChartData[] = [
    { label: 'Jan', value: 85000 },
    { label: 'Fév', value: 92000 },
    { label: 'Mar', value: 105000 },
    { label: 'Avr', value: 98000 },
    { label: 'Mai', value: 115000 },
    { label: 'Jun', value: 125450 }
  ];

  topProducts = [
    { name: 'Produit A', sales: 45000, orders: 320 },
    { name: 'Produit B', sales: 38500, orders: 275 },
    { name: 'Produit C', sales: 32000, orders: 198 },
    { name: 'Produit D', sales: 28900, orders: 165 },
    { name: 'Produit E', sales: 21050, orders: 142 }
  ];

  salesByCategory = [
    { category: 'Électronique', percentage: 35, value: 43900 },
    { category: 'Mode', percentage: 28, value: 35126 },
    { category: 'Maison', percentage: 22, value: 27599 },
    { category: 'Autres', percentage: 15, value: 18825 }
  ];

  ngOnInit(): void {
    // Initialisation des données
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    // Simuler le rechargement des données
    console.log('Période changée:', period);
  }

  getMaxValue(): number {
    return Math.max(...this.revenueData.map(d => d.value));
  }

  getBarHeight(value: number): number {
    return (value / this.getMaxValue()) * 100;
  }

  exportData(): void {
    console.log('Export des données KPI');
    alert('Export des données en cours...');
  }

  refreshData(): void {
    console.log('Actualisation des données');
    alert('Données actualisées !');
  }
}
