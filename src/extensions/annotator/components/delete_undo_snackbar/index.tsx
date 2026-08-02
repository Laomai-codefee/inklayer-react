import React, { useCallback, useRef, useSyncExternalStore } from 'react'
import { Button, Callout, Flex } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'
import { usePainter } from '../../context/use_painter'
import { AnnotationReferenceHoverCard } from '../annotation_reference_hover_card'
import styles from './styles.module.scss'
import {
    getDeleteUndoMessage,
    getDeleteUndoMessageSegments,
    type DeleteUndoTranslate
} from './message'

export function DeleteUndoSnackbar() {
    const { painter } = usePainter()
    const { t, i18n } = useTranslation(['common', 'annotator'], { useSuspense: false })
    const snackbarRef = useRef<HTMLDivElement>(null)
    const hoveredRef = useRef(false)
    const focusedRef = useRef(false)
    const openReferencesRef = useRef(new Set<string>())
    const subscribe = useCallback(
        (listener: () => void) => painter?.subscribeDeleteUndo(listener) ?? (() => {}),
        [painter]
    )
    const getSnapshot = useCallback(
        () => painter?.getDeleteUndoSnapshot() ?? null,
        [painter]
    )
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null)

    if (!snapshot) return null

    const message = getDeleteUndoMessage(snapshot, t as DeleteUndoTranslate, i18n.resolvedLanguage ?? i18n.language)
    const segments = getDeleteUndoMessageSegments(message, snapshot.items)

    const handleReferenceOpenChange = (key: string, open: boolean) => {
        if (open) {
            openReferencesRef.current.add(key)
            painter?.pauseDeleteUndo()
            return
        }
        openReferencesRef.current.delete(key)
        if (!hoveredRef.current && !focusedRef.current && openReferencesRef.current.size === 0) {
            painter?.resumeDeleteUndo()
        }
    }

    return (
        <div className={styles.overlay}>
            <Callout.Root
                ref={snackbarRef}
                className={styles.snackbar}
                size="1"
                role="status"
                aria-live="polite"
                onMouseEnter={() => {
                    hoveredRef.current = true
                    painter?.pauseDeleteUndo()
                }}
                onMouseLeave={() => {
                    hoveredRef.current = false
                    if (!focusedRef.current && openReferencesRef.current.size === 0) painter?.resumeDeleteUndo()
                }}
                onFocusCapture={() => {
                    focusedRef.current = true
                    painter?.pauseDeleteUndo()
                }}
                onBlurCapture={(event) => {
                    if (snackbarRef.current?.contains(event.relatedTarget as Node | null)) return
                    focusedRef.current = false
                    if (!hoveredRef.current && openReferencesRef.current.size === 0) painter?.resumeDeleteUndo()
                }}
            >
                <Flex className={styles.content} align="center" gap="2">
                    <Callout.Text className={styles.message}>
                        {segments.map((segment, index) => {
                            if (segment.kind === 'text') {
                                return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>
                            }
                            const key = `${segment.annotation.id}-${index}`
                            return (
                                <AnnotationReferenceHoverCard
                                    key={key}
                                    annotation={segment.annotation}
                                    previewComments={segment.comments}
                                    onOpenChange={(open) => handleReferenceOpenChange(key, open)}
                                >
                                    <button className={styles.reference} type="button">
                                        {segment.value}
                                    </button>
                                </AnnotationReferenceHoverCard>
                            )
                        })}
                    </Callout.Text>
                    <Button
                        size="1"
                        onClick={() => painter?.undoDelete()}
                    >
                        {t(snapshot.totalCount === 1 ? 'common:restore' : 'common:restoreAll')}
                    </Button>
                </Flex>
            </Callout.Root>
        </div>
    )
}
