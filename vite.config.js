import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (moduleId) {
                    if (moduleId.includes("/node_modules/katex/")) {
                        return "katex";
                    }
                    if (moduleId.includes("/node_modules/react/") ||
                        moduleId.includes("/node_modules/react-dom/") ||
                        moduleId.includes("/node_modules/scheduler/")) {
                        return "react";
                    }
                },
            },
        },
    },
    base: process.env.VITE_BASE_PATH || "/euclid-in-motion/",
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
