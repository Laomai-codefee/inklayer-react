import { AnnotationParser } from './parse'
import { PDFName, PDFString, PDFNumber } from 'pdf-lib'
import { convertKonvaRectToPdfRect, rgbToPdfColor, stringToPDFHexString } from '../../utils/utils'
import { t } from 'i18next'
import { convertKonvaPointToPdf, transformPointByGroup } from './geometry'

function buildArrowHeadPoints(x1: number, y1: number, x2: number, y2: number, pointerLength = 10, pointerWidth = 10): number[] {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1

    const ux = dx / len
    const uy = dy / len

    const px = -uy
    const py = ux

    const leftX = x2 - ux * pointerLength + px * (pointerWidth / 2)
    const leftY = y2 - uy * pointerLength + py * (pointerWidth / 2)

    const rightX = x2 - ux * pointerLength - px * (pointerWidth / 2)
    const rightY = y2 - uy * pointerLength - py * (pointerWidth / 2)

    return [x2, y2, leftX, leftY, rightX, rightY, x2, y2]
}

export class LineParser extends AnnotationParser {
    async parse() {
        const { annotation, page, pdfDoc, pageView } = this
        const context = pdfDoc.context
        const konvaGroup = JSON.parse(annotation.konvaString)
        const lines = konvaGroup.children.filter((item: { className?: string }) => item.className === 'Arrow')
        if (lines.length === 0) throw new Error(`Arrow annotation ${annotation.id} has no arrow shape.`)

        const inkList = context.obj(
            lines.map((line: { attrs: Record<string, unknown> }) => {
                const points = line.attrs.points as number[]
                if (!points || points.length < 4) {
                    throw new Error(`Arrow annotation ${annotation.id} needs at least two points.`)
                }
                const transformedPoints: number[] = []

                for (let i = 0; i < points.length; i += 2) {
                    const transformed = transformPointByGroup({ x: points[i], y: points[i + 1] }, konvaGroup)
                    const [pdfX, pdfY] = convertKonvaPointToPdf(transformed, pageView)
                    transformedPoints.push(pdfX, pdfY)
                }

                const length = points.length
                const head = buildArrowHeadPoints(
                    points[length - 4],
                    points[length - 3],
                    points[length - 2],
                    points[length - 1],
                    typeof line.attrs.pointerLength === 'number' ? line.attrs.pointerLength : 10,
                    typeof line.attrs.pointerWidth === 'number' ? line.attrs.pointerWidth : 10
                )
                for (let i = 0; i < head.length; i += 2) {
                    const transformed = transformPointByGroup({ x: head[i], y: head[i + 1] }, konvaGroup)
                    const [pdfX, pdfY] = convertKonvaPointToPdf(transformed, pageView)
                    transformedPoints.push(pdfX, pdfY)
                }

                return context.obj(transformedPoints)
            })
        )

        const firstLine = lines[0]?.attrs || {}
        const strokeWidth = firstLine.strokeWidth ?? 1
        const opacity = firstLine.opacity ?? 1
        const color = firstLine.stroke ?? annotation.color ?? 'rgb(255, 0, 0)'
        const [r, g, b] = rgbToPdfColor(color)

        const bs = context.obj({
            W: PDFNumber.of(strokeWidth),
            S: PDFName.of('S') // Solid border style
        })

        const mainAnn = context.obj({
            Type: PDFName.of('Annot'),
            // Ink is intentional: the sampled arrowhead renders consistently in PDF viewers.
            Subtype: PDFName.of('Ink'),
            InkLayerType: PDFName.of('Arrow'),
            Rect: convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView),
            InkList: inkList,
            C: context.obj([PDFNumber.of(r), PDFNumber.of(g), PDFNumber.of(b)]),
            T: stringToPDFHexString(annotation.title || t('normal.unknownUser')),
            Contents: stringToPDFHexString(annotation.contentsObj?.text || ''),
            M: PDFString.of(annotation.date || ''),
            NM: PDFString.of(annotation.id),
            BS: bs,
            F: PDFNumber.of(4),
            P: page.ref,
            CA: PDFNumber.of(opacity) // Constant opacity for the Ink stroke.
        })

        const mainAnnRef = context.register(mainAnn)
        this.addAnnotationToPage(page, mainAnnRef)

        for (const comment of annotation.comments || []) {
            const replyAnn = context.obj({
                Type: PDFName.of('Annot'),
                Subtype: PDFName.of('Text'),
                Rect: convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView),
                Contents: stringToPDFHexString(comment.content),
                T: stringToPDFHexString(comment.title || t('normal.unknownUser')),
                M: PDFString.of(comment.date || ''),
                C: context.obj([PDFNumber.of(r), PDFNumber.of(g), PDFNumber.of(b)]),
                IRT: mainAnnRef,
                RT: PDFName.of('R'),
                NM: PDFString.of(comment.id),
                Open: false
            })
            const replyAnnRef = context.register(replyAnn)
            this.addAnnotationToPage(page, replyAnnRef)
        }
    }
}
