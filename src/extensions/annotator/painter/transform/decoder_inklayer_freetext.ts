import type { Annotation, TextAnnotation } from 'pdfjs'
import Konva from 'konva'

import { AnnotationType, PdfjsAnnotationType, type IAnnotationStore } from '../../const/definitions'
import { convertToRGB } from '../../utils/utils'
import { SHAPE_GROUP_NAME } from '../const'
import { Decoder, type IDecoderOptions } from './decoder'

export class InkLayerFreeTextDecoder extends Decoder {
    constructor(options: IDecoderOptions) {
        super(options)
    }

    public decodePdfAnnotation(annotation: TextAnnotation, allAnnotations: Annotation[]): IAnnotationStore {
        const color = convertToRGB(annotation.color || [0, 0, 0])
        const { x, y } = this.convertRect(
            annotation.rect,
            annotation.pageViewer.viewport.scale,
            annotation.pageViewer.viewport.height
        )
        const group = new Konva.Group({ draggable: false, name: SHAPE_GROUP_NAME, id: annotation.id })
        group.add(new Konva.Text({
            x,
            y,
            text: annotation.contentsObj.str,
            width: this.inkLayerMetadata?.textWidth,
            fontSize: this.inkLayerMetadata?.fontSize ?? 14,
            fill: color,
            opacity: this.inkLayerMetadata?.opacity ?? 1,
            wrap: 'word'
        }))
        const store: IAnnotationStore = {
            id: annotation.id,
            pageNumber: annotation.pageNumber,
            konvaString: group.toJSON(),
            konvaClientRect: group.getClientRect(),
            title: annotation.titleObj.str,
            type: AnnotationType.FREETEXT,
            color,
            pdfjsType: PdfjsAnnotationType.FREETEXT,
            subtype: 'FreeText',
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
