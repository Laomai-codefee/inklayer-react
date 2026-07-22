import { PDFName, PDFString, PDFNumber } from 'pdf-lib'
import { AnnotationParser } from './parse'
import { convertKonvaRectToPdfRect, rgbToPdfColor, stringToPDFHexString } from '../../utils/utils'
import { t } from 'i18next'

export class FreeTextParser extends AnnotationParser {
    async parse() {
        const { annotation, page, pdfDoc, pageView } = this
        const [x1, , , y2] = convertKonvaRectToPdfRect(annotation.konvaClientRect, pageView)
        const context = pdfDoc.context
        const iconSize = 20
        const pageWidth = page.getWidth()
        const pageHeight = page.getHeight()
        const xLeft = Math.max(0, Math.min(x1, pageWidth - iconSize))
        const yTop = Math.max(iconSize, Math.min(y2, pageHeight))
        const rect = [
            PDFNumber.of(xLeft),
            PDFNumber.of(yTop - iconSize),
            PDFNumber.of(xLeft + iconSize),
            PDFNumber.of(yTop)
        ]
        const konvaGroup = JSON.parse(annotation.konvaString)
        const text = konvaGroup.children?.find((child: { className?: string }) => child.className === 'Text')
        const scaleY = Math.abs(konvaGroup.attrs?.scaleY ?? 1)
        const fontSize = (text?.attrs?.fontSize ?? 14) * scaleY
        const opacity = text?.attrs?.opacity ?? 1

        // Keep editor free text as a Text annotation intentionally. A real PDF FreeText
        // appearance requires an embedded font, which can make CJK text disappear.
        const mainAnn = context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Text'),
            InkLayerType: PDFName.of('FreeText'),
            InkLayerFontSize: PDFNumber.of(fontSize),
            InkLayerTextWidth: PDFNumber.of(annotation.konvaClientRect.width),
            Rect: rect,
            NM: PDFString.of(annotation.id), // 唯一标识
            Contents: stringToPDFHexString(annotation.contentsObj?.text || ''),
            Name: PDFName.of('Comment'),
            T: stringToPDFHexString(annotation.title || t('normal.unknownUser')),
            M: PDFString.of(annotation.date || ''),
            C: rgbToPdfColor(annotation.color || '#000000'),
            CA: PDFNumber.of(opacity),
            F: PDFNumber.of(4),
            P: page.ref,
            Open: false
        })
        const mainAnnRef = context.register(mainAnn)
        this.addAnnotationToPage(page, mainAnnRef)

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
                NM: PDFString.of(comment.id), // 唯一标识
                Open: false
            })
            const replyAnnRef = context.register(replyAnn)
            this.addAnnotationToPage(page, replyAnnRef)
        }
    }
}
