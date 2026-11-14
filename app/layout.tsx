import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  title: "Soil Time Machine — See the Future of Your Soil",
  description:
    "Explore how crop rotation decisions may shape soil health, water demand and climate resilience over the next 3–5 years — powered by NASA Earth observations.",
};

export const viewport: Viewport = {
  themeColor: "#174D3A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
