import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        react(),
        visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    server: {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    form: ['react-hook-form', '@hookform/resolvers'],
                    ui: ['@radix-ui/react-progress', '@radix-ui/react-select', '@radix-ui/react-slot'],
                },
            },
        },
    },
}); 