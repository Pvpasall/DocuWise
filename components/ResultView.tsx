"use client";

import { useMemo, useState } from "react";
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
      <div className="result-hero reveal" style={revealDelay(0)}>
        <div className="result-tags">
          <Badge>{result.typeDocument}</Badge>
          <Badge tone="brand">{result.demarcheDetectee}</Badge>
        </div>
        <p className="result-kicker">Lecture DocuWise · voici l&apos;essentiel</p>
        <h2 className="result-title">Ce que signifie ce document</h2>
        <p className="result-summary">{result.explicationSimple}</p>
      </div>

      {/* Champs pré-remplissables */}
      {result.champs?.length > 0 && (
        <div className="result-card reveal" style={revealDelay(1)}>
          <h2 className="result-card-title">Informations &amp; pré-remplissage</h2>
          <div className="result-fields">
            {result.champs.map((c, i) => (
              <FieldRow key={i} champ={c} />
            ))}
          </div>
          <p className="result-note">
            Ces valeurs sont des propositions. Vérifiez et corrigez chaque champ
            avant de valider sur le site officiel.
          </p>
        </div>
      )}

      {/* Justificatifs — checklist cochable */}
      {result.justificatifsRequis?.length > 0 && (
        <Checklist items={result.justificatifsRequis} />
      )}

      {/* Alertes */}
      {result.alertes?.length > 0 && (
        <div className="alert-card reveal" style={revealDelay(3)}>
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
      <div className="limits-card reveal" style={revealDelay(4)}>
        <strong>Limites :</strong> {result.limites}
      </div>
    </div>
  );
}

function FieldRow({ champ }: { champ: AnalyseResult["champs"][number] }) {
  const [copied, setCopied] = useState(false);
  const value = champ.valeurProposee || champ.valeurExtraite || "";

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard indisponible : on ignore silencieusement */
    }
  }

  return (
    <div className="result-field">
      <div className="result-field-main">
        <p className="result-field-label">{champ.libelle}</p>
        <p className="result-field-value">
          {value || <span className="italic">à compléter</span>}
        </p>
      </div>
      {value ? (
        <button
          type="button"
          onClick={copy}
          className={`copy-btn ${copied ? "copied" : ""}`}
          title="Copier"
        >
          {copied ? "copié ✓" : "copier"}
        </button>
      ) : null}
    </div>
  );
}

function Checklist({ items }: { items: AnalyseResult["justificatifsRequis"] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const required = useMemo(
    () => items.filter((j) => j.obligatoire).length,
    [items]
  );
  const doneRequired = useMemo(
    () => items.filter((j, i) => j.obligatoire && done.has(i)).length,
    [items, done]
  );
  const pct = required > 0 ? Math.round((doneRequired / required) * 100) : 0;

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="result-card reveal" style={revealDelay(2)}>
      <div className="checklist-head">
        <h2 className="result-card-title">Justificatifs à préparer</h2>
        <span className="checklist-count">
          {doneRequired}/{required} prêts
        </span>
      </div>
      <div className="checklist-progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ul className="result-checklist">
        {items.map((j, i) => {
          const checked = done.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                className={`checkmark ${j.obligatoire ? "required" : ""} ${
                  checked ? "checked" : ""
                }`}
                aria-pressed={checked}
                aria-label={`Marquer « ${j.nom} » comme préparé`}
              >
                {checked ? "✓" : j.obligatoire ? "" : "·"}
              </button>
              <span className={checked ? "check-body is-done" : "check-body"}>
                <span className="check-name">{j.nom}</span>
                {!j.obligatoire && <span className="optional"> (si applicable)</span>}
                {j.note && <span className="check-note">{j.note}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OcrBlock({ texte }: { texte: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ocr-card reveal" style={revealDelay(3.5)}>
      <button onClick={() => setOpen(!open)} className="ocr-toggle">
        Texte extrait du document (OCR)
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <pre className="ocr-text">{texte || "(aucun texte détecté)"}</pre>}
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
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function revealDelay(i: number): React.CSSProperties {
  return { animationDelay: `${i * 70}ms` };
}
