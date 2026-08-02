import styles from './styles.module.scss';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { annotationDefinitions, CommentStatus, IAnnotationComment, IAnnotationStore, PdfjsAnnotationSubtype } from '../../const/definitions'
import { useTranslation } from 'react-i18next'
import { formatPDFCompactDateTime, formatTimestamp, generateUUID } from '../../utils/utils'
import { Button, Checkbox, DropdownMenu, Flex, IconButton, Popover, Text, Tooltip } from '@radix-ui/themes'
import {
    AiOutlineCheckCircle,
    AiOutlineDislike,
    AiOutlineEllipsis,
    AiOutlineExclamation,
    AiOutlineFilter,
    AiOutlineLike,
    AiOutlineMinusCircle,
    AiOutlineMinusSquare,
    AiOutlineStop
} from 'react-icons/ai'
import { SelectionSource, useAnnotationStore } from '../../store'
import { UserContext } from '@/context/user_context'
import { usePainter } from '../../context/use_painter'
import { usePdfViewerContext } from '@/context/pdf_viewer_context'
import {
    AnnotationReferenceInput,
    type AnnotationReferenceDraft
} from '../annotation_reference_input'
import { AnnotationReferenceText } from '../annotation_reference_text'
import {
    applyAnnotationCommentDraft,
    applyAnnotationReplyDraft,
    createAnnotationReply
} from './comment_mutations'
import { getAnnotationAuthorName } from '../../painter/editor/annotation_author_label'
import { isValidReferenceNumber } from '../../references/annotation_numbering'
import { AnnotationTypeIcon } from '../annotation_type_icon'
import { useAnnotationHoverSnapshot } from '../../context/use_annotation_hover'

interface StatusOption {
    labelKey: string // i18n key
    icon: React.ReactNode
}

type SidebarEditorState =
    | { kind: 'annotation-edit'; annotationId: string }
    | { kind: 'annotation-reply'; annotationId: string }
    | { kind: 'reply-edit'; annotationId: string; replyId: string }

const annotationToolNames = new Map(
    annotationDefinitions.map((annotation) => [annotation.type, annotation.name])
)

const commentStatusOptions: Record<CommentStatus, StatusOption> = {
    [CommentStatus.Accepted]: {
        labelKey: 'annotator:comment.status.accepted',
        icon: <AiOutlineLike />
    },
    [CommentStatus.Rejected]: {
        labelKey: 'annotator:comment.status.rejected',
        icon: <AiOutlineDislike />
    },
    [CommentStatus.Cancelled]: {
        labelKey: 'annotator:comment.status.cancelled',
        icon: <AiOutlineMinusCircle />
    },
    [CommentStatus.Completed]: {
        labelKey: 'annotator:comment.status.completed',
        icon: <AiOutlineCheckCircle />
    },
    [CommentStatus.Closed]: {
        labelKey: 'annotator:comment.status.closed',
        icon: <AiOutlineStop />
    },
    [CommentStatus.None]: {
        labelKey: 'annotator:comment.status.none',
        icon: <AiOutlineMinusSquare />
    }
}

/**
 * @description Sidebar
 */
const Sidebar: React.FC = () => {
    const annotations = useAnnotationStore((state) => state.annotations)
    const currentUser = useContext(UserContext)
    const { isSidebarCollapsed } = usePdfViewerContext()
    const { painter } = usePainter()
    const annotationHover = useAnnotationHoverSnapshot()
    const hoveredAnnotationId = annotationHover.annotationId
    const currentAnnotation = useAnnotationStore((state) => state.selectedAnnotation)
    const selectionRevision = useAnnotationStore((state) => state.selectionRevision)
    const setCurrentAnnotation = useAnnotationStore((state) => state.setSelectedAnnotation)
    const [editorState, setEditorState] = useState<SidebarEditorState | null>(null)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<PdfjsAnnotationSubtype[]>([])
    const [pendingReferenceAnnotationId, setPendingReferenceAnnotationId] = useState<string | null>(null)
    const knownUsersRef = useRef<Set<string> | null>(null)
    const knownTypesRef = useRef<Set<PdfjsAnnotationSubtype> | null>(null)
    const pointerHoveredAnnotationIdRef = useRef<string | null>(null)
    const focusedAnnotationIdRef = useRef<string | null>(null)
    const pendingMenuActionRef = useRef<(() => void) | null>(null)
    const pendingMenuActionFrameRef = useRef<number | null>(null)

    const { t } = useTranslation(['common', 'annotator'], { useSuspense: false })

    const activeEditorAnnotationId = editorState?.annotationId ?? null

    useEffect(() => {
        const selectedAnnotationId = currentAnnotation?.store?.id
        if (
            !selectedAnnotationId
            || currentAnnotation.source !== SelectionSource.CANVAS
            || isSidebarCollapsed
        ) {
            return
        }

        const annotation = useAnnotationStore.getState().getAnnotation(selectedAnnotationId)
        if (!annotation) return

        const canEdit = Boolean(painter?.can('annotation.edit', annotation))
        const isEmptyComment = annotation.contentsObj?.text === ''
        const isEmptyReply = annotation.comments?.length === 0
        // 根据批注归属与内容决定打开评论或回复。
        setEditorState(
            canEdit && isEmptyComment && isEmptyReply
                ? { kind: 'annotation-edit', annotationId: annotation.id }
                : painter?.can('annotation.comment', annotation)
                    ? { kind: 'annotation-reply', annotationId: annotation.id }
                    : null
        )
    }, [
        currentAnnotation?.source,
        currentAnnotation?.store?.id,
        isSidebarCollapsed,
        painter,
        selectionRevision
    ])

    const annotationRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const allUsers = useMemo(() => {
        const map = new Map<string, number>()
        annotations.forEach((a) => {
            map.set(a.title, (map.get(a.title) || 0) + 1)
        })
        return Array.from(map.entries()) // [title, count]
    }, [annotations])

    const allTypes = useMemo(() => {
        const types = new Map<PdfjsAnnotationSubtype, number>()
        annotations.forEach((a) => {
            types.set(a.subtype, (types.get(a.subtype) || 0) + 1)
        })
        return Array.from(types.entries()) // [subtype, count]
    }, [annotations])

    useEffect(() => {
        const nextUsers = new Set(allUsers.map(([user]) => user))
        const previousUsers = knownUsersRef.current
        knownUsersRef.current = nextUsers

        setSelectedUsers((previous) => {
            if (previousUsers === null) return Array.from(nextUsers)

            const retained = previous.filter((user) => nextUsers.has(user))
            const newlyAdded = Array.from(nextUsers).filter((user) => !previousUsers.has(user))
            const next = [...retained, ...newlyAdded]
            return next.length === previous.length
                && next.every((user, index) => user === previous[index])
                ? previous
                : next
        })
    }, [allUsers])

    useEffect(() => {
        const nextTypes = new Set(allTypes.map(([type]) => type))
        const previousTypes = knownTypesRef.current
        knownTypesRef.current = nextTypes

        setSelectedTypes((previous) => {
            if (previousTypes === null) return Array.from(nextTypes)

            const retained = previous.filter((type) => nextTypes.has(type))
            const newlyAdded = Array.from(nextTypes).filter((type) => !previousTypes.has(type))
            const next = [...retained, ...newlyAdded]
            return next.length === previous.length
                && next.every((type, index) => type === previous[index])
                ? previous
                : next
        })
    }, [allTypes])

    useEffect(() => {
        return () => {
            if (pendingMenuActionFrameRef.current !== null) {
                cancelAnimationFrame(pendingMenuActionFrameRef.current)
            }
            pendingMenuActionRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            const pointerHoveredId = pointerHoveredAnnotationIdRef.current
            const focusedId = focusedAnnotationIdRef.current
            if (pointerHoveredId) {
                painter?.clearAnnotationHover('sidebar-pointer', pointerHoveredId)
            }
            if (focusedId) {
                painter?.clearAnnotationHover('sidebar-focus', focusedId)
            }
            pointerHoveredAnnotationIdRef.current = null
            focusedAnnotationIdRef.current = null
        }
    }, [painter])

    const filteredAnnotations = useMemo(() => {
        if (selectedUsers.length === 0 || selectedTypes.length === 0) return []
        return Array.from(annotations.values()).filter((a) => selectedUsers.includes(a.title) && selectedTypes.includes(a.subtype))
    }, [annotations, selectedUsers, selectedTypes])

    useEffect(() => {
        if (!editorState) return

        const selectedAnnotationId = currentAnnotation?.store?.id
        const editorIsVisible = filteredAnnotations.some(
            (annotation) => annotation.id === editorState.annotationId
        )
        const canvasWillReplaceEditor = Boolean(
            selectedAnnotationId
            && selectedAnnotationId !== editorState.annotationId
            && currentAnnotation?.source === SelectionSource.CANVAS
        )
        if (
            editorIsVisible
            && !isSidebarCollapsed
            && (selectedAnnotationId === editorState.annotationId || canvasWillReplaceEditor)
        ) {
            return
        }

        setEditorState(null)
        if (focusedAnnotationIdRef.current === editorState.annotationId) {
            focusedAnnotationIdRef.current = null
            painter?.clearAnnotationHover('sidebar-focus', editorState.annotationId)
        }
    }, [
        currentAnnotation?.source,
        currentAnnotation?.store?.id,
        editorState,
        filteredAnnotations,
        isSidebarCollapsed,
        painter
    ])

    useEffect(() => {
        const visibleAnnotationIds = new Set(filteredAnnotations.map((annotation) => annotation.id))
        const pointerHoveredId = pointerHoveredAnnotationIdRef.current
        const focusedId = focusedAnnotationIdRef.current

        if (pointerHoveredId && (isSidebarCollapsed || !visibleAnnotationIds.has(pointerHoveredId))) {
            painter?.clearAnnotationHover('sidebar-pointer', pointerHoveredId)
            pointerHoveredAnnotationIdRef.current = null
        }
        if (focusedId && (isSidebarCollapsed || !visibleAnnotationIds.has(focusedId))) {
            painter?.clearAnnotationHover('sidebar-focus', focusedId)
            focusedAnnotationIdRef.current = null
        }
    }, [filteredAnnotations, isSidebarCollapsed, painter])

    const referenceCandidates = useMemo(
        () => Array.from(annotations.values()),
        [annotations]
    )

    const groupedAnnotations = useMemo(() => {
        return filteredAnnotations.reduce(
            (acc, annotation) => {
                if (!acc[annotation.pageNumber]) {
                    acc[annotation.pageNumber] = []
                }
                acc[annotation.pageNumber].push(annotation)
                return acc
            },
            {} as Record<number, IAnnotationStore[]>
        )
    }, [filteredAnnotations])

    useEffect(() => {
        if (!pendingReferenceAnnotationId) return

        const animationFrame = window.requestAnimationFrame(() => {
            const target = annotationRefs.current[pendingReferenceAnnotationId]
            if (!target) return

            target.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
            setPendingReferenceAnnotationId(null)
        })

        return () => window.cancelAnimationFrame(animationFrame)
    }, [groupedAnnotations, pendingReferenceAnnotationId])

    const handleUserToggle = (username: string) => {
        setSelectedUsers((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]))
    }

    const handleTypeToggle = (type: PdfjsAnnotationSubtype) => {
        setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
    }

    const filterContent = (
        <div className={styles.filter}>
            <Text as="div">{t('author')}</Text>
            <ul>
                {allUsers.map(([user, count]) => (
                    <li key={user}>
                        <Text as="label" size="2">
                            <Flex gap="2">
                                <Checkbox checked={selectedUsers.includes(user)} onCheckedChange={() => handleUserToggle(user)} />
                                {user} ({count})
                            </Flex>
                        </Text>
                    </li>
                ))}
            </ul>
            <Text as="div">{t('type')}</Text>
            <ul>
                {allTypes.map(([type, count]) => (
                    <li key={type}>
                        <Text as="label" size="2">
                            <Flex gap="2">
                                <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={() => handleTypeToggle(type)} />
                                {type} ({count})
                            </Flex>
                        </Text>
                    </li>
                ))}
            </ul>
            <Flex gap="3" mt="2" justify="between">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedUsers(allUsers.map(([u]) => u))
                        setSelectedTypes(allTypes.map(([t]) => t))
                    }}
                >
                    {t('selectAll')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedUsers([])
                        setSelectedTypes([])
                    }}
                >
                    {t('clear')}
                </Button>
            </Flex>
        </div>
    )

    const getLastStatus = (annotation: IAnnotationStore): CommentStatus => {
        const lastWithStatus = [...(annotation.comments || [])].reverse().find((c) => c.status !== undefined && c.status !== null)

        return lastWithStatus?.status ?? CommentStatus.None
    }

    const getLastStatusIcon = (annotation: IAnnotationStore): React.ReactNode => {
        const status = getLastStatus(annotation)
        return commentStatusOptions[status]?.icon ?? commentStatusOptions[CommentStatus.None].icon
    }

    const handleAnnotationClick = (annotation: IAnnotationStore) => {
        if (
            activeEditorAnnotationId
            && activeEditorAnnotationId !== annotation.id
        ) {
            setEditorState(null)
            clearAnnotationFocus(activeEditorAnnotationId)
        }
        setCurrentAnnotation(annotation, SelectionSource.SIDEBAR)
        void painter?.highlight(annotation)
    }

    const handleMenuTriggerPointerDown = (
        event: React.PointerEvent<HTMLButtonElement>
    ) => {
        if (!activeEditorAnnotationId) return

        event.preventDefault()
        event.stopPropagation()
        setEditorState(null)
        clearAnnotationFocus(activeEditorAnnotationId)
    }

    const openAnnotationReply = (annotation: IAnnotationStore) => {
        handleAnnotationClick(annotation)
        setEditorState({
            kind: 'annotation-reply',
            annotationId: annotation.id
        })
    }

    const openAnnotationEditor = (annotation: IAnnotationStore) => {
        handleAnnotationClick(annotation)
        setEditorState({
            kind: 'annotation-edit',
            annotationId: annotation.id
        })
    }

    const openReplyEditor = (
        annotation: IAnnotationStore,
        reply: IAnnotationComment
    ) => {
        handleAnnotationClick(annotation)
        setEditorState({
            kind: 'reply-edit',
            annotationId: annotation.id,
            replyId: reply.id
        })
    }

    const queueMenuAction = (action: () => void) => {
        pendingMenuActionRef.current = action
    }

    const handleMenuCloseAutoFocus = (event: Event) => {
        event.preventDefault()

        const action = pendingMenuActionRef.current
        pendingMenuActionRef.current = null
        if (!action) return

        if (pendingMenuActionFrameRef.current !== null) {
            cancelAnimationFrame(pendingMenuActionFrameRef.current)
        }
        pendingMenuActionFrameRef.current = requestAnimationFrame(() => {
            pendingMenuActionFrameRef.current = null
            action()
        })
    }

    const handleAnnotationPointerEnter = (annotationId: string, event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch') return
        pointerHoveredAnnotationIdRef.current = annotationId
        painter?.setAnnotationHover('sidebar-pointer', annotationId)
    }

    const handleAnnotationPointerLeave = (annotationId: string) => {
        if (pointerHoveredAnnotationIdRef.current === annotationId) {
            pointerHoveredAnnotationIdRef.current = null
        }
        painter?.clearAnnotationHover('sidebar-pointer', annotationId)
    }

    const getAnnotationFocusOwner = (target: EventTarget | null): string | null => {
        if (!(target instanceof Element)) return null
        return target.closest<HTMLElement>('[data-annotation-hover-owner]')
            ?.dataset.annotationHoverOwner ?? null
    }

    const handleAnnotationFocus = (annotationId: string) => {
        focusedAnnotationIdRef.current = annotationId
        painter?.setAnnotationHover('sidebar-focus', annotationId)
    }

    const clearAnnotationFocus = (annotationId: string) => {
        if (focusedAnnotationIdRef.current !== annotationId) return
        focusedAnnotationIdRef.current = null
        painter?.clearAnnotationHover('sidebar-focus', annotationId)
    }

    const handleAnnotationBlur = (
        annotationId: string,
        event: React.FocusEvent<HTMLElement>
    ) => {
        if (getAnnotationFocusOwner(event.relatedTarget) === annotationId) return
        clearAnnotationFocus(annotationId)
    }

    const handleReferenceClick = (annotationId: string) => {
        const annotation = annotations.get(annotationId)
        if (!annotation) return

        setSelectedUsers((previous) => (
            previous.includes(annotation.title)
                ? previous
                : [...previous, annotation.title]
        ))
        setSelectedTypes((previous) => (
            previous.includes(annotation.subtype)
                ? previous
                : [...previous, annotation.subtype]
        ))
        setPendingReferenceAnnotationId(annotation.id)
        setCurrentAnnotation(annotation, SelectionSource.SIDEBAR)
        void painter?.highlight(annotation)
    }

    const updateComment = (annotation: IAnnotationStore, draft: AnnotationReferenceDraft) => {
        const latestAnnotation = useAnnotationStore.getState().getAnnotation(annotation.id)
        if (!latestAnnotation || !painter?.can('annotation.edit', latestAnnotation)) return
        painter.update(latestAnnotation.id, {
            contentsObj: applyAnnotationCommentDraft(latestAnnotation.contentsObj, draft),
            date: formatTimestamp(Date.now())
        }, 'annotation.edit')

        setEditorState(null)
        clearAnnotationFocus(latestAnnotation.id)
    }

    const addReply = (annotation: IAnnotationStore, draft: AnnotationReferenceDraft, status?: CommentStatus) => {
        const latestAnnotation = useAnnotationStore.getState().getAnnotation(annotation.id)
        if (!latestAnnotation) return
        const action = status === undefined ? 'annotation.comment' : 'annotation.change-status'
        if (!painter?.can(action, latestAnnotation)) return
        const replyUser = currentUser?.user ?? undefined
        const newReply = createAnnotationReply({
            id: generateUUID(),
            title: replyUser?.name ?? 'Anonymous',
            date: formatTimestamp(Date.now()),
            draft,
            status,
            user: replyUser
        })

        painter.update(latestAnnotation.id, {
            comments: [...(latestAnnotation.comments || []), newReply]
        }, action)

        setEditorState(null)
        clearAnnotationFocus(latestAnnotation.id)
    }

    const updateReply = (annotation: IAnnotationStore, reply: IAnnotationComment, draft: AnnotationReferenceDraft) => {
        const latestAnnotation = useAnnotationStore.getState().getAnnotation(annotation.id)
        const latestReply = latestAnnotation?.comments?.find((comment) => comment.id === reply.id)
        if (
            !latestAnnotation
            || !latestReply
            || !painter?.can('comment.edit', latestAnnotation, latestReply)
        ) {
            return
        }
        const updatedComments = applyAnnotationReplyDraft(
            latestAnnotation.comments || [],
            latestReply.id,
            draft,
            formatTimestamp(Date.now()),
            currentUser?.user?.name || latestReply.title
        )

        painter.update(latestAnnotation.id, {
            comments: updatedComments
        }, 'comment.edit', latestReply)

        setEditorState(null)
        clearAnnotationFocus(latestAnnotation.id)
    }

    const deleteAnnotation = (annotation: IAnnotationStore) => {
        if (!painter?.can('annotation.delete', annotation)) return
        painter?.delete(annotation.id, true)
    }

    const deleteReply = (annotation: IAnnotationStore, reply: IAnnotationComment) => {
        if (!painter?.deleteComment(annotation.id, reply.id)) return

        if (editorState?.kind === 'reply-edit' && editorState.replyId === reply.id) {
            setEditorState(null)
            clearAnnotationFocus(annotation.id)
        }
    }

    // Comment 编辑框
    const commentInput = (annotation: IAnnotationStore) => {
        if (
            editorState?.kind === 'annotation-edit'
            && editorState.annotationId === annotation.id
            && currentAnnotation?.store?.id === annotation.id
        ) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    initialContent={annotation.contentsObj?.text}
                    initialReferences={annotation.contentsObj?.references}
                    className={styles.commentEditor}
                    placeholder={t('annotator:comment.reference.commentPlaceholder')}
                    onSubmit={(draft) => updateComment(annotation, draft)}
                    onCancel={() => {
                        setEditorState(null)
                        clearAnnotationFocus(annotation.id)
                    }}
                />
            )
        }
        const content = annotation.contentsObj?.text
        if (!content?.trim()) return null

        return (
            <Flex gap="3" pl="4">
                <Text as="p" size="2">
                    <AnnotationReferenceText
                        annotations={referenceCandidates}
                        content={content}
                        references={annotation.contentsObj?.references}
                        onActivate={handleReferenceClick}
                    />
                </Text>
            </Flex>
        )
    }

    // 回复框
    const replyInput = (annotation: IAnnotationStore) => {
        if (
            editorState?.kind === 'annotation-reply'
            && editorState.annotationId === annotation.id
            && currentAnnotation?.store?.id === annotation.id
        ) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    className={styles.commentEditor}
                    placeholder={t('annotator:comment.reference.replyPlaceholder')}
                    onSubmit={(draft) => addReply(annotation, draft)}
                    onCancel={() => {
                        setEditorState(null)
                        clearAnnotationFocus(annotation.id)
                    }}
                />
            )
        }
        return null
    }

    // 编辑回复框
    const editReplyInput = (annotation: IAnnotationStore, reply: IAnnotationComment) => {
        if (
            editorState?.kind === 'reply-edit'
            && editorState.annotationId === annotation.id
            && editorState.replyId === reply.id
        ) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    initialContent={reply.content}
                    initialReferences={reply.references}
                    className={styles.replyEditor}
                    placeholder={t('annotator:comment.reference.replyPlaceholder')}
                    onSubmit={(draft) => updateReply(annotation, reply, draft)}
                    onCancel={() => {
                        setEditorState(null)
                        clearAnnotationFocus(annotation.id)
                    }}
                />
            )
        }

        return (
            <Flex gap="3">
                <Text as="p" size="2">
                    <AnnotationReferenceText
                        annotations={referenceCandidates}
                        content={reply.content}
                        references={reply.references}
                        onActivate={handleReferenceClick}
                    />
                </Text>
            </Flex>
        )
    }

    const comments = Object.entries(groupedAnnotations).map(([pageNumber, annotationsForPage]) => {
        // 根据 konvaClientRect.y 对 annotationsForPage 进行排序
        const sortedAnnotations = annotationsForPage.sort((a, b) => a.konvaClientRect.y - b.konvaClientRect.y)

        return (
            <div key={pageNumber} className={styles.group}>
                <Flex gap="2" justify="between" p="1">
                    <Text size="1">
                        {t('annotator:comment.page', { value: pageNumber })}
                    </Text>
                    <Text size="1">
                        {t('annotator:comment.total', { value: annotationsForPage.length })}
                    </Text>
                </Flex>
                {sortedAnnotations.map((annotation) => {
                    const isSelected = annotation.id === currentAnnotation?.store?.id
                    const isPreviewed = annotation.id === hoveredAnnotationId
                    const showPreviewStyle = isPreviewed
                        && (!isSelected || annotationHover.source !== 'sidebar-focus')
                    const canComment = Boolean(painter?.can('annotation.comment', annotation))
                    const canEdit = Boolean(painter?.can('annotation.edit', annotation))
                    const canDelete = Boolean(painter?.can('annotation.delete', annotation))
                    const canChangeStatus = Boolean(painter?.can('annotation.change-status', annotation))
                    const lastStatus = getLastStatus(annotation)
                    const annotationAuthorName = getAnnotationAuthorName(annotation) ?? annotation.title
                    const hasReferenceNumber = isValidReferenceNumber(annotation.referenceNumber)
                    const annotationHeading = hasReferenceNumber
                        ? `#${annotation.referenceNumber}`
                        : annotationAuthorName
                    const isHeadingActive = hasReferenceNumber && (isPreviewed || isSelected)
                    const annotationDateTime = formatPDFCompactDateTime(annotation.date)
                    const annotationToolName = annotationToolNames.get(annotation.type)
                    const annotationTypeLabel = annotationToolName
                        ? t(`annotator:tool.${annotationToolName}`)
                        : annotation.subtype
                    const commonProps = {
                        className: [
                            styles.comment,
                            showPreviewStyle ? styles.preview : '',
                            isSelected ? styles.selected : ''
                        ].filter(Boolean).join(' '),
                        id: `annotation-${annotation.id}`,
                        'data-annotation-hover-owner': annotation.id
                    }
                    return (
                        <div
                            {...commonProps}
                            key={annotation.id}
                            onClick={() => handleAnnotationClick(annotation)}
                            onPointerEnter={(event) => handleAnnotationPointerEnter(annotation.id, event)}
                            onPointerLeave={() => handleAnnotationPointerLeave(annotation.id)}
                            onFocusCapture={() => handleAnnotationFocus(annotation.id)}
                            onBlurCapture={(event) => handleAnnotationBlur(annotation.id, event)}
                            ref={(el) => (annotationRefs.current[annotation.id] = el)}
                        >
                            <div className={`${styles.title} ${styles.annotationHeader}`}>
                                <Text
                                    as="div"
                                    size="2"
                                    weight="medium"
                                    highContrast
                                    className={[
                                        styles.annotationHeading,
                                        isHeadingActive ? styles.annotationHeadingActive : ''
                                    ].filter(Boolean).join(' ')}
                                >
                                    {annotationHeading}
                                    {
                                        annotation.native && <Tooltip content={t('annotator:comment.nativeAnnotation')}><span><AiOutlineExclamation /></span></Tooltip>
                                    }
                                </Text>
                                <Flex
                                    align="center"
                                    gap="1"
                                    ml="auto"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {canChangeStatus && <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <IconButton
                                                variant="ghost"
                                                color="gray"
                                                size="1"
                                                className={styles.toolButton}
                                                aria-label={t(commentStatusOptions[lastStatus].labelKey)}
                                                onPointerDown={handleMenuTriggerPointerDown}
                                                style={{
                                                    boxShadow: 'none'
                                                }}
                                            >
                                                {getLastStatusIcon(annotation)}
                                            </IconButton>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content
                                            data-annotation-hover-owner={annotation.id}
                                            onFocusCapture={() => handleAnnotationFocus(annotation.id)}
                                            onBlurCapture={(event) => handleAnnotationBlur(annotation.id, event)}
                                            onCloseAutoFocus={handleMenuCloseAutoFocus}
                                        >
                                            {Object.entries(commentStatusOptions).map(([statusKey, option]) => (
                                                <DropdownMenu.Item
                                                    key={statusKey}
                                                    onSelect={() => {
                                                        addReply(
                                                            annotation,
                                                            {
                                                                content: t('annotator:comment.statusText', { value: t(option.labelKey) })
                                                            },
                                                            statusKey as CommentStatus
                                                        )
                                                    }}
                                                >
                                                    {option.icon} {t(option.labelKey)}
                                                </DropdownMenu.Item>
                                            ))}
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>}
                                    {(canComment || canEdit || canDelete) && <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <IconButton
                                                variant="ghost"
                                                color="gray"
                                                size="1"
                                                className={styles.toolButton}
                                                aria-label={t('more')}
                                                onPointerDown={handleMenuTriggerPointerDown}
                                                style={{
                                                    boxShadow: 'none'
                                                }}
                                            >
                                                <AiOutlineEllipsis />
                                            </IconButton>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content
                                            data-annotation-hover-owner={annotation.id}
                                            onFocusCapture={() => handleAnnotationFocus(annotation.id)}
                                            onBlurCapture={(event) => handleAnnotationBlur(annotation.id, event)}
                                            onCloseAutoFocus={handleMenuCloseAutoFocus}
                                        >
                                            {canComment && <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    queueMenuAction(() => (
                                                        openAnnotationReply(annotation)
                                                    ))
                                                }}
                                            >
                                                {t('reply')}
                                            </DropdownMenu.Item>}
                                            {canEdit && <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    queueMenuAction(() => (
                                                        openAnnotationEditor(annotation)
                                                    ))
                                                }}
                                            >
                                                {t('edit')}
                                            </DropdownMenu.Item>}
                                            {canDelete && <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    deleteAnnotation(annotation)
                                                }}
                                            >
                                                {t('delete')}
                                            </DropdownMenu.Item>}
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>}
                                </Flex>
                            </div>
                            <Flex align="center" gap="1" className={styles.annotationMeta}>
                                <AnnotationTypeIcon
                                    type={annotation.type}
                                    label={annotationTypeLabel}
                                    className={styles.annotationTypeIcon}
                                />
                                <Text
                                    as="span"
                                    size="1"
                                    color="gray"
                                    className={styles.annotationAuthor}
                                >
                                    {annotationAuthorName}
                                </Text>
                                {annotationDateTime && (
                                    <>
                                        <Text as="span" size="1" color="gray" aria-hidden="true">
                                            ·
                                        </Text>
                                        <Text
                                            as="span"
                                            size="1"
                                            color="gray"
                                            className={styles.annotationDateTime}
                                        >
                                            {annotationDateTime}
                                        </Text>
                                    </>
                                )}

                            </Flex>
                            {commentInput(annotation)}
                            {annotation.comments?.map((reply) => {
                                const replyDateTime = formatPDFCompactDateTime(reply.date)
                                const canEditReply = Boolean(painter?.can('comment.edit', annotation, reply))
                                const canDeleteReply = Boolean(painter?.can('comment.delete', annotation, reply))

                                return (
                                    <div className={styles.reply} key={reply.id}>
                                        <div className={`${styles.title} ${styles.annotationHeader}`}>
                                            <Text
                                                truncate
                                                size="1"
                                                weight="medium"
                                                as="div"
                                                className={styles.annotationHeading}
                                            >
                                                {reply.title}
                                            </Text>
                                            {(canEditReply || canDeleteReply) && (
                                                <Flex
                                                    align="center"
                                                    gap="1"
                                                    ml="auto"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <DropdownMenu.Root>
                                                        <DropdownMenu.Trigger>
                                                            <IconButton
                                                                variant="ghost"
                                                                color="gray"
                                                                highContrast
                                                                size="1"
                                                                className={styles.toolButton}
                                                                aria-label={t('more')}
                                                                onPointerDown={handleMenuTriggerPointerDown}
                                                                style={{
                                                                    boxShadow: 'none'
                                                                }}
                                                            >
                                                                <AiOutlineEllipsis />
                                                            </IconButton>
                                                        </DropdownMenu.Trigger>
                                                        <DropdownMenu.Content
                                                            data-annotation-hover-owner={annotation.id}
                                                            onFocusCapture={() => handleAnnotationFocus(annotation.id)}
                                                            onBlurCapture={(event) => handleAnnotationBlur(annotation.id, event)}
                                                            onCloseAutoFocus={handleMenuCloseAutoFocus}
                                                        >
                                                            {canEditReply && <DropdownMenu.Item
                                                                onSelect={(e) => {
                                                                    e.stopPropagation()
                                                                    queueMenuAction(() => (
                                                                        openReplyEditor(annotation, reply)
                                                                    ))
                                                                }}
                                                            >
                                                                {t('edit')}
                                                            </DropdownMenu.Item>}
                                                            {canDeleteReply && <DropdownMenu.Item
                                                                onSelect={(e) => {
                                                                    e.stopPropagation()
                                                                    deleteReply(annotation, reply)
                                                                }}
                                                            >
                                                                {t('delete')}
                                                            </DropdownMenu.Item>}
                                                        </DropdownMenu.Content>
                                                    </DropdownMenu.Root>
                                                </Flex>
                                            )}
                                        </div>
                                        {replyDateTime && (
                                            <Flex align="center" className={`${styles.annotationMeta} ${styles.replyMeta}`}>
                                                <Text as="span" size="1" color="gray">
                                                    {replyDateTime}
                                                </Text>
                                            </Flex>
                                        )}
                                        {editReplyInput(annotation, reply)}
                                    </div>
                                )
                            })}
                            <div>
                                {replyInput(annotation)}
                                {canComment && !editorState && currentAnnotation?.store?.id === annotation.id && (
                                    <Button mt="2" style={{ width: '100%' }} onClick={() => openAnnotationReply(annotation)}>
                                        {t('reply')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    })
    return (
        <div className={styles.sidebar}>
            <Flex align="center" justify="start" p='1'>
                <Popover.Root>
                    <Popover.Trigger>
                        <Button
                            variant="outline"
                            size="2"
                            color="gray"
                            highContrast
                            style={{
                                boxShadow: 'none',
                                fontSize: '16px'
                            }}
                        >
                            <AiOutlineFilter />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content>{filterContent}</Popover.Content>
                </Popover.Root>
            </Flex>
            <div className={styles.list}>{comments}</div>
        </div>
    )
}

export { Sidebar }
