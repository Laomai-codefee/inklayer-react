import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const PDF_WORKER_IMPORT = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

const externalDependencies = [
    '@floating-ui/dom',
    '@radix-ui/themes',
    'dayjs',
    'exceljs',
    'file-saver',
    'i18next',
    'konva',
    'nanoid',
    'pdf-lib',
    'pdfjs-dist',
    'react',
    'react-colorful',
    'react-dom',
    'react-i18next',
    'react-icons',
    'web-highlighter',
    'zustand'
]

function isExternalDependency(id: string) {
    if (id === PDF_WORKER_IMPORT) return false
    if (id === '@radix-ui/themes/styles.css') return false
    return externalDependencies.some(
        (dependency) => id === dependency || id.startsWith(`${dependency}/`)
    )
}

function pdfWorkerAssetPlugin() {
    const virtualModuleId = '\0inklayer-pdf-worker-url'
    const workerPath = resolve(
        __dirname,
        'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs'
    )

    return {
        name: 'inklayer-pdf-worker-asset',
        enforce: 'pre' as const,
        resolveId(id: string) {
            if (id === PDF_WORKER_IMPORT) return virtualModuleId
        },
        load(id: string) {
            if (id !== virtualModuleId) return
            const referenceId = this.emitFile({
                type: 'asset',
                fileName: 'pdf.worker.min.mjs',
                source: readFileSync(workerPath)
            })
            return `export default import.meta.ROLLUP_FILE_URL_${referenceId}`
        }
    }
}

export default defineConfig(({ mode }) => {
    const isPlayground = mode === 'playground' || mode === 'development'

    if (isPlayground) {
        // Playground 模式：本地开发 / 构建演示站点
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
            pdfWorkerAssetPlugin(),
            dts({
                include: ['src/**/*'],
                exclude: ['**/*.stories.tsx', 'playground/**', 'public/**'],
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
                external: isExternalDependency,
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
