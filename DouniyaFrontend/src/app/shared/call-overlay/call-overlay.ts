import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallService } from '../../services/call/call.service';

@Component({
  selector: 'app-call-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call-overlay.html',
  styleUrl: './call-overlay.css'
})
export class CallOverlay {
  // Le setter est appelé par Angular à chaque apparition/disparition du
  // conteneur dans le DOM (piloté par *ngIf="callService.active()") : c'est
  // ce qui permet à CallService de savoir quand il peut monter Jitsi dedans.
  @ViewChild('jitsiContainer')
  set jitsiContainer(ref: ElementRef<HTMLDivElement> | undefined) {
    this.callService.registerContainer(ref?.nativeElement ?? null);
  }

  constructor(public callService: CallService) {}
}
