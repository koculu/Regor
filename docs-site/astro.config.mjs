import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    starlight({
      title: 'Regor Documentation',
      pagefind: false
    })
  ],
  outDir: '../docs-dist'
});
