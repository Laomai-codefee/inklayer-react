import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { DownloadManager, EventBus, PDFFindController, PDFLinkService, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import {
    AnnotationEditorType,
    AnnotationMode,
    getDocument,
    PDFDataRangeTransport,
    PDFDocumentLoadingTask,
    PDFDocumentProxy
} from 'pdfjs-dist/legacy/build/pdf.mjs'

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface UseViewerOptions {
    /** PDF 文件 URL */
    url: string | URL | undefined
    /** PDF 数据 - 直接传入二进制数据，优先级高于 url */
    data?: string | number[] | ArrayBuffer | Uint8Array | Uint16Array | Uint32Array
    /** 是否启用 Range 加载， 默认 auto */
    enableRange?: boolean | 'auto'
    /** PDF 加载成功回调 */
    onLoadSuccess?: (pdfDocument: PDFDocumentProxy) => void
    /** PDF 加载失败回调 */
    onLoadError?: (error: Error) => void
    /** PDF 加载结束（包括成功或失败） */
    onLoadEnd?: () => void
    /** Viewer 初始化回调（暴露 PDFViewer 实例） */
    onViewerInit?: (viewer: PDFViewer) => void
    /** 外部 eventBus，可复用 */
    eventBus?: EventBus
    /** 文本层模式 */
    textLayerMode?: number
    /** 批注层模式 */
    annotationMode?: number
    /** 外部链接打开方式 */
    externalLinkTarget?: number
}

function isRangeFailure(error: unknown) {
    if (!(error instanceof Error)) return false

    const msg = error.message.toLowerCase()

    return msg.includes('range') || msg.includes('content-length') || msg.includes('unexpected server response') || msg.includes('cors')
}

export function usePdfViewer(containerRef: React.RefObject<HTMLDivElement>, options: UseViewerOptions) {
    const {
        url,
        data,
        enableRange = 'auto',
        onLoadSuccess,
        onLoadError,
        onLoadEnd,
        onViewerInit,
        eventBus: externalEventBus,
        textLayerMode = 1,
        annotationMode = AnnotationMode.DISABLE,
        externalLinkTarget = 2
    } = options

    const onLoadSuccessRef = useRef(onLoadSuccess)
    const onLoadErrorRef = useRef(onLoadError)
    const onLoadEndRef = useRef(onLoadEnd)
    const onViewerInitRef = useRef(onViewerInit)
    onLoadSuccessRef.current = onLoadSuccess
    onLoadErrorRef.current = onLoadError
    onLoadEndRef.current = onLoadEnd
    onViewerInitRef.current = onViewerInit

    const pdfViewerRef = useRef<PDFViewer | null>(null)
    const linkServiceRef = useRef<PDFLinkService | null>(null)
    const eventBusRef = useRef<EventBus | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const loadGenerationRef = useRef(0)

    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
    const [metadata, setMetadata] = useState<any>(null)
    const [loadError, setLoadError] = useState<Error | null>(null)

    /** 创建 PDFViewer */
    const createPdfViewer = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = null
        }

        if (!containerRef.current) throw new Error('PDF container not ready')

        const bus = externalEventBus || new EventBus()
        eventBusRef.current = bus

        const linkService = new PDFLinkService({ eventBus: bus, externalLinkTarget })
        const downloadManager = new DownloadManager()
        const fc = new PDFFindController({ linkService, eventBus: bus })

        const viewer = new PDFViewer({
            container: containerRef.current,
            eventBus: bus,
            textLayerMode,
            annotationMode,
            annotationEditorMode: AnnotationEditorType.DISABLE,
            linkService,
            downloadManager,
            removePageBorders: true,
            findController: fc
        })

        linkService.setViewer(viewer)
        pdfViewerRef.current = viewer
        linkServiceRef.current = linkService

        cleanupRef.current = () => {
            if (pdfViewerRef.current) {
                pdfViewerRef.current.cleanup()
                pdfViewerRef.current = null
            }
            if (linkServiceRef.current) linkServiceRef.current = null
            if (!externalEventBus && eventBusRef.current) eventBusRef.current = null
        }

        onViewerInitRef.current?.(viewer)
        return { bus, linkService, viewer }
    }, [containerRef, externalEventBus, textLayerMode, annotationMode, externalLinkTarget])

    const createTransport = useCallback(async (url: string) => {
        const headResp = await fetch(url, { method: 'HEAD' })
        const length = Number(headResp.headers.get('Content-Length'))
        if (isNaN(length)) throw new Error('Cannot get PDF length for range loading')
        class MyPDFDataRangeTransport extends PDFDataRangeTransport {
            async requestDataRange(begin: number, end: number) {
                const resp = await fetch(url, { headers: { Range: `bytes=${begin}-${end - 1}` } })
                const arrayBuffer = await resp.arrayBuffer()
                this.onDataRange(begin, new Uint8Array(arrayBuffer))
            }
        }

        return new MyPDFDataRangeTransport(length, null)
    }, [])

    const createLoadingTask = useCallback(
        async (useRange: boolean) => {
            if (data) {
                // 如果提供了 data，则直接使用数据
                return getDocument({
                    data: data,
                    disableRange: true,
                    disableStream: true
                })
            } else if (url && useRange) {
                const transport = await createTransport(url as string)
                return getDocument({ range: transport })
            } else if (url) {
                return getDocument({ url, disableRange: true, disableStream: true })
            } else {
                throw new Error('Either url or data must be provided')
            }
        },
        [url, createTransport, data]
    )

    const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

    const loadPdf = useCallback(async () => {
        const generation = loadGenerationRef.current + 1
        loadGenerationRef.current = generation
        const isCurrentLoad = () => loadGenerationRef.current === generation

        if (!url && !data) {
            const error = new Error('Either url or data must be provided')
            if (isCurrentLoad()) {
                setLoadError(error)
                setLoading(false)
                onLoadErrorRef.current?.(error)
                onLoadEndRef.current?.()
            }
            return
        }

        setLoading(true)
        setProgress(0)
        setLoadError(null)
        setPdfDocument(null)

        let triedRange = false
        let activeTask: PDFDocumentLoadingTask | null = null
        let viewerContext: ReturnType<typeof createPdfViewer> | null = null

        try {
            viewerContext = createPdfViewer()
            const { linkService, viewer } = viewerContext
            const shouldTryRange = enableRange === true || enableRange === 'auto'

            if (shouldTryRange) {
                triedRange = true
                activeTask = await createLoadingTask(true)
            } else {
                activeTask = await createLoadingTask(false)
            }

            if (!isCurrentLoad()) {
                await activeTask.destroy()
                return
            }

            loadingTaskRef.current = activeTask

            activeTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                if (isCurrentLoad() && total > 0) {
                    setProgress(Math.min(100, Math.round((loaded / total) * 100)))
                }
            }

            const pdf = await activeTask.promise
            if (!isCurrentLoad()) {
                await pdf.destroy()
                return
            }

            setPdfDocument(pdf)
            linkService.setDocument(pdf)
            viewer.setDocument(pdf)

            const docMetadata = await pdf.getMetadata()
            if (!isCurrentLoad()) return

            setMetadata(docMetadata)
            onLoadSuccessRef.current?.(pdf)
        } catch (err) {
            if (!isCurrentLoad()) return

            // auto 模式下，Range 失败 → fallback
            if (enableRange === 'auto' && triedRange && isRangeFailure(err)) {
                console.warn('[PDF] Range failed, fallback to full loading')

                // 清理失败的 task
                await activeTask?.destroy()
                if (loadingTaskRef.current === activeTask) {
                    loadingTaskRef.current = null
                }

                // fallback 再来一次（不再 Range）
                try {
                    if (!viewerContext) {
                        throw new Error('PDF viewer was not initialized')
                    }
                    const fallbackTask = await createLoadingTask(false)
                    activeTask = fallbackTask

                    if (!isCurrentLoad()) {
                        await fallbackTask.destroy()
                        return
                    }

                    loadingTaskRef.current = fallbackTask

                    fallbackTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                        if (isCurrentLoad() && total > 0) {
                            setProgress(Math.min(100, Math.round((loaded / total) * 100)))
                        }
                    }

                    const pdf = await fallbackTask.promise
                    if (!isCurrentLoad()) {
                        await pdf.destroy()
                        return
                    }

                    const { linkService, viewer } = viewerContext
                    setPdfDocument(pdf)
                    linkService.setDocument(pdf)
                    viewer.setDocument(pdf)

                    const docMetadata = await pdf.getMetadata()
                    if (!isCurrentLoad()) return

                    setMetadata(docMetadata)
                    onLoadSuccessRef.current?.(pdf)
                    return
                } catch (fallbackErr) {
                    if (!isCurrentLoad()) return
                    setLoadError(fallbackErr as Error)
                    onLoadErrorRef.current?.(fallbackErr as Error)
                    return
                }
            }

            // 非 Range 错误，直接抛
            setLoadError(err as Error)
            onLoadErrorRef.current?.(err as Error)
        } finally {
            if (isCurrentLoad()) {
                setLoading(false)
                onLoadEndRef.current?.()
            }
        }
    }, [url, data, enableRange, createPdfViewer, createLoadingTask])

    useEffect(() => {
        loadPdf()
        return () => {
            loadGenerationRef.current += 1
            if (cleanupRef.current) {
                cleanupRef.current()
                cleanupRef.current = null
            }
            if (loadingTaskRef.current) {
                loadingTaskRef.current.destroy()
                loadingTaskRef.current = null
            }
        }
    }, [loadPdf])

    return {
        /** 是否加载中 */
        loading,
        /** 加载进度 */
        progress,
        /** PDF 文档对象 */
        pdfDocument,
        /** PDFViewer 实例 */
        pdfViewer: pdfViewerRef.current,
        /** EventBus 引用 */
        eventBus: eventBusRef.current,
        /** PDF 元数据 */
        metadata,
        /** 加载错误 */
        loadError
    }
}
