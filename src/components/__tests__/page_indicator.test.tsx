/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'
import { PageIndicator } from '../page_indicator'

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
})
