/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Theme } from '@radix-ui/themes'
import type { EventBus } from 'pdfjs-dist/types/web/pdf_viewer'
import { NavigationSidebar } from '../navigation_sidebar'
import {
    NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
    type NavigationPageMarkersChangedEvent,
} from '../navigation_page_markers'

type MarkerListener = (event: NavigationPageMarkersChangedEvent) => void

const createEventBus = () => {
    const listeners = new Map<string, MarkerListener>()
    return {
        listeners,
        on: jest.fn((name: string, listener: MarkerListener) => {
            listeners.set(name, listener)
        }),
        off: jest.fn((name: string) => {
            listeners.delete(name)
        }),
    }
}

let mockEventBus = createEventBus()

jest.mock('@/context/pdf_viewer_context', () => ({
    usePdfViewerContext: () => ({
        eventBus: mockEventBus as unknown as EventBus,
    })
}))

jest.mock('../pdf_thumbnail_list', () => ({
    PdfThumbnailList: ({
        pageMarkerCounts,
    }: {
        pageMarkerCounts: ReadonlyMap<number, number>
    }) => (
        <div data-testid="thumbnail-markers">
            {Array.from(pageMarkerCounts)
                .sort(([left], [right]) => left - right)
                .map(([page, count]) => `${page}:${count}`)
                .join(',')}
        </div>
    )
}))

jest.mock('../pdf_outline', () => ({
    PdfOutline: ({ onNavigate }: { onNavigate?: () => void }) => (
        <button type="button" onClick={onNavigate}>Navigate outline</button>
    )
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    })
}))

describe('NavigationSidebar', () => {
    beforeEach(() => {
        mockEventBus = createEventBus()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: jest.fn(() => ({
                matches: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            })),
        })
    })

    it('aggregates independent marker sources and removes empty sources', () => {
        render(
            <Theme>
                <NavigationSidebar open onClose={jest.fn()} />
            </Theme>
        )

        const publish = mockEventBus.listeners.get(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT
        )
        expect(publish).toBeDefined()

        act(() => {
            publish?.({
                source: 'annotations',
                markers: new Map([[1, 2]]),
            })
            publish?.({
                source: 'search',
                markers: new Map([[1, 1], [2, 4]]),
            })
        })
        expect(screen.getByTestId('thumbnail-markers')).toHaveTextContent('1:3,2:4')

        act(() => {
            publish?.({
                source: 'search',
                markers: new Map(),
            })
        })
        expect(screen.getByTestId('thumbnail-markers')).toHaveTextContent('1:2')
    })

    it('clears stale markers and listeners when the event bus changes', () => {
        const { rerender, unmount } = render(
            <Theme>
                <NavigationSidebar open onClose={jest.fn()} />
            </Theme>
        )
        const firstEventBus = mockEventBus

        act(() => {
            firstEventBus.listeners.get(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT)?.({
                source: 'annotations',
                markers: new Map([[4, 3]]),
            })
        })
        expect(screen.getByTestId('thumbnail-markers')).toHaveTextContent('4:3')

        mockEventBus = createEventBus()
        rerender(
            <Theme>
                <NavigationSidebar open onClose={jest.fn()} />
            </Theme>
        )

        expect(firstEventBus.off).toHaveBeenCalledWith(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
            expect.any(Function)
        )
        expect(screen.getByTestId('thumbnail-markers')).toBeEmptyDOMElement()

        const secondEventBus = mockEventBus
        unmount()
        expect(secondEventBus.off).toHaveBeenCalledWith(
            NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
            expect.any(Function)
        )
    })

    it('closes on Escape and after mobile outline navigation', async () => {
        const onClose = jest.fn()
        const user = userEvent.setup()
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: jest.fn(() => ({
                matches: true,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            })),
        })

        render(
            <Theme>
                <NavigationSidebar open onClose={onClose} />
            </Theme>
        )

        fireEvent.keyDown(document, { key: 'Escape' })
        expect(onClose).toHaveBeenCalledTimes(1)

        await user.click(screen.getAllByRole('tab')[1])
        await user.click(screen.getByRole('button', { name: 'Navigate outline' }))
        expect(onClose).toHaveBeenCalledTimes(2)
    })
})
