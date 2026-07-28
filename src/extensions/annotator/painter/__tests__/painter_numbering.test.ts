/** @jest-environment jsdom */

import { Painter } from '..'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../const/definitions'
import { useAnnotationStore } from '../../store'

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
        pageNumber: 1,
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
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

type NumberingPainter = Painter & {
    saveToStore: (annotation: IAnnotationStore, isOriginal?: boolean) => void
}

function createPainter(): NumberingPainter {
    const painter = Object.create(Painter.prototype) as NumberingPainter
    Object.assign(painter as unknown as Record<string, unknown>, {
        nextAnnotationReferenceNumber: 1,
        permissionController: { can: jest.fn(() => true) },
        authorLabels: { refreshAnnotation: jest.fn() },
        onAnnotationAdd: jest.fn(),
        selectAnnotation: jest.fn()
    })
    return painter
}

describe('Painter annotation reference numbering', () => {
    beforeEach(() => {
        useAnnotationStore.getState().clearAnnotations()
        useAnnotationStore.getState().clearSelectedAnnotation()
    })

    afterEach(() => {
        useAnnotationStore.getState().clearAnnotations()
        useAnnotationStore.getState().clearSelectedAnnotation()
    })

    it('normalizes loaded annotations before data is saved', async () => {
        const painter = createPainter()

        await painter.initAnnotationsOnce([
            makeAnnotation('a', { referenceNumber: 1 }),
            makeAnnotation('b', { referenceNumber: 2 }),
            makeAnnotation('c')
        ], false)

        expect(painter.getData().map((annotation) => annotation.referenceNumber))
            .toEqual([1, 2, 3])
    })

    it('numbers a new annotation before emitting it and keeps the session high-water mark', async () => {
        const painter = createPainter()
        await painter.initAnnotationsOnce([
            makeAnnotation('a', { referenceNumber: 1 }),
            makeAnnotation('b', { referenceNumber: 2 })
        ], false)

        painter.saveToStore(makeAnnotation('c'))
        useAnnotationStore.getState().removeAnnotation('c')
        painter.saveToStore(makeAnnotation('d'))

        const onAnnotationAdd = (painter as unknown as { onAnnotationAdd: jest.Mock }).onAnnotationAdd
        expect(onAnnotationAdd.mock.calls.map(([annotation]) => annotation.referenceNumber))
            .toEqual([3, 4])
        expect(painter.getData().map((annotation) => annotation.referenceNumber))
            .toEqual([1, 2, 4])
    })
})
