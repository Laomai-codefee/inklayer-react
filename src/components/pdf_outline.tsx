import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useTranslation } from 'react-i18next'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import styles from './pdf_outline.module.scss'

type PdfOutlineItemBase = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number]
type PdfOutlineItem = Omit<PdfOutlineItemBase, 'items'> & {
    items: PdfOutlineItem[]
}

interface PdfPageReference {
    num: number
    gen: number
}

interface PdfOutlineProps {
    onNavigate?: () => void
}

interface OutlineItemProps {
    depth: number
    item: PdfOutlineItem
    itemKey: string
    selectedItemKey: string | null
    onNavigate: (item: PdfOutlineItem, itemKey: string) => void
}

const isPageReference = (value: unknown): value is PdfPageReference => {
    if (!value || typeof value !== 'object') return false
    const reference = value as Partial<PdfPageReference>
    return Number.isInteger(reference.num) && Number.isInteger(reference.gen)
}

const OutlineItem = memo<OutlineItemProps>(({
    depth,
    item,
    itemKey,
    selectedItemKey,
    onNavigate,
}) => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const hasChildren = item.items.length > 0
    const [expanded, setExpanded] = useState(() => item.count === undefined || item.count >= 0)
    const title = item.title.trim() || t('viewer:navigation.untitledOutlineItem')
    const canNavigate = item.dest !== null
    const selected = selectedItemKey === itemKey

    const handleTitleClick = () => {
        if (canNavigate) {
            onNavigate(item, itemKey)
        } else if (hasChildren) {
            setExpanded((current) => !current)
        }
    }

    return (
        <li
            role="treeitem"
            aria-expanded={hasChildren ? expanded : undefined}
            className={styles.outlineItem}
        >
            <div
                className={[
                    styles.outlineRow,
                    selected ? styles['outlineRow--selected'] : '',
                ].join(' ')}
                style={{ paddingLeft: `${8 + Math.min(depth, 8) * 12}px` }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        className={styles.outlineToggle}
                        aria-label={t(expanded
                            ? 'viewer:navigation.collapseOutlineItem'
                            : 'viewer:navigation.expandOutlineItem', { title })}
                        aria-controls={`${itemKey}-children`}
                        aria-expanded={expanded}
                        onClick={() => setExpanded((current) => !current)}
                    >
                        <span
                            className={[
                                styles.outlineChevron,
                                expanded ? styles['outlineChevron--expanded'] : '',
                            ].join(' ')}
                        />
                    </button>
                ) : (
                    <span className={styles.outlineToggleSpacer} />
                )}
                {item.url ? (
                    <a
                        className={styles.outlineTitle}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontStyle: item.italic ? 'italic' : undefined,
                            fontWeight: item.bold ? 600 : undefined,
                        }}
                        onClick={() => onNavigate(item, itemKey)}
                    >
                        {title}
                    </a>
                ) : (
                    <button
                        type="button"
                        className={styles.outlineTitle}
                        disabled={!canNavigate && !hasChildren}
                        aria-current={selected ? 'location' : undefined}
                        style={{
                            fontStyle: item.italic ? 'italic' : undefined,
                            fontWeight: item.bold ? 600 : undefined,
                        }}
                        onClick={handleTitleClick}
                    >
                        {title}
                    </button>
                )}
            </div>
            {hasChildren && expanded && (
                <ul id={`${itemKey}-children`} role="group" className={styles.outlineTree}>
                    {item.items.map((child, index) => (
                        <OutlineItem
                            key={`${itemKey}-${index}`}
                            itemKey={`${itemKey}-${index}`}
                            item={child}
                            depth={depth + 1}
                            selectedItemKey={selectedItemKey}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            )}
        </li>
    )
})

OutlineItem.displayName = 'OutlineItem'

interface OutlineState {
    document: PDFDocumentProxy | null
    status: 'loading' | 'ready' | 'error'
    items: PdfOutlineItem[]
}

export const PdfOutline: React.FC<PdfOutlineProps> = ({ onNavigate }) => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const { pdfDocument, pdfViewer } = usePdfViewerContext()
    const navigationGenerationRef = useRef(0)
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
    const [outlineState, setOutlineState] = useState<OutlineState>({
        document: null,
        status: 'loading',
        items: [],
    })

    useEffect(() => {
        if (!pdfDocument) {
            setOutlineState({ document: null, status: 'loading', items: [] })
            return
        }

        let disposed = false
        navigationGenerationRef.current += 1
        setSelectedItemKey(null)
        setOutlineState({ document: pdfDocument, status: 'loading', items: [] })

        void pdfDocument.getOutline().then(
            (items) => {
                if (!disposed) {
                    setOutlineState({
                        document: pdfDocument,
                        status: 'ready',
                        items: items ?? [],
                    })
                }
            },
            () => {
                if (!disposed) {
                    setOutlineState({
                        document: pdfDocument,
                        status: 'error',
                        items: [],
                    })
                }
            }
        )

        return () => {
            disposed = true
            navigationGenerationRef.current += 1
        }
    }, [pdfDocument])

    const handleNavigate = useCallback(async (item: PdfOutlineItem, itemKey: string) => {
        const generation = navigationGenerationRef.current + 1
        navigationGenerationRef.current = generation

        if (item.url) {
            onNavigate?.()
            return
        }
        if (!pdfDocument || !pdfViewer || item.dest === null) return

        try {
            const destination = typeof item.dest === 'string'
                ? await pdfDocument.getDestination(item.dest)
                : item.dest

            if (
                navigationGenerationRef.current !== generation
                || pdfViewer.pdfDocument !== pdfDocument
                || !Array.isArray(destination)
            ) {
                return
            }

            const destinationReference = destination[0]
            let pageNumber: number | null = null

            if (isPageReference(destinationReference)) {
                pageNumber = pdfDocument.cachedPageNumber(destinationReference)
                if (!pageNumber) {
                    pageNumber = (await pdfDocument.getPageIndex(destinationReference)) + 1
                }
            } else if (Number.isInteger(destinationReference)) {
                pageNumber = (destinationReference as number) + 1
            }

            if (
                navigationGenerationRef.current !== generation
                || pdfViewer.pdfDocument !== pdfDocument
                || !pageNumber
                || pageNumber < 1
                || pageNumber > pdfDocument.numPages
            ) {
                return
            }

            pdfViewer.scrollPageIntoView({
                pageNumber,
                destArray: destination,
            })
            setSelectedItemKey(itemKey)
            onNavigate?.()
        } catch {
            // Ignore malformed or unresolved PDF destinations.
        }
    }, [onNavigate, pdfDocument, pdfViewer])

    if (!pdfDocument || outlineState.document !== pdfDocument || outlineState.status === 'loading') {
        return <div className={styles.outlineState}>{t('viewer:navigation.outlineLoading')}</div>
    }

    if (outlineState.status === 'error') {
        return <div className={styles.outlineState}>{t('viewer:navigation.outlineError')}</div>
    }

    if (outlineState.items.length === 0) {
        return <div className={styles.outlineState}>{t('viewer:navigation.outlineEmpty')}</div>
    }

    return (
        <nav className={styles.outline} aria-label={t('viewer:navigation.outline')}>
            <ul role="tree" className={styles.outlineTree}>
                {outlineState.items.map((item, index) => (
                    <OutlineItem
                        key={`outline-${index}`}
                        itemKey={`outline-${index}`}
                        item={item}
                        depth={0}
                        selectedItemKey={selectedItemKey}
                        onNavigate={handleNavigate}
                    />
                ))}
            </ul>
        </nav>
    )
}
