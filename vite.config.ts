import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project sites are served from /<repository>/.
  // Local development and Vercel keep the root path.
  base: process.env.GITHUB_ACTIONS ? '/golgedeki-miras/' : '/',
});
