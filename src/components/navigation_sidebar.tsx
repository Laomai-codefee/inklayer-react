import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Tabs } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import { PdfThumbnailList } from './pdf_thumbnail_list'
import { PdfOutline } from './pdf_outline'
import {
    NAVIGATION_PAGE_MARKERS_CHANGED_EVENT,
    type NavigationPageMarkersChangedEvent,
} from './navigation_page_markers'
import styles from './navigation_sidebar.module.scss'

type NavigationPanelKey = 'thumbnails' | 'outline'

interface NavigationSidebarProps {
    open: boolean
    onClose: () => void
    onTransitionEnd?: React.TransitionEventHandler<HTMLElement>
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
    open,
    onClose,
    onTransitionEnd,
}) => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const { eventBus } = usePdfViewerContext()
    const [activePanel, setActivePanel] = useState<NavigationPanelKey>('thumbnails')
    const [markerSources, setMarkerSources] = useState<
        Map<string, ReadonlyMap<number, number>>
    >(() => new Map())

    const handlePanelChange = useCallback((value: string) => {
        if (value === 'thumbnails' || value === 'outline') {
            setActivePanel(value)
        }
    }, [])

    useEffect(() => {
        if (!eventBus) return

        const handleMarkersChanged = ({
            source,
            markers,
        }: NavigationPageMarkersChangedEvent) => {
            setMarkerSources((currentSources) => {
                const nextSources = new Map(currentSources)
                if (markers.size > 0) {
                    nextSources.set(source, markers)
                } else {
                    nextSources.delete(source)
                }
                return nextSources
            })
        }

        eventBus.on(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, handleMarkersChanged)
        return () => {
            eventBus.off(NAVIGATION_PAGE_MARKERS_CHANGED_EVENT, handleMarkersChanged)
        }
    }, [eventBus])

    const pageMarkerCounts = useMemo(() => {
        const counts = new Map<number, number>()
        markerSources.forEach((markers) => {
            markers.forEach((count, pageNumber) => {
                counts.set(pageNumber, (counts.get(pageNumber) ?? 0) + count)
            })
        })
        return counts
    }, [markerSources])

    const handleOutlineNavigate = useCallback(() => {
        if (window.matchMedia('(max-width: 840px)').matches) {
            onClose()
        }
    }, [onClose])

    return (
        <>
            <aside
                id="InkLayer-navigation-sidebar"
                className={[
                    styles.navigationSidebar,
                    !open ? styles['navigationSidebar--hidden'] : '',
                ].join(' ')}
                aria-label={t('viewer:navigation.label')}
                aria-hidden={!open}
                onTransitionEnd={onTransitionEnd}
            >
                <div className={styles.navigationSidebarContainer} hidden={!open}>
                    <Tabs.Root
                        value={activePanel}
                        onValueChange={handlePanelChange}
                        className={styles.navigationTabs}
                    >
                        <Tabs.List className={styles.navigationTabsList}>
                            <Tabs.Trigger
                                value="thumbnails"
                                className={styles.navigationTabsTrigger}
                            >
                                <span>{t('viewer:navigation.thumbnails')}</span>
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                value="outline"
                                className={styles.navigationTabsTrigger}
                            >
                                <span>{t('viewer:navigation.outline')}</span>
                            </Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content
                            value="thumbnails"
                            className={styles.navigationTabsContent}
                        >
                            <PdfThumbnailList pageMarkerCounts={pageMarkerCounts} />
                        </Tabs.Content>
                        <Tabs.Content
                            value="outline"
                            className={styles.navigationTabsContent}
                        >
                            <PdfOutline onNavigate={handleOutlineNavigate} />
                        </Tabs.Content>
                    </Tabs.Root>
                </div>
            </aside>
            {open && (
                <div
                    className={styles.navigationSidebarOverlay}
                    onClick={onClose}
                />
            )}
        </>
    )
}
