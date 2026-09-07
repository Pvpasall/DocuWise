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

const STATS = [
  { number: "443 500", label: "étudiants étrangers en France (2024-25)", src: "Campus France" },
  { number: "61 %", label: "rencontrent des difficultés administratives", src: "Défenseur des droits, 2025" },
  { number: "+40 %", label: "des réclamations relèvent du droit des étrangers", src: "Défenseur des droits" },
  { number: "+17 %", label: "d'étudiants internationaux en 5 ans", src: "Campus France" },
];

const STEPS = [
  { n: "01", t: "Décrivez votre situation", d: "Statut, nationalité, démarche : les explications s'adaptent à vous." },
  { n: "02", t: "Importez un document", d: "PDF, JPG ou PNG. L'OCR est traité localement, sur votre appareil." },
  { n: "03", t: "Recevez votre feuille de route", d: "Explication claire, pièces à fournir, alertes et pré-remplissage." },
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
      const { texte, apercu, methode } = await extractText(file, (etape) =>
        setStatus(etape)
      );
      setPreview(apercu);
      setTexteExtrait(texte);
      if (texte.trim().length < 3) {
        throw new Error("Aucun texte lisible détecté. Essaie une image plus nette.");
      }
      setStatus(methode === "ocr" ? "Analyse par l'IA (après OCR)…" : "Analyse par l'IA…");
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

  function reset() {
    setResult(null);
    setPreview(null);
    setTexteExtrait("");
    setError(null);
  }

  return (
    <>
      <nav className="topbar">
        <div className="topbar-inner">
          <div className="wordmark"><span className="wordmark-mark">D</span> DocuWise</div>
          <div className="topbar-links">
            <a href="#chiffres">Le problème</a>
            <a href="#methode">Comment ça marche</a>
            <a href="#app" className="topbar-cta">Analyser un document</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Assistant administratif · nouveaux arrivants</p>
            <h1>Comprendre ses démarches.<br /><em>Agir avec confiance.</em></h1>
            <p className="hero-lede">
              DocuWise lit vos documents administratifs, explique ce qui est demandé
              et vous aide à préparer la prochaine étape — sans jamais décider à votre place.
            </p>
            <div className="hero-actions">
              <a href="#app" className="btn-primary">Analyser un document →</a>
              <a href="#methode" className="btn-ghost">Comment ça marche</a>
            </div>
            <div className="hero-proof">
              <span className="proof-icon">✓</span>
              <span><strong>Simple, guidé, confidentiel.</strong> L&apos;OCR est traité localement. Vous gardez le dernier mot.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <span className="hero-card-tag">Titre de séjour · ANEF</span>
              <div className="hero-card-line lg" />
              <div className="hero-card-line" />
              <div className="hero-card-line short" />
              <div className="hero-card-check"><span>✓</span> 5 justificatifs identifiés</div>
              <div className="hero-card-check soft"><span>!</span> Échéance : 30/09</div>
            </div>
            <div className="hero-stamp">
              <span className="stamp-number">01</span>
              <span>Un document<br />à décoder ?</span>
              <span className="stamp-arrow">↘</span>
            </div>
          </div>
        </div>
      </header>

      {/* CHIFFRES */}
      <section id="chiffres" className="band">
        <div className="band-inner">
          <p className="section-kicker center">Un besoin réel, chiffré</p>
          <h2 className="band-title">Les démarches administratives, une épreuve pour beaucoup</h2>
          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat">
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-src">{s.src}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODE */}
      <section id="methode" className="method">
        <div className="method-inner">
          <p className="section-kicker center">Comment ça marche</p>
          <h2 className="band-title">Trois étapes, une feuille de route claire</h2>
          <div className="method-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="method-card">
                <span className="method-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="method-cta">
            <a href="#app" className="btn-primary">Essayer maintenant →</a>
          </div>
        </div>
      </section>

      {/* APP */}
      <section id="app" className="tool">
        <div className="tool-inner">
          <div className="tool-head">
            <p className="section-kicker">Votre espace</p>
            <h2 className="band-title">Analysez votre document</h2>
            <p className="tool-sub">Renseignez votre situation, importez un document, et laissez DocuWise faire le reste.</p>
          </div>

          {error && <div className="error-panel">{error}</div>}

          {/* Saisie : visible tant qu'il n'y a pas de résultat */}
          {!result && !loading && (
            <div className="tool-grid">
              <div className="panel">
                <div className="section-heading">
                  <span className="section-kicker">Étape 01</span>
                  <h3>Votre situation</h3>
                  <p>Ces éléments personnalisent les explications.</p>
                </div>
                <div className="form-stack">
                  <label><span className="field-label">Statut</span>
                    <input className="field-input" value={profile.statut}
                      onChange={(e) => setProfile({ ...profile, statut: e.target.value })} />
                  </label>
                  <label><span className="field-label">Nationalité <small>optionnel</small></span>
                    <input className="field-input" placeholder="ex. Sénégalaise" value={profile.nationalite}
                      onChange={(e) => setProfile({ ...profile, nationalite: e.target.value })} />
                  </label>
                  <label><span className="field-label">Date d&apos;arrivée en France <small>optionnel</small></span>
                    <input type="month" className="field-input" value={profile.dateArrivee}
                      onChange={(e) => setProfile({ ...profile, dateArrivee: e.target.value })} />
                  </label>
                  <label><span className="field-label">Démarche à comprendre</span>
                    <select className="field-input" value={profile.demarche}
                      onChange={(e) => setProfile({ ...profile, demarche: e.target.value })}>
                      {DEMARCHES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="panel drop-panel">
                <div className="section-heading">
                  <span className="section-kicker">Étape 02</span>
                  <h3>Importez le document</h3>
                  <p>PDF, JPG ou PNG. Traitement de l&apos;OCR en local.</p>
                </div>
                <FileDrop onFile={handleFile} disabled={loading} />
                {preview && (
                  <div className="preview-panel">
                    <p className="preview-label"><span className="status-dot" /> Document importé</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Aperçu du document" className="preview-image" />
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-panel">
              <span className="loader-ring" />
              <div className="loading-copy">
                <strong>DocuWise lit votre document</strong>
                <span className="loading-status">{status || "Traitement…"}</span>
                <div className="loading-steps">
                  <span className="on">Extraction du texte</span>
                  <span className="sep">→</span>
                  <span className={status && status.includes("IA") ? "on" : ""}>Analyse</span>
                  <span className="sep">→</span>
                  <span>Feuille de route</span>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="result-wrap">
              <div className="tool-recap">
                <div className="recap-meta">
                  <span className="status-dot" />
                  <span>{profile.statut} · {profile.demarche}</span>
                </div>
                <button className="btn-ghost sm" onClick={reset}>↺ Analyser un autre document</button>
              </div>
              <ResultView result={result} texteExtrait={texteExtrait} />
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span>DOCUWISE / PROTOTYPE</span>
          <span>Un assistant, pas une administration. Vérifiez toujours sur ANEF, service-public.fr ou auprès de votre préfecture.</span>
        </div>
      </footer>
    </>
  );
}

function FileDrop({ onFile, disabled }: { onFile: (file: File) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={`upload-zone ${dragging ? "upload-zone-active" : ""} ${disabled ? "upload-zone-disabled" : ""}`}
    >
      <span className="upload-icon">↑</span>
      <span className="upload-title">Déposez votre document ici</span>
      <span className="upload-action">ou choisissez un fichier <b>→</b></span>
      <span className="upload-meta">PDF, JPG ou PNG · traitement local de l&apos;OCR</span>
      <input type="file" accept="image/*,application/pdf" className="hidden" disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </label>
  );
}
