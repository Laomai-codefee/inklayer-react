import { useState, useCallback, useEffect, useRef } from 'react'
import { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { KeywordResult, MatchSnippet, PageMatch } from '@/types'

interface UsePdfSearchProps {
    pdfViewer: PDFViewer | null
}

interface SearchOptions {
    caseSensitive?: boolean
    entireWord?: boolean
    matchDiacritics?: boolean
}

interface FindControllerState {
    _matchesCountTotal?: number
    _pageMatches?: number[][]
}

interface FindControllerNavigationState {
    _selected: { pageIdx: number; matchIdx: number }
    _offset: { pageIdx: number; matchIdx: number; wrapped: boolean }
    _highlightMatches: boolean
}

interface FindControlStateEvent {
    rawQuery?: string | string[] | null
    source?: FindControllerState
}

async function getPageText(pdfViewer: PDFViewer, pageIndex: number, cache: Map<number, string>): Promise<string> {
    if (cache.has(pageIndex)) return cache.get(pageIndex)!
    const pageView = pdfViewer.getPageView(pageIndex)
    if (!pageView?.pdfPage) return ''
    const textContent = await pageView.pdfPage.getTextContent()
    const fullText = textContent.items.map((i: any) => i.str).join('')
    cache.set(pageIndex, fullText)
    return fullText
}

export function usePdfSearch({ pdfViewer }: UsePdfSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<KeywordResult[]>([])
    const [searching, setSearching] = useState(false)
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        caseSensitive: false,
        entireWord: false,
        matchDiacritics: false
    })
    const textContentCache = useRef<Map<number, string>>(new Map())
    const searchOptionsRef = useRef(searchOptions)
    const searchRequestRef = useRef(0)
    const activeSearchCancelRef = useRef<(() => void) | null>(null)

    const cancelActiveSearch = useCallback(() => {
        activeSearchCancelRef.current?.()
        activeSearchCancelRef.current = null
    }, [])

    useEffect(() => {
        textContentCache.current.clear()

        return () => {
            searchRequestRef.current += 1
            cancelActiveSearch()
        }
    }, [pdfViewer, cancelActiveSearch])

    const jumpToMatch = useCallback(({ pageNumber, matchIndex }: { pageNumber: number; matchIndex: number }) => {
        if (!pdfViewer || !query) return
        const findController = pdfViewer.findController
        if (!findController) return
        const pdfDocument = pdfViewer.pdfDocument
        if (!pdfDocument) return

        pdfViewer.scrollPageIntoView({ pageNumber })

        // PDF.js navigation still relies on internal mutable state whose published
        // _offset declaration only describes its initial null value.
        const navigationState = findController as unknown as FindControllerNavigationState
        navigationState._selected = { pageIdx: pageNumber - 1, matchIdx: matchIndex }
        navigationState._offset = { pageIdx: pageNumber - 1, matchIdx: matchIndex - 1, wrapped: false }
        navigationState._highlightMatches = true

        pdfViewer.eventBus.dispatch('find', {
            type: 'again',
            query,
            caseSensitive: searchOptions.caseSensitive,
            entireWord: searchOptions.entireWord,
            findPrevious: false,
            matchDiacritics: searchOptions.matchDiacritics,
            highlightAll: true
        })
    }, [pdfViewer, query, searchOptions])

    const search = useCallback(
        async (keyword: string, options?: SearchOptions) => {
            if (!pdfViewer) return

            const requestId = searchRequestRef.current + 1
            searchRequestRef.current = requestId
            cancelActiveSearch()

            const effectiveOptions = {
                ...searchOptionsRef.current,
                ...options
            }
            searchOptionsRef.current = effectiveOptions

            setSearching(true)
            setQuery(keyword)
            setSearchOptions(effectiveOptions)

            try {
                const res = await new Promise<KeywordResult | null>((resolve, reject) => {
                    const pagesCount = pdfViewer.pagesCount
                    let retries = 0
                    const maxRetries = 60
                    const delay = 200
                    let timer: ReturnType<typeof setTimeout> | null = null
                    let settled = false
                    let latestSource: FindControllerState | null = null

                    const cleanup = () => {
                        if (timer) {
                            clearTimeout(timer)
                            timer = null
                        }
                        pdfViewer.eventBus.off('updatefindcontrolstate', handler)
                    }

                    const finish = (value: KeywordResult | null) => {
                        if (settled) return
                        settled = true
                        cleanup()
                        resolve(value)
                    }

                    const fail = (error: unknown) => {
                        if (settled) return
                        settled = true
                        cleanup()
                        reject(error)
                    }

                    const check = async () => {
                        if (settled || requestId !== searchRequestRef.current) {
                            finish(null)
                            return
                        }

                        try {
                            const pageMatchIndexes = latestSource?._pageMatches
                            if (Array.isArray(pageMatchIndexes) && pageMatchIndexes.length === pagesCount) {
                                const pageMatches: PageMatch[] = []

                                for (let i = 0; i < pageMatchIndexes.length; i++) {
                                    const matchIndexes = pageMatchIndexes[i]
                                    if (!matchIndexes || matchIndexes.length === 0) continue

                                    const fullText = await getPageText(pdfViewer, i, textContentCache.current)

                                    if (settled || requestId !== searchRequestRef.current) {
                                        finish(null)
                                        return
                                    }

                                    const matches: MatchSnippet[] = matchIndexes.map((charIndex, matchIndex) => {
                                        const context = 30
                                        const start = Math.max(0, charIndex - 5)
                                        const end = Math.min(fullText.length, charIndex + keyword.length + context)

                                        return {
                                            matchIndex,
                                            charIndex,
                                            snippet: fullText.slice(start, end)
                                        }
                                    })

                                    pageMatches.push({
                                        pageNumber: i + 1,
                                        countTotal: matchIndexes.length,
                                        matches
                                    })
                                }

                                finish({
                                    query: keyword,
                                    countTotal: latestSource?._matchesCountTotal ?? 0,
                                    pageMatches
                                })
                            } else if (retries < maxRetries) {
                                retries += 1
                                timer = setTimeout(() => {
                                    timer = null
                                    void check()
                                }, delay)
                            } else {
                                finish({
                                    query: keyword,
                                    countTotal: 0,
                                    pageMatches: []
                                })
                            }
                        } catch (error) {
                            fail(error)
                        }
                    }

                    const handler = ({ source, rawQuery }: FindControlStateEvent) => {
                        const normalizedQuery = Array.isArray(rawQuery) ? rawQuery.join('') : rawQuery
                        if (normalizedQuery !== undefined && normalizedQuery !== null && normalizedQuery !== keyword) {
                            return
                        }

                        latestSource = source ?? null
                        if (timer) {
                            clearTimeout(timer)
                            timer = null
                        }
                        void check()
                    }

                    activeSearchCancelRef.current = () => finish(null)
                    pdfViewer.eventBus.on('updatefindcontrolstate', handler)

                    pdfViewer.eventBus.dispatch('find', {
                        type: 'highlightallchange',
                        query: keyword,
                        caseSensitive: effectiveOptions.caseSensitive ?? false,
                        entireWord: effectiveOptions.entireWord ?? false,
                        findPrevious: false,
                        matchDiacritics: effectiveOptions.matchDiacritics ?? false,
                        highlightAll: true
                    })
                })

                if (res && requestId === searchRequestRef.current) {
                    setResults([res])
                }
            } catch (err) {
                console.error(err)
                if (requestId === searchRequestRef.current) {
                    setResults([{ query: keyword, countTotal: 0, pageMatches: [] }])
                }
            } finally {
                if (requestId === searchRequestRef.current) {
                    activeSearchCancelRef.current = null
                    setSearching(false)
                }
            }
        },
        [pdfViewer, cancelActiveSearch]
    )

    const clearSearch = useCallback(() => {
        searchRequestRef.current += 1
        cancelActiveSearch()
        pdfViewer?.eventBus.dispatch('find', { query: '' })
        setQuery('')
        setResults([])
        setSearching(false)
    }, [pdfViewer, cancelActiveSearch])

    return { query, setQuery, results, searching, search, clearSearch, jumpToMatch, searchOptions }
}
