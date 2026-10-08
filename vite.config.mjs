import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
	plugins: [crx({ manifest }), cssInjectedByJsPlugin({ topExecutionPriority: true, })],
	build: { minify: false, modulePreload: false }
});
