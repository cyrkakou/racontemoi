import type { Metadata } from "next";
import { Fraunces, Newsreader, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Racontemoi — Contes africains personnalisés",
    template: "%s — Racontemoi",
  },
  description:
    "Créez un livre personnalisé pour votre enfant : contes africains originaux, héros à son image, illustrations et export PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${newsreader.variable} ${instrument.variable}`}>
      <body className="min-h-screen flex flex-col paper-grain">
        <SessionProvider>
          <SiteNav />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
