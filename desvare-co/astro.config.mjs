import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.desvare.co',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
