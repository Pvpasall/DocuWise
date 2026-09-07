import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocuWise — Comprendre vos démarches administratives",
  description:
    "Assistant IA pour les étudiants internationaux en France : lit vos documents, les explique et vous guide (prototype : renouvellement de titre de séjour / ANEF).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
