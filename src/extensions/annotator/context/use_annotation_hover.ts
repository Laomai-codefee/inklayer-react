import { useCallback, useSyncExternalStore } from 'react'

import { usePainter } from './use_painter'

export function useAnnotationHoveredId(): string | null {
    const { painter } = usePainter()
    const subscribe = useCallback(
        (listener: () => void) => painter?.subscribeAnnotationHover(listener) ?? (() => {}),
        [painter]
    )
    const getSnapshot = useCallback(
        () => painter?.getAnnotationHoverSnapshot().annotationId ?? null,
        [painter]
    )

    return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
