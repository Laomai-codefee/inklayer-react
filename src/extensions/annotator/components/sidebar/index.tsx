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

interface StatusOption {
    labelKey: string // i18n key
    icon: React.ReactNode
}

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
    const currentAnnotation = useAnnotationStore((state) => state.selectedAnnotation)
    const setCurrentAnnotation = useAnnotationStore((state) => state.setSelectedAnnotation)
    const clearSelectedAnnotation = useAnnotationStore((state) => state.clearSelectedAnnotation)
    const [replyAnnotation, setReplyAnnotation] = useState<IAnnotationStore | null>(null)
    const [currentReply, setCurrentReply] = useState<IAnnotationComment | null>(null)
    const [editAnnotation, setEditAnnotation] = useState<IAnnotationStore | null>(null)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<PdfjsAnnotationSubtype[]>([])
    const [pendingReferenceAnnotationId, setPendingReferenceAnnotationId] = useState<string | null>(null)
    const clearSelectedAnnotationRef = useRef(clearSelectedAnnotation)
    clearSelectedAnnotationRef.current = clearSelectedAnnotation

    const { t } = useTranslation(['common', 'annotator'], { useSuspense: false })

    useEffect(() => {
        if (currentAnnotation?.store && currentAnnotation.source === SelectionSource.CANVAS && !isSidebarCollapsed) {
            const annotation = currentAnnotation.store
            const canEdit = Boolean(painter?.can('annotation.edit', annotation))
            const isEmptyComment = annotation.contentsObj?.text === ''
            const isEmptyReply = annotation.comments?.length === 0
            // 👇 根据批注归属与内容决定打开评论或回复
            if (canEdit && isEmptyComment && isEmptyReply) {
                setEditAnnotation(annotation)
            } else if (painter?.can('annotation.comment', annotation)) {
                setReplyAnnotation(annotation)
            }
        }
    }, [currentAnnotation, isSidebarCollapsed, painter])

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

    // ✅ 初始化默认选中所有 username/type
    useEffect(() => {
        setSelectedUsers(allUsers.map(([u]) => u))
    }, [allUsers])

    useEffect(() => {
        setSelectedTypes(allTypes.map(([t]) => t))
    }, [allTypes])

    useEffect(() => {
        return () => {
            setReplyAnnotation(null)
            setCurrentReply(null)
            setEditAnnotation(null)
            clearSelectedAnnotationRef.current()
        }
    }, [])

    const filteredAnnotations = useMemo(() => {
        if (selectedUsers.length === 0 || selectedTypes.length === 0) return []
        return Array.from(annotations.values()).filter((a) => selectedUsers.includes(a.title) && selectedTypes.includes(a.subtype))
    }, [annotations, selectedUsers, selectedTypes])
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
        setCurrentAnnotation(annotation, SelectionSource.SIDEBAR)
        void painter?.highlight(annotation)
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
        if (!painter?.can('annotation.edit', annotation)) return
        painter?.update(annotation.id, {
            contentsObj: applyAnnotationCommentDraft(annotation.contentsObj, draft),
            date: formatTimestamp(Date.now())
        }, 'annotation.edit')

        setEditAnnotation(null)
    }

    const addReply = (annotation: IAnnotationStore, draft: AnnotationReferenceDraft, status?: CommentStatus) => {
        const action = status === undefined ? 'annotation.comment' : 'annotation.change-status'
        if (!painter?.can(action, annotation)) return
        const replyUser = currentUser?.user ?? undefined
        const newReply = createAnnotationReply({
            id: generateUUID(),
            title: replyUser?.name ?? 'Anonymous',
            date: formatTimestamp(Date.now()),
            draft,
            status,
            user: replyUser
        })

        painter?.update(annotation.id, {
            comments: [...(annotation.comments || []), newReply]
        }, action)

        setReplyAnnotation(null)
    }

    const updateReply = (annotation: IAnnotationStore, reply: IAnnotationComment, draft: AnnotationReferenceDraft) => {
        if (!painter?.can('comment.edit', annotation, reply)) return
        const updatedComments = applyAnnotationReplyDraft(
            annotation.comments || [],
            reply.id,
            draft,
            formatTimestamp(Date.now()),
            currentUser?.user?.name || reply.title
        )

        painter?.update(annotation.id, {
            comments: updatedComments
        }, 'comment.edit', reply)

        setCurrentReply(null)
    }

    const deleteAnnotation = (annotation: IAnnotationStore) => {
        if (!painter?.can('annotation.delete', annotation)) return
        painter?.delete(annotation.id, true)
    }

    const deleteReply = (annotation: IAnnotationStore, reply: IAnnotationComment) => {
        if (!painter?.can('comment.delete', annotation, reply)) return
        const updatedComments = (annotation.comments || []).filter((comment) => comment.id !== reply.id)

        painter?.update(annotation.id, {
            comments: updatedComments
        }, 'comment.delete', reply)

        if (currentReply?.id === reply.id) {
            setCurrentReply(null)
        }
    }

    // Comment 编辑框
    const commentInput = (annotation: IAnnotationStore) => {
        if (editAnnotation && currentAnnotation?.store?.id === annotation.id) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    initialContent={annotation.contentsObj?.text}
                    initialReferences={annotation.contentsObj?.references}
                    className={styles.commentEditor}
                    onSubmit={(draft) => updateComment(annotation, draft)}
                    onCancel={() => setEditAnnotation(null)}
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
        if (replyAnnotation && currentAnnotation?.store?.id === annotation.id) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    className={styles.commentEditor}
                    onSubmit={(draft) => addReply(annotation, draft)}
                    onCancel={() => setReplyAnnotation(null)}
                />
            )
        }
        return null
    }

    // 编辑回复框
    const editReplyInput = (annotation: IAnnotationStore, reply: IAnnotationComment) => {
        if (currentReply && currentReply.id === reply.id) {
            return (
                <AnnotationReferenceInput
                    annotations={referenceCandidates}
                    excludeAnnotationId={annotation.id}
                    initialContent={currentReply.content}
                    initialReferences={currentReply.references}
                    className={styles.replyEditor}
                    onSubmit={(draft) => updateReply(annotation, reply, draft)}
                    onCancel={() => setCurrentReply(null)}
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
                    const canComment = Boolean(painter?.can('annotation.comment', annotation))
                    const canEdit = Boolean(painter?.can('annotation.edit', annotation))
                    const canDelete = Boolean(painter?.can('annotation.delete', annotation))
                    const canChangeStatus = Boolean(painter?.can('annotation.change-status', annotation))
                    const lastStatus = getLastStatus(annotation)
                    const annotationAuthorName = getAnnotationAuthorName(annotation) ?? annotation.title
                    const annotationHeading = isValidReferenceNumber(annotation.referenceNumber)
                        ? `#${annotation.referenceNumber}`
                        : annotationAuthorName
                    const annotationDateTime = formatPDFCompactDateTime(annotation.date)
                    const annotationToolName = annotationToolNames.get(annotation.type)
                    const annotationTypeLabel = annotationToolName
                        ? t(`annotator:tool.${annotationToolName}`)
                        : annotation.subtype
                    const commonProps = { className: isSelected ? `${styles.comment} ${styles.selected}` : styles.comment, id: `annotation-${annotation.id}` }
                    return (
                        <div
                            {...commonProps}
                            key={annotation.id}
                            onClick={() => handleAnnotationClick(annotation)}
                            ref={(el) => (annotationRefs.current[annotation.id] = el)}
                        >
                            <div className={`${styles.title} ${styles.annotationHeader}`}>
                                <Text
                                    as="div"
                                    size="2"
                                    weight="medium"
                                    highContrast
                                    className={styles.annotationHeading}
                                >
                                    {annotationHeading}
                                    {
                                        annotation.native && <Tooltip content={t('annotator:comment.nativeAnnotation')}><span><AiOutlineExclamation /></span></Tooltip>
                                    }
                                </Text>
                                <Flex align="center" gap="1" ml="auto">
                                    {canChangeStatus && <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <IconButton
                                                variant="ghost"
                                                color="gray"
                                                size="1"
                                                className={styles.toolButton}
                                                aria-label={t(commentStatusOptions[lastStatus].labelKey)}
                                                style={{
                                                    boxShadow: 'none'
                                                }}
                                            >
                                                {getLastStatusIcon(annotation)}
                                            </IconButton>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
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
                                                        setReplyAnnotation(null)
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
                                                style={{
                                                    boxShadow: 'none'
                                                }}
                                            >
                                                <AiOutlineEllipsis />
                                            </IconButton>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
                                            {canComment && <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    setReplyAnnotation(annotation)
                                                }}
                                            >
                                                {t('reply')}
                                            </DropdownMenu.Item>}
                                            {canEdit && <DropdownMenu.Item
                                                onSelect={(e) => {
                                                    e.stopPropagation()
                                                    setEditAnnotation(annotation)
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
                                                <Flex align="center" gap="1" ml="auto">
                                                    <DropdownMenu.Root>
                                                        <DropdownMenu.Trigger>
                                                            <IconButton
                                                                variant="ghost"
                                                                color="gray"
                                                                highContrast
                                                                size="1"
                                                                className={styles.toolButton}
                                                                aria-label={t('more')}
                                                                style={{
                                                                    boxShadow: 'none'
                                                                }}
                                                            >
                                                                <AiOutlineEllipsis />
                                                            </IconButton>
                                                        </DropdownMenu.Trigger>
                                                        <DropdownMenu.Content onCloseAutoFocus={(event) => event.preventDefault()}>
                                                            {canEditReply && <DropdownMenu.Item
                                                                onSelect={(e) => {
                                                                    e.stopPropagation()
                                                                    setCurrentReply(reply)
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
                                {canComment && !replyAnnotation && !currentReply && !editAnnotation && currentAnnotation?.store?.id === annotation.id && (
                                    <Button mt="2" style={{ width: '100%' }} onClick={() => setReplyAnnotation(annotation)}>
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
