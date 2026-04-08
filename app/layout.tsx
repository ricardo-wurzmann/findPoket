import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FindPoker — Plataforma de Poker Brasileiro",
  description: "Encontre torneios, cash games e home games de poker em todo o Brasil.",
  keywords: ["poker", "torneio", "cash game", "Brasil", "BSOP", "KSOP"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased bg-background text-text">
        {children}
      </body>
    </html>
  );
}
