import { PDFArray, PDFDocument, PDFName, PDFPage, PDFRef } from 'pdf-lib'
import { IAnnotationStore } from '../../const/definitions'
import { PDFPageView } from 'pdfjs-dist/types/web/pdf_page_view'

export interface SerializedKonvaAttributes {
    x?: number
    y?: number
    scaleX?: number
    scaleY?: number
    offsetX?: number
    offsetY?: number
    rotation?: number
    width?: number
    height?: number
    strokeWidth?: number
    dash?: number[]
    opacity?: number
    stroke?: string
    points?: number[]
    data?: string
    [key: string]: unknown
}

export interface SerializedKonvaNode {
    className?: string
    attrs?: SerializedKonvaAttributes
    children?: SerializedKonvaNode[]
}

export function parseSerializedKonvaNode(serialized: string): SerializedKonvaNode {
    const value: unknown = JSON.parse(serialized)
    if (!value || typeof value !== 'object') {
        throw new Error('Invalid serialized Konva node')
    }
    return value as SerializedKonvaNode
}

export abstract class AnnotationParser {
    protected annotation: IAnnotationStore
    protected page: PDFPage
    protected pdfDoc: PDFDocument

    protected pageView: PDFPageView

    constructor(pdfDoc: PDFDocument, page: PDFPage, annotation: IAnnotationStore, pageView: PDFPageView) {
        this.pdfDoc = pdfDoc
        this.page = page
        this.annotation = annotation
        this.pageView = pageView
    }

    protected addAnnotationToPage(page: PDFPage, annotRef: PDFRef) {
        const annots = page.node.lookup(PDFName.of('Annots')) as PDFArray | undefined
        if (annots) {
            annots.push(annotRef)
        } else {
            page.node.set(PDFName.of('Annots'), page.doc.context.obj([annotRef]))
        }
    }

    protected extractGroupTransform(konvaGroup: SerializedKonvaNode): { groupX: number; groupY: number; scaleX: number; scaleY: number } {
        const attrs = konvaGroup.attrs ?? {}
        return {
            groupX: attrs.x || 0,
            groupY: attrs.y || 0,
            scaleX: attrs.scaleX || 1,
            scaleY: attrs.scaleY || 1
        }
    }

    abstract parse(): Promise<void>
}
