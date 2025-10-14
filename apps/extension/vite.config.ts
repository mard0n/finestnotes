import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  define: {
    __VITE_WEB_URL__: process.env.VITE_WEB_URL || "http://localhost:4321",
  },
  plugins: [
    solidPlugin(),
    tailwindcss(),
    webExtension({
      manifest: generateManifest,
      // watchFilePaths: ["package.json", "manifest.json"],
      disableAutoLaunch: true
    }),
  ]
});
