import { Routes } from '@angular/router';
import { Accueil } from './accueil/accueil';
import { RegisterEntrprise } from './auth/register-entrprise/register-entrprise';
import { RegisterIndividu } from './auth/register-individu/register-individu';
import { Login } from './auth/login/login';
import { NewEmployer } from './auth/new-employer/new-employer';
import { AcceptInvitation } from './auth/accept-invitation/accept-invitation';
import { DashboardEntreprise } from './entreprise/dashboard-entreprise/dashboard-entreprise';
import { Equipe } from './entreprise/equipe/equipe';
import { Chat } from './entreprise/chat/chat';
import { EspaceB2B } from './entreprise/espace-b2-b/espace-b2-b';
import { MarketPace } from './entreprise/market-pace/market-pace';
import { VisioConference } from './entreprise/visio-conference/visio-conference';
import { AnaleticKpi } from './entreprise/analetic-kpi/analetic-kpi';
import { Parametres } from './entreprise/parametres/parametres';
import { Reseau } from './entreprise/reseau/reseau';
import { ProjetB2b } from './entreprise/projet-b2b/projet-b2b';
import { AuthGuard, EntrepriseGuard } from './guard/auth-guard';

export const routes: Routes = [
  // Routes publiques
  { path: '', component: Accueil },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' },

  // Routes d'authentification
  { path: 'inscription-entreprise', component: RegisterEntrprise },
  { path: 'inscription-individu', component: RegisterIndividu },
  { path: 'connexion', component: Login },
  { path: 'accept-invitation', component: AcceptInvitation },

  // Routes entreprise (protégées)
  {
    path: 'entreprise/ajouter-employe',
    component: NewEmployer,
    canActivate: [EntrepriseGuard]
  },
  {
    path: 'dashboard-entreprise',
    component: DashboardEntreprise,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/equipe',
    component: Equipe,
    canActivate: [EntrepriseGuard]
  },
  {
    path: 'entreprise/chat',
    component: Chat,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/espace-b2b',
    component: EspaceB2B,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/marketplace',
    component: MarketPace,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/visio',
    component: VisioConference,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/analytics',
    component: AnaleticKpi,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/parametres',
    component: Parametres,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/reseau',
    component: Reseau,
    canActivate: [AuthGuard]
  },
  {
    path: 'entreprise/projet',
    component: ProjetB2b,
    canActivate: [AuthGuard]
  },

  // Route par défaut
  { path: '**', redirectTo: '' }
];
