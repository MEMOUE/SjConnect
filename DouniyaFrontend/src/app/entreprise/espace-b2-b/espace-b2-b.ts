import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

import { SharedService, Resource, Stats } from '../../services/shared/shared.service';

@Component({
  selector: 'app-espace-b2-b',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule
  ],
  templateUrl: './espace-b2-b.html'
})
export class EspaceB2B implements OnInit {

  resources: Resource[] = [];
  currentFolder: Resource | null = null;
  stats!: Stats;

  showNewFolder = false;
  showUpload = false;

  folderName = '';
  searchQuery = '';
  selectedFile: File | null = null;

  constructor(private service: SharedService) {}

  ngOnInit(): void {
    this.loadRoot();
    this.loadStats();
  }

  loadRoot() {
    this.service.getRootResources().subscribe((r: Resource[]) => {
      this.resources = r;
      this.currentFolder = null;
    });
  }

  loadFolder(folder: Resource) {
    this.service.getChildren(folder.id).subscribe((r: Resource[]) => {
      this.resources = r;
      this.currentFolder = folder;
    });
  }

  createFolder() {
    this.service.createFolder(this.folderName, '', this.currentFolder?.id)
      .subscribe(() => {
        this.showNewFolder = false;
        this.folderName = '';
        this.refresh();
      });
  }

  upload() {
    if (!this.selectedFile) return;

    this.service.uploadFile(this.selectedFile, '', this.currentFolder?.id)
      .subscribe(() => {
        this.showUpload = false;
        this.selectedFile = null;
        this.refresh();
      });
  }

  doSearch() {
    if (!this.searchQuery) return this.refresh();
    this.service.search(this.searchQuery)
      .subscribe((r: Resource[]) => this.resources = r);
  }

  loadStats() {
    this.service.getStats().subscribe((s: Stats) => this.stats = s);
  }

  refresh() {
    this.currentFolder ? this.loadFolder(this.currentFolder) : this.loadRoot();
    this.loadStats();
  }

  formatSize(bytes: number): string {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
