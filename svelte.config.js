import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';


/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess()],

	vitePlugin: {
		inspector: true,
	},
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'@app/s/u': './src/server/utils/*',
			// '@app/s/u/db': './src/server/utils/db.ts',
		},
	},
	csrf: {
		checkOrigin: true, // Deixe como true para verificar a origem (configuração padrão)
		// allowedOrigins: ['https://sua-origem-permitida.com'],
	},
};
export default config;
