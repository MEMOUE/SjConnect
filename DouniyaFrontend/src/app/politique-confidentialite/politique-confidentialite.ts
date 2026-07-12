import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-politique-confidentialite',
  imports: [CommonModule, RouterLink],
  templateUrl: './politique-confidentialite.html',
  styleUrl: './politique-confidentialite.css'
})
export class PolitiqueConfidentialite {

  // Répétitions pour la trame du filigrane de fond
  readonly watermarkPattern = Array.from({ length: 60 });

  /**
   * Protections anti-copie.
   * Remarque : aucune protection côté navigateur n'est absolue (le contenu reste
   * lisible pour être affiché). Ces mesures découragent la copie « ordinaire » :
   * sélection, menu contextuel, glisser-déposer et raccourcis clavier usuels.
   */

  // Bloque le menu contextuel (clic droit)
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event): boolean {
    event.preventDefault();
    return false;
  }

  // Bloque copier / couper
  @HostListener('copy', ['$event'])
  @HostListener('cut', ['$event'])
  onCopyCut(event: Event): boolean {
    event.preventDefault();
    return false;
  }

  // Bloque le glisser-déposer du texte
  @HostListener('dragstart', ['$event'])
  onDragStart(event: Event): boolean {
    event.preventDefault();
    return false;
  }

  // Bloque le début de sélection à la souris
  @HostListener('selectstart', ['$event'])
  onSelectStart(event: Event): boolean {
    event.preventDefault();
    return false;
  }

  // Bloque les raccourcis clavier de copie / sélection / sauvegarde / impression
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();

    // Ctrl/Cmd + C, X, A, S, P, U (source)
    if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'a', 's', 'p', 'u'].includes(key)) {
      event.preventDefault();
      return false;
    }

    // F12 (outils de développement) et Ctrl+Shift+I/J/C
    if (key === 'f12' ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(key))) {
      event.preventDefault();
      return false;
    }

    return true;
  }
}
