import { DELETE_UNDO_DURATION_MS, DeleteUndoController } from '../delete_undo'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationComment,
    type IAnnotationStore
} from '../../const/definitions'

const comment: IAnnotationComment = {
    id: 'comment-1',
    title: 'Alice',
    date: '2026-08-01',
    content: 'Comment',
    user: { id: 'alice', name: 'Alice' }
}

const previewAnnotation: IAnnotationStore = {
    id: 'annotation-1',
    referenceNumber: 1,
    pageNumber: 1,
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    title: 'Alice',
    type: AnnotationType.RECTANGLE,
    color: '#000000',
    subtype: 'Square',
    pdfjsType: PdfjsAnnotationType.SQUARE,
    date: null,
    contentsObj: { text: 'Annotation' },
    comments: [comment],
    user: { id: 'alice', name: 'Alice' },
    native: false
}

describe('DeleteUndoController', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('batches consecutive deletions and resets the expiry window', () => {
        const controller = new DeleteUndoController()
        const listener = jest.fn()
        controller.subscribe(listener)

        controller.add({
            kind: 'comment',
            annotationId: 'annotation-1',
            previewAnnotation,
            comment,
            commentIndex: 0
        })
        jest.advanceTimersByTime(DELETE_UNDO_DURATION_MS - 1000)
        controller.add({
            kind: 'comment',
            annotationId: 'annotation-1',
            previewAnnotation,
            comment: { ...comment, id: 'comment-2' },
            commentIndex: 1
        })

        expect(controller.getSnapshot()).toEqual(expect.objectContaining({
            commentCount: 2,
            totalCount: 2
        }))
        jest.advanceTimersByTime(DELETE_UNDO_DURATION_MS - 1)
        expect(controller.getSnapshot()).not.toBeNull()
        jest.advanceTimersByTime(1)
        expect(controller.getSnapshot()).toBeNull()
        expect(listener).toHaveBeenCalled()
    })

    it('pauses and resumes the remaining timeout', () => {
        const controller = new DeleteUndoController()
        controller.add({
            kind: 'comment',
            annotationId: 'annotation-1',
            previewAnnotation,
            comment,
            commentIndex: 0
        })
        jest.advanceTimersByTime(3000)
        controller.pause()
        jest.advanceTimersByTime(DELETE_UNDO_DURATION_MS)
        expect(controller.getSnapshot()).not.toBeNull()

        controller.resume()
        jest.advanceTimersByTime(DELETE_UNDO_DURATION_MS - 3001)
        expect(controller.getSnapshot()).not.toBeNull()
        jest.advanceTimersByTime(1)
        expect(controller.getSnapshot()).toBeNull()
    })
})
