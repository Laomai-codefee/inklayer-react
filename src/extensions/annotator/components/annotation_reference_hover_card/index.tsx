import React, { useState } from 'react'
import { HoverCard } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'

import type { IAnnotationComment, IAnnotationStore } from '../../const/definitions'
import { createAnnotationPreview } from './annotation_preview'
import styles from './styles.module.scss'

interface AnnotationReferenceHoverCardProps {
    annotation: IAnnotationStore
    children: React.ReactElement
    onActivate?: (annotationId: string) => void
    onOpenChange?: (open: boolean) => void
    previewComments?: readonly IAnnotationComment[]
}

export const AnnotationReferenceHoverCard: React.FC<AnnotationReferenceHoverCardProps> = ({
    annotation,
    children,
    onActivate,
    onOpenChange,
    previewComments = []
}) => {
    const { t } = useTranslation('annotator', { useSuspense: false })
    const [open, setOpen] = useState(false)
    const annotationPreview = createAnnotationPreview(annotation.contentsObj?.text)
    const selectedTextPreview = createAnnotationPreview(annotation.contentsObj?.selectedText)
    const hasDeletedCommentPreview = previewComments.length > 0
    const hasPreview = Boolean(annotationPreview || selectedTextPreview || hasDeletedCommentPreview)
    const authorName = annotation.user?.name || annotation.title
    const replyCount = annotation.comments?.length ?? 0
    const referenceLabel = annotation.referenceNumber === undefined
        ? annotation.title
        : `#${annotation.referenceNumber}`

    const activate = () => {
        if (!onActivate) return
        setOpen(false)
        onActivate(annotation.id)
    }

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        onOpenChange?.(nextOpen)
    }

    return (
        <HoverCard.Root
            open={open}
            onOpenChange={handleOpenChange}
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
                        {
                            onActivate
                                ? (
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
                                )
                                : <span className={styles.referenceLabelStatic}>{referenceLabel}</span>
                        }
                        <span className={styles.separator} aria-hidden="true">·</span>
                        <span className={styles.author}>{authorName}</span>
                    </span>
                    <span className={styles.page}>
                        {t('comment.reference.previewPage', {
                            value: annotation.pageNumber
                        })}
                    </span>
                </div>
                {
                    selectedTextPreview
                        ? (
                            <blockquote className={styles.selectedText}>
                                {selectedTextPreview}
                            </blockquote>
                        )
                        : null
                }
                {
                    !hasDeletedCommentPreview && annotationPreview
                        ? <p className={styles.preview}>{annotationPreview}</p>
                        : null
                }
                {
                    hasDeletedCommentPreview
                        ? (
                            <section className={styles.deletedComments}>
                                <div className={styles.deletedCommentsTitle}>
                                    {t('deleteUndo.deletedCommentPreview')}
                                </div>
                                {previewComments.slice(0, 3).map((comment) => (
                                    <div className={styles.deletedComment} key={comment.id}>
                                        <span className={styles.deletedCommentAuthor}>
                                            {comment.user?.name || comment.title}
                                        </span>
                                        <p className={styles.deletedCommentContent}>
                                            {createAnnotationPreview(comment.content)
                                                || t('comment.reference.previewNoContent')}
                                        </p>
                                    </div>
                                ))}
                                {
                                    previewComments.length > 3
                                        ? (
                                            <div className={styles.deletedCommentsMore}>
                                                {t('deleteUndo.deletedCommentsMore', {
                                                    count: previewComments.length - 3
                                                })}
                                            </div>
                                        )
                                        : null
                                }
                            </section>
                        )
                        : null
                }
                {
                    hasPreview
                        ? null
                        : (
                            <p className={styles.empty}>
                                {t('comment.reference.previewNoContent')}
                            </p>
                        )
                }
                {
                    replyCount > 0 && !hasDeletedCommentPreview
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
