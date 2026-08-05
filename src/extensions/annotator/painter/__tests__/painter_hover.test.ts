/** @jest-environment jsdom */

import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'

import type { PdfAnnotatorOptions } from '../../types/annotator'
import { Painter } from '..'
import { AnnotationType, annotationDefinitions } from '../../const/definitions'

jest.mock('../../utils/utils', () => ({
    isElementInDOM: jest.fn(() => true),
    removeCssCustomProperty: jest.fn(),
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id')
}))

describe('Painter annotation hover', () => {
    it('forwards the effective target to author labels and exposes a stable subscription', () => {
        const painter = new Painter({
            primaryColor: '#6e56cf',
            defaultOptions: {} as PdfAnnotatorOptions,
            currentUser: { id: 'alice', name: 'Alice' },
            defaultShowAnnotationAuthorLabels: false,
            PDFViewerApplication: {} as PDFViewer,
            onTextSelected: jest.fn(),
            onAnnotationAdd: jest.fn(),
            onAnnotationDelete: jest.fn(),
            onAnnotationSelected: jest.fn(),
            onAnnotationChanging: jest.fn(),
            onAnnotationChanged: jest.fn()
        })
        const authorLabels = (
            painter as unknown as {
                authorLabels: { setHovered: (id: string | null) => void }
            }
        ).authorLabels
        const setHovered = jest.spyOn(authorLabels, 'setHovered')
        const listener = jest.fn()
        painter.subscribeAnnotationHover(listener)

        painter.setAnnotationHover('sidebar-focus', 'annotation-1')
        painter.setAnnotationHover('canvas', 'annotation-2')
        painter.clearAnnotationHover('canvas', 'annotation-2')

        expect(painter.getAnnotationHoverSnapshot()).toEqual({
            annotationId: 'annotation-1',
            source: 'sidebar-focus'
        })
        expect(setHovered.mock.calls).toEqual([
            ['annotation-1'],
            ['annotation-2'],
            ['annotation-1']
        ])
        expect(listener).toHaveBeenCalledTimes(3)

        painter.destroy()

        expect(listener).toHaveBeenLastCalledWith({
            annotationId: null,
            source: null
        })
    })

    it('shows only the author label for Canvas hover', () => {
        const painter = new Painter({
            primaryColor: '#6e56cf',
            defaultOptions: {} as PdfAnnotatorOptions,
            currentUser: { id: 'alice', name: 'Alice' },
            defaultShowAnnotationAuthorLabels: false,
            PDFViewerApplication: {} as PDFViewer,
            onTextSelected: jest.fn(),
            onAnnotationAdd: jest.fn(),
            onAnnotationDelete: jest.fn(),
            onAnnotationSelected: jest.fn(),
            onAnnotationChanging: jest.fn(),
            onAnnotationChanged: jest.fn()
        })
        const internals = painter as unknown as {
            authorLabels: { setHovered: (id: string | null) => void }
            hoverPreview: { setHovered: (id: string | null) => void }
        }
        const setLabelHovered = jest.spyOn(internals.authorLabels, 'setHovered')
        const setPreviewHovered = jest.spyOn(internals.hoverPreview, 'setHovered')

        painter.setAnnotationHover('canvas', 'annotation-1')
        expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
        expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

        painter.clearAnnotationHover('canvas', 'annotation-1')
        expect(setLabelHovered).toHaveBeenLastCalledWith(null)
        expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

        painter.setAnnotationHover('canvas-passive', 'annotation-1')
        expect(setLabelHovered).toHaveBeenLastCalledWith('annotation-1')
        expect(setPreviewHovered).toHaveBeenLastCalledWith(null)

        painter.destroy()
    })

    it('keeps passive hover available while a text-markup tool is active', () => {
        const painter = new Painter({
            primaryColor: '#6e56cf',
            defaultOptions: {} as PdfAnnotatorOptions,
            currentUser: { id: 'alice', name: 'Alice' },
            defaultShowAnnotationAuthorLabels: false,
            PDFViewerApplication: {} as PDFViewer,
            onTextSelected: jest.fn(),
            onAnnotationAdd: jest.fn(),
            onAnnotationDelete: jest.fn(),
            onAnnotationSelected: jest.fn(),
            onAnnotationChanging: jest.fn(),
            onAnnotationChanged: jest.fn()
        })
        const internals = painter as unknown as {
            passiveHover: { shouldSuppress: () => boolean }
            webSelection: { isRangeSelectionActive: () => boolean }
        }
        const highlight = annotationDefinitions.find(
            (annotation) => annotation.type === AnnotationType.HIGHLIGHT
        )!
        const rectangle = annotationDefinitions.find(
            (annotation) => annotation.type === AnnotationType.RECTANGLE
        )!

        painter.activate(highlight, null)
        expect(internals.passiveHover.shouldSuppress()).toBe(false)

        const rangeSelectionSpy = jest
            .spyOn(internals.webSelection, 'isRangeSelectionActive')
            .mockReturnValue(true)
        expect(internals.passiveHover.shouldSuppress()).toBe(true)

        rangeSelectionSpy.mockRestore()
        painter.activate(rectangle, null)
        expect(internals.passiveHover.shouldSuppress()).toBe(true)

        painter.destroy()
    })
})
