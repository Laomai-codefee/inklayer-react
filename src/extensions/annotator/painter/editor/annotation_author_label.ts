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

function parseColor(color: string): [number, number, number] | null {
    const normalized = color.trim().toLowerCase()
    const shortHex = normalized.match(/^#([0-9a-f]{3})$/i)
    if (shortHex) {
        return shortHex[1].split('').map((channel) => parseInt(channel + channel, 16)) as [number, number, number]
    }

    const hex = normalized.match(/^#([0-9a-f]{6})$/i)
    if (hex) {
        return [
            parseInt(hex[1].slice(0, 2), 16),
            parseInt(hex[1].slice(2, 4), 16),
            parseInt(hex[1].slice(4, 6), 16)
        ]
    }

    const rgb = normalized.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/)
    if (!rgb) return null

    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((channel) =>
        Math.max(0, Math.min(255, channel))
    ) as [number, number, number]
}

function getRelativeLuminance([red, green, blue]: [number, number, number]): number {
    const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })

    return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue
}

export function getReadableAuthorLabelTextColor(backgroundColor: string): '#ffffff' | '#111827' {
    const rgb = parseColor(backgroundColor)
    if (!rgb) return '#ffffff'

    const backgroundLuminance = getRelativeLuminance(rgb)
    const darkTextLuminance = getRelativeLuminance([17, 24, 39])
    const whiteContrast = 1.05 / (backgroundLuminance + 0.05)
    const darkContrast = (backgroundLuminance + 0.05) / (darkTextLuminance + 0.05)

    return darkContrast > whiteContrast ? '#111827' : '#ffffff'
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
