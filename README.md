# DocuWise 📄

**Assistant IA pour les démarches administratives des étudiants internationaux en France.**

DocuWise lit un document administratif (image ou PDF), l'explique en langage
simple, indique les justificatifs nécessaires et propose une aide au
pré-remplissage — sans jamais remplacer l'administration.

> Prototype (pitch du 10 septembre) — cas d'usage démontré :
> **renouvellement de titre de séjour étudiant (ANEF)**.

## Ce que le prototype démontre (cadrage §13)

1. Import d'un document (image ou PDF)
2. **Extraction OCR visible** (texte brut lu sur le document)
3. **Explication en langage simple**, adaptée au profil de l'utilisateur
4. **Justificatifs et informations nécessaires** pour la démarche
5. **Aide au pré-remplissage** (valeurs proposées, jamais imposées)
6. **Rappel des limites** : l'IA assiste, l'utilisateur valide sur le canal officiel

## Stack (100 % gratuit)

- **Next.js 14** (App Router) + **Tailwind CSS**
- **Groq** (tier gratuit) avec un modèle **vision Llama 4** : OCR + compréhension en une passe
- **pdfjs-dist** : rendu de la 1re page d'un PDF en image, côté navigateur (aucun service payant)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la clé API Groq (gratuite : https://console.groq.com/keys)
cp .env.example .env.local
# puis éditer .env.local et renseigner GROQ_API_KEY

# 3. Lancer en développement
npm run dev
```

Ouvrir http://localhost:3000.

## Variables d'environnement

| Variable        | Description                                   | Défaut                                        |
| --------------- | --------------------------------------------- | --------------------------------------------- |
| `GROQ_API_KEY`  | Clé API Groq (gratuite)                       | —                                             |
| `GROQ_MODEL`    | Modèle vision Groq                            | `meta-llama/llama-4-scout-17b-16e-instruct`   |

## Architecture

```
app/
  page.tsx              Interface : profil + import + résultats
  layout.tsx            Layout racine
  api/analyze/route.ts  Appel Groq (vision) → JSON structuré
components/
  ResultView.tsx        Affichage de l'analyse
lib/
  prompt.ts             Prompt système + connaissance métier (titre de séjour)
  fileToImage.ts        Conversion fichier (image/PDF) → data URL image
  types.ts              Types du résultat d'analyse
```

## Limites & sécurité (cadrage §12)

- DocuWise **ne décide pas** à la place de l'administration et ne remplace pas
  les sites officiels.
- Le document est envoyé au modèle uniquement pour l'analyse en cours ; ne
  committez jamais de clé API (voir `.gitignore`).
- Les informations réglementaires doivent être vérifiées sur les sources
  officielles (ANEF, service-public.fr, préfecture).

## Roadmap (cadrage §14)

- **Étape 1 — Prototype** (actuel) : OCR + compréhension + guidage sur une démarche.
- **Étape 2 — MVP** : 3 à 5 démarches, comptes utilisateurs, sécurité, retours.
- **Étape 3 — Pilote** : test avec une école / un service international.
- **Étape 4 — Monétisation** : premium et/ou offre établissement (B2B2C).
- **Étape 5 — Extension** : nouveaux profils et nouvelles démarches.
