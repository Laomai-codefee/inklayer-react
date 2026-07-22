import type { Annotation, InkAnnotation } from 'pdfjs'
import Konva from 'konva'

import { AnnotationType, PdfjsAnnotationType, type IAnnotationStore } from '../../const/definitions'
import { convertToRGB } from '../../utils/utils'
import { SHAPE_GROUP_NAME } from '../const'
import { Decoder, type IDecoderOptions } from './decoder'

function distance(first: { x: number; y: number }, second: { x: number; y: number }): number {
    return Math.hypot(second.x - first.x, second.y - first.y)
}

export class ArrowDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: InkAnnotation, allAnnotations: Annotation[]): IAnnotationStore | null {
        const source = annotation.inkLists?.[0] ?? []
        if (source.length < 2) return null
        const points = source.map(point => this.convertPoint(
            point,
            annotation.pageViewer.viewport.scale,
            annotation.pageViewer.viewport.height
        ))
        const start = points[0]
        const end = points[1]
        const headLeft = points[3]
        const headRight = points[4]
        const headBase = headLeft && headRight
            ? { x: (headLeft.x + headRight.x) / 2, y: (headLeft.y + headRight.y) / 2 }
            : undefined
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const group = new Konva.Group({ draggable: false, name: SHAPE_GROUP_NAME, id: annotation.id })
        group.add(new Konva.Arrow({
            points: [start.x, start.y, end.x, end.y],
            stroke: color,
            fill: color,
            strokeWidth: annotation.borderStyle.width || 1,
            opacity: this.inkLayerMetadata?.opacity ?? 1,
            pointerLength: headBase ? distance(end, headBase) : 10,
            pointerWidth: headLeft && headRight ? distance(headLeft, headRight) : 10,
            lineCap: 'round',
            lineJoin: 'round',
            hitStrokeWidth: 20,
            strokeScaleEnabled: false
        }))
        const store: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: group.toJSON(),
            konvaClientRect: group.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.ARROW,
            color,
            pdfjsType: PdfjsAnnotationType.LINE,
            subtype: 'Arrow',
            date: annotation.modificationDate,
            contentsObj: { text: annotation.contentsObj.str },
            comments: this.getComments(annotation, allAnnotations),
            user: { id: annotation.titleObj.str, name: annotation.titleObj.str },
            native: true
        }
        group.destroy()
        return store
    }
}
