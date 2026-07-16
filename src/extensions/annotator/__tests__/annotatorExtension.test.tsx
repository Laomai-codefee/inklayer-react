/** @jest-environment jsdom */

import { act, render, waitFor } from '@testing-library/react'
import { AnnotatorExtension } from '..'

const mockSetPainter = jest.fn()
const mockClearAnnotations = jest.fn()
const mockEventBus = {
    on: jest.fn(),
    _on: jest.fn(),
    off: jest.fn()
}
const mockPdfViewer = {
    pdfDocument: {},
    viewer: document.createElement('div'),
    pagesCount: 1,
    getPageView: jest.fn(() => ({ div: document.createElement('div'), canvas: document.createElement('canvas') }))
}
const mockPainterInstances: MockPainter[] = []
let mockInitAnnotations: () => Promise<void>

interface MockPainter {
    destroy: jest.Mock
    initAnnotationsOnce: jest.Mock
    reRenderAnnotations: jest.Mock
}

jest.mock('../../../context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({
        isReady: true,
        pdfViewer: mockPdfViewer,
        eventBus: mockEventBus,
        isSidebarCollapsed: false
    })
}))

jest.mock('@/context/user_context', () => ({
    useUserContext: () => ({ user: { id: 'user-1', name: 'User' } })
}))

jest.mock('../context/painter_context', () => ({
    usePainter: () => ({ setPainter: mockSetPainter })
}))

jest.mock('../context/options_context', () => ({
    useOptionsContext: () => ({ defaultOptions: {}, primaryColor: '#000000' })
}))

jest.mock('../store', () => ({
    useAnnotationStore: (selector: (state: { clearAnnotations: typeof mockClearAnnotations }) => unknown) =>
        selector({ clearAnnotations: mockClearAnnotations })
}))

jest.mock('../painter', () => ({
    Painter: class {
        destroy = jest.fn()
        initWebSelection = jest.fn()
        initCanvas = jest.fn()
        initAnnotationsOnce = jest.fn(() => mockInitAnnotations())
        getKonvaCanvasStore = jest.fn(() => new Map([[1, {}]]))
        reRenderAnnotations = jest.fn()

        constructor() {
            mockPainterInstances.push(this)
        }
    }
}))

jest.mock('../components/selection_bar', () => {
    const React = jest.requireActual('react')
    return { SelectionBar: React.forwardRef(() => null) }
})

jest.mock('../components/menu_bar', () => {
    const React = jest.requireActual('react')
    return { MenuBar: React.forwardRef(() => null) }
})

const requiredProps = {
    enableNativeAnnotations: false,
    onLoad: jest.fn(),
    onAnnotationAdd: jest.fn(),
    onAnnotationDelete: jest.fn(),
    onAnnotationSelected: jest.fn(),
    onAnnotationChanged: jest.fn()
}

describe('AnnotatorExtension lifecycle', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.clearAllMocks()
        mockPainterInstances.length = 0
        requiredProps.onLoad = jest.fn()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('ignores annotation initialization that finishes after unmount', async () => {
        let resolveInitialization!: () => void
        mockInitAnnotations = () => new Promise<void>((resolve) => (resolveInitialization = resolve))

        const { unmount } = render(<AnnotatorExtension {...requiredProps} />)
        await waitFor(() => expect(mockPainterInstances[0].initAnnotationsOnce).toHaveBeenCalledTimes(1))
        const painter = mockPainterInstances[0]

        unmount()
        await act(async () => {
            resolveInitialization()
            await Promise.resolve()
        })

        expect(painter.destroy).toHaveBeenCalledTimes(1)
        expect(mockEventBus.off).toHaveBeenCalledWith('pagerendered', expect.any(Function))
        expect(mockEventBus.off).toHaveBeenCalledWith('updateviewarea', expect.any(Function))
        expect(mockEventBus.off).toHaveBeenCalledWith('documentloaded', expect.any(Function))
        expect(mockSetPainter).toHaveBeenLastCalledWith(null)
        expect(requiredProps.onLoad).not.toHaveBeenCalled()
        expect(painter.reRenderAnnotations).not.toHaveBeenCalled()
    })

    it('clears the deferred rerender timer on unmount', async () => {
        mockInitAnnotations = async () => undefined

        const { unmount } = render(<AnnotatorExtension {...requiredProps} />)
        await act(async () => {
            await Promise.resolve()
        })
        const painter = mockPainterInstances[0]

        expect(requiredProps.onLoad).toHaveBeenCalledTimes(1)
        unmount()
        act(() => jest.runOnlyPendingTimers())

        expect(painter.reRenderAnnotations).not.toHaveBeenCalled()
    })
})
