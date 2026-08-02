/** @jest-environment jsdom */

import { Painter } from '..'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationComment,
    type IAnnotationStore
} from '../../const/definitions'
import { useAnnotationStore } from '../../store'
import { DELETE_UNDO_DURATION_MS, DeleteUndoController } from '../delete_undo'

jest.mock('../../utils/utils', () => ({
    isElementInDOM: jest.fn(() => true),
    removeCssCustomProperty: jest.fn(),
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id')
}))

function makeAnnotation(comments: IAnnotationComment[] = []): IAnnotationStore {
    return {
        id: 'annotation-1',
        pageNumber: 1,
        konvaString: '{"attrs":{"id":"annotation-1"}}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
        title: 'Alice',
        type: AnnotationType.RECTANGLE,
        color: '#000000',
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        contentsObj: { text: 'Review this' },
        comments,
        referenceNumber: 7,
        user: { id: 'alice', name: 'Alice' },
        native: false
    }
}

function createPainter(events: string[]): Painter {
    const painter = Object.create(Painter.prototype) as Painter
    Object.assign(painter as unknown as Record<string, unknown>, {
        permissionController: { can: jest.fn(() => true) },
        deleteUndoController: new DeleteUndoController(),
        selector: { delete: jest.fn() },
        authorLabels: {
            remove: jest.fn(),
            refreshAnnotation: jest.fn()
        },
        hoverPreview: { refresh: jest.fn() },
        annotationHover: { clearAnnotation: jest.fn() },
        editorStore: new Map(),
        konvaCanvasStore: new Map(),
        onAnnotationDelete: jest.fn((id: string) => events.push(`deleted:${id}`)),
        onAnnotationAdd: jest.fn((annotation: IAnnotationStore) => events.push(`added:${annotation.id}`)),
        onAnnotationChanged: jest.fn((annotation: IAnnotationStore) => events.push(`updated:${annotation.comments.length}`))
    })
    return painter
}

describe('Painter delete undo', () => {
    beforeEach(() => {
        useAnnotationStore.getState().clearAnnotations()
    })

    afterEach(() => {
        useAnnotationStore.getState().clearAnnotations()
        jest.useRealTimers()
    })

    it('deletes immediately and restores the same annotation through existing events', () => {
        const events: string[] = []
        const annotation = makeAnnotation()
        const painter = createPainter(events)
        useAnnotationStore.getState().addAnnotation(annotation)

        expect(painter.delete(annotation.id, true)).toBe(true)
        expect(painter.getData()).toEqual([])
        expect(events).toEqual([`deleted:${annotation.id}`])
        expect(painter.getDeleteUndoSnapshot()).toEqual(expect.objectContaining({
            annotationCount: 1,
            commentCount: 0,
            totalCount: 1
        }))

        expect(painter.undoDelete()).toBe(1)
        expect(painter.getData()).toEqual([annotation])
        expect(events).toEqual([`deleted:${annotation.id}`, `added:${annotation.id}`])
        expect(painter.getDeleteUndoSnapshot()).toBeNull()
    })

    it('restores mixed deletions in reverse order without losing comment changes', () => {
        const events: string[] = []
        const reply: IAnnotationComment = {
            id: 'comment-1',
            title: 'Bob',
            date: '2026-08-01',
            content: 'Please revise',
            user: { id: 'bob', name: 'Bob' }
        }
        const annotation = makeAnnotation([reply])
        const painter = createPainter(events)
        useAnnotationStore.getState().addAnnotation(annotation)

        expect(painter.deleteComment(annotation.id, reply.id)).toBe(true)
        expect(painter.getData()[0].comments).toEqual([])
        expect(painter.delete(annotation.id, true)).toBe(true)
        expect(painter.getData()).toEqual([])

        expect(painter.undoDelete()).toBe(2)
        expect(painter.getData()[0].comments).toEqual([reply])
        expect(events).toEqual([
            'updated:0',
            `deleted:${annotation.id}`,
            `added:${annotation.id}`,
            'updated:1'
        ])
    })

    it('restores a comment into the latest annotation state', () => {
        const events: string[] = []
        const reply: IAnnotationComment = {
            id: 'comment-1',
            title: 'Bob',
            date: '2026-08-01',
            content: 'Please revise',
            user: { id: 'bob', name: 'Bob' }
        }
        const annotation = makeAnnotation([reply])
        const painter = createPainter(events)
        useAnnotationStore.getState().addAnnotation(annotation)

        painter.deleteComment(annotation.id, reply.id)
        painter.update(annotation.id, { title: 'Edited after deletion' })
        painter.undoDelete()

        expect(painter.getData()[0]).toEqual(expect.objectContaining({
            title: 'Edited after deletion',
            comments: [reply]
        }))
    })

    it('drops the recovery snapshot after the timeout without changing data again', () => {
        jest.useFakeTimers()
        const events: string[] = []
        const annotation = makeAnnotation()
        const painter = createPainter(events)
        useAnnotationStore.getState().addAnnotation(annotation)

        painter.delete(annotation.id, true)
        jest.advanceTimersByTime(DELETE_UNDO_DURATION_MS)

        expect(painter.getDeleteUndoSnapshot()).toBeNull()
        expect(painter.undoDelete()).toBe(0)
        expect(painter.getData()).toEqual([])
        expect(events).toEqual([`deleted:${annotation.id}`])
    })

    it('does not overwrite an annotation that reused the deleted id', () => {
        const events: string[] = []
        const annotation = makeAnnotation()
        const replacement = { ...makeAnnotation(), title: 'Replacement' }
        const painter = createPainter(events)
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
        useAnnotationStore.getState().addAnnotation(annotation)

        painter.delete(annotation.id, true)
        useAnnotationStore.getState().addAnnotation(replacement)

        expect(painter.undoDelete()).toBe(0)
        expect(painter.getData()).toEqual([replacement])
        expect(events).toEqual([`deleted:${annotation.id}`])
        warning.mockRestore()
    })
})
