"use client";

// Convertit un fichier importé (image OU PDF) en data URL d'image (PNG/JPEG),
// prêt à être envoyé au modèle vision de Groq.
// - Image : lue directement.
// - PDF : la 1re page est rendue en image via pdfjs-dist (gratuit, côté navigateur).

export async function fileToImageDataUrl(file: File): Promise<string> {
  if (file.type.startsWith("image/")) {
    return readAsDataUrl(file);
  }
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return pdfFirstPageToImage(file);
  }
  throw new Error(
    "Format non supporté. Importe une image (JPG, PNG) ou un PDF."
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

async function pdfFirstPageToImage(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker servi depuis /public (copié depuis pdfjs-dist, aucune dépendance réseau).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Rendu du PDF impossible.");

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}
