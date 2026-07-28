import { useCallback, useSyncExternalStore } from 'react'

import { usePainter } from './use_painter'
import type { AnnotationHoverSnapshot } from '../painter/annotation_hover'

const EMPTY_ANNOTATION_HOVER: AnnotationHoverSnapshot = Object.freeze({
    annotationId: null,
    source: null
})

export function useAnnotationHoverSnapshot(): AnnotationHoverSnapshot {
    const { painter } = usePainter()
    const subscribe = useCallback(
        (listener: () => void) => painter?.subscribeAnnotationHover(listener) ?? (() => {}),
        [painter]
    )
    const getSnapshot = useCallback(
        () => painter?.getAnnotationHoverSnapshot() ?? EMPTY_ANNOTATION_HOVER,
        [painter]
    )

    return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ANNOTATION_HOVER)
}

export function useAnnotationHoveredId(): string | null {
    return useAnnotationHoverSnapshot().annotationId
}
