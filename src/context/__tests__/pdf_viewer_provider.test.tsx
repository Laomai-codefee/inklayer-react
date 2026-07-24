/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { PdfViewerProvider } from '../pdf_viewer_provider'

jest.mock('@/hooks/usePdfViewer', () => ({
    usePdfViewer: () => ({
        loading: false,
        progress: 100,
        pdfDocument: null,
        pdfViewer: null,
        eventBus: null,
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
    it('places the navigation sidebar beside the viewer and toggles it from the header', () => {
        render(
            <PdfViewerProvider title="Test Viewer">
                <div>Child content</div>
            </PdfViewerProvider>
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
})
