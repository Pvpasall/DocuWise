export type Champ = {
  libelle: string;
  valeurExtraite: string | null;
  prefillable: boolean;
  valeurProposee: string | null;
};

export type Justificatif = {
  nom: string;
  obligatoire: boolean;
  note: string | null;
};

// Analyse renvoyée par le modèle. Le texte OCR n'y figure pas : il est produit
// localement (Tesseract / pdfjs) et affiché côté client.
export type AnalyseResult = {
  typeDocument: string;
  demarcheDetectee: string;
  explicationSimple: string;
  champs: Champ[];
  justificatifsRequis: Justificatif[];
  alertes: string[];
  limites: string;
};
