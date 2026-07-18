/** @jest-environment jsdom */

import { Painter } from '..'
import type { IAnnotationStore } from '../../const/definitions'

jest.mock('../../utils/utils', () => ({
    isElementInDOM: jest.fn(() => true),
    removeCssCustomProperty: jest.fn(),
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id')
}))

const annotation = {
    id: 'annotation-1',
    pageNumber: 1,
    type: 3,
    pdfjsType: 5,
    subtype: 'Square',
    title: 'Alice',
    date: '',
    user: { id: 'alice', name: 'Alice' },
    comments: [],
    konvaString: '{}',
    konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
    native: false
} as IAnnotationStore

const mockState = {
    getAnnotation: jest.fn(() => annotation),
    updateAnnotation: jest.fn((_id: string, updates: Partial<IAnnotationStore>) => ({ ...annotation, ...updates })),
    removeAnnotation: jest.fn(),
    setCurrentAnnotationType: jest.fn()
}

jest.mock('../../store', () => ({
    SelectionSource: { CANVAS: 'canvas', SIDEBAR: 'sidebar' },
    useAnnotationStore: { getState: () => mockState }
}))

function createPainter(can: boolean) {
    const painter = Object.create(Painter.prototype) as Painter
    Object.assign(painter as unknown as Record<string, unknown>, {
        permissionController: { can: jest.fn(() => can) },
        selector: { delete: jest.fn(), clear: jest.fn(), refreshCurrentSelection: jest.fn() },
        editorStore: new Map(),
        konvaCanvasStore: new Map(),
        onAnnotationChanged: jest.fn(),
        onAnnotationDelete: jest.fn(),
        webSelection: { highlight: jest.fn() },
        disablePainting: jest.fn(),
        setDefaultMode: jest.fn()
    })
    return painter
}

describe('Painter permission guards', () => {
    beforeEach(() => jest.clearAllMocks())

    it('does not update or emit when a programmatic update is denied', () => {
        const painter = createPainter(false)

        const result = painter.update(annotation.id, { title: 'Changed' })

        expect(result).toBeUndefined()
        expect(mockState.updateAnnotation).not.toHaveBeenCalled()
        expect((painter as unknown as { onAnnotationChanged: jest.Mock }).onAnnotationChanged).not.toHaveBeenCalled()
    })

    it('forwards comment metadata and emits only after an allowed update', () => {
        const painter = createPainter(true)
        const reply = { id: 'reply-1', title: 'Alice', date: '', content: 'Reply', user: annotation.user }

        const result = painter.update(annotation.id, { comments: [] }, 'comment.edit', reply)

        expect(result).toEqual(expect.objectContaining({ id: annotation.id, comments: [] }))
        expect((painter as unknown as { permissionController: { can: jest.Mock } }).permissionController.can)
            .toHaveBeenCalledWith('comment.edit', annotation, reply)
        expect((painter as unknown as { onAnnotationChanged: jest.Mock }).onAnnotationChanged).toHaveBeenCalledTimes(1)
    })

    it('does not delete, clear selection, or emit when deletion is denied', () => {
        const painter = createPainter(false)

        expect(painter.delete(annotation.id, true)).toBe(false)
        expect(mockState.removeAnnotation).not.toHaveBeenCalled()
        expect((painter as unknown as { selector: { delete: jest.Mock } }).selector.delete).not.toHaveBeenCalled()
        expect((painter as unknown as { onAnnotationDelete: jest.Mock }).onAnnotationDelete).not.toHaveBeenCalled()
    })

    it('blocks annotation tools and text highlighting when creation is denied', () => {
        const painter = createPainter(false)
        const rectangle = { type: 3 } as Parameters<Painter['activate']>[0]

        painter.activate(rectangle, null)
        painter.highlightRange(null, rectangle!)

        expect((painter as unknown as { disablePainting: jest.Mock }).disablePainting).toHaveBeenCalledTimes(1)
        expect((painter as unknown as { setDefaultMode: jest.Mock }).setDefaultMode).toHaveBeenCalledTimes(1)
        expect((painter as unknown as { webSelection: { highlight: jest.Mock } }).webSelection.highlight).not.toHaveBeenCalled()
    })
})
