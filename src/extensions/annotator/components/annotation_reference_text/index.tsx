import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
    IAnnotationReference,
    IAnnotationStore
} from '../../const/definitions'
import { synchronizeAnnotationReferenceLabels } from '../../references/annotation_reference'
import { createAnnotationReferenceSegments } from './reference_segments'
import styles from './styles.module.scss'

interface AnnotationReferenceTextProps {
    annotations: readonly IAnnotationStore[]
    content: string | undefined
    references: readonly IAnnotationReference[] | undefined
    onActivate: (annotationId: string) => void
}

export const AnnotationReferenceText: React.FC<AnnotationReferenceTextProps> = ({
    annotations,
    content = '',
    references,
    onActivate
}) => {
    const { t } = useTranslation('annotator', { useSuspense: false })
    const annotationsById = useMemo(
        () => new Map(annotations.map((annotation) => [annotation.id, annotation])),
        [annotations]
    )
    const synchronized = useMemo(
        () => synchronizeAnnotationReferenceLabels(content, references, annotations),
        [annotations, content, references]
    )
    const segments = useMemo(
        () => createAnnotationReferenceSegments(
            synchronized.content,
            synchronized.references
        ),
        [synchronized]
    )

    return (
        <span className={styles.content}>
            {segments.map((segment, index) => {
                if (segment.kind === 'text') {
                    return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>
                }

                const target = annotationsById.get(segment.annotationId)
                if (!target) {
                    return (
                        <span
                            key={`reference-${segment.annotationId}-${index}`}
                            className={styles.unavailable}
                            aria-label={t('comment.reference.unavailable', {
                                value: segment.value
                            })}
                            title={t('comment.reference.unavailable', {
                                value: segment.value
                            })}
                        >
                            {segment.value}
                        </span>
                    )
                }

                return (
                    <button
                        key={`reference-${segment.annotationId}-${index}`}
                        className={styles.reference}
                        type="button"
                        aria-label={t('comment.reference.open', {
                            value: segment.value
                        })}
                        title={t('comment.reference.open', {
                            value: segment.value
                        })}
                        onClick={(event) => {
                            event.stopPropagation()
                            onActivate(segment.annotationId)
                        }}
                    >
                        {segment.value}
                    </button>
                )
            })}
        </span>
    )
}
