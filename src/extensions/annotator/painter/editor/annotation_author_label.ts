import { IRect } from 'konva/lib/types'

import type { IAnnotationStore } from '../../const/definitions'
import { isValidReferenceNumber } from '../../references/annotation_numbering'

export const ANNOTATION_AUTHOR_LABEL_MAX_WIDTH = 160
export const ANNOTATION_AUTHOR_LABEL_GAP = 4

export interface AnnotationAuthorLabelPlacement {
    id: string
    x: number
    y: number
    width: number
    height: number
}

export function getAnnotationAuthorName(
    annotation: Pick<IAnnotationStore, 'user' | 'title'>
): string | null {
    const userName = annotation.user?.name?.trim()
    if (userName) return userName

    const title = annotation.title?.trim()
    return title || null
}

export function getAnnotationAuthorLabelText(
    annotation: Pick<IAnnotationStore, 'user' | 'title' | 'referenceNumber'>
): string | null {
    const authorName = getAnnotationAuthorName(annotation)
    const hasReferenceNumber = isValidReferenceNumber(annotation.referenceNumber)

    if (hasReferenceNumber && authorName) return `#${annotation.referenceNumber} · ${authorName}`
    if (hasReferenceNumber) return `#${annotation.referenceNumber}`
    return authorName
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

function placementsOverlap(
    first: AnnotationAuthorLabelPlacement,
    second: AnnotationAuthorLabelPlacement,
    gap: number
): boolean {
    return first.x < second.x + second.width + gap
        && first.x + first.width + gap > second.x
        && first.y < second.y + second.height + gap
        && first.y + first.height + gap > second.y
}

/**
 * Keeps simultaneously visible labels readable while preserving their preferred
 * anchor whenever possible. Candidates alternate below and above the anchor so
 * dense labels do not all drift in one direction.
 */
export function resolveAnnotationAuthorLabelCollisions(
    placements: AnnotationAuthorLabelPlacement[],
    stageHeight: number,
    gap = ANNOTATION_AUTHOR_LABEL_GAP
): Map<string, { x: number; y: number }> {
    const resolved = new Map<string, { x: number; y: number }>()
    const occupied: AnnotationAuthorLabelPlacement[] = []
    const sorted = [...placements].sort(
        (first, second) => first.y - second.y || first.x - second.x || first.id.localeCompare(second.id)
    )

    sorted.forEach((placement) => {
        const maxY = Math.max(0, stageHeight - placement.height)
        const step = Math.max(1, placement.height + gap)
        const maxSteps = Math.ceil(stageHeight / step) + 1
        let selected = { ...placement, y: Math.max(0, Math.min(maxY, placement.y)) }

        for (let index = 0; index <= maxSteps; index += 1) {
            const offsets = index === 0 ? [0] : [index * step, -index * step]
            const candidate = offsets
                .map((offset) => ({ ...placement, y: placement.y + offset }))
                .find((item) => (
                    item.y >= 0
                    && item.y <= maxY
                    && occupied.every((other) => !placementsOverlap(item, other, gap))
                ))
            if (candidate) {
                selected = candidate
                break
            }
        }

        occupied.push(selected)
        resolved.set(selected.id, { x: selected.x, y: selected.y })
    })

    return resolved
}
