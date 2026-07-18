import { AnnotationPermissionController } from '../permission_controller'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationComment,
    type IAnnotationStore
} from '../../const/definitions'
import type { AnnotationPermissionAction, AnnotationPermissions } from '../../types/annotator'
import type { User } from '@/types'

const alice: User = { id: 'alice', name: 'Alice' }
const bob: User = { id: 'bob', name: 'Bob' }

function makeAnnotation(user: User = alice): IAnnotationStore {
    return {
        id: 'annotation-1',
        pageNumber: 1,
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
        title: user.name,
        type: AnnotationType.RECTANGLE,
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        comments: [],
        user,
        native: false
    }
}

function makeComment(user?: User): IAnnotationComment {
    return { id: 'comment-1', title: user?.name ?? 'Legacy', date: null, content: 'Review', user }
}

function createController(
    currentUser: User | null,
    permissions?: AnnotationPermissions
) {
    return new AnnotationPermissionController({
        getCurrentUser: () => currentUser,
        getPermissions: () => permissions
    })
}

describe('AnnotationPermissionController', () => {
    const actions: AnnotationPermissionAction[] = [
        'annotation.create',
        'annotation.transform',
        'annotation.edit',
        'annotation.delete',
        'annotation.comment',
        'annotation.change-status',
        'comment.edit',
        'comment.delete'
    ]

    it('keeps every action unrestricted by default', () => {
        const controller = createController(null)
        const annotation = makeAnnotation()
        const comment = makeComment()

        actions.forEach(action => {
            expect(controller.can(action, annotation, comment)).toBe(true)
        })
    })

    it('allows an owner to mutate their annotation and comment', () => {
        const controller = createController(alice, { mode: 'owner-only' })
        const annotation = makeAnnotation(alice)
        const comment = makeComment(alice)

        actions.forEach(action => {
            expect(controller.can(action, annotation, comment)).toBe(true)
        })
    })

    it('lets another authenticated user comment but not mutate', () => {
        const controller = createController(bob, { mode: 'owner-only' })
        const annotation = makeAnnotation(alice)
        const comment = makeComment(alice)

        expect(controller.can('annotation.create', annotation)).toBe(true)
        expect(controller.can('annotation.comment', annotation)).toBe(true)
        expect(controller.can('annotation.transform', annotation)).toBe(false)
        expect(controller.can('annotation.edit', annotation)).toBe(false)
        expect(controller.can('annotation.delete', annotation)).toBe(false)
        expect(controller.can('annotation.change-status', annotation)).toBe(false)
        expect(controller.can('comment.edit', annotation, comment)).toBe(false)
        expect(controller.can('comment.delete', annotation, comment)).toBe(false)
    })

    it('keeps legacy comments without a stable author read-only', () => {
        const controller = createController(alice, { mode: 'owner-only' })
        const comment = makeComment()

        expect(controller.can('comment.edit', makeAnnotation(), comment)).toBe(false)
        expect(controller.can('comment.delete', makeAnnotation(), comment)).toBe(false)
    })

    it('makes an unauthenticated owner-only viewer read-only', () => {
        const controller = createController(null, { mode: 'owner-only' })
        const annotation = makeAnnotation()

        actions.forEach(action => {
            expect(controller.can(action, annotation, makeComment(alice))).toBe(false)
        })
    })

    it('supports partial custom overrides', () => {
        const can = jest.fn(({ action }) => action === 'annotation.delete' ? true : undefined)
        const controller = createController(bob, { mode: 'owner-only', can })
        const annotation = makeAnnotation(alice)

        expect(controller.can('annotation.delete', annotation)).toBe(true)
        expect(controller.can('annotation.transform', annotation)).toBe(false)
        expect(can).toHaveBeenCalledWith(expect.objectContaining({
            currentUser: bob,
            defaultAllowed: false,
            annotation: expect.objectContaining({ id: annotation.id })
        }))
    })

    it('denies and reports a failing resolver only once', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const can = jest.fn(() => { throw new Error('resolver failed') })
        const controller = createController(alice, { mode: 'owner-only', can })

        expect(controller.can('annotation.edit', makeAnnotation(alice))).toBe(false)
        expect(controller.can('annotation.edit', makeAnnotation(alice))).toBe(false)
        expect(errorSpy).toHaveBeenCalledTimes(1)
        errorSpy.mockRestore()
    })
})
