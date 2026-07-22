import type { Annotation, InkAnnotation, PolygonAnnotation, Vertices } from 'pdfjs'
import Konva from 'konva'

import { AnnotationType, type IAnnotationStore } from '../../const/definitions'
import { convertToRGB } from '../../utils/utils'
import { generateCloudPathData } from '../cloud_path'
import { SHAPE_GROUP_NAME } from '../const'
import { Decoder, type IDecoderOptions } from './decoder'

export class CloudDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: PolygonAnnotation | InkAnnotation, allAnnotations: Annotation[]) {
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const sourcePoints = 'inkLists' in annotation
            ? annotation.inkLists?.[0] ?? []
            : annotation.vertices ?? []
        const points = sourcePoints.map((point: Vertices) =>
            this.convertPoint(
                point,
                annotation.pageViewer.viewport.scale,
                annotation.pageViewer.viewport.height
            )
        )
        if (points.length < 3) return null

        const group = new Konva.Group({
            draggable: false,
            name: SHAPE_GROUP_NAME,
            id: annotation.id
        })
        const pathData = 'inkLists' in annotation
            ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            : generateCloudPathData([...points, points[0]])
        const path = new Konva.Path({
            data: pathData,
            strokeScaleEnabled: false,
            stroke: color,
            strokeWidth: annotation.borderStyle.width === 1 ? 2 : annotation.borderStyle.width,
            opacity: this.inkLayerMetadata?.opacity ?? 1,
            fillEnabled: false,
            lineCap: 'round',
            lineJoin: 'round',
            hitStrokeWidth: 20
        })
        group.add(path)
        const annotationStore: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: group.toJSON(),
            konvaClientRect: group.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.CLOUD,
            color,
            pdfjsType: annotation.annotationType,
            subtype: 'PolyLine',
            date: annotation.modificationDate,
            contentsObj: { text: annotation.contentsObj.str },
            comments: this.getComments(annotation, allAnnotations),
            user: {
                id: annotation.titleObj.str,
                name: annotation.titleObj.str
            },
            native: true
        }

        group.destroy()
        return annotationStore
    }
}
