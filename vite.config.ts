import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		tsconfigPaths: true,
		dedupe: ["react", "react-dom"],
	},
	ssr: {
		external: ["mssql", "tedious", "@azure/identity", "@react-pdf/renderer"],
	},
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react/jsx-runtime",
			"@react-pdf/renderer",
			"base64-js",
		],
	},
	plugins: [
		devtools(),
		nitro({
			rollupConfig: {
				external: [/^@sentry\//, "mssql", "tedious", "@azure/identity"],
			},
		}),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
