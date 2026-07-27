import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useTranslation } from 'react-i18next'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import styles from './pdf_thumbnail_list.module.scss'

const THUMBNAIL_WIDTH = 132
const PRELOAD_MARGIN = '320px 0px'

interface PdfThumbnailProps {
    pdfDocument: PDFDocumentProxy
    pageNumber: number
    selected: boolean
    markerCount: number
    onSelect: (pageNumber: number) => void
    onLayoutChange: () => void
    registerElement: (pageNumber: number, element: HTMLButtonElement | null) => void
}

const PdfThumbnail = memo<PdfThumbnailProps>(({
    pdfDocument,
    pageNumber,
    selected,
    markerCount,
    onSelect,
    onLayoutChange,
    registerElement,
}) => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const itemRef = useRef<HTMLButtonElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null)
    const [shouldRender, setShouldRender] = useState(false)
    const [rendered, setRendered] = useState(false)
    const [renderFailed, setRenderFailed] = useState(false)
    const pageLabel = markerCount > 0
        ? t('viewer:navigation.pageWithMarkers', {
            value: pageNumber,
            count: markerCount,
        })
        : t('viewer:navigation.page', { value: pageNumber })

    const setItemRef = useCallback((element: HTMLButtonElement | null) => {
        itemRef.current = element
        registerElement(pageNumber, element)
    }, [pageNumber, registerElement])

    useEffect(() => {
        const element = itemRef.current
        if (!element || shouldRender) return

        if (typeof IntersectionObserver === 'undefined') {
            setShouldRender(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldRender(true)
                    observer.disconnect()
                }
            },
            { rootMargin: PRELOAD_MARGIN }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [shouldRender])

    useEffect(() => {
        if (!shouldRender) return

        let disposed = false

        const renderThumbnail = async () => {
            let renderTask: ReturnType<PDFPageProxy['render']> | null = null

            try {
                setRendered(false)
                setRenderFailed(false)
                const page = await pdfDocument.getPage(pageNumber)
                if (disposed) return

                const canvas = canvasRef.current
                const context = canvas?.getContext('2d')
                if (!canvas || !context) return

                const baseViewport = page.getViewport({ scale: 1 })
                const viewport = page.getViewport({ scale: THUMBNAIL_WIDTH / baseViewport.width })
                const outputScale = Math.min(window.devicePixelRatio || 1, 2)

                canvas.width = Math.floor(viewport.width * outputScale)
                canvas.height = Math.floor(viewport.height * outputScale)
                canvas.style.width = `${Math.floor(viewport.width)}px`
                canvas.style.height = `${Math.floor(viewport.height)}px`
                onLayoutChange()

                renderTask = page.render({
                    canvasContext: context,
                    viewport,
                    transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
                })
                renderTaskRef.current = renderTask
                await renderTask.promise
                if (!disposed) {
                    setRendered(true)
                }
            } catch (error) {
                if (!disposed && (error as Error).name !== 'RenderingCancelledException') {
                    setRenderFailed(true)
                }
            } finally {
                if (renderTaskRef.current === renderTask) {
                    renderTaskRef.current = null
                }
            }
        }

        void renderThumbnail()

        return () => {
            disposed = true
            renderTaskRef.current?.cancel()
            renderTaskRef.current = null
        }
    }, [onLayoutChange, pdfDocument, pageNumber, shouldRender])

    return (
        <button
            ref={setItemRef}
            type="button"
            className={[
                styles.thumbnail,
                selected ? styles['thumbnail--selected'] : '',
            ].join(' ')}
            aria-current={selected ? 'page' : undefined}
            aria-label={pageLabel}
            onClick={() => onSelect(pageNumber)}
        >
            <span className={styles.thumbnailCanvasWrapper}>
                <canvas ref={canvasRef} className={styles.thumbnailCanvas} />
                {!rendered && !renderFailed && <span className={styles.thumbnailPlaceholder} />}
                {renderFailed && (
                    <span className={styles.thumbnailError}>
                        {t('viewer:navigation.thumbnailError')}
                    </span>
                )}
                {markerCount > 0 && (
                    <span className={styles.thumbnailMarker} aria-hidden="true">
                        {markerCount > 99 ? '99+' : markerCount}
                    </span>
                )}
                <span className={styles.thumbnailPageNumber}>{pageNumber}</span>
            </span>
        </button>
    )
})

PdfThumbnail.displayName = 'PdfThumbnail'

interface PdfThumbnailListProps {
    pageMarkerCounts: ReadonlyMap<number, number>
}

export const PdfThumbnailList: React.FC<PdfThumbnailListProps> = ({ pageMarkerCounts }) => {
    const { pdfDocument, pdfViewer, eventBus } = usePdfViewerContext()
    const [currentPage, setCurrentPage] = useState(() => pdfViewer?.currentPageNumber || 1)
    const currentPageRef = useRef(currentPage)
    const thumbnailElementsRef = useRef(new Map<number, HTMLButtonElement>())
    const animationFrameRef = useRef<number | null>(null)
    const autoFollowCurrentPageRef = useRef(true)

    const registerElement = useCallback((pageNumber: number, element: HTMLButtonElement | null) => {
        if (element) {
            thumbnailElementsRef.current.set(pageNumber, element)
        } else {
            thumbnailElementsRef.current.delete(pageNumber)
        }
    }, [])

    const cancelScheduledScroll = useCallback(() => {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
    }, [])

    const keepCurrentThumbnailVisible = useCallback(() => {
        if (!autoFollowCurrentPageRef.current) return

        cancelScheduledScroll()
        animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = null
            thumbnailElementsRef.current.get(currentPageRef.current)?.scrollIntoView({
                block: 'nearest',
            })
        })
    }, [cancelScheduledScroll])

    const stopAutoFollow = useCallback(() => {
        autoFollowCurrentPageRef.current = false
        cancelScheduledScroll()
    }, [cancelScheduledScroll])

    const handlePageSelect = useCallback((pageNumber: number) => {
        if (!pdfViewer) return
        autoFollowCurrentPageRef.current = true
        currentPageRef.current = pageNumber
        setCurrentPage(pageNumber)
        pdfViewer.currentPageNumber = pageNumber
    }, [pdfViewer])

    useEffect(() => {
        if (!pdfViewer || !eventBus) return

        const initialPage = pdfViewer.currentPageNumber || 1
        autoFollowCurrentPageRef.current = true
        currentPageRef.current = initialPage
        setCurrentPage(initialPage)

        const handlePageChanging = ({ pageNumber }: { pageNumber: number }) => {
            autoFollowCurrentPageRef.current = true
            currentPageRef.current = pageNumber
            setCurrentPage(pageNumber)
        }

        eventBus.on('pagechanging', handlePageChanging)
        return () => eventBus.off('pagechanging', handlePageChanging)
    }, [eventBus, pdfViewer])

    useEffect(() => {
        autoFollowCurrentPageRef.current = true
        currentPageRef.current = currentPage
        keepCurrentThumbnailVisible()
    }, [currentPage, keepCurrentThumbnailVisible, pdfDocument])

    useEffect(() => cancelScheduledScroll, [cancelScheduledScroll])

    if (!pdfDocument) return null

    return (
        <div
            className={styles.thumbnailList}
            onPointerDown={stopAutoFollow}
            onTouchStart={stopAutoFollow}
            onWheel={stopAutoFollow}
        >
            {Array.from({ length: pdfDocument.numPages }, (_, index) => {
                const pageNumber = index + 1
                return (
                    <PdfThumbnail
                        key={pageNumber}
                        pdfDocument={pdfDocument}
                        pageNumber={pageNumber}
                        selected={pageNumber === currentPage}
                        markerCount={pageMarkerCounts.get(pageNumber) ?? 0}
                        onSelect={handlePageSelect}
                        onLayoutChange={keepCurrentThumbnailVisible}
                        registerElement={registerElement}
                    />
                )
            })}
        </div>
    )
}
