import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Substitua <seu-repo> pelo nome exato do seu repositório no GitHub
const repoName = "<https://github.com/Dev-AI-Site/eccos-portal-digital.git>";

export default defineConfig(({ mode }) => ({
  // 1. Define o base para produção
  base: `/${repoName}/`,

  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
