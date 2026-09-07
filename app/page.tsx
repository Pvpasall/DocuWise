"use client";

import { useState } from "react";
import { fileToImageDataUrl } from "@/lib/fileToImage";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResult | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    try {
      const dataUrl = await fileToImageDataUrl(file);
      setPreview(dataUrl);
      await analyze(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  async function analyze(imageDataUrl: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse impossible.");
      setResult(data.result as AnalyseResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <h1 className="text-2xl font-bold text-slate-900">DocuWise</h1>
        </div>
        <p className="mt-1 text-slate-600">
          Importez un document administratif : DocuWise le lit, vous l'explique
          simplement et vous indique les justificatifs à préparer.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[320px,1fr]">
        {/* Colonne gauche : profil + import */}
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Votre situation
            </h2>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">Statut</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profile.statut}
                onChange={(e) =>
                  setProfile({ ...profile, statut: e.target.value })
                }
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">Nationalité</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="ex. Sénégalaise"
                value={profile.nationalite}
                onChange={(e) =>
                  setProfile({ ...profile, nationalite: e.target.value })
                }
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">
                Date d'arrivée en France
              </span>
              <input
                type="month"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profile.dateArrivee}
                onChange={(e) =>
                  setProfile({ ...profile, dateArrivee: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Démarche</span>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Document importé
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Aperçu du document"
                className="max-h-64 w-full rounded-lg object-contain"
              />
            </div>
          )}
        </section>

        {/* Colonne droite : résultats */}
        <section>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              DocuWise lit votre document…
            </div>
          )}

          {!loading && !result && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Importez un document pour voir l'analyse ici.
            </div>
          )}

          {result && <ResultView result={result} />}
        </section>
      </div>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        DocuWise est un assistant : il vous aide à comprendre, il ne décide pas à
        la place de l'administration. Vérifiez toujours les informations sur les
        canaux officiels (ANEF, service-public.fr, votre préfecture).
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
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
        dragging
          ? "border-brand-500 bg-brand-50"
          : "border-slate-300 bg-white hover:border-brand-500"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <span className="text-3xl">⬆️</span>
      <span className="mt-2 text-sm font-medium text-slate-700">
        Importer un document
      </span>
      <span className="mt-1 text-xs text-slate-500">
        Glissez-déposez ou cliquez — JPG, PNG ou PDF
      </span>
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
