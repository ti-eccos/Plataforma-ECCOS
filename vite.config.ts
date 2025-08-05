import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Defina o nome do repositório corretamente
const repoName = "Plataforma-ECCOS"; // Corrigido para match com seu repositório

export default defineConfig(({ mode }) => ({
  base: "/Plataforma-ECCOS/",
  
  server: {
    host: "::",
    port: 8080,
  },
  
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteStaticCopy({
      targets: [
        { src: 'public/_redirects', dest: '', rename: '_redirects' },
        { src: 'public/404.html', dest: '', rename: '404.html' }
      ]
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Adicionado para limpar o diretório de build
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]', // Formato simplificado
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
publicDir: 'public',
}));