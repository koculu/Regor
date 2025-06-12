import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https:/tenray.io/regor',
  integrations: [
    starlight({
      title: 'Regor Documentation',
      pagefind: true
    })
  ],
  outDir: './docs-dist'
});
