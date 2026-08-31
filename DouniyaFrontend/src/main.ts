// sockjs-client (chargé dynamiquement par ChatService pour le WebSocket temps
// réel) référence l'identifiant Node.js `global`, absent des navigateurs.
// Sans ce polyfill, son import échoue avec "global is not defined" et
// ChatService.connect() tombe silencieusement dans fallbackConnect() — la
// connexion WebSocket temps réel n'est alors JAMAIS établie en production
// (présence, notifications temps réel, etc. ne fonctionnent plus).
(window as any).global ??= window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
