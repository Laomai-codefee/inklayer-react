import { AnnotationParser, parseSerializedKonvaNode } from './parse'
import { PDFName, PDFNumber, PDFString } from 'pdf-lib'
import { convertKonvaRectToPdfRect, rgbToPdfColor, stringToPDFHexString } from '../../utils/utils'
import { t } from 'i18next'

export class SquareParser extends AnnotationParser {
    async parse() {
        const { annotation, page, pdfDoc, pageView } = this
        const context = pdfDoc.context

        const konvaGroup = parseSerializedKonvaNode(annotation.konvaString)

        const konvaShape = konvaGroup.children?.[0] ?? konvaGroup
        const shapeAttrs = konvaShape.attrs ?? konvaGroup.attrs ?? {}
        const strokeWidth = shapeAttrs.strokeWidth ?? 2
        const dashArray = shapeAttrs.dash ?? []
        const opacity = shapeAttrs.opacity ?? 1
        const bsDict = {
            W: PDFNumber.of(strokeWidth),
            S: PDFName.of(dashArray.length > 0 ? 'D' : 'S'),
            ...(dashArray.length > 0 ? { D: context.obj(dashArray) } : {})
        }

        // 1️⃣ 主批注（方框）
        const mainAnn = context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Square'),
            Rect: convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView),
            C: rgbToPdfColor(annotation.color || '#000000'), // 边框颜色
            T: stringToPDFHexString(annotation.title || t('normal.unknownUser')), // 作者
            Contents: stringToPDFHexString(annotation.contentsObj?.text || ''), // 说明文字
            M: PDFString.of(annotation.date || ''),
            NM: PDFString.of(annotation.id), // 唯一标识
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
                Rect: convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView),
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
