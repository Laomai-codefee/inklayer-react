import React, { useCallback, useEffect, useRef } from 'react'
import { usePdfViewerContext } from '../../context/pdf_viewer_context'
import { Painter } from './painter'
import { useUserContext } from '@/context/user_context'
import { usePainter } from './context/painter_context'
import { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view'
import { PopoverBarRef } from '@/components/popover_bar'
import { SelectionBar } from './components/selection_bar'
import { useOptionsContext } from './context/options_context'
import { MenuBar, MenuBarRef } from './components/menu_bar'
import { IAnnotationStore } from './const/definitions'
import { FREE_TEXT_EDITOR } from './painter/const'
import { useAnnotationStore } from './store'
import { debounce } from '@/utils'

interface AnnotatorExtensionProps {
    enableNativeAnnotations: boolean
    annotations?: IAnnotationStore[]

    onLoad: () => void

    onAnnotationAdd: (annotation: IAnnotationStore) => void
    onAnnotationDelete: (id: string) => void
    onAnnotationSelected: (annotation: IAnnotationStore | null, isClick: boolean) => void
    onAnnotationChanged: (annotation: IAnnotationStore) => void
}

export const AnnotatorExtension: React.FC<AnnotatorExtensionProps> = ({
    enableNativeAnnotations,
    annotations,
    onLoad,
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationSelected,
    onAnnotationChanged
}) => {
    const { isReady, pdfViewer, eventBus, isSidebarCollapsed } = usePdfViewerContext()
    const { user } = useUserContext()
    const { setPainter } = usePainter()
    const { defaultOptions, primaryColor } = useOptionsContext()

    const clearAnnotations = useAnnotationStore(state => state.clearAnnotations)


    const latestPropsRef = useRef({
        annotations: annotations ?? [],
        enableNativeAnnotations,
        onLoad,
        onAnnotationAdd,
        onAnnotationDelete,
        onAnnotationSelected,
        onAnnotationChanged
    })
    latestPropsRef.current = {
        annotations: annotations ?? [],
        enableNativeAnnotations,
        onLoad,
        onAnnotationAdd,
        onAnnotationDelete,
        onAnnotationSelected,
        onAnnotationChanged
    }

    const selectionBarRef = useRef<PopoverBarRef>(null)
    const menuBarRef = useRef<MenuBarRef>(null)

    const debouncedViewAreaChanged = useRef(
        debounce(
            () => {
                menuBarRef.current?.close()
                selectionBarRef.current?.close()

                const element = document.querySelector(`#${FREE_TEXT_EDITOR}`)
                if (element?.parentNode) {
                    try {
                        element.parentNode.removeChild(element)
                    } catch {
                        // ignore
                    }
                }
            },
            100,
            true
        )
    ).current

    const handleViewAreaChanged = useCallback(() => {
        debouncedViewAreaChanged()
    }, [debouncedViewAreaChanged])

    useEffect(() => {
        clearAnnotations()

        if (!isReady || !pdfViewer || !eventBus || !user) return

        let disposed = false
        let documentLoadStarted = false
        let rerenderTimer: ReturnType<typeof setTimeout> | null = null

        const painterInstance = new Painter({
            primaryColor,
            defaultOptions,
            currentUser: user,
            PDFViewerApplication: pdfViewer,

            onTextSelected: (range) => {
                selectionBarRef.current?.open(range)
            },

            onAnnotationAdd: (annotation) => {
                latestPropsRef.current.onAnnotationAdd(annotation)
            },

            onAnnotationDelete: (id) => {
                latestPropsRef.current.onAnnotationDelete(id)
            },

            onAnnotationSelected: (annotation, isClick, selectorRect) => {
                if (isClick && annotation) {
                    menuBarRef.current?.open(annotation, selectorRect)
                }
                latestPropsRef.current.onAnnotationSelected(annotation ?? null, isClick)
            },

            onAnnotationChanging: () => {
                menuBarRef.current?.close()
            },

            onAnnotationChanged: (annotation, selectorRect) => {
                if (annotation && selectorRect) {
                    menuBarRef.current?.open(annotation, selectorRect)
                }
                if (annotation) {
                    latestPropsRef.current.onAnnotationChanged(annotation)
                }
            }
        })

        setPainter(painterInstance)

        const handlePageRendered = ({ source, cssTransform, pageNumber }: { source: PDFPageView; cssTransform: boolean; pageNumber: number }) => {
            painterInstance.initCanvas({
                pageView: source,
                cssTransform,
                pageNumber
            })
        }

        eventBus.on('pagerendered', handlePageRendered)

        // NOTE: private pdfjs event API, version-sensitive
        eventBus._on('updateviewarea', handleViewAreaChanged)

        painterInstance.initWebSelection(pdfViewer.viewer as HTMLDivElement)

        // 检查文档是否已经加载
        const handleDocumentLoaded = async () => {
            if (disposed || documentLoadStarted) return
            documentLoadStarted = true

            try {
                const { annotations: latestAnnotations, enableNativeAnnotations: latestEnableNativeAnnotations } = latestPropsRef.current
                await painterInstance.initAnnotationsOnce(latestAnnotations, latestEnableNativeAnnotations)
            } catch (error) {
                if (!disposed) {
                    console.error('[Annotator] Failed to initialize annotations', error)
                }
                return
            }

            if (disposed) return

            rerenderTimer = setTimeout(() => {
                rerenderTimer = null
                if (disposed) return

                for (let i = 0; i < pdfViewer.pagesCount; i++) {
                    const pageView = pdfViewer.getPageView(i)
                    if (pageView && pageView.div && pageView.canvas) {
                        const konvaCanvasStore = painterInstance.getKonvaCanvasStore()
                        if (konvaCanvasStore && konvaCanvasStore.has(i + 1)) {
                            painterInstance.reRenderAnnotations(i + 1)
                        }
                    }
                }
            }, 0)
            latestPropsRef.current.onLoad?.()

        }

        if (pdfViewer.pdfDocument) {
            void handleDocumentLoaded()
        } else {
            eventBus.on('documentloaded', handleDocumentLoaded)
        }

        return () => {
            disposed = true
            if (rerenderTimer) {
                clearTimeout(rerenderTimer)
                rerenderTimer = null
            }
            eventBus.off('pagerendered', handlePageRendered)
            eventBus.off('updateviewarea', handleViewAreaChanged)
            eventBus.off('documentloaded', handleDocumentLoaded)
            painterInstance.destroy()
            setPainter(null)
        }

    }, [clearAnnotations, defaultOptions, eventBus, handleViewAreaChanged, isReady, pdfViewer, primaryColor, setPainter, user])


    useEffect(() => {
        handleViewAreaChanged()
    }, [handleViewAreaChanged, isSidebarCollapsed])

    return (
        <>
            <SelectionBar ref={selectionBarRef} />
            <MenuBar ref={menuBarRef} />
        </>
    )
}
