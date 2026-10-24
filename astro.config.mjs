import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [mdx(), react()],
  output: 'static',
  compressHTML: true,
  server: {
    allowedHosts: ['b997-2001-3b0-25-6a8b-25c1-f151-25d5-f52e.ngrok-free.app'],
  },
});
