import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

const repoName = "eccos-portal-digital";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/eccos-portal-digital/' : '/',
  
  server: {
    host: "::",
    port: 8080,
  },
  
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteStaticCopy({
      targets: [
        { 
          src: 'public/_redirects', 
          dest: '',
          rename: '_redirects'
        }
      ]
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
}));