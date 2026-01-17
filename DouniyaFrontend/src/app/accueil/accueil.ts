import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-accueil',
  imports: [CommonModule, RouterLink],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css'
})
export class Accueil {

}
