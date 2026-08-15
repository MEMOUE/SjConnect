import { ValidatorFn, Validators } from '@angular/forms';

/**
 * Le mot de passe doit contenir entre 8 et 12 caractères, avec au moins
 * une lettre, un chiffre et un caractère spécial (miroir des contraintes
 * @Size/@Pattern appliquées côté backend).
 */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_HINT =
  'Le mot de passe doit contenir entre 8 et 12 caractères, avec au moins une lettre, un chiffre et un caractère spécial.';

export function passwordComplexityValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(12),
    Validators.pattern(PASSWORD_PATTERN)
  ];
}
