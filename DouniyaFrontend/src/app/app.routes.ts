import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { RegisterEntrprise } from './auth/register-entrprise/register-entrprise';
import { RegisterIndividu } from './auth/register-individu/register-individu';
import { Login } from './auth/login/login';
import { NewEmployer } from './auth/new-employer/new-employer';
import { DashboardEntreprise } from './entreprise/dashboard-entreprise/dashboard-entreprise';
import {Equipe} from './entreprise/equipe/equipe';
import {Chat} from './entreprise/chat/chat';
import {EspaceB2B} from './entreprise/espace-b2-b/espace-b2-b';
import {MarketPace} from './entreprise/market-pace/market-pace';
import {VisioConference} from './entreprise/visio-conference/visio-conference';
import {AnaleticKpi} from './entreprise/analetic-kpi/analetic-kpi';
import {Parametres} from './entreprise/parametres/parametres';
import {Reseau} from './entreprise/reseau/reseau';
import {ProjetB2b} from './entreprise/projet-b2b/projet-b2b';

export const routes: Routes = [
  { path: '', component: Accueil },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' },
  { path: 'inscription-entreprise', component: RegisterEntrprise },
  { path: 'inscription-individu', component: RegisterIndividu },
  { path: 'connexion', component: Login },
  { path: 'ajouter-employe', component: NewEmployer },
  { path: 'dashboard-entreprise', component: DashboardEntreprise },

  // Routes des composants d'entreprise
  { path: 'entreprise/equipe', component: Equipe },
  { path: 'entreprise/chat', component: Chat },
  { path: 'entreprise/espace-b2b', component: EspaceB2B },
  { path: 'entreprise/marketplace', component: MarketPace },
  { path: 'entreprise/visio', component: VisioConference },
  { path: 'entreprise/analytics', component: AnaleticKpi },
  { path: 'entreprise/parametres', component: Parametres },
  { path: 'entreprise/reseau', component: Reseau },
  { path: 'entreprise/reseau', component: Reseau },
  { path: 'entreprise/projet', component: ProjetB2b }
];
