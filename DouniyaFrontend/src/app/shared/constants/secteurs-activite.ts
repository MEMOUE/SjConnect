// DouniyaFrontend/src/app/shared/constants/secteurs-activite.ts

export interface SecteurActivite {
  code: string;      // Valeur canonique stockée en base — IDENTIQUE partout
  libelle: string;   // Libellé affiché
  icone: string;
  couleur: string;
}

/**
 * Source de vérité unique des secteurs d'activité.
 * Utilisée à l'inscription entreprise ET pour le ciblage des publications
 * du marketplace. Les `code` doivent rester strictement identiques côté backend
 * (Entreprise.secteurActivite) pour que le filtrage du feed fonctionne.
 */
export const SECTEURS_ACTIVITE: SecteurActivite[] = [
  // ── Secteurs financiers ───────────────────────────────────────────────
  { code: 'BANQUE',               libelle: 'Banque',                 icone: '🏦', couleur: '#1e40af' },
  { code: 'ASSURANCE',            libelle: 'Assurance',              icone: '🛡️', couleur: '#059669' },
  { code: 'SGI',                  libelle: 'SGI',                    icone: '💼', couleur: '#7c3aed' },
  { code: 'SGO',                  libelle: 'SGO',                    icone: '📊', couleur: '#dc2626' },
  { code: 'FONDS_INVESTISSEMENT', libelle: "Fonds d'investissement", icone: '💰', couleur: '#b45309' },
  { code: 'MICROFINANCE',         libelle: 'Microfinance',           icone: '🏘️', couleur: '#0891b2' },
  { code: 'SOCIETES_BOURSE',      libelle: 'Société de bourse',      icone: '📈', couleur: '#be185d' },
  { code: 'COURTIER',             libelle: 'Courtier',               icone: '🤝', couleur: '#4d7c0f' },
  // ── Secteurs généraux ─────────────────────────────────────────────────
  { code: 'INDUSTRIE',            libelle: 'Industrie',              icone: '🏭', couleur: '#475569' },
  { code: 'TRANSPORT',            libelle: 'Transport & Logistique', icone: '🚚', couleur: '#ea580c' },
  { code: 'AGRICOLE',             libelle: 'Agriculture',            icone: '🌾', couleur: '#65a30d' },
  { code: 'SANTE',                libelle: 'Santé',                  icone: '⚕️', couleur: '#0d9488' },
  { code: 'EDUCATION',            libelle: 'Éducation',              icone: '🎓', couleur: '#4f46e5' },
  { code: 'AUTRE',                libelle: 'Autre',                  icone: '🏢', couleur: '#6b7280' },
];

/** Options prêtes pour un <p-select> PrimeNG ({ label, value }). */
export const SECTEURS_ACTIVITE_OPTIONS = SECTEURS_ACTIVITE.map(s => ({
  label: s.libelle,
  value: s.code,
}));

/** Accès rapide à un secteur par son code. */
export function getSecteurByCode(code: string): SecteurActivite | undefined {
  return SECTEURS_ACTIVITE.find(s => s.code === code);
}
