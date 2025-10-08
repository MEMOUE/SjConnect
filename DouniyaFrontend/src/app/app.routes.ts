import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';

export const routes: Routes = [

    { path: '', component: Accueil },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' }
];
