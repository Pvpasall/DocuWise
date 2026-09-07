"use client";

import { useState } from "react";
import { extractText } from "@/lib/extractText";
import type { AnalyseResult } from "@/lib/types";
import type { UserProfile } from "@/lib/prompt";
import { ResultView } from "@/components/ResultView";

const DEMARCHES = [
  "Renouvellement de titre de séjour étudiant (ANEF)",
  "Première demande de titre de séjour étudiant",
  "Changement de statut après diplôme",
];

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>({
    statut: "Étudiant international",
    nationalite: "",
    dateArrivee: "",
    demarche: DEMARCHES[0],
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [texteExtrait, setTexteExtrait] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResult | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setTexteExtrait("");
    setLoading(true);
    try {
      // 1) Extraction locale (OCR / couche texte) — gratuit, aucun token.
      const { texte, apercu, methode } = await extractText(file, (etape) =>
        setStatus(etape)
      );
      setPreview(apercu);
      setTexteExtrait(texte);

      if (texte.trim().length < 3) {
        throw new Error(
          "Aucun texte lisible détecté. Essaie une image plus nette."
        );
      }

      // 2) Analyse par le modèle (texte seulement).
      setStatus(
        methode === "ocr"
          ? "Analyse par l'IA (après OCR)…"
          : "Analyse par l'IA…"
      );
      await analyze(texte);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function analyze(texte: string) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texteExtrait: texte, profile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analyse impossible.");
    setResult(data.result as AnalyseResult);
  }

  return (
    <main className="site-shell">
      <nav className="topbar">
        <div className="wordmark"><span className="wordmark-mark">D</span> DocuWise</div>
        <div className="topbar-note"><span className="status-dot" /> Assistant administratif pour les nouveaux arrivants</div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Votre dossier, enfin lisible</p>
          <h1>Comprendre ses démarches.<br /><em>Agir avec confiance.</em></h1>
          <p className="hero-lede">DocuWise lit vos documents administratifs, explique ce qui est demandé et vous aide à préparer la prochaine étape.</p>
          <div className="hero-proof">
            <span className="proof-icon">✓</span>
            <span><strong>Simple, guidé, confidentiel.</strong><br />L&apos;IA assiste. Vous gardez le dernier mot.</span>
          </div>
        </div>
        <div className="hero-stamp">
          <span className="stamp-number">01</span>
          <span>Un document<br />à décoder ?</span>
          <span className="stamp-arrow">↘</span>
        </div>
      </header>

      <div className="process-strip" aria-label="Parcours DocuWise">
        <div className="process-item active"><span>01</span><div><strong>Décrivez votre situation</strong><small>Quelques informations utiles</small></div></div>
        <div className="process-line" />
        <div className="process-item"><span>02</span><div><strong>Importez un document</strong><small>PDF, JPG ou PNG</small></div></div>
        <div className="process-line" />
        <div className="process-item"><span>03</span><div><strong>Recevez votre feuille de route</strong><small>Explication, pièces et alertes</small></div></div>
      </div>

      <div className="workspace-grid">
        <section className="sidebar-panel">
          <div className="section-heading">
            <span className="section-kicker">Étape 01</span>
            <h2>Votre situation</h2>
            <p>Ces éléments permettent de personnaliser les explications.</p>
          </div>
          <div className="form-stack">
            <label className="mb-3 block text-sm">
              <span className="field-label">Statut</span>
              <input
                className="field-input"
                value={profile.statut}
                onChange={(e) =>
                  setProfile({ ...profile, statut: e.target.value })
                }
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="field-label">Nationalité <small>optionnel</small></span>
              <input
                className="field-input"
                placeholder="ex. Sénégalaise"
                value={profile.nationalite}
                onChange={(e) =>
                  setProfile({ ...profile, nationalite: e.target.value })
                }
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="field-label">Date d&apos;arrivée en France <small>optionnel</small></span>
              <input
                type="month"
                className="field-input"
                value={profile.dateArrivee}
                onChange={(e) =>
                  setProfile({ ...profile, dateArrivee: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="field-label">Démarche à comprendre</span>
              <select
                className="field-input"
                value={profile.demarche}
                onChange={(e) =>
                  setProfile({ ...profile, demarche: e.target.value })
                }
              >
                {DEMARCHES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <FileDrop onFile={handleFile} disabled={loading} />

          {preview && (
            <div className="preview-panel">
              <p className="preview-label"><span className="status-dot" /> Document importé</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Aperçu du document"
                className="preview-image"
              />
            </div>
          )}
        </section>

        <section className="results-panel">
          {error && (
            <div className="error-panel">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-panel">
              <span className="loader-ring" /><div><strong>DocuWise lit votre document</strong><span>{status || "Traitement…"}</span></div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="empty-panel">
              <div className="empty-illustration"><span>✦</span><span>▤</span><span>→</span></div>
              <p className="section-kicker">Votre espace de clarté</p>
              <h2>Votre analyse apparaîtra ici</h2>
              <p>Commencez par renseigner votre situation, puis déposez le document qui vous pose question.</p>
            </div>
          )}

          {result && <ResultView result={result} texteExtrait={texteExtrait} />}
        </section>
      </div>

      <footer className="site-footer">
        <span>DOCUWISE / PROTOTYPE</span><span>Un assistant, pas une administration. Vérifiez toujours sur ANEF, service-public.fr ou auprès de votre préfecture.</span>
      </footer>
    </main>
  );
}

function FileDrop({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`upload-zone ${
        dragging
          ? "upload-zone-active"
          : ""
      } ${disabled ? "upload-zone-disabled" : ""}`}
    >
      <span className="upload-icon">↑</span>
      <span className="upload-title">Déposez votre document ici</span>
      <span className="upload-action">ou choisissez un fichier <b>→</b></span>
      <span className="upload-meta">PDF, JPG ou PNG · traitement local de l&apos;OCR</span>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
