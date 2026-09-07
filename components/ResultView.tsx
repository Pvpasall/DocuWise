"use client";

import { useState } from "react";
import type { AnalyseResult } from "@/lib/types";

export function ResultView({
  result,
  texteExtrait,
}: {
  result: AnalyseResult;
  texteExtrait: string;
}) {
  return (
    <div className="result-stack">
      {/* En-tête : type + démarche détectés */}
      <div className="result-hero">
        <div className="result-tags">
          <Badge>{result.typeDocument}</Badge>
          <Badge tone="brand">{result.demarcheDetectee}</Badge>
        </div>
        <p className="result-kicker">Lecture DocuWise · voici l&apos;essentiel</p>
        <h2 className="result-title">Ce que signifie ce document</h2>
        <p className="result-summary">
          {result.explicationSimple}
        </p>
      </div>

      {/* Champs pré-remplissables */}
      {result.champs?.length > 0 && (
        <div className="result-card">
          <h2 className="result-card-title">
            Informations & pré-remplissage
          </h2>
          <div className="result-fields">
            {result.champs.map((c, i) => (
              <div
                key={i}
                className="result-field"
              >
                <div>
                  <p className="result-field-label">
                    {c.libelle}
                  </p>
                  <p className="result-field-value">
                    {c.valeurProposee || c.valeurExtraite || (
                      <span className="italic">à compléter</span>
                    )}
                  </p>
                </div>
                {c.prefillable && (c.valeurProposee || c.valeurExtraite) && (
                  <Badge tone="green">proposé</Badge>
                )}
              </div>
            ))}
          </div>
          <p className="result-note">
            Ces valeurs sont des propositions. Vérifiez et corrigez chaque champ
            avant de valider sur le site officiel.
          </p>
        </div>
      )}

      {/* Justificatifs */}
      {result.justificatifsRequis?.length > 0 && (
        <div className="result-card">
          <h2 className="result-card-title">
            Justificatifs à préparer
          </h2>
          <ul className="result-checklist">
            {result.justificatifsRequis.map((j, i) => (
              <li key={i}>
                  <span className={`checkmark ${j.obligatoire ? "required" : ""}`}>{j.obligatoire ? "✓" : "·"}</span>
                <span>
                    <span className="check-name">{j.nom}</span>
                  {!j.obligatoire && (
                    <span className="optional"> (si applicable)</span>
                  )}
                  {j.note && (
                    <span className="check-note">
                      {j.note}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertes */}
      {result.alertes?.length > 0 && (
        <div className="alert-card">
          <h2>
            <span>!</span> À ne pas oublier
          </h2>
          <ul>
            {result.alertes.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Texte OCR (repliable) */}
      <OcrBlock texte={texteExtrait} />

      {/* Limites */}
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-600">
        <strong>Limites :</strong> {result.limites}
      </div>
    </div>
  );
}

function OcrBlock({ texte }: { texte: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ocr-card">
      <button
        onClick={() => setOpen(!open)}
        className="ocr-toggle"
      >
        Texte extrait du document (OCR)
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <pre className="ocr-text">
          {texte || "(aucun texte détecté)"}
        </pre>
      )}
    </div>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "green";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    green: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
