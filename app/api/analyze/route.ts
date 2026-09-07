import { NextRequest, NextResponse } from "next/server";
import { systemPrompt, userMessage, type UserProfile } from "@/lib/prompt";
import type { AnalyseResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile"; // modèle texte, gratuit, bon en français

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Clé GROQ_API_KEY manquante. Copie .env.example en .env.local et renseigne ta clé (gratuite) : https://console.groq.com/keys",
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

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS || 1024);

  log(id, "Envoi à Groq", { model, maxTokens, texteLength: texte.length });

  const payload = {
    model,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt(body.profile) },
      { role: "user", content: userMessage(texte) },
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
    log(id, "Groq a répondu en erreur", {
      status: groqRes.status,
      bodyStart: detail.slice(0, 200),
    });

    // Messages actionnables pour les cas fréquents du tier gratuit.
    if (groqRes.status === 404) {
      return NextResponse.json(
        {
          error: `Le modèle "${model}" n'existe pas ou n'est pas accessible. Vérifie GROQ_MODEL dans .env.local (ex. llama-3.3-70b-versatile, llama-3.1-8b-instant, qwen/qwen3-32b). Liste : https://console.groq.com/docs/models`,
        },
        { status: 502 }
      );
    }
    if (groqRes.status === 429) {
      return NextResponse.json(
        {
          error: `Limite du tier gratuit atteinte pour "${model}" (trop de tokens/minute). Réduis GROQ_MAX_TOKENS dans .env.local, attends une minute, ou choisis un modèle avec des limites plus élevées (ex. llama-3.1-8b-instant).`,
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Erreur Groq (${groqRes.status}). ${detail.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await groqRes.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
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
