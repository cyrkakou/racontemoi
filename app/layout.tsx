import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "African Storybook — Hosting proof of concept",
  description: "Namecheap shared-hosting validation for African Storybook.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
