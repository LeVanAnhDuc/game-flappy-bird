import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flappy bird - LeVanAnhDuc",
  description: "Game flappy bird react"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
