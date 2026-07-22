import type { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view'

interface SerializedKonvaNode {
    attrs?: Record<string, number | undefined>
}

export interface Point {
    x: number
    y: number
}

export function transformPointByGroup(point: Point, group: SerializedKonvaNode): Point {
    const attrs = group.attrs ?? {}
    const scaleX = attrs.scaleX ?? 1
    const scaleY = attrs.scaleY ?? 1
    const offsetX = attrs.offsetX ?? 0
    const offsetY = attrs.offsetY ?? 0
    const x = (point.x - offsetX) * scaleX
    const y = (point.y - offsetY) * scaleY
    const rotation = ((attrs.rotation ?? 0) * Math.PI) / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    return {
        x: (attrs.x ?? 0) + x * cos - y * sin,
        y: (attrs.y ?? 0) + x * sin + y * cos
    }
}

export function transformRectByGroup(
    rect: { x?: number; y?: number; width?: number; height?: number },
    group: SerializedKonvaNode
): { x: number; y: number; width: number; height: number } {
    const x = rect.x ?? 0
    const y = rect.y ?? 0
    const width = rect.width ?? 0
    const height = rect.height ?? 0
    const corners = [
        transformPointByGroup({ x, y }, group),
        transformPointByGroup({ x: x + width, y }, group),
        transformPointByGroup({ x, y: y + height }, group),
        transformPointByGroup({ x: x + width, y: y + height }, group)
    ]
    const xs = corners.map(point => point.x)
    const ys = corners.map(point => point.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function convertKonvaPointToPdf(point: Point, pageView: PDFPageView): [number, number] {
    const { viewport } = pageView
    return viewport.convertToPdfPoint(point.x * viewport.scale, point.y * viewport.scale) as [number, number]
}
