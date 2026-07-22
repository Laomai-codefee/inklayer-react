import { PDFName, PDFNumber, PDFString } from 'pdf-lib'
import { t } from 'i18next'

import { AnnotationParser } from './parse'
import { convertKonvaRectToPdfRect, rgbToPdfColor, stringToPDFHexString } from '../../utils/utils'
import { convertKonvaPointToPdf, type Point, transformPointByGroup } from './geometry'

interface PathCommand {
    type: string
    values: number[]
}

function parsePathCommands(data: string): PathCommand[] {
    const commands = data.match(/[a-zA-Z][^a-zA-Z]*/g) ?? []
    return commands.map(command => ({
        type: command[0].toUpperCase(),
        values: command
            .slice(1)
            .trim()
            .split(/[\s,]+/)
            .filter(Boolean)
            .map(Number)
    }))
}

function quadraticPoint(start: Point, control: Point, end: Point, ratio: number): Point {
    const inverse = 1 - ratio
    return {
        x: inverse * inverse * start.x + 2 * inverse * ratio * control.x + ratio * ratio * end.x,
        y: inverse * inverse * start.y + 2 * inverse * ratio * control.y + ratio * ratio * end.y
    }
}

function cubicPoint(start: Point, first: Point, second: Point, end: Point, ratio: number): Point {
    const inverse = 1 - ratio
    return {
        x: inverse ** 3 * start.x + 3 * inverse ** 2 * ratio * first.x +
            3 * inverse * ratio ** 2 * second.x + ratio ** 3 * end.x,
        y: inverse ** 3 * start.y + 3 * inverse ** 2 * ratio * first.y +
            3 * inverse * ratio ** 2 * second.y + ratio ** 3 * end.y
    }
}

function sampleCloudPath(commands: PathCommand[]): Point[] {
    const points: Point[] = []
    let current: Point | null = null

    commands.forEach(command => {
        if (command.type === 'M' && command.values.length >= 2) {
            current = { x: command.values[0], y: command.values[1] }
            points.push(current)
            return
        }
        if (command.type === 'L' && command.values.length >= 2) {
            current = { x: command.values[0], y: command.values[1] }
            points.push(current)
            return
        }
        if (command.type === 'Q' && current && command.values.length >= 4) {
            const start = current
            const control = { x: command.values[0], y: command.values[1] }
            const end = { x: command.values[2], y: command.values[3] }
            for (let segment = 1; segment <= 12; segment++) {
                points.push(quadraticPoint(start, control, end, segment / 12))
            }
            current = end
            return
        }
        if (command.type === 'C' && current && command.values.length >= 6) {
            const start = current
            const first = { x: command.values[0], y: command.values[1] }
            const second = { x: command.values[2], y: command.values[3] }
            const end = { x: command.values[4], y: command.values[5] }
            for (let segment = 1; segment <= 16; segment++) {
                points.push(cubicPoint(start, first, second, end, segment / 16))
            }
            current = end
        }
    })
    return points
}

export class CloudParser extends AnnotationParser {
    async parse() {
        const { annotation, page, pdfDoc, pageView } = this
        const context = pdfDoc.context
        const konvaGroup = JSON.parse(annotation.konvaString)
        const path = konvaGroup.children?.find((child: { className?: string }) => child.className === 'Path')
        if (!path?.attrs?.data) throw new Error(`Cloud annotation ${annotation.id} has no path data.`)

        const points = sampleCloudPath(parsePathCommands(path.attrs.data))
        if (points.length < 2) throw new Error(`Cloud annotation ${annotation.id} needs at least two points.`)
        const inkPoints = points.flatMap(point => {
            const transformed = transformPointByGroup(point, konvaGroup)
            return convertKonvaPointToPdf(transformed, pageView)
        })

        const strokeWidth = path.attrs.strokeWidth ?? 2
        const opacity = path.attrs.opacity ?? 1
        const color = path.attrs.stroke ?? annotation.color ?? '#000000'
        const [red, green, blue] = rgbToPdfColor(color)
        const rect = convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView)
        // Ink is used intentionally: PDF viewers do not consistently render PolygonCloud
        // border effects, while an InkList preserves the exact cloud outline everywhere.
        const mainAnnotation = context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Ink'),
            InkLayerType: PDFName.of('Cloud'),
            Rect: rect,
            InkList: context.obj([inkPoints]),
            C: context.obj([red, green, blue]),
            T: stringToPDFHexString(annotation.title || t('normal.unknownUser')),
            Contents: stringToPDFHexString(annotation.contentsObj?.text || ''),
            M: PDFString.of(annotation.date || ''),
            NM: PDFString.of(annotation.id),
            Border: context.obj([0, 0, 0]),
            BS: context.obj({ W: strokeWidth, S: PDFName.of('S') }),
            F: PDFNumber.of(4),
            P: page.ref,
            CA: PDFNumber.of(opacity)
        })
        const mainAnnotationRef = context.register(mainAnnotation)
        this.addAnnotationToPage(page, mainAnnotationRef)

        for (const comment of annotation.comments || []) {
            const replyAnnotation = context.obj({
                Type: PDFName.of('Annot'),
                Subtype: PDFName.of('Text'),
                Rect: rect,
                Contents: stringToPDFHexString(comment.content),
                T: stringToPDFHexString(comment.title || t('normal.unknownUser')),
                M: PDFString.of(comment.date || ''),
                C: context.obj([red, green, blue]),
                IRT: mainAnnotationRef,
                RT: PDFName.of('R'),
                NM: PDFString.of(comment.id),
                Open: false
            })
            this.addAnnotationToPage(page, context.register(replyAnnotation))
        }
    }
}
