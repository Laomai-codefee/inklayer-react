/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { usePdfViewer } from '../usePdfViewer'

jest.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => 'pdf.worker.mjs', { virtual: true })

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
    AnnotationEditorType: { DISABLE: 0 },
    AnnotationMode: { DISABLE: 0 },
    GlobalWorkerOptions: {},
    PDFDataRangeTransport: class {},
    getDocument: jest.fn()
}))

jest.mock('pdfjs-dist/legacy/web/pdf_viewer.mjs', () => ({
    DownloadManager: class {},
    EventBus: class {},
    PDFFindController: class {},
    PDFLinkService: class {
        setViewer = jest.fn()
        setDocument = jest.fn()
    },
    PDFViewer: class {
        cleanup = jest.fn()
        setDocument = jest.fn()
    }
}))

interface DeferredTask {
    promise: Promise<PDFDocumentProxy>
    resolve: (document: PDFDocumentProxy) => void
    reject: (error: Error) => void
    destroy: jest.Mock<Promise<void>, []>
    onProgress: ((progress: { loaded: number; total: number }) => void) | null
}

function createDeferredTask(): DeferredTask {
    let resolve!: (document: PDFDocumentProxy) => void
    let reject!: (error: Error) => void
    const promise = new Promise<PDFDocumentProxy>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })

    return {
        promise,
        resolve,
        reject,
        destroy: jest.fn(async () => undefined),
        onProgress: null
    }
}

function createDocument(name: string) {
    return {
        name,
        destroy: jest.fn(async () => undefined),
        getMetadata: jest.fn(async () => ({ info: { Title: name } }))
    } as unknown as PDFDocumentProxy
}

describe('usePdfViewer', () => {
    it('ignores a stale loading task after the URL changes', async () => {
        const firstTask = createDeferredTask()
        const secondTask = createDeferredTask()
        const getDocumentMock = jest.mocked(getDocument)
        getDocumentMock.mockReturnValueOnce(firstTask as never).mockReturnValueOnce(secondTask as never)

        const firstDocument = createDocument('first')
        const secondDocument = createDocument('second')
        const onLoadSuccess = jest.fn()
        const onLoadError = jest.fn()
        const onLoadEnd = jest.fn()
        const container = document.createElement('div')
        const containerRef = { current: container }

        const { result, rerender } = renderHook(
            ({ url }) =>
                usePdfViewer(
                    containerRef,
                    {
                        url,
                        enableRange: false,
                        onLoadSuccess,
                        onLoadError,
                        onLoadEnd
                    }
                ),
            { initialProps: { url: 'first.pdf' } }
        )

        await waitFor(() => expect(getDocumentMock).toHaveBeenCalledTimes(1))
        rerender({ url: 'second.pdf' })
        await waitFor(() => expect(getDocumentMock).toHaveBeenCalledTimes(2))

        await act(async () => {
            secondTask.resolve(secondDocument)
            await secondTask.promise
        })

        await waitFor(() => expect(result.current.pdfDocument).toBe(secondDocument))

        await act(async () => {
            firstTask.resolve(firstDocument)
            await firstTask.promise
        })

        expect(firstTask.destroy).toHaveBeenCalled()
        expect(firstDocument.destroy).toHaveBeenCalled()
        expect(result.current.pdfDocument).toBe(secondDocument)
        expect(result.current.loadError).toBeNull()
        expect(onLoadSuccess).toHaveBeenCalledTimes(1)
        expect(onLoadSuccess).toHaveBeenCalledWith(secondDocument)
        expect(onLoadError).not.toHaveBeenCalled()
        expect(onLoadEnd).toHaveBeenCalledTimes(1)
    })
})
