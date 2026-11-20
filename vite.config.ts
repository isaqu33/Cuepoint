// import { purgeCss } from 'vite-plugin-tailwind-purgecss';
// import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
// import { enhancedImages } from '@sveltejs/enhanced-img';


export default defineConfig({
	// plugins: [enhancedImages(), sveltekit(), purgeCss()]
	plugins: [sveltekit()],
	// Dev em Docker: acesso por localhost, pelo nome do serviço (E2E) e por host.docker.internal.
	server: { host: true, allowedHosts: ['localhost', 'web', 'host.docker.internal'] },
  // kit: {
  //   alias: {
  //     '@app/s/utils': './src/server/utils/*',
  //     // '@app/s/db': './src/server/utils/db.ts',
  //   },
  // },
  // kit: {
  //   vite: {
  //     resolve: {
  //       alias: {
  //         '@app/db': path.resolve('./src/server/utils/db.ts'),
  //         '@app/s/utils/*': path.resolve('./src/server/utils')
  //       }
  //     }
  //   },
  // },
  test: {
    globals: true,
    // environment: 'jsdom',
    environment: 'happy-dom',
    // environment: 'none',
    include: ['src/**/*.test.ts'],
    // setupFiles: './src/setupTests.js', // Optional setup file
    setupFiles: './src/setup-test.ts', // Optional setup file
  },
});
