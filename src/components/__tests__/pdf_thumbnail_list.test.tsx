/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { EventBus, PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { PdfThumbnailList } from '../pdf_thumbnail_list'

const mockEventListeners = new Map<string, (event: { pageNumber: number }) => void>()
const mockEventBus = {
    on: jest.fn((name: string, listener: (event: { pageNumber: number }) => void) => {
        mockEventListeners.set(name, listener)
    }),
    off: jest.fn((name: string) => {
        mockEventListeners.delete(name)
    }),
}
const mockSetCurrentPage = jest.fn()
let mockCurrentPage = 2
let mockPdfDocument: PDFDocumentProxy | null = null
const mockPdfViewer = {
    get currentPageNumber() {
        return mockCurrentPage
    },
    set currentPageNumber(pageNumber: number) {
        mockCurrentPage = pageNumber
        mockSetCurrentPage(pageNumber)
    },
} as PDFViewer

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({
        pdfDocument: mockPdfDocument,
        pdfViewer: mockPdfViewer,
        eventBus: mockEventBus as unknown as EventBus,
    })
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { value?: number; count?: number }) => {
            if (key === 'viewer:navigation.page') return `Page ${options?.value}`
            if (key === 'viewer:navigation.pageWithMarkers') {
                return `Page ${options?.value}, ${options?.count} annotations`
            }
            return key
        }
    })
}))

const createPage = (
    renderTask: { promise: Promise<void>; cancel: jest.Mock } = {
        promise: Promise.resolve(),
        cancel: jest.fn(),
    }
) => {
    const render = jest.fn(() => renderTask)
    const page = {
        getViewport: jest.fn(({ scale }: { scale: number }) => ({
            width: 612 * scale,
            height: 792 * scale,
        })),
        render,
    } as unknown as PDFPageProxy

    return { page, render, renderTask }
}

const createDocument = (numPages: number, page: PDFPageProxy): PDFDocumentProxy => ({
    numPages,
    getPage: jest.fn(async () => page),
} as unknown as PDFDocumentProxy)

describe('PdfThumbnailList', () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver
    const originalDevicePixelRatio = window.devicePixelRatio
    const scrollIntoView = jest.fn()

    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scrollIntoView,
        })
    })

    beforeEach(() => {
        jest.clearAllMocks()
        mockEventListeners.clear()
        mockCurrentPage = 2
        Object.defineProperty(globalThis, 'IntersectionObserver', {
            configurable: true,
            writable: true,
            value: undefined,
        })
        Object.defineProperty(window, 'devicePixelRatio', {
            configurable: true,
            value: 2,
        })
    })

    afterAll(() => {
        Object.defineProperty(globalThis, 'IntersectionObserver', {
            configurable: true,
            writable: true,
            value: originalIntersectionObserver,
        })
        Object.defineProperty(window, 'devicePixelRatio', {
            configurable: true,
            value: originalDevicePixelRatio,
        })
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
    })

    it('renders every page, exposes marker counts, and follows page changes', async () => {
        const { page } = createPage()
        mockPdfDocument = createDocument(3, page)

        const { unmount } = render(
            <PdfThumbnailList pageMarkerCounts={new Map([[2, 105]])} />
        )

        expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current')
        expect(screen.getByRole('button', {
            name: 'Page 2, 105 annotations',
        })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByText('99+')).toHaveAttribute('aria-hidden', 'true')

        fireEvent.click(screen.getByRole('button', { name: 'Page 1' }))
        expect(mockSetCurrentPage).toHaveBeenCalledWith(1)

        scrollIntoView.mockClear()
        act(() => {
            mockEventListeners.get('pagechanging')?.({ pageNumber: 3 })
        })
        expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
            'aria-current',
            'page'
        )
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())

        unmount()
        expect(mockEventBus.off).toHaveBeenCalledWith('pagechanging', expect.any(Function))
    })

    it('renders thumbnails at a capped output scale when observers are unavailable', async () => {
        const { page, render: renderPage } = createPage()
        mockPdfDocument = createDocument(1, page)
        mockCurrentPage = 1

        render(<PdfThumbnailList pageMarkerCounts={new Map()} />)

        await waitFor(() => expect(renderPage).toHaveBeenCalledTimes(1))
        const canvas = screen.getByRole('button', { name: 'Page 1' })
            .querySelector('canvas')

        expect(canvas).toHaveAttribute('width', '264')
        expect(canvas).toHaveAttribute('height', '341')
        expect(renderPage).toHaveBeenCalledWith(expect.objectContaining({
            transform: [2, 0, 0, 2, 0, 0],
        }))
    })

    it('defers rendering until a thumbnail approaches the viewport', async () => {
        let intersectionCallback: IntersectionObserverCallback | null = null
        const disconnect = jest.fn()
        Object.defineProperty(globalThis, 'IntersectionObserver', {
            configurable: true,
            writable: true,
            value: jest.fn((callback: IntersectionObserverCallback) => {
                intersectionCallback = callback
                return {
                    disconnect,
                    observe: jest.fn(),
                    root: null,
                    rootMargin: '',
                    thresholds: [],
                    takeRecords: () => [],
                    unobserve: jest.fn(),
                }
            }),
        })
        const { page, render: renderPage } = createPage()
        mockPdfDocument = createDocument(1, page)
        mockCurrentPage = 1

        render(<PdfThumbnailList pageMarkerCounts={new Map()} />)
        expect(mockPdfDocument.getPage).not.toHaveBeenCalled()

        act(() => {
            intersectionCallback?.(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver
            )
        })

        await waitFor(() => expect(renderPage).toHaveBeenCalledTimes(1))
        expect(disconnect).toHaveBeenCalled()
    })

    it('shows a localized fallback when a thumbnail cannot be rendered', async () => {
        mockPdfDocument = {
            numPages: 1,
            getPage: jest.fn(async () => {
                throw new Error('render failed')
            }),
        } as unknown as PDFDocumentProxy
        mockCurrentPage = 1

        render(<PdfThumbnailList pageMarkerCounts={new Map()} />)

        expect(await screen.findByText(
            'viewer:navigation.thumbnailError'
        )).toBeInTheDocument()
    })

    it('realigns the selected thumbnail when its size resolves after a long delay', async () => {
        jest.useFakeTimers()
        try {
            let resolvePage!: (page: PDFPageProxy) => void
            const pagePromise = new Promise<PDFPageProxy>((resolve) => {
                resolvePage = resolve
            })
            const { page } = createPage()
            mockPdfDocument = {
                numPages: 1,
                getPage: jest.fn(() => pagePromise),
            } as unknown as PDFDocumentProxy
            mockCurrentPage = 1

            render(<PdfThumbnailList pageMarkerCounts={new Map()} />)
            scrollIntoView.mockClear()

            act(() => jest.advanceTimersByTime(10_000))
            await act(async () => {
                resolvePage(page)
                await pagePromise
                await Promise.resolve()
            })
            act(() => jest.runOnlyPendingTimers())

            expect(scrollIntoView).toHaveBeenCalled()
        } finally {
            jest.useRealTimers()
        }
    })

    it('does not reclaim scroll position after the user scrolls the thumbnail list', async () => {
        jest.useFakeTimers()
        try {
            let resolvePage!: (page: PDFPageProxy) => void
            const pagePromise = new Promise<PDFPageProxy>((resolve) => {
                resolvePage = resolve
            })
            const { page } = createPage()
            mockPdfDocument = {
                numPages: 1,
                getPage: jest.fn(() => pagePromise),
            } as unknown as PDFDocumentProxy
            mockCurrentPage = 1

            render(<PdfThumbnailList pageMarkerCounts={new Map()} />)
            const thumbnail = screen.getByRole('button', { name: 'Page 1' })
            const thumbnailList = thumbnail.parentElement
            expect(thumbnailList).not.toBeNull()

            scrollIntoView.mockClear()
            fireEvent.wheel(thumbnailList!)
            act(() => jest.advanceTimersByTime(10_000))
            await act(async () => {
                resolvePage(page)
                await pagePromise
                await Promise.resolve()
            })
            act(() => jest.runOnlyPendingTimers())

            expect(scrollIntoView).not.toHaveBeenCalled()
        } finally {
            jest.useRealTimers()
        }
    })

    it('cancels an in-progress thumbnail render when unmounted', async () => {
        const renderTask = {
            promise: new Promise<void>(() => undefined),
            cancel: jest.fn(),
        }
        const { page, render: renderPage } = createPage(renderTask)
        mockPdfDocument = createDocument(1, page)
        mockCurrentPage = 1

        const { unmount } = render(
            <PdfThumbnailList pageMarkerCounts={new Map()} />
        )
        await waitFor(() => expect(renderPage).toHaveBeenCalledTimes(1))

        unmount()

        expect(renderTask.cancel).toHaveBeenCalledTimes(1)
    })
})
