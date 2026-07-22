import { IAnnotationStore, PdfjsAnnotationType } from '../../const/definitions'
import { CircleDecoder } from './decoder_circle'
import { Decoder, type IDecoderOptions, type InkLayerAnnotationMetadata } from './decoder'
import { FreeTextDecoder } from './decoder_free_text'
import { HighlightDecoder } from './decoder_highlight'
import { SquareDecoder } from './decoder_square'
import { InkDecoder } from './decoder_ink'
import { LineDecoder } from './decoder_line'
import { PolygonDecoder } from './decoder_polygon'
import { PolylineDecoder } from './decoder_polyline'
import { TextDecoder } from './decoder_text'
import { CloudDecoder } from './decoder_cloud'
import { ArrowDecoder } from './decoder_arrow'
import { InkLayerFreeTextDecoder } from './decoder_inklayer_freetext'
import { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { Annotation } from 'pdfjs'
import {
    PDFArray,
    PDFDict,
    PDFDocument,
    PDFHexString,
    PDFName,
    PDFNumber,
    PDFRef,
    PDFString
} from 'pdf-lib'

const PDFJS_INTERNAL_EDITOR_PREFIX = 'pdfjs_internal_editor_'

export class Transform {
    private pdfViewerApplication: PDFViewer

    constructor(pdfViewerApplication: PDFViewer) {
        this.pdfViewerApplication = pdfViewerApplication
    }

    private async getAnnotations(): Promise<Annotation[]> {
        const pdfDocument = this.pdfViewerApplication.pdfDocument
        const pdfViewer = this.pdfViewerApplication
        const numPages = pdfDocument!.numPages
        const annotationsPromises = Array.from({ length: numPages }, (_, i) =>
            pdfDocument!.getPage(i + 1).then(page => {
                const _pageViewer = pdfViewer.getPageView(i)
                return page.getAnnotations().then(annotations =>
                    annotations.map(annotation => ({
                        ...annotation,
                        pageNumber: i + 1,
                        pageViewer: _pageViewer
                    }))
                )
            })
        )

        const nestedAnnotations = await Promise.all(annotationsPromises)
        return nestedAnnotations.flat()
    }

    private async getInkLayerAnnotationMetadata(): Promise<Map<string, InkLayerAnnotationMetadata>> {
        const result = new Map<string, InkLayerAnnotationMetadata>()
        const pdfDocument = this.pdfViewerApplication.pdfDocument
        if (!pdfDocument) return result

        try {
            const document = await PDFDocument.load(await pdfDocument.getData())
            document.getPages().forEach((page) => {
                const annotations = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray)
                annotations?.asArray().forEach((reference) => {
                    const dictionary = document.context.lookupMaybe(reference, PDFDict)
                    const subtype = dictionary?.get(PDFName.of('Subtype'))?.toString()
                    const borderEffect = dictionary?.lookupMaybe(PDFName.of('BE'), PDFDict)
                    const isCloudyPolygon = subtype === '/Polygon' && (
                        borderEffect?.get(PDFName.of('S'))?.toString() === '/C' ||
                        dictionary?.get(PDFName.of('IT'))?.toString() === '/PolygonCloud'
                    )
                    const inkLayerType = dictionary?.get(PDFName.of('InkLayerType'))?.toString().slice(1)
                    const isSupportedMarker = (
                        (inkLayerType === 'Cloud' && subtype === '/Ink') ||
                        (inkLayerType === 'FreeText' && subtype === '/Text') ||
                        (inkLayerType === 'Arrow' && subtype === '/Ink')
                    )
                    if (!isCloudyPolygon && !isSupportedMarker) return

                    const nameObject = dictionary?.get(PDFName.of('NM'))
                    const name = nameObject ? document.context.lookup(nameObject) : undefined
                    const id = name instanceof PDFString || name instanceof PDFHexString
                        ? name.decodeText()
                        : reference instanceof PDFRef ? `${reference.objectNumber}R` : undefined
                    if (!id) return
                    const type = isCloudyPolygon ? 'Cloud' : inkLayerType
                    if (type !== 'Cloud' && type !== 'FreeText' && type !== 'Arrow') return
                    const fontSize = dictionary?.lookupMaybe(PDFName.of('InkLayerFontSize'), PDFNumber)?.asNumber()
                    const textWidth = dictionary?.lookupMaybe(PDFName.of('InkLayerTextWidth'), PDFNumber)?.asNumber()
                    const opacity = dictionary?.lookupMaybe(PDFName.of('CA'), PDFNumber)?.asNumber()
                    result.set(id, { type, fontSize, textWidth, opacity })
                })
            })
        } catch (error) {
            console.warn('InkLayer could not inspect PDF annotation metadata.', error)
        }
        return result
    }

    private decodeAnnotation(
        annotation: Annotation,
        allAnnotations: Annotation[],
        inkLayerMetadata: Map<string, InkLayerAnnotationMetadata>
    ): IAnnotationStore | null {
        const decoderMap: { [key: string]: new (options: IDecoderOptions) => Decoder } = {
            [PdfjsAnnotationType.CIRCLE]: CircleDecoder,
            [PdfjsAnnotationType.FREETEXT]: FreeTextDecoder,
            [PdfjsAnnotationType.HIGHLIGHT]: HighlightDecoder,
            [PdfjsAnnotationType.UNDERLINE]: HighlightDecoder,
            [PdfjsAnnotationType.STRIKEOUT]: HighlightDecoder,
            [PdfjsAnnotationType.SQUARE]: SquareDecoder,
            [PdfjsAnnotationType.INK]: InkDecoder,
            [PdfjsAnnotationType.LINE]: LineDecoder,
            [PdfjsAnnotationType.POLYGON]: PolygonDecoder,
            [PdfjsAnnotationType.POLYLINE]: PolylineDecoder,
            [PdfjsAnnotationType.TEXT]: TextDecoder
        }
        const metadata = inkLayerMetadata.get(annotation.id)
        let DecoderClass: new (options: IDecoderOptions) => Decoder = decoderMap[annotation.annotationType]
        if (metadata?.type === 'Cloud' && (
            annotation.annotationType === PdfjsAnnotationType.POLYGON ||
            annotation.annotationType === PdfjsAnnotationType.INK
        )) DecoderClass = CloudDecoder
        if (metadata?.type === 'FreeText' && annotation.annotationType === PdfjsAnnotationType.TEXT) {
            DecoderClass = InkLayerFreeTextDecoder
        }
        if (metadata?.type === 'Arrow' && annotation.annotationType === PdfjsAnnotationType.INK) {
            DecoderClass = ArrowDecoder
        }
        if (DecoderClass) {
            const decoder = new DecoderClass({
                pdfViewerApplication: this.pdfViewerApplication,
                id: annotation.id,
                inkLayerMetadata: metadata
            })
            return decoder.decodePdfAnnotation(annotation, allAnnotations)
        }
        return null // 不支持的类型返回 null
    }

    /**
     * 在 pdf store 中 清除原有 pdf 注释
     * @param annotation
     */
    private cleanAnnotationStore(annotation: Annotation) {
        this.pdfViewerApplication?.pdfDocument?.annotationStorage?.setValue(`${PDFJS_INTERNAL_EDITOR_PREFIX}${annotation.id}`, {
            deleted: true,
            id: annotation.id,
            pageIndex: annotation.pageNumber - 1
        })
    }

    public async decodePdfAnnotation(): Promise<Map<string, IAnnotationStore>> {
        const [allAnnotations, inkLayerMetadata] = await Promise.all([
            this.getAnnotations(),
            this.getInkLayerAnnotationMetadata()
        ])
        const annotationStoreMap = new Map<string, IAnnotationStore>()
        allAnnotations.forEach(annotation => {
            this.cleanAnnotationStore(annotation)
            const decodedAnnotation = this.decodeAnnotation(annotation, allAnnotations, inkLayerMetadata)
            if (decodedAnnotation) {
                annotationStoreMap.set(annotation.id, decodedAnnotation)
            }
        })

        return annotationStoreMap
    }
}
