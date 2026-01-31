"use client";

import { useEffect } from "react";

function applyTheme(theme: "light" | "dark") {
  const bg = theme === "dark" ? "#0b0b0b" : "#ffffff";
  const fg = theme === "dark" ? "#ffffff" : "#000000";

  document.body.style.background = bg;
  document.body.style.color = fg;

  // Petites variables utiles (optionnel mais aide pour boutons/pages simples)
  document.documentElement.style.setProperty("--bg", bg);
  document.documentElement.style.setProperty("--fg", fg);
  document.documentElement.style.setProperty("--card", theme === "dark" ? "#111" : "#fff");
  document.documentElement.style.setProperty("--border", theme === "dark" ? "#222" : "#eee");
  document.documentElement.style.setProperty("--inputBg", theme === "dark" ? "#0f0f0f" : "#fff");
  document.documentElement.style.setProperty("--inputBorder", theme === "dark" ? "#333" : "#ddd");
}

export default function ThemeSync() {
  useEffect(() => {
    // 1) applique au chargement
    const saved = localStorage.getItem("lingua_theme");
    const theme = saved === "dark" ? "dark" : "light";
    applyTheme(theme);

    // 2) si on change le theme dans un autre onglet/page
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lingua_theme") {
        const t = e.newValue === "dark" ? "dark" : "light";
        applyTheme(t);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
