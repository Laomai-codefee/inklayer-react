/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'
import { PageIndicator } from '../page_indicator'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'viewer:navigation.pageInput') return 'Page number'
            if (key === 'viewer:navigation.previousPage') return 'Previous page'
            if (key === 'viewer:navigation.nextPage') return 'Next page'
            return key
        }
    })
}))

const listeners = new Map<string, (event: { pageNumber: number }) => void>()
const container = document.createElement('div')
const eventBus = {
    on: jest.fn((name: string, listener: (event: { pageNumber: number }) => void) => {
        listeners.set(name, listener)
    }),
    off: jest.fn((name: string) => {
        listeners.delete(name)
    })
}
const pdfViewer = {
    currentPageNumber: 12,
    pagesCount: 446,
    container,
    eventBus
}

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({
        pdfViewer,
        isReady: true
    })
}))

const findIndicator = (input: HTMLInputElement): HTMLElement => {
    let element: HTMLElement | null = input
    while (element && element.style.opacity === '') {
        element = element.parentElement
    }
    if (!element) throw new Error('Page indicator container not found')
    return element
}

describe('PageIndicator visibility and input selection', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        listeners.clear()
        jest.clearAllMocks()
        pdfViewer.currentPageNumber = 12
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('selects the full page number on double-click and stays visible while focused', () => {
        render(
            <Theme>
                <PageIndicator />
            </Theme>
        )

        const input = screen.getByDisplayValue('12') as HTMLInputElement
        const indicator = findIndicator(input)

        fireEvent.focus(input)
        fireEvent.doubleClick(input)
        expect(input.selectionStart).toBe(0)
        expect(input.selectionEnd).toBe(2)

        act(() => jest.advanceTimersByTime(5000))
        expect(indicator).toHaveStyle({ opacity: '1' })

        fireEvent.blur(input)
        act(() => jest.advanceTimersByTime(2999))
        expect(indicator).toHaveStyle({ opacity: '1' })
        act(() => jest.advanceTimersByTime(1))
        expect(indicator).toHaveStyle({ opacity: '0' })
    })

    it('stays visible while hovered and hides three seconds after leaving', () => {
        render(
            <Theme>
                <PageIndicator />
            </Theme>
        )

        const input = screen.getByDisplayValue('12') as HTMLInputElement
        const indicator = findIndicator(input)

        fireEvent.mouseEnter(indicator)
        act(() => jest.advanceTimersByTime(5000))
        expect(indicator).toHaveStyle({ opacity: '1' })

        fireEvent.mouseLeave(indicator)
        act(() => jest.advanceTimersByTime(3000))
        expect(indicator).toHaveStyle({ opacity: '0' })
    })

    it('navigates by input and buttons and follows PDF.js page changes', () => {
        const { unmount } = render(
            <Theme>
                <PageIndicator />
            </Theme>
        )

        const input = screen.getByRole('textbox', { name: 'Page number' })
        fireEvent.change(input, { target: { value: '446' } })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(pdfViewer.currentPageNumber).toBe(446)

        act(() => {
            listeners.get('pagechanging')?.({ pageNumber: 200 })
        })
        expect(input).toHaveValue('200')

        fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
        expect(pdfViewer.currentPageNumber).toBe(199)
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
        expect(pdfViewer.currentPageNumber).toBe(200)

        fireEvent.change(input, { target: { value: '999' } })
        fireEvent.blur(input)
        expect(input).toHaveValue('200')

        unmount()
        expect(eventBus.off).toHaveBeenCalledWith('pagechanging', expect.any(Function))
    })
})
