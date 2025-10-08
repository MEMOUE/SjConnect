import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { RegisterEntrprise } from './auth/register-entrprise/register-entrprise';
import { Login } from './auth/login/login';

export const routes: Routes = [
  { path: '', component: Accueil },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' },
  { path: 'inscription-entreprise', component: RegisterEntrprise },
  { path: 'connexion', component: Login }
];
