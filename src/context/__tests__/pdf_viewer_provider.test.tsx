/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'
import { PdfViewerProvider } from '../pdf_viewer_provider'

let mockScaleValue: string | number = 'auto'
const mockSetScaleValue = jest.fn()
const mockUpdate = jest.fn()
const mockEventBus = {
    on: jest.fn(),
    off: jest.fn()
}
const mockPdfViewer = {
    get currentScaleValue() {
        return mockScaleValue
    },
    set currentScaleValue(value: string | number) {
        mockScaleValue = value
        mockSetScaleValue(value)
    },
    update: mockUpdate
}

const fireTransitionEnd = (element: Element, propertyName: string) => {
    const event = new Event('transitionend', { bubbles: true })
    Object.defineProperty(event, 'propertyName', { value: propertyName })
    fireEvent(element, event)
}

jest.mock('@/hooks/usePdfViewer', () => ({
    usePdfViewer: () => ({
        loading: false,
        progress: 100,
        pdfDocument: null,
        pdfViewer: mockPdfViewer,
        eventBus: mockEventBus,
        loadError: null
    })
}))

jest.mock('@/hooks/usePdfTool', () => ({
    usePdfTool: () => ({
        printClean: jest.fn(),
        downloadClean: jest.fn()
    })
}))

jest.mock('@/hooks/usePinchZoom', () => ({
    usePinchZoom: jest.fn()
}))

jest.mock('@/components/loading_indicator', () => ({
    LoadingIndicator: () => null
}))

jest.mock('@/components/error_display', () => ({
    ErrorDisplay: () => null
}))

jest.mock('@/components/page_indicator', () => ({
    PageIndicator: () => null
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'viewer:navigation.toggle') return 'Toggle document navigation'
            if (key === 'viewer:navigation.label') return 'Document navigation'
            return key
        }
    })
}))

describe('PdfViewerProvider navigation sidebar layout', () => {
    beforeEach(() => {
        mockScaleValue = 'auto'
        mockSetScaleValue.mockClear()
        mockUpdate.mockClear()
        mockEventBus.on.mockClear()
        mockEventBus.off.mockClear()
    })

    it('places the navigation sidebar beside the viewer and toggles it from the header', () => {
        render(
            <Theme>
                <PdfViewerProvider title="Test Viewer">
                    <div>Child content</div>
                </PdfViewerProvider>
            </Theme>
        )

        const trigger = screen.getByRole('button', { name: 'Toggle document navigation' })
        const sidebar = document.getElementById('InkLayer-navigation-sidebar')

        expect(sidebar).not.toBeNull()
        expect(sidebar).toHaveAttribute('aria-hidden', 'true')
        expect(trigger).toHaveAttribute('aria-expanded', 'false')
        expect(sidebar?.nextElementSibling?.querySelector('.pdfViewer')).not.toBeNull()

        fireEvent.click(trigger)

        expect(sidebar).toHaveAttribute('aria-hidden', 'false')
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('refreshes adaptive scale after either desktop sidebar finishes resizing', () => {
        render(
            <Theme>
                <PdfViewerProvider
                    title="Test Viewer"
                    sidebar={[
                        {
                            key: 'comments',
                            title: 'Comments',
                            icon: <span>Comments</span>,
                            render: () => <div>Comment sidebar</div>
                        }
                    ]}
                >
                    <div>Child content</div>
                </PdfViewerProvider>
            </Theme>
        )

        mockSetScaleValue.mockClear()
        mockUpdate.mockClear()

        const navigationSidebar = document.getElementById('InkLayer-navigation-sidebar')
        expect(navigationSidebar).not.toBeNull()

        fireTransitionEnd(navigationSidebar!, 'width')

        expect(mockSetScaleValue).toHaveBeenLastCalledWith('auto')
        expect(mockUpdate).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: 'Comments' }))
        expect(mockUpdate).toHaveBeenCalledTimes(1)

        const viewerSidebar = document.getElementById('InkLayer-viewer-sidebar')
        expect(viewerSidebar).not.toBeNull()

        fireTransitionEnd(viewerSidebar!, 'width')

        expect(mockSetScaleValue).toHaveBeenLastCalledWith('auto')
        expect(mockUpdate).toHaveBeenCalledTimes(2)
    })

    it('does not refresh fixed scale or react to mobile transform transitions', () => {
        render(
            <Theme>
                <PdfViewerProvider title="Test Viewer">
                    <div>Child content</div>
                </PdfViewerProvider>
            </Theme>
        )

        const navigationSidebar = document.getElementById('InkLayer-navigation-sidebar')
        expect(navigationSidebar).not.toBeNull()

        mockSetScaleValue.mockClear()
        mockUpdate.mockClear()
        mockScaleValue = 1.5

        fireTransitionEnd(navigationSidebar!, 'width')
        fireTransitionEnd(navigationSidebar!, 'transform')

        expect(mockSetScaleValue).not.toHaveBeenCalled()
        expect(mockUpdate).not.toHaveBeenCalled()
    })
})
