import { NextRequest, NextResponse } from "next/server";
import { systemPrompt, userMessage, type UserProfile } from "@/lib/prompt";
import type { AnalyseResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

type Body = {
  texteExtrait: string;
  profile: UserProfile;
};

function log(id: string, msg: string, extra?: unknown) {
  if (extra !== undefined) console.log(`[DocuWise][${id}] ${msg}`, extra);
  else console.log(`[DocuWise][${id}] ${msg}`);
}

export async function POST(req: NextRequest) {
  const id = crypto.randomUUID();
  log(id, "Requête d'analyse reçue");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Clé GEMINI_API_KEY manquante. Copie .env.example en .env.local et renseigne ta clé (gratuite) : https://aistudio.google.com/apikey",
      },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const texte = (body.texteExtrait || "").trim();
  if (texte.length < 3) {
    return NextResponse.json(
      {
        error:
          "Aucun texte n'a pu être extrait du document. Essaie une image plus nette ou un autre document.",
      },
      { status: 400 }
    );
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  log(id, "Envoi à Gemini", { model, texteLength: texte.length });

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt(body.profile) }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage(texte) }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de contacter Gemini. Vérifie ta connexion." },
      { status: 502 }
    );
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    log(id, "Gemini a répondu en erreur", {
      status: geminiRes.status,
      bodyStart: detail.slice(0, 200),
    });

    return NextResponse.json(
      { error: `Erreur Gemini (${geminiRes.status}). ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await geminiRes.json();
  const content: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return NextResponse.json({ error: "Réponse vide du modèle." }, { status: 502 });
  }

  let parsed: AnalyseResult;
  try {
    parsed = JSON.parse(content) as AnalyseResult;
  } catch {
    return NextResponse.json(
      {
        error:
          "Le modèle n'a pas renvoyé un JSON exploitable. Réessaie ou change de modèle.",
        raw: content.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  log(id, "Analyse OK");
  return NextResponse.json({ result: parsed });
}
