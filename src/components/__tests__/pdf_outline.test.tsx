/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { PdfOutline } from '../pdf_outline'

type PdfOutlineItem = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number]

let mockPdfDocument: PDFDocumentProxy | null
let mockPdfViewer: PDFViewer | null

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({
        pdfDocument: mockPdfDocument,
        pdfViewer: mockPdfViewer,
    })
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { title?: string }) => {
            if (key === 'viewer:navigation.expandOutlineItem') return `Expand ${options?.title}`
            if (key === 'viewer:navigation.collapseOutlineItem') return `Collapse ${options?.title}`
            return key
        }
    })
}))

const createOutlineItem = (
    title: string,
    overrides: Partial<PdfOutlineItem> = {}
): PdfOutlineItem => ({
    title,
    bold: false,
    italic: false,
    color: new Uint8ClampedArray([0, 0, 0]),
    dest: null,
    url: null,
    unsafeUrl: undefined,
    newWindow: undefined,
    count: undefined,
    items: [],
    ...overrides,
})

const createDocument = (
    items: PdfOutlineItem[],
    overrides: Partial<PDFDocumentProxy> = {}
): PDFDocumentProxy => ({
    numPages: 8,
    getOutline: jest.fn(async () => items),
    getDestination: jest.fn(),
    getPageIndex: jest.fn(),
    cachedPageNumber: jest.fn(() => null),
    ...overrides,
} as unknown as PDFDocumentProxy)

const createViewer = (pdfDocument: PDFDocumentProxy): PDFViewer => ({
    pdfDocument,
    scrollPageIntoView: jest.fn(),
} as unknown as PDFViewer)

describe('PdfOutline', () => {
    beforeEach(() => {
        mockPdfDocument = null
        mockPdfViewer = null
    })

    it('shows an empty state when the document has no outline', async () => {
        mockPdfDocument = createDocument([])
        mockPdfViewer = createViewer(mockPdfDocument)

        render(<PdfOutline />)

        expect(await screen.findByText('viewer:navigation.outlineEmpty')).toBeInTheDocument()
    })

    it('respects collapsed outline items and navigates an integer destination', async () => {
        const child = createOutlineItem('Section 1.1', {
            dest: [1, { name: 'Fit' }],
        })
        const parent = createOutlineItem('Chapter 1', {
            count: -1,
            items: [child],
        })
        mockPdfDocument = createDocument([parent])
        mockPdfViewer = createViewer(mockPdfDocument)

        render(<PdfOutline />)

        await screen.findByText('Chapter 1')
        expect(screen.queryByText('Section 1.1')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Expand Chapter 1' }))
        fireEvent.click(screen.getByRole('button', { name: 'Section 1.1' }))

        expect(mockPdfViewer.scrollPageIntoView).toHaveBeenCalledWith({
            pageNumber: 2,
            destArray: child.dest,
        })
    })

    it('resolves named destinations only when an outline item is selected', async () => {
        const pageReference = { num: 12, gen: 0 }
        const destination = [pageReference, { name: 'XYZ' }, 0, 100, null]
        const item = createOutlineItem('Named chapter', { dest: 'chapter-1' })
        const getDestination = jest.fn(async () => destination)
        const getPageIndex = jest.fn(async () => 3)

        mockPdfDocument = createDocument([item], {
            getDestination,
            getPageIndex,
        })
        mockPdfViewer = createViewer(mockPdfDocument)

        render(<PdfOutline />)

        expect(getDestination).not.toHaveBeenCalled()
        fireEvent.click(await screen.findByRole('button', { name: 'Named chapter' }))

        await waitFor(() => {
            expect(mockPdfViewer.scrollPageIntoView).toHaveBeenCalledWith({
                pageNumber: 4,
                destArray: destination,
            })
        })
        expect(getDestination).toHaveBeenCalledWith('chapter-1')
        expect(getPageIndex).toHaveBeenCalledWith(pageReference)
        expect(screen.getByRole('button', { name: 'Named chapter' })).toHaveAttribute(
            'aria-current',
            'location'
        )
    })
})
