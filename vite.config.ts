import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
    const isDemo = mode === 'demo' || mode === 'development'

    if (isDemo) {
        // Demo 模式：本地开发 / 构建演示站点
        return {
            plugins: [react()],
            esbuild: {
                jsx: 'automatic'
            },
            resolve: {
                alias: { '@': resolve(__dirname, 'src') }
            }
        }
    }

    // 库模式：构建 npm 发布产物
    return {
        plugins: [
            dts({
                include: ['src/**/*'],
                exclude: ['**/*.stories.tsx', 'demo/**', 'public/**'],
                insertTypesEntry: true,
                rollupTypes: true
            })
        ],
        esbuild: {
            jsx: 'automatic'
        },
        resolve: {
            alias: { '@': resolve(__dirname, 'src') }
        },
        build: {
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: 'InkLayerReact',
                cssFileName: 'inklayer-react',
                formats: ['es', 'cjs'],
                fileName: (format) =>
                    `index.${format === 'es' ? 'es' : 'cjs'}.js`
            },
            rollupOptions: {
                external: [
                    'react',
                    'react-dom',
                    'react/jsx-runtime',
                    'pdfjs-dist',
                    'konva',
                    'exceljs',
                    'file-saver',
                    'pdf-lib',
                    /^pdfjs-dist\/(?!.*\?url)/,
                    /^konva\//,
                ],
                output: {
                    globals: {
                        react: 'React',
                        'react-dom': 'ReactDOM',
                        'pdfjs-dist': 'pdfjsLib',
                        konva: 'Konva',
                    }
                }
            },
            sourcemap: false,
            emptyOutDir: true,
            copyPublicDir: false
        }
    }
})

