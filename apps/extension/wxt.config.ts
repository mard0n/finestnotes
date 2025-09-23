import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  srcDir: 'src',
  manifest: {
    commands: {
      "highlight": {
        "suggested_key": {
          "default": "Ctrl+Shift+Y",
          "mac": "Command+Shift+Y"
        },
        "description": "Highlight selected text"
      }
    },
    permissions: ['scripting', 'tabs'],
    host_permissions: ["<all_urls>"],
  }
});
