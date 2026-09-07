"use client";

import { useState } from "react";
import type { AnalyseResult } from "@/lib/types";

export function ResultView({ result }: { result: AnalyseResult }) {
  return (
    <div className="space-y-4">
      {/* En-tête : type + démarche détectés */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.typeDocument}</Badge>
          <Badge tone="brand">{result.demarcheDetectee}</Badge>
        </div>
        <h2 className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ce que signifie ce document
        </h2>
        <p className="mt-1 leading-relaxed text-slate-800">
          {result.explicationSimple}
        </p>
      </div>

      {/* Champs pré-remplissables */}
      {result.champs?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Informations & pré-remplissage
          </h2>
          <div className="space-y-3">
            {result.champs.map((c, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {c.libelle}
                  </p>
                  <p className="text-sm text-slate-500">
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
          <p className="mt-3 text-xs text-slate-400">
            Ces valeurs sont des propositions. Vérifiez et corrigez chaque champ
            avant de valider sur le site officiel.
          </p>
        </div>
      )}

      {/* Justificatifs */}
      {result.justificatifsRequis?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Justificatifs à préparer
          </h2>
          <ul className="space-y-2">
            {result.justificatifsRequis.map((j, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5">{j.obligatoire ? "✅" : "▫️"}</span>
                <span>
                  <span className="font-medium text-slate-800">{j.nom}</span>
                  {!j.obligatoire && (
                    <span className="text-slate-400"> (si applicable)</span>
                  )}
                  {j.note && (
                    <span className="block text-xs text-slate-500">
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            ⚠️ À ne pas oublier
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {result.alertes.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Texte OCR (repliable) */}
      <OcrBlock texte={result.texteExtrait} />

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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500"
      >
        Texte extrait du document (OCR)
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t border-slate-100 p-4 text-xs text-slate-700">
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
