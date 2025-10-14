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
