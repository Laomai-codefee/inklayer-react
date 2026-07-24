import React, { useCallback, useState } from 'react'
import { Tabs } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'
import styles from './navigation_sidebar.module.scss'

type NavigationPanelKey = 'thumbnails' | 'outline'

interface NavigationSidebarProps {
    open: boolean
    onClose: () => void
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ open, onClose }) => {
    const { t } = useTranslation(['viewer'], { useSuspense: false })
    const [activePanel, setActivePanel] = useState<NavigationPanelKey>('thumbnails')

    const handlePanelChange = useCallback((value: string) => {
        if (value === 'thumbnails' || value === 'outline') {
            setActivePanel(value)
        }
    }, [])

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
            >
                <div className={styles.navigationSidebarContainer}>
                    {open && (
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
                            />
                            <Tabs.Content
                                value="outline"
                                className={styles.navigationTabsContent}
                            />
                        </Tabs.Root>
                    )}
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
