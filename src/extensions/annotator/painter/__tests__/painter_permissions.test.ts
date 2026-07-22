/** @jest-environment jsdom */

import { Painter } from '..'
import type { IAnnotationStore } from '../../const/definitions'
import { AnnotationPermissionController } from '../../permissions/permission_controller'
import type { AnnotationPermissions } from '../../types/annotator'
import type { User } from '@/types'

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
        selector: { delete: jest.fn(), clear: jest.fn(), select: jest.fn(), refreshCurrentSelection: jest.fn() },
        authorLabels: {
            refreshAnnotation: jest.fn(),
            refreshAll: jest.fn(),
            remove: jest.fn()
        },
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

function createCollaborativePainter(currentUser: User, permissions: AnnotationPermissions) {
    const painter = createPainter(false)
    Object.assign(painter as unknown as Record<string, unknown>, {
        currentUser,
        annotationPermissions: permissions
    })
    const permissionController = new AnnotationPermissionController({
        getCurrentUser: () => (painter as unknown as { currentUser: User }).currentUser,
        getPermissions: () => (painter as unknown as { annotationPermissions?: AnnotationPermissions }).annotationPermissions
    })
    Object.assign(painter as unknown as Record<string, unknown>, { permissionController })
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

    it('enforces the Alice, Bob, and admin collaboration flow through public mutations', () => {
        const ownerOnly = { mode: 'owner-only' as const }
        const alice = createCollaborativePainter({ id: 'alice', name: 'Alice' }, ownerOnly)
        const bob = createCollaborativePainter({ id: 'bob', name: 'Bob' }, ownerOnly)
        const admin = createCollaborativePainter(
            { id: 'admin', name: 'Admin' },
            {
                mode: 'owner-only',
                can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined
            }
        )

        expect(alice.update(annotation.id, { title: 'Alice edited' })).toBeDefined()
        expect(bob.update(annotation.id, { title: 'Bob edited' })).toBeUndefined()
        expect(bob.update(annotation.id, { comments: [] }, 'annotation.comment')).toBeDefined()
        expect(bob.delete(annotation.id, true)).toBe(false)
        expect(admin.update(annotation.id, { title: 'Admin edited' })).toBeDefined()
        expect(admin.delete(annotation.id, true)).toBe(true)
    })

    it('updates the active permission context without recreating the painter', () => {
        const painter = createCollaborativePainter(
            { id: 'alice', name: 'Alice' },
            { mode: 'owner-only' }
        )
        const editor = { setCurrentUser: jest.fn() }
        ;(painter as unknown as { editorStore: Map<string, typeof editor> }).editorStore.set('editor', editor)

        painter.setPermissionContext({ id: 'bob', name: 'Bob' }, { can: () => false })

        expect(painter.can('annotation.edit', annotation)).toBe(false)
        expect(editor.setCurrentUser).toHaveBeenCalledWith({ id: 'bob', name: 'Bob' })
        expect((painter as unknown as { selector: { refreshCurrentSelection: jest.Mock } }).selector.refreshCurrentSelection).toHaveBeenCalledTimes(1)
        expect((painter as unknown as { authorLabels: { refreshAll: jest.Mock } }).authorLabels.refreshAll).toHaveBeenCalledTimes(1)
    })

    it('keeps selection available when every mutation is read-only', () => {
        const painter = createCollaborativePainter(
            { id: 'bob', name: 'Bob' },
            { can: () => false }
        )
        const rectangle = { type: 3 } as Parameters<Painter['activate']>[0]

        painter.selectAnnotation(annotation.id, true)
        expect(painter.update(annotation.id, { title: 'Blocked' })).toBeUndefined()
        expect(painter.delete(annotation.id, true)).toBe(false)
        painter.activate(rectangle, null)
        painter.highlightRange(null, rectangle!)

        expect((painter as unknown as { selector: { select: jest.Mock } }).selector.select)
            .toHaveBeenCalledWith(annotation.id, true)
        expect(mockState.updateAnnotation).not.toHaveBeenCalled()
        expect(mockState.removeAnnotation).not.toHaveBeenCalled()
        expect((painter as unknown as { webSelection: { highlight: jest.Mock } }).webSelection.highlight).not.toHaveBeenCalled()
    })
})
