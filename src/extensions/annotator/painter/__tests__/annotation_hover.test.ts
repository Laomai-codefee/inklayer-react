import { AnnotationHoverCoordinator } from '../annotation_hover'

describe('AnnotationHoverCoordinator', () => {
    it('keeps a stable snapshot and only notifies when the effective target changes', () => {
        const coordinator = new AnnotationHoverCoordinator()
        const listener = jest.fn()
        const initialSnapshot = coordinator.getSnapshot()
        coordinator.subscribe(listener)

        coordinator.set('sidebar-pointer', 'annotation-1')
        const activeSnapshot = coordinator.getSnapshot()
        coordinator.set('sidebar-pointer', 'annotation-1')

        expect(initialSnapshot).toEqual({ annotationId: null, source: null })
        expect(activeSnapshot).toEqual({
            annotationId: 'annotation-1',
            source: 'sidebar-pointer'
        })
        expect(coordinator.getSnapshot()).toBe(activeSnapshot)
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('restores the previous active source when a newer source leaves', () => {
        const coordinator = new AnnotationHoverCoordinator()

        coordinator.set('sidebar-focus', 'annotation-1')
        coordinator.set('canvas', 'annotation-2')
        expect(coordinator.getSnapshot()).toEqual({
            annotationId: 'annotation-2',
            source: 'canvas'
        })

        coordinator.clear('canvas', 'annotation-2')
        expect(coordinator.getSnapshot()).toEqual({
            annotationId: 'annotation-1',
            source: 'sidebar-focus'
        })
    })

    it('publishes source changes for the same annotation', () => {
        const coordinator = new AnnotationHoverCoordinator()
        const listener = jest.fn()
        coordinator.subscribe(listener)

        coordinator.set('canvas-passive', 'annotation-1')
        coordinator.set('sidebar-pointer', 'annotation-1')
        coordinator.clear('sidebar-pointer', 'annotation-1')

        expect(coordinator.getSnapshot()).toEqual({
            annotationId: 'annotation-1',
            source: 'canvas-passive'
        })
        expect(listener.mock.calls.map(([snapshot]) => snapshot.source)).toEqual([
            'canvas-passive',
            'sidebar-pointer',
            'canvas-passive'
        ])
    })

    it('does not let a stale leave event clear a newer annotation from the same source', () => {
        const coordinator = new AnnotationHoverCoordinator()

        coordinator.set('sidebar-pointer', 'annotation-1')
        coordinator.set('sidebar-pointer', 'annotation-2')
        coordinator.clear('sidebar-pointer', 'annotation-1')

        expect(coordinator.getSnapshot()).toEqual({
            annotationId: 'annotation-2',
            source: 'sidebar-pointer'
        })
    })

    it('clears every source for a deleted annotation without disturbing other targets', () => {
        const coordinator = new AnnotationHoverCoordinator()

        coordinator.set('sidebar-focus', 'annotation-2')
        coordinator.set('sidebar-pointer', 'annotation-1')
        coordinator.set('canvas', 'annotation-1')
        coordinator.clearAnnotation('annotation-1')

        expect(coordinator.getSnapshot()).toEqual({
            annotationId: 'annotation-2',
            source: 'sidebar-focus'
        })
    })

    it('publishes the empty snapshot before removing listeners on destroy', () => {
        const coordinator = new AnnotationHoverCoordinator()
        const listener = jest.fn()
        coordinator.subscribe(listener)
        coordinator.set('canvas', 'annotation-1')

        coordinator.destroy()

        expect(coordinator.getSnapshot()).toEqual({ annotationId: null, source: null })
        expect(listener).toHaveBeenLastCalledWith({ annotationId: null, source: null })
        expect(listener).toHaveBeenCalledTimes(2)

        coordinator.set('canvas', 'annotation-2')
        expect(coordinator.getSnapshot()).toEqual({ annotationId: null, source: null })
        expect(listener).toHaveBeenCalledTimes(2)
    })
})
