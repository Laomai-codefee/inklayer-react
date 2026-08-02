import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../const/definitions'
import { SelectionSource, useAnnotationStore } from '..'

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

describe('annotation selection store', () => {
    beforeEach(() => {
        useAnnotationStore.getState().clearAnnotations()
    })

    afterEach(() => {
        useAnnotationStore.getState().clearAnnotations()
    })

    it('keeps the selected annotation snapshot synchronized after updates', () => {
        const annotation = makeAnnotation('annotation-1')
        const store = useAnnotationStore.getState()
        store.addAnnotation(annotation)
        store.setSelectedAnnotation(annotation, SelectionSource.CANVAS)
        const revision = useAnnotationStore.getState().selectionRevision

        store.updateAnnotation(annotation.id, {
            contentsObj: { text: 'Updated' }
        })

        const state = useAnnotationStore.getState()
        expect(state.selectedAnnotation?.store).toBe(state.annotations.get(annotation.id))
        expect(state.selectedAnnotation?.store?.contentsObj?.text).toBe('Updated')
        expect(state.selectionRevision).toBe(revision)
    })

    it('clears selection when the selected annotation is removed', () => {
        const annotation = makeAnnotation('annotation-1')
        const store = useAnnotationStore.getState()
        store.addAnnotation(annotation)
        store.setSelectedAnnotation(annotation, SelectionSource.SIDEBAR)

        store.removeAnnotation(annotation.id)

        expect(useAnnotationStore.getState().selectedAnnotation).toBeNull()
    })

    it('restores an annotation at its original insertion position', () => {
        const first = makeAnnotation('annotation-1')
        const second = makeAnnotation('annotation-2')
        const third = makeAnnotation('annotation-3')
        const store = useAnnotationStore.getState()
        store.addAnnotation(first)
        store.addAnnotation(second)
        store.addAnnotation(third)
        store.removeAnnotation(second.id)

        expect(store.restoreAnnotation(second, 1)).toBe(true)
        expect(Array.from(useAnnotationStore.getState().annotations.keys())).toEqual([
            first.id,
            second.id,
            third.id
        ])
        expect(store.restoreAnnotation(second, 1)).toBe(false)
    })

    it('clears selection together with all annotations', () => {
        const annotation = makeAnnotation('annotation-1')
        const store = useAnnotationStore.getState()
        store.addAnnotation(annotation)
        store.setSelectedAnnotation(annotation, SelectionSource.CANVAS)

        store.clearAnnotations()

        const state = useAnnotationStore.getState()
        expect(state.annotations.size).toBe(0)
        expect(state.selectedAnnotation).toBeNull()
    })

    it('represents a null selection as null', () => {
        const annotation = makeAnnotation('annotation-1')
        const store = useAnnotationStore.getState()
        store.setSelectedAnnotation(annotation, SelectionSource.CANVAS)

        store.setSelectedAnnotation(null)

        expect(useAnnotationStore.getState().selectedAnnotation).toBeNull()
    })
})
