import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePdfViewerContext } from '../context/pdf_viewer_context'
import { Flex, TextField, Text, Box, IconButton } from '@radix-ui/themes'
import { AiOutlineRight, AiOutlineLeft } from 'react-icons/ai'
import { useTranslation } from 'react-i18next'

const AUTO_HIDE_DELAY = 3000

export const PageIndicator: React.FC = () => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const { pdfViewer, isReady } = usePdfViewerContext()

    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [inputPage, setInputPage] = useState<string>('1')
    const [isPageChanging, setIsPageChanging] = useState<boolean>(false)
    const [enabled, setEnabled] = useState<boolean>(false)

    /** 自动显隐 */
    const [visible, setVisible] = useState<boolean>(true)
    const hideTimerRef = useRef<number | null>(null)
    const interactionRef = useRef({
        hovered: false,
        inputFocused: false
    })

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            window.clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }
    }, [])

    const scheduleHide = useCallback(() => {
        clearHideTimer()
        if (interactionRef.current.hovered || interactionRef.current.inputFocused) return
        hideTimerRef.current = window.setTimeout(() => {
            hideTimerRef.current = null
            setVisible(false)
        }, AUTO_HIDE_DELAY)
    }, [clearHideTimer])

    const showTemporarily = useCallback(() => {
        setVisible(true)
        scheduleHide()
    }, [scheduleHide])

    const handleMouseEnter = useCallback(() => {
        interactionRef.current.hovered = true
        clearHideTimer()
        setVisible(true)
    }, [clearHideTimer])

    const handleMouseLeave = useCallback(() => {
        interactionRef.current.hovered = false
        scheduleHide()
    }, [scheduleHide])

    const handleInputFocus = useCallback(() => {
        interactionRef.current.inputFocused = true
        clearHideTimer()
        setVisible(true)
    }, [clearHideTimer])

    const handleInputDoubleClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
        event.currentTarget.select()
        showTemporarily()
    }, [showTemporarily])

    const updatePageInfo = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber)
        setInputPage(pageNumber.toString())
    }, [])

    const isValidPage = useCallback(
        (page: number): boolean => {
            return !isNaN(page) && page >= 1 && page <= totalPages
        },
        [totalPages]
    )

    const handlePageChange = useCallback(
        (page: number) => {
            if (!pdfViewer || !isValidPage(page)) return

            showTemporarily()
            setIsPageChanging(true)

            try {
                pdfViewer.currentPageNumber = page
                setCurrentPage(page)
                setInputPage(page.toString())
            } catch (error) {
                console.error('Error changing page:', error)
            } finally {
                setIsPageChanging(false)
            }
        },
        [pdfViewer, isValidPage, showTemporarily]
    )

    const handleInputPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        showTemporarily()
        const value = e.target.value
        if (value === '' || /^\d+$/.test(value)) {
            setInputPage(value)
        }
    }

    const handleGoToPage = useCallback(() => {
        showTemporarily()
        const page = parseInt(inputPage, 10)
        if (isValidPage(page)) {
            handlePageChange(page)
        } else {
            setInputPage(currentPage.toString())
        }
    }, [inputPage, currentPage, handlePageChange, isValidPage, showTemporarily])

    const handlePrevPage = useCallback(() => {
        showTemporarily()
        if (currentPage > 1) {
            handlePageChange(currentPage - 1)
        }
    }, [currentPage, handlePageChange, showTemporarily])

    const handleNextPage = useCallback(() => {
        showTemporarily()
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1)
        }
    }, [currentPage, totalPages, handlePageChange, showTemporarily])

    /** pdf.js 事件监听 */
    useEffect(() => {
        if (!pdfViewer) return

        const onPageChange = ({ pageNumber }: { pageNumber: number }) => {
            updatePageInfo(pageNumber)
            setIsPageChanging(false)
            showTemporarily()
        }

        if (isReady) {
            const initialPage = pdfViewer.currentPageNumber || 1
            const initialTotalPages = pdfViewer.pagesCount || 1
            setCurrentPage(initialPage)
            setInputPage(initialPage.toString())
            setTotalPages(initialTotalPages)
            setEnabled(true)
            showTemporarily()
        }

        pdfViewer.eventBus.on('pagechanging', onPageChange)

        return () => {
            pdfViewer.eventBus.off('pagechanging', onPageChange)
        }
    }, [pdfViewer, isReady, updatePageInfo, showTemporarily])

    /** 监听 PDF 容器滚动 */
    useEffect(() => {
        if (!pdfViewer?.container) return

        const container = pdfViewer.container

        const onScroll = () => {
            showTemporarily()
        }

        container.addEventListener('scroll', onScroll, { passive: true })
        container.addEventListener('wheel', onScroll, { passive: true })

        return () => {
            container.removeEventListener('scroll', onScroll)
            container.removeEventListener('wheel', onScroll)
        }
    }, [pdfViewer, showTemporarily])

    useEffect(() => clearHideTimer, [clearHideTimer])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGoToPage()
        } else if (e.key === 'Escape') {
            setInputPage(currentPage.toString())
        }
    }

    const handleBlur = () => {
        interactionRef.current.inputFocused = false
        handleGoToPage()
        scheduleHide()
    }

    const isInputValid = inputPage === '' || isValidPage(parseInt(inputPage, 10))

    return (
        <Box
            position="absolute"
            bottom="20px"
            left="50%"
            style={{
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(60, 60, 60, 0.85)',
                color: '#fff',
                borderRadius: '4px',
                opacity: enabled && visible ? 1 : 0,
                pointerEvents: enabled && visible ? 'auto' : 'none',
                transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Flex gap="2" align="center" pt="1" pl="1" pr="2" pb="1">
                <IconButton
                    style={{
                        color: currentPage <= 1 || isPageChanging ? '#aaa' : '#fff',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    color="gray"
                    variant="soft"
                    onClick={handlePrevPage}
                    size="1"
                    disabled={currentPage <= 1 || isPageChanging}
                    aria-label={t('viewer:navigation.previousPage')}
                >
                    <AiOutlineLeft />
                </IconButton>

                <Flex align="center" gap="1" pr="2">
                    <TextField.Root
                        size="1"
                        value={inputPage}
                        onChange={handleInputPageChange}
                        onFocus={handleInputFocus}
                        onBlur={handleBlur}
                        onDoubleClick={handleInputDoubleClick}
                        onKeyDown={handleKeyDown}
                        disabled={isPageChanging}
                        aria-label={t('viewer:navigation.pageInput')}
                        style={{
                            width: 30,
                            fontWeight: 'bold',
                            textAlign: 'right',
                            color: '#fff',
                            paddingRight: 5,
                            '--text-field-border-width': 0,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderColor: isInputValid ? undefined : 'red'
                        } as React.CSSProperties & { '--text-field-border-width': number }}
                    />
                    <Text
                        style={{
                            minWidth: 30
                        }}
                        size="1"
                        weight="medium"
                    >
                        / {totalPages}
                    </Text>
                </Flex>

                <IconButton
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    color="gray"
                    variant="ghost"
                    disabled={currentPage >= totalPages || isPageChanging}
                    onClick={handleNextPage}
                    size="1"
                    aria-label={t('viewer:navigation.nextPage')}
                    style={{
                        color: currentPage >= totalPages || isPageChanging ? '#aaa' : '#fff',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                    }}
                >
                    <AiOutlineRight />
                </IconButton>
            </Flex>
        </Box>
    )
}
