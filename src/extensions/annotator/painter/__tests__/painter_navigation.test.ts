/** @jest-environment jsdom */

import { Painter } from '..'
import {
    AnnotationType,
    PdfjsAnnotationType,
    annotationDefinitions,
    type IAnnotationStore
} from '../../const/definitions'

jest.mock('../../utils/utils', () => ({
    isElementInDOM: jest.fn(() => true),
    removeCssCustomProperty: jest.fn(),
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id')
}))

function makeAnnotation(
    id: string,
    overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
    return {
        id,
        pageNumber: 2,
        konvaString: '{}',
        konvaClientRect: { x: 10, y: 220, width: 20, height: 20 },
        title: 'Alice',
        type: AnnotationType.RECTANGLE,
        color: '#000000',
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        contentsObj: { text: '' },
        comments: [],
        user: { id: 'alice', name: 'Alice' },
        native: false,
        ...overrides
    }
}

type NavigationPainter = Painter & {
    editorStore: Map<string, unknown>
}

function createPainter(editorStore = new Map<string, unknown>()): {
    painter: NavigationPainter
    scrollPageIntoView: jest.Mock
    getPageView: jest.Mock
    convertToPdfPoint: jest.Mock
    select: jest.Mock
    activate: jest.Mock
} {
    const painter = Object.create(Painter.prototype) as NavigationPainter
    const scrollPageIntoView = jest.fn()
    const convertToPdfPoint = jest.fn(() => [30, 40])
    const getPageView = jest.fn(() => ({
        viewport: {
            scale: 1.5,
            convertToPdfPoint
        }
    }))
    const select = jest.fn()
    const activate = jest.fn()

    Object.assign(painter as unknown as Record<string, unknown>, {
        pdfViewerApplication: {
            _pages: [],
            getPageView,
            scrollPageIntoView
        },
        editorStore,
        selector: { select, activate },
        currentAnnotation: annotationDefinitions[0],
        setDefaultMode: jest.fn(),
        highlightRequestId: 0,
        highlightRetryTimer: null,
        resolveHighlightRequest: null
    })

    return {
        painter,
        scrollPageIntoView,
        getPageView,
        convertToPdfPoint,
        select,
        activate
    }
}

describe('Painter annotation reference navigation', () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    it('uses the zero-based PDF.js page view and selects a rendered target', async () => {
        const editorStore = new Map<string, unknown>([
            [`2_${AnnotationType.RECTANGLE}`, {}]
        ])
        const {
            painter,
            scrollPageIntoView,
            getPageView,
            convertToPdfPoint,
            select,
            activate
        } = createPainter(editorStore)

        await expect(painter.highlight(makeAnnotation('annotation-2')))
            .resolves.toBe(true)

        expect(getPageView).toHaveBeenCalledWith(1)
        expect(convertToPdfPoint).toHaveBeenCalledWith(15, 130)
        expect(scrollPageIntoView).toHaveBeenCalledWith({
            pageNumber: 2,
            destArray: [null, { name: 'XYZ' }, 30, 40, null],
            allowNegativeOffset: true
        })
        expect(select).toHaveBeenCalledWith('annotation-2')
        expect(activate).toHaveBeenCalledWith(2)
    })

    it('cancels an older pending jump when a newer reference is activated', async () => {
        jest.useFakeTimers()
        const editorStore = new Map<string, unknown>()
        const { painter, select } = createPainter(editorStore)
        const first = painter.highlight(makeAnnotation('annotation-1'))
        const second = painter.highlight(makeAnnotation('annotation-2'))

        await expect(first).resolves.toBe(false)

        editorStore.set(`2_${AnnotationType.RECTANGLE}`, {})
        jest.advanceTimersByTime(100)

        await expect(second).resolves.toBe(true)
        expect(select).toHaveBeenCalledTimes(1)
        expect(select).toHaveBeenCalledWith('annotation-2')
    })
})
