import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { RegisterEntrprise } from './auth/register-entrprise/register-entrprise';
import { RegisterIndividu } from './auth/register-individu/register-individu';
import { Login } from './auth/login/login';
import { NewEmployer } from './auth/new-employer/new-employer';

export const routes: Routes = [
  { path: '', component: Accueil },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' },
  { path: 'inscription-entreprise', component: RegisterEntrprise },
  { path: 'inscription-individu', component: RegisterIndividu },
  { path: 'connexion', component: Login },
  { path: 'ajouter-employe', component: NewEmployer }
];
