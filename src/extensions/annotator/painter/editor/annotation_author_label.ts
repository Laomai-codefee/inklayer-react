import { IRect } from 'konva/lib/types'

import type { IAnnotationStore } from '../../const/definitions'

export const ANNOTATION_AUTHOR_LABEL_MAX_WIDTH = 160
export const ANNOTATION_AUTHOR_LABEL_GAP = 4

export function getAnnotationAuthorName(
    annotation: Pick<IAnnotationStore, 'user' | 'title'>
): string | null {
    const userName = annotation.user?.name?.trim()
    if (userName) return userName

    const title = annotation.title?.trim()
    return title || null
}

interface AnnotationAuthorLabelPositionOptions {
    selectionRect: IRect
    labelWidth: number
    labelHeight: number
    stageWidth: number
    stageHeight: number
    gap?: number
}

export function getAnnotationAuthorLabelPosition({
    selectionRect,
    labelWidth,
    labelHeight,
    stageWidth,
    stageHeight,
    gap = ANNOTATION_AUTHOR_LABEL_GAP
}: AnnotationAuthorLabelPositionOptions): { x: number; y: number } {
    const maxX = Math.max(0, stageWidth - labelWidth)
    const maxY = Math.max(0, stageHeight - labelHeight)
    const x = Math.max(0, Math.min(maxX, selectionRect.x + selectionRect.width - labelWidth))
    const preferredY = selectionRect.y - labelHeight - gap
    const fallbackY = selectionRect.y + selectionRect.height + gap
    const y = preferredY >= 0 ? preferredY : Math.max(0, Math.min(maxY, fallbackY))

    return { x, y }
}
