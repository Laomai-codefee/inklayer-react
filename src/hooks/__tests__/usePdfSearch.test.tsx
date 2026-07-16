/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import type { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { usePdfSearch } from '../usePdfSearch'

interface FindEvent {
    rawQuery?: string
    source: {
        _matchesCountTotal: number
        _pageMatches: number[][]
    }
}

type Listener = (event: FindEvent) => void

class FakeEventBus {
    private listeners = new Map<string, Set<Listener>>()
    readonly dispatched: Array<{ name: string; payload: Record<string, unknown> }> = []

    constructor(private readonly autoRespond = true) {}

    on(name: string, listener: Listener) {
        const listeners = this.listeners.get(name) ?? new Set<Listener>()
        listeners.add(listener)
        this.listeners.set(name, listeners)
    }

    off(name: string, listener: Listener) {
        this.listeners.get(name)?.delete(listener)
    }

    dispatch(name: string, payload: Record<string, unknown>) {
        this.dispatched.push({ name, payload })
        if (!this.autoRespond || name !== 'find' || !payload.query) return

        queueMicrotask(() => {
            this.emitFindResult(String(payload.query), [[4]])
        })
    }

    listenerCount(name: string) {
        return this.listeners.get(name)?.size ?? 0
    }

    emitFindResult(query: string, pageMatches: number[][]) {
        this.emit('updatefindcontrolstate', {
            rawQuery: query,
            source: {
                _matchesCountTotal: pageMatches.reduce((total, matches) => total + matches.length, 0),
                _pageMatches: pageMatches
            }
        })
    }

    private emit(name: string, payload: FindEvent) {
        this.listeners.get(name)?.forEach((listener) => listener(payload))
    }
}

function createViewer(eventBus: FakeEventBus) {
    return {
        pagesCount: 1,
        eventBus,
        getPageView: () => ({
            pdfPage: {
                getTextContent: async () => ({ items: [{ str: 'The PDF viewer is ready' }] })
            }
        }),
        scrollPageIntoView: jest.fn(),
        findController: {
            _selected: null,
            _offset: null,
            _highlightMatches: false
        },
        pdfDocument: {}
    } as unknown as PDFViewer
}

describe('usePdfSearch', () => {
    it('collects page matches and removes the event listener after searching', async () => {
        const eventBus = new FakeEventBus()
        const viewer = createViewer(eventBus)
        const { result } = renderHook(() => usePdfSearch({ pdfViewer: viewer }))

        await act(async () => {
            await result.current.search('PDF')
        })

        expect(result.current.searching).toBe(false)
        expect(result.current.results).toEqual([
            {
                query: 'PDF',
                countTotal: 1,
                pageMatches: [
                    {
                        pageNumber: 1,
                        countTotal: 1,
                        matches: [
                            {
                                matchIndex: 0,
                                charIndex: 4,
                                snippet: 'The PDF viewer is ready'
                            }
                        ]
                    }
                ]
            }
        ])
        expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(0)
    })

    it('clears the viewer highlights and local results together', async () => {
        const eventBus = new FakeEventBus()
        const viewer = createViewer(eventBus)
        const { result } = renderHook(() => usePdfSearch({ pdfViewer: viewer }))

        await act(async () => {
            await result.current.search('PDF')
            result.current.clearSearch()
        })

        expect(result.current.query).toBe('')
        expect(result.current.results).toEqual([])
        expect(eventBus.dispatched[eventBus.dispatched.length - 1]).toEqual({ name: 'find', payload: { query: '' } })
    })

    it('keeps only the latest result when searches overlap', async () => {
        const eventBus = new FakeEventBus(false)
        const viewer = createViewer(eventBus)
        const { result } = renderHook(() => usePdfSearch({ pdfViewer: viewer }))

        let firstSearch!: Promise<void>
        let secondSearch!: Promise<void>
        await act(async () => {
            firstSearch = result.current.search('first')
            secondSearch = result.current.search('second')
            eventBus.emitFindResult('first', [[0]])
            eventBus.emitFindResult('second', [[4]])
            await Promise.all([firstSearch, secondSearch])
        })

        expect(result.current.query).toBe('second')
        expect(result.current.results).toHaveLength(1)
        expect(result.current.results[0].query).toBe('second')
        expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(0)
    })

    it('cancels the pending listener when the hook unmounts', async () => {
        const eventBus = new FakeEventBus(false)
        const viewer = createViewer(eventBus)
        const { result, unmount } = renderHook(() => usePdfSearch({ pdfViewer: viewer }))

        let pendingSearch!: Promise<void>
        act(() => {
            pendingSearch = result.current.search('pending')
        })

        expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(1)
        unmount()
        await pendingSearch
        expect(eventBus.listenerCount('updatefindcontrolstate')).toBe(0)
    })
})
