import React, {
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import {
    Badge,
    Button,
    Flex,
    Popover,
    Text,
    TextArea
} from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'

import type {
    IAnnotationReference,
    IAnnotationStore
} from '../../const/definitions'
import { annotationDefinitions } from '../../const/definitions'
import {
    normalizeAnnotationReferences,
    synchronizeAnnotationReferenceLabels,
    type AnnotationReferenceContent
} from '../../references/annotation_reference'
import { formatPDFDate } from '../../utils/utils'
import {
    filterAnnotationReferenceCandidates,
    findAnnotationReferenceQuery,
    type AnnotationReferenceQuery
} from './reference_query'
import { AnnotationTypeIcon } from '../annotation_type_icon'
import styles from './styles.module.scss'

const SEPARATOR_PREFIX_PATTERN = /^[\s.,!?;:'"<>/\\，。！？；：、“”‘’《》（）()[\]{}]/
const annotationTypeNames = new Map(
    annotationDefinitions.map((annotation) => [annotation.type, annotation.name])
)

export type AnnotationReferenceDraft = AnnotationReferenceContent

interface AnnotationReferenceInputProps {
    annotations: readonly IAnnotationStore[]
    excludeAnnotationId: string
    initialContent?: string
    initialReferences?: readonly IAnnotationReference[]
    className?: string
    placeholder?: string
    onSubmit: (draft: AnnotationReferenceDraft) => void
    onCancel: () => void
}

function getAnnotationSummary(annotation: IAnnotationStore): string {
    const contents = annotation.contentsObj
    return (contents?.text || contents?.selectedText || '')
        .replace(/\s+/g, ' ')
        .trim()
}

export const AnnotationReferenceInput: React.FC<AnnotationReferenceInputProps> = ({
    annotations,
    excludeAnnotationId,
    initialContent = '',
    initialReferences,
    className,
    placeholder,
    onSubmit,
    onCancel
}) => {
    const { t } = useTranslation(['annotator', 'common'], { useSuspense: false })
    const initialDraftRef = useRef<AnnotationReferenceDraft | null>(null)
    if (initialDraftRef.current === null) {
        initialDraftRef.current = synchronizeAnnotationReferenceLabels(
            initialContent,
            initialReferences,
            annotations
        )
    }
    const [content, setContent] = useState(initialDraftRef.current.content)
    const [references, setReferences] = useState<IAnnotationReference[]>(
        () => initialDraftRef.current?.references ?? []
    )
    const [query, setQuery] = useState<AnnotationReferenceQuery | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const pendingSelectionRef = useRef<number | null>(null)
    const isComposingRef = useRef(false)
    const blurFrameRef = useRef<number | null>(null)
    const optionRefs = useRef<Array<HTMLDivElement | null>>([])
    const listboxId = useId()

    const candidates = useMemo(
        () => filterAnnotationReferenceCandidates(
            annotations,
            query?.query ?? '',
            excludeAnnotationId
        ),
        [annotations, excludeAnnotationId, query?.query]
    )
    const menuOpen = query !== null
    const boundedActiveIndex = candidates.length > 0
        ? Math.min(activeIndex, candidates.length - 1)
        : 0

    useLayoutEffect(() => {
        const focusFrame = requestAnimationFrame(() => {
            textareaRef.current?.focus()
        })

        return () => cancelAnimationFrame(focusFrame)
    }, [])

    useLayoutEffect(() => {
        const selection = pendingSelectionRef.current
        if (selection === null) return

        pendingSelectionRef.current = null
        textareaRef.current?.focus()
        textareaRef.current?.setSelectionRange(selection, selection)
    }, [content])

    useLayoutEffect(() => {
        return () => {
            if (blurFrameRef.current !== null) {
                cancelAnimationFrame(blurFrameRef.current)
            }
        }
    }, [])

    useLayoutEffect(() => {
        if (!menuOpen) return
        optionRefs.current[boundedActiveIndex]?.scrollIntoView?.({
            block: 'nearest'
        })
    }, [boundedActiveIndex, menuOpen])

    const updateQuery = (nextContent: string, caretPosition: number) => {
        const nextQuery = findAnnotationReferenceQuery(nextContent, caretPosition)
        setQuery(nextQuery)
        setActiveIndex(0)
    }

    const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nextContent = event.target.value
        setContent(nextContent)
        setReferences(normalizeAnnotationReferences(nextContent, references) ?? [])
        if (!isComposingRef.current) {
            updateQuery(nextContent, event.target.selectionStart)
        }
    }

    const insertReference = (annotation: IAnnotationStore) => {
        if (!query || annotation.referenceNumber === undefined) return

        const label = `#${annotation.referenceNumber}`
        const before = content.slice(0, query.start)
        const after = content.slice(query.end)
        const separator = after.length === 0 || !SEPARATOR_PREFIX_PATTERN.test(after)
            ? ' '
            : ''
        const nextContent = `${before}${label}${separator}${after}`
        const nextReferences = [
            ...references.filter((reference) => reference.label !== label),
            {
                type: 'annotation' as const,
                annotationId: annotation.id,
                label
            }
        ]

        pendingSelectionRef.current = before.length + label.length + separator.length
        setContent(nextContent)
        setReferences(normalizeAnnotationReferences(nextContent, nextReferences) ?? [])
        setQuery(null)
        setActiveIndex(0)
    }

    const submit = () => {
        onSubmit(synchronizeAnnotationReferenceLabels(
            content,
            references,
            annotations
        ))
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.nativeEvent.isComposing
            || isComposingRef.current
            || event.keyCode === 229
        ) {
            return
        }

        if (menuOpen) {
            if (event.key === 'ArrowDown') {
                event.preventDefault()
                if (candidates.length > 0) {
                    setActiveIndex((boundedActiveIndex + 1) % candidates.length)
                }
                return
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault()
                if (candidates.length > 0) {
                    setActiveIndex((boundedActiveIndex - 1 + candidates.length) % candidates.length)
                }
                return
            }
            if (event.key === 'Enter') {
                event.preventDefault()
                const candidate = candidates[boundedActiveIndex]
                if (candidate) insertReference(candidate)
                return
            }
            if (event.key === 'Escape') {
                event.preventDefault()
                setQuery(null)
                return
            }
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
            return
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
        }
    }

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        if (
            event.relatedTarget instanceof Node
            && (
                rootRef.current?.contains(event.relatedTarget)
                || menuRef.current?.contains(event.relatedTarget)
            )
        ) {
            return
        }
        if (blurFrameRef.current !== null) {
            cancelAnimationFrame(blurFrameRef.current)
        }
        blurFrameRef.current = requestAnimationFrame(() => {
            blurFrameRef.current = null
            if (
                !rootRef.current?.contains(document.activeElement)
                && !menuRef.current?.contains(document.activeElement)
            ) {
                onCancel()
            }
        })
    }

    return (
        <div
            ref={rootRef}
            data-annotation-editor
            className={`${styles.referenceInput} ${className ?? ''}`}
            onBlurCapture={handleBlur}
            onClick={(event) => event.stopPropagation()}
        >
            <div className={styles.editor}>
                <Popover.Root
                    open={menuOpen}
                    onOpenChange={(open) => {
                        if (!open) setQuery(null)
                    }}
                >
                    <Popover.Trigger>
                        <TextArea
                            ref={textareaRef}
                            value={content}
                            rows={4}
                            size="1"
                            placeholder={placeholder}
                            role="combobox"
                            aria-label={t('annotator:comment.reference.inputLabel')}
                            aria-autocomplete="list"
                            aria-haspopup="listbox"
                            aria-expanded={menuOpen}
                            aria-controls={menuOpen ? listboxId : undefined}
                            aria-activedescendant={
                                menuOpen && candidates.length > 0
                                    ? `${listboxId}-option-${boundedActiveIndex}`
                                    : undefined
                            }
                            onChange={handleContentChange}
                            onClick={(event) => updateQuery(event.currentTarget.value, event.currentTarget.selectionStart)}
                            onKeyDown={handleKeyDown}
                            onKeyUp={(event) => {
                                if (!isComposingRef.current && !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
                                    updateQuery(event.currentTarget.value, event.currentTarget.selectionStart)
                                }
                            }}
                            onCompositionStart={() => {
                                isComposingRef.current = true
                            }}
                            onCompositionEnd={(event) => {
                                isComposingRef.current = false
                                updateQuery(event.currentTarget.value, event.currentTarget.selectionStart)
                            }}
                        />
                    </Popover.Trigger>

                    <Popover.Content
                        ref={menuRef}
                        container={rootRef.current}
                        id={listboxId}
                        className={styles.referenceMenu}
                        role="listbox"
                        size="1"
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        collisionPadding={8}
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onCloseAutoFocus={(event) => {
                            event.preventDefault()
                            textareaRef.current?.focus()
                        }}
                    >
                        {candidates.length > 0 ? candidates.map((annotation, index) => {
                            const summary = getAnnotationSummary(annotation)
                            const typeName = annotationTypeNames.get(annotation.type)
                            const typeLabel = typeName
                                ? t(`annotator:tool.${typeName}`)
                                : annotation.subtype
                            const formattedDate = formatPDFDate(annotation.date)
                            return (
                                <div
                                    id={`${listboxId}-option-${index}`}
                                    key={annotation.id}
                                    ref={(element) => {
                                        optionRefs.current[index] = element
                                    }}
                                    role="option"
                                    aria-selected={index === boundedActiveIndex}
                                    className={styles.referenceOption}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => insertReference(annotation)}
                                >
                                    <Flex align="center" gap="2" className={styles.referenceOptionHeader}>
                                        <Badge size="1" radius="full" variant="soft">
                                            #{annotation.referenceNumber}
                                        </Badge>
                                        <Text as="span" size="1" color="gray" className={styles.referencePage}>
                                            {t('annotator:comment.page', { value: annotation.pageNumber })}
                                        </Text>
                                    </Flex>
                                    <Text as="span" size="2" className={styles.referenceSummary}>
                                        {summary || t('annotator:comment.reference.noContent')}
                                    </Text>
                                    <Text as="span" size="1" color="gray" className={styles.referenceMeta}>
                                        <AnnotationTypeIcon
                                            type={annotation.type}
                                            label={typeLabel}
                                            className={styles.referenceTypeIcon}
                                            decorative
                                            showTooltip={false}
                                        />
                                        <span className={styles.referenceAuthor}>
                                            {annotation.title}
                                        </span>

                                        {formattedDate && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span className={styles.referenceDate}>
                                                    {formattedDate}
                                                </span>
                                            </>
                                        )}
                                    </Text>
                                </div>
                            )
                        }) : (
                            <Text as="div" size="2" color="gray" className={styles.referenceEmpty}>
                                {t('annotator:comment.reference.empty')}
                            </Text>
                        )}
                    </Popover.Content>
                </Popover.Root>
            </div>

            <Button
                type="button"
                className={styles.submit}
                onMouseDown={(event) => event.preventDefault()}
                onClick={submit}
            >
                {t('common:confirm')}
            </Button>
        </div>
    )
}
