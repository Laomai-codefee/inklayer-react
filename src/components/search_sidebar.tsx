import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Box, TextField, Text, Spinner, Flex, Checkbox, Button, IconButton, Separator } from '@radix-ui/themes'
import { AiFillCloseCircle, AiOutlineLeft, AiOutlineRight, AiOutlineSearch } from 'react-icons/ai'
import { PDFViewer } from 'pdfjs-dist/types/web/pdf_viewer'
import { usePdfSearch } from '@/hooks/usePdfSearch'
import { useTranslation } from 'react-i18next'
import { splitSearchText } from './search_text'

interface SearchOptions {
    caseSensitive: boolean
    entireWord: boolean
}

interface MatchLocation {
    pageNumber: number
    matchIndex: number
}

interface SearchSidebarProps {
    pdfViewer: PDFViewer | null
}

const HighlightedText: React.FC<{
    text: string
    query: string
    caseSensitive: boolean
}> = ({ text, query, caseSensitive }) => (
    <>
        {splitSearchText(text, query, caseSensitive).map((part, index) =>
            part.highlighted ? (
                <mark key={`${index}-${part.text}`} style={{ backgroundColor: 'rgba(255, 255, 0, 0.2)', padding: '0 2px' }}>
                    {part.text}
                </mark>
            ) : (
                part.text
            )
        )}
    </>
)

export const SearchSidebar: React.FC<SearchSidebarProps> = ({ pdfViewer }) => {
    const { query, setQuery, results, searching, search, clearSearch, jumpToMatch } = usePdfSearch({ pdfViewer })
    const { t } = useTranslation('viewer', { useSuspense: false })

    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        caseSensitive: false,
        entireWord: false
    })

    const [currentMatch, setCurrentMatch] = useState<MatchLocation | null>(null)

    const matchRefs = useRef<Record<string, HTMLButtonElement | null>>({})

    const prevResultsRef = useRef(results)
    const queryRef = useRef(query)
    queryRef.current = query

    const performSearch = useCallback(
        (searchQuery: string) => {
            if (searchQuery.trim() && pdfViewer) {
                clearSearch()
                setCurrentMatch(null)
                search(searchQuery.trim(), {
                    caseSensitive: searchOptions.caseSensitive,
                    entireWord: searchOptions.entireWord
                })
            }
        },
        [pdfViewer, search, clearSearch, searchOptions]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            switch (e.key) {
                case 'Escape':
                    if (results.length > 0 || query.trim() !== '') {
                        clearSearch()
                    }
                    break
                case 'Enter':
                    if (query.trim() === '' && results.length > 0) {
                        clearSearch()
                    }
                    if (query.trim()) {
                        clearSearch()
                        performSearch(query)
                    }
                    break
                default:
                    break
            }
        },
        [query, results, clearSearch, performSearch]
    )

    const handleJumpToMatch = useCallback(
        (pageNumber: number, matchIndex: number) => {
            setCurrentMatch({ pageNumber, matchIndex })
            jumpToMatch({
                pageNumber,
                matchIndex
            })
        },
        [jumpToMatch]
    )

    const handleOptionChange = useCallback((option: keyof SearchOptions, value: boolean) => {
        setSearchOptions((prev) => ({
            ...prev,
            [option]: value
        }))
    }, [])

    // 获取所有匹配项的扁平化列表
    const getAllMatches = useCallback(() => {
        const allMatches: Array<{
            pageNumber: number
            matchIndex: number
            query: string
        }> = []

        results.forEach((res) => {
            res.pageMatches.forEach((page) => {
                page.matches.forEach((match) => {
                    allMatches.push({
                        pageNumber: page.pageNumber,
                        matchIndex: match.matchIndex,
                        query: res.query
                    })
                })
            })
        })

        return allMatches
    }, [results])

    const scrollToMatch = useCallback((pageNumber: number, matchIndex: number) => {
        const ref = matchRefs.current[`${pageNumber}-${matchIndex}`]
        if (ref) {
            ref.scrollIntoView({
                block: 'center',
                inline: 'center'
            })
        }
    }, [])

    // 计算当前匹配项的索引
    const findCurrentMatchIndex = useCallback(() => {
        if (!currentMatch) return -1

        const allMatches = getAllMatches()
        return allMatches.findIndex((match) => match.pageNumber === currentMatch.pageNumber && match.matchIndex === currentMatch.matchIndex)
    }, [currentMatch, getAllMatches])

    // 跳转到下一个匹配项
    const goToNextMatch = useCallback(() => {
        if (!results.length) return

        const allMatches = getAllMatches()
        if (!allMatches.length) return

        let nextIndex = 0
        if (currentMatch) {
            const currentIndex = findCurrentMatchIndex()
            nextIndex = (currentIndex + 1) % allMatches.length
        }

        const nextMatch = allMatches[nextIndex]
        setCurrentMatch({
            pageNumber: nextMatch.pageNumber,
            matchIndex: nextMatch.matchIndex
        })
        jumpToMatch({
            pageNumber: nextMatch.pageNumber,
            matchIndex: nextMatch.matchIndex
        })
        scrollToMatch(nextMatch.pageNumber, nextMatch.matchIndex)
    }, [results, currentMatch, getAllMatches, findCurrentMatchIndex, jumpToMatch, scrollToMatch])

    // 跳转到上一个匹配项
    const goToPreviousMatch = useCallback(() => {
        if (!results.length) return

        const allMatches = getAllMatches()
        if (!allMatches.length) return

        let prevIndex = allMatches.length - 1
        if (currentMatch) {
            const currentIndex = findCurrentMatchIndex()
            prevIndex = (currentIndex - 1 + allMatches.length) % allMatches.length
        }

        const prevMatch = allMatches[prevIndex]
        setCurrentMatch({
            pageNumber: prevMatch.pageNumber,
            matchIndex: prevMatch.matchIndex
        })
        jumpToMatch({
            pageNumber: prevMatch.pageNumber,
            matchIndex: prevMatch.matchIndex
        })
        scrollToMatch(prevMatch.pageNumber, prevMatch.matchIndex)
    }, [results, currentMatch, getAllMatches, findCurrentMatchIndex, jumpToMatch, scrollToMatch])

    useEffect(() => {
        prevResultsRef.current = results
    }, [results])

    useEffect(() => {
        const currentQuery = queryRef.current.trim()
        if (currentQuery) {
            performSearch(currentQuery)
        }
    }, [searchOptions, performSearch])

    useEffect(() => {
        return () => {
            if (prevResultsRef.current.length > 0) {
                clearSearch()
            }
            setCurrentMatch(null)
            setQuery('')
        }
    }, [clearSearch, setQuery])

    // 渲染搜索结果
    const renderSearchResults = () => {
        if (!results.length || searching) return null

        return results.map((res) => (
            <Box key={res.query}>
                <Flex
                    pb="2"
                    justify="between"
                    align="center"
                    style={{ position: 'sticky', top: 89, backgroundColor: 'var(--bg-color-tertiary)', zIndex: 1 }}
                >
                    <Text size="2">
                        {t('viewer:search.resultTotal', {
                            total: res.countTotal
                        })}
                    </Text>
                    {
                        res.countTotal > 0 && (
                            <div>
                                <IconButton onClick={goToPreviousMatch} variant="soft" color="gray" size="1" mr="1">
                                    <AiOutlineLeft />
                                </IconButton>
                                <IconButton onClick={goToNextMatch} variant="soft" color="gray" size="1" mr="1">
                                    <AiOutlineRight />
                                </IconButton>
                            </div>
                        )
                    }
                </Flex>

                {res.pageMatches.map((page) => (
                    <Box key={page.pageNumber} mt="1" mb="3" pl="2">
                        <Text size="2">
                            {t('viewer:search.page', { value: page.pageNumber })} ({page.countTotal})
                        </Text>
                        {page.matches.map((m) => {
                            const isCurrentMatch =
                                currentMatch && currentMatch.pageNumber === page.pageNumber && currentMatch.matchIndex === m.matchIndex
                            const key = `${page.pageNumber}-${m.matchIndex}`
                            return (
                                <Box key={m.matchIndex} mt="2" pl="0">
                                    <Button
                                        ref={(el) => (matchRefs.current[key] = el)}
                                        variant={isCurrentMatch ? 'soft' : 'outline'}
                                        color={isCurrentMatch ? undefined : 'gray'}
                                        type="button"
                                        onClick={() => handleJumpToMatch(page.pageNumber, m.matchIndex)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            justifyContent: 'flex-start'
                                        }}
                                    >
                                        <Text truncate>
                                            <HighlightedText
                                                text={m.snippet}
                                                query={res.query}
                                                caseSensitive={searchOptions.caseSensitive}
                                            />
                                        </Text>
                                    </Button>
                                </Box>
                            )
                        })}
                    </Box>
                ))}
            </Box>
        ))
    }

    // 渲染加载状态
    const renderLoading = useMemo(() => {
        if (!searching) return null
        return (
            <Flex mt="2" align="center" gap="2">
                <Spinner />
                <Text size="2">{t('viewer:search.searching')}</Text>
            </Flex>
        )
    }, [searching, t])

    return (
        <Box p="2" pt="0">
            <Flex direction="column" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-color-tertiary)', zIndex: 1 }}>
                <TextField.Root
                    placeholder={t('viewer:search.placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    aria-label={t('viewer:search.placeholder')}
                    mt="3"
                >
                    <TextField.Slot>
                        <AiOutlineSearch />
                    </TextField.Slot>
                    <TextField.Slot>
                        {
                            query.trim() && (
                                <IconButton
                                    size="1"
                                    variant="ghost"
                                    onClick={() => {
                                        setQuery('')
                                        if (results.length > 0) {
                                            clearSearch()
                                            setCurrentMatch(null)
                                        }
                                    }}
                                >
                                    <AiFillCloseCircle />
                                </IconButton>
                            )
                        }
                    </TextField.Slot>
                </TextField.Root>
                <Flex mt="2" align="center" gap="2">
                    <Text as="label" size="2">
                        <Flex gap="2">
                            <Checkbox
                                checked={searchOptions.caseSensitive}
                                onCheckedChange={(checked) => handleOptionChange('caseSensitive', !!checked)}
                                aria-label={t('viewer:search.caseSensitive')}
                            />
                            {t('viewer:search.caseSensitive')}
                        </Flex>
                    </Text>
                    <Text as="label" size="2">
                        <Flex gap="2">
                            <Checkbox
                                checked={searchOptions.entireWord}
                                onCheckedChange={(checked) => handleOptionChange('entireWord', !!checked)}
                                aria-label={t('viewer:search.entireWord')}
                            />
                            {t('viewer:search.entireWord')}
                        </Flex>
                    </Text>
                </Flex>
                <Separator my="2" size="4" />
            </Flex>
            {renderLoading}
            {renderSearchResults()}
        </Box>
    )
}
