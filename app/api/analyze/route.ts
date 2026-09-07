import { NextRequest, NextResponse } from "next/server";
import { systemPrompt, USER_INSTRUCTION, type UserProfile } from "@/lib/prompt";
import type { AnalyseResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Body = {
  imageDataUrl: string; // data:image/...;base64,....
  profile: UserProfile;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Clé GROQ_API_KEY manquante. Copie .env.example en .env.local et renseigne ta clé (gratuite) depuis https://console.groq.com/keys.",
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

  const { imageDataUrl, profile } = body;
  if (!imageDataUrl || !imageDataUrl.startsWith("data:")) {
    return NextResponse.json(
      { error: "Aucune image reçue. Importe un document (image ou PDF)." },
      { status: 400 }
    );
  }

  const model =
    process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

  const payload = {
    model,
    temperature: 0.2,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt(profile) },
      {
        role: "user",
        content: [
          { type: "text", text: USER_INSTRUCTION },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  };

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de contacter Groq. Vérifie ta connexion." },
      { status: 502 }
    );
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    return NextResponse.json(
      {
        error: `Erreur Groq (${groqRes.status}). ${detail.slice(0, 400)}`,
      },
      { status: 502 }
    );
  }

  const data = await groqRes.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "Réponse vide du modèle." },
      { status: 502 }
    );
  }

  let parsed: AnalyseResult;
  try {
    parsed = JSON.parse(content) as AnalyseResult;
  } catch {
    return NextResponse.json(
      {
        error: "Le modèle n'a pas renvoyé un JSON exploitable.",
        raw: content.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ result: parsed });
}
