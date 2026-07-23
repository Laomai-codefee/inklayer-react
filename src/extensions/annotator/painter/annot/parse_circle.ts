import { AnnotationParser, parseSerializedKonvaNode } from './parse'
import { PDFName, PDFNumber, PDFString } from 'pdf-lib'
import { t } from 'i18next'
import { convertKonvaRectToPdfRect, rgbToPdfColor, stringToPDFHexString } from '../../utils/utils'

export class CircleParser extends AnnotationParser {
    async parse() {
        const { annotation, page, pdfDoc, pageView } = this
        const context = pdfDoc.context

        const konvaGroup = parseSerializedKonvaNode(annotation.konvaString)

        const konvaRect = konvaGroup.children?.find((child) => child.className === 'Ellipse')
        if (!konvaRect) throw new Error(`Annotation ${annotation.id} is missing its ellipse geometry.`)
        const attrs = konvaRect.attrs ?? {}

        const strokeWidth = attrs.strokeWidth ?? 2

        const dashArray = attrs.dash ?? []

        const opacity = attrs.opacity ?? 1

        const bsDict = {
            W: PDFNumber.of(strokeWidth),
            S: PDFName.of(dashArray.length > 0 ? 'D' : 'S'),
            ...(dashArray.length > 0 ? { D: context.obj(dashArray) } : {})
        }

        const rect = convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView)

        // 1️⃣ 主批注（圆形）
        const mainAnn = context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Circle'),
            Rect: rect,
            C: rgbToPdfColor(annotation.color || '#000000'),
            T: stringToPDFHexString(annotation.title || t('normal.unknownUser')),
            Contents: stringToPDFHexString(annotation.contentsObj?.text || ''),
            M: PDFString.of(annotation.date || ''),
            NM: PDFString.of(annotation.id),
            F: PDFNumber.of(4),
            P: page.ref,
            BS: context.obj(bsDict),
            CA: PDFNumber.of(opacity)
        })
        const mainAnnRef = context.register(mainAnn)
        this.addAnnotationToPage(page, mainAnnRef)

        // 2️⃣ 回复评论（如果有）
        for (const comment of annotation.comments || []) {
            const replyAnn = context.obj({
                Type: PDFName.of('Annot'),
                Subtype: PDFName.of('Text'),
                Rect: rect,
                Contents: stringToPDFHexString(comment.content),
                T: stringToPDFHexString(comment.title || t('normal.unknownUser')),
                M: PDFString.of(comment.date || ''),
                C: rgbToPdfColor(annotation.color || '#000000'),
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
