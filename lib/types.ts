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

export type AnalyseResult = {
  typeDocument: string;
  demarcheDetectee: string;
  texteExtrait: string;
  explicationSimple: string;
  champs: Champ[];
  justificatifsRequis: Justificatif[];
  alertes: string[];
  limites: string;
};
