import React, { useState } from 'react'
import { HoverCard } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'

import type { IAnnotationStore } from '../../const/definitions'
import { createAnnotationPreview } from './annotation_preview'
import styles from './styles.module.scss'

interface AnnotationReferenceHoverCardProps {
    annotation: IAnnotationStore
    children: React.ReactElement
    onActivate: (annotationId: string) => void
}

export const AnnotationReferenceHoverCard: React.FC<AnnotationReferenceHoverCardProps> = ({
    annotation,
    children,
    onActivate
}) => {
    const { t } = useTranslation('annotator', { useSuspense: false })
    const [open, setOpen] = useState(false)
    const preview = createAnnotationPreview(annotation.contentsObj?.text)
    const authorName = annotation.user?.name || annotation.title
    const replyCount = annotation.comments?.length ?? 0
    const referenceLabel = annotation.referenceNumber === undefined
        ? annotation.title
        : `#${annotation.referenceNumber}`

    const activate = () => {
        setOpen(false)
        onActivate(annotation.id)
    }

    return (
        <HoverCard.Root
            open={open}
            onOpenChange={setOpen}
            openDelay={350}
            closeDelay={150}
        >
            <HoverCard.Trigger>
                {children}
            </HoverCard.Trigger>
            <HoverCard.Content
                align="center"
                size="2"
                className={styles.card}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <span className={styles.identity}>
                        <button
                            type="button"
                            className={styles.referenceLabel}
                            aria-label={t('comment.reference.open', {
                                value: referenceLabel
                            })}
                            onClick={activate}
                        >
                            {referenceLabel}
                        </button>
                        <span className={styles.separator} aria-hidden="true">·</span>
                        <span className={styles.author}>{authorName}</span>
                    </span>
                    <span className={styles.page}>
                        {t('comment.reference.previewPage', {
                            value: annotation.pageNumber
                        })}
                    </span>
                </div>
                <p className={preview ? styles.preview : styles.empty}>
                    {preview || t('comment.reference.previewNoContent')}
                </p>
                {
                    replyCount > 0
                        ? (
                            <div className={styles.footer}>
                                {t('comment.reference.replyCount', {
                                    count: replyCount
                                })}
                            </div>
                        )
                        : null
                }
            </HoverCard.Content>
        </HoverCard.Root>
    )
}
