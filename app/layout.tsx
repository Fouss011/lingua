import type { Metadata } from "next";
import SwRegister from "./sw-register";
import ThemeSync from "./theme-sync";

export const metadata: Metadata = {
  title: "Lingua Dataset Studio",
  description: "Studio de consultation & validation audio pour Lingua Dataset.",
  manifest: "/manifest.webmanifest",
  themeColor: "#ffffff",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <ThemeSync />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
