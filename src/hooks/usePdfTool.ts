import { PDFDocument, PDFName } from 'pdf-lib'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useCallback } from 'react'

/**
 * 从 PDF 中清除所有页面上的原始注解（Annots）
 *
 * @param pdfDoc - 要处理的 PDF 文档对象
 */
function clearAllAnnotations(pdfDoc: PDFDocument) {
    for (const page of pdfDoc.getPages()) {
        const annotsKey = PDFName.of('Annots')
        if (page.node.has(annotsKey)) {
            page.node.set(annotsKey, pdfDoc.context.obj([])) // 清空批注数组
        }
    }
}
async function generatePdf(pdfDocument: PDFDocumentProxy, cleanup: boolean = false): Promise<Uint8Array> {
    const pdfData = await pdfDocument.getData()
    const pdfDoc = await PDFDocument.load(pdfData)
    if (cleanup) {
        // 清空所有原生批注
        clearAllAnnotations(pdfDoc)
    }
    return pdfDoc.save()
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)
    return buffer
}

function downloadPdf(data: Uint8Array, filename: string) {
    const blob = new Blob([toArrayBuffer(data)], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
}

export function printPdf(data: Uint8Array) {
    const blob = new Blob([toArrayBuffer(data)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(url)
        }, 1000)
    }
}

export function usePdfTool(pdfDocument: PDFDocumentProxy | null) {
    const downloadClean = useCallback(
        async (filename?: string) => {
            if (!pdfDocument) return
            const data = await generatePdf(pdfDocument, true)
            const fileName = filename || `file_${Date.now()}.pdf`
            downloadPdf(data, fileName)
        },
        [pdfDocument]
    )

    const printClean = useCallback(async () => {
        if (!pdfDocument) return
        const data = await generatePdf(pdfDocument, true)
        printPdf(data)
    }, [pdfDocument])

    return {
        downloadClean,
        printClean
    }
}
