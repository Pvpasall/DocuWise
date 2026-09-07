"use client";

// Extraction de texte 100% locale et gratuite (aucun token LLM consommé).
// - PDF avec couche texte -> pdfjs getTextContent (instantané, précis).
// - PDF scanné / image     -> Tesseract.js (OCR, français + anglais).
//
// Renvoie aussi une image d'aperçu (data URL) pour l'affichage.

export type Extraction = {
  texte: string;
  apercu: string; // data URL image pour la prévisualisation
  methode: "pdf-texte" | "ocr";
};

type Progress = (etape: string, ratio?: number) => void;

const MIN_TEXTE_PDF = 40; // en dessous, on considère le PDF comme scanné

export async function extractText(
  file: File,
  onProgress?: Progress
): Promise<Extraction> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return extractFromPdf(file, onProgress);
  }
  if (file.type.startsWith("image/")) {
    const apercu = await readAsDataUrl(file);
    onProgress?.("Lecture du texte (OCR)…");
    const texte = await ocrImage(apercu, onProgress);
    return { texte, apercu, methode: "ocr" };
  }
  throw new Error("Format non supporté. Importe une image (JPG, PNG) ou un PDF.");
}

async function extractFromPdf(
  file: File,
  onProgress?: Progress
): Promise<Extraction> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  // Aperçu : on rend la 1re page en image.
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Rendu du PDF impossible.");
  await page.render({ canvasContext: context, viewport }).promise;
  const apercu = canvas.toDataURL("image/png");

  // 1) Tenter la couche texte du PDF.
  onProgress?.("Lecture du texte du PDF…");
  const content = await page.getTextContent();
  const texte = content.items
    .map((it) => ("str" in it ? it.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (texte.length >= MIN_TEXTE_PDF) {
    return { texte, apercu, methode: "pdf-texte" };
  }

  // 2) PDF scanné : OCR sur l'image rendue.
  onProgress?.("PDF scanné détecté — OCR…");
  const texteOcr = await ocrImage(apercu, onProgress);
  return { texte: texteOcr, apercu, methode: "ocr" };
}

async function ocrImage(dataUrl: string, onProgress?: Progress): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra+eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress?.("OCR en cours…", m.progress);
      }
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    return text.replace(/\n{3,}/g, "\n\n").trim();
  } finally {
    await worker.terminate();
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}
