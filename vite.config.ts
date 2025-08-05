import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from 'vite-plugin-static-copy';

const repoName = "Plataforma-ECCOS";

export default defineConfig(({ mode }) => ({
  base: `/${repoName}/`,
  
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '^/Plataforma-ECCOS/.*': {
        target: 'http://localhost:8080/',
        rewrite: (path) => path.replace(/^\/Plataforma-ECCOS/, '')
      }
    }
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
        },
        { 
          src: 'public/404.html', 
          dest: '', 
          rename: '404.html' 
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
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  publicDir: 'public',
}));