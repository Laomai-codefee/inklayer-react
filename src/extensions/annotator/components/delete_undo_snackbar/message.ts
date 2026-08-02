import { annotationDefinitions } from '../../const/definitions'
import type { DeleteUndoItemSummary, DeleteUndoSnapshot } from '../../painter/delete_undo'
import type { IAnnotationComment, IAnnotationStore } from '../../const/definitions'

const DELETE_PREVIEW_MAX_LENGTH = 24

export type DeleteUndoTranslate = (key: string, options?: Record<string, unknown>) => string

export type DeleteUndoMessageSegment = {
    kind: 'text'
    value: string
} | {
    kind: 'reference'
    value: string
    annotation: IAnnotationStore
    comments: IAnnotationComment[]
}

const REFERENCE_PATTERN = /#(\d+)/g

function getContentPreview(content: string | undefined): string {
    const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
    const characters = Array.from(normalized)
    if (characters.length <= DELETE_PREVIEW_MAX_LENGTH) return normalized
    return `${characters.slice(0, DELETE_PREVIEW_MAX_LENGTH).join('')}…`
}

function getReference(item: DeleteUndoItemSummary): string {
    return item.annotationReferenceNumber === undefined
        ? ''
        : ` #${item.annotationReferenceNumber}`
}

function quotePreview(preview: string): string {
    return `“${preview}”`
}

function formatBatchReferences(
    items: DeleteUndoItemSummary[],
    translate: DeleteUndoTranslate,
    language: string
): string {
    const numbers = Array.from(new Set(items
        .map((item) => item.annotationReferenceNumber)
        .filter((number): number is number => number !== undefined)))
    const separator = language.startsWith('zh') ? '、' : ', '
    const references = numbers.slice(0, 3).map((number) => `#${number}`).join(separator)
    return numbers.length > 3
        ? translate('annotator:deleteUndo.referencesMore', { references })
        : references
}

export function getDeleteUndoMessage(
    snapshot: DeleteUndoSnapshot,
    translate: DeleteUndoTranslate,
    language: string
): string {
    if (snapshot.totalCount === 1) {
        const item = snapshot.items[0]
        const reference = getReference(item)
        const preview = getContentPreview(item.content)
        if (item.kind === 'annotation') {
            if (preview) {
                return translate('annotator:deleteUndo.annotationDeletedDetailed', {
                    reference,
                    detail: quotePreview(preview)
                })
            }

            const definition = annotationDefinitions.find((candidate) => candidate.type === item.annotationType)
            const type = definition ? translate(`annotator:tool.${definition.name}`) : ''
            const detail = type && item.pageNumber
                ? translate('annotator:deleteUndo.typeAndPage', { type, page: item.pageNumber })
                : type || (item.pageNumber
                    ? translate('annotator:deleteUndo.page', { page: item.pageNumber })
                    : '')
            return detail
                ? translate('annotator:deleteUndo.annotationDeletedDetailed', { reference, detail })
                : translate('annotator:deleteUndo.annotationDeleted', { reference })
        }

        if (preview) {
            return translate('annotator:deleteUndo.commentDeletedDetailed', {
                reference,
                detail: quotePreview(preview)
            })
        }
        return item.author
            ? translate('annotator:deleteUndo.commentDeletedByAuthor', { reference, author: item.author })
            : translate('annotator:deleteUndo.commentDeleted', { reference })
    }

    const references = formatBatchReferences(snapshot.items, translate, language)
    if (snapshot.annotationCount === snapshot.totalCount) {
        return references
            ? translate('annotator:deleteUndo.annotationsDeletedDetailed', { count: snapshot.totalCount, references })
            : translate('annotator:deleteUndo.annotationsDeleted', { count: snapshot.totalCount })
    }
    if (snapshot.commentCount === snapshot.totalCount) {
        return references
            ? translate('annotator:deleteUndo.commentsDeletedDetailed', { count: snapshot.totalCount, references })
            : translate('annotator:deleteUndo.commentsDeleted', { count: snapshot.totalCount })
    }
    return references
        ? translate('annotator:deleteUndo.itemsDeletedDetailed', { count: snapshot.totalCount, references })
        : translate('annotator:deleteUndo.itemsDeleted', { count: snapshot.totalCount })
}

export function getDeleteUndoMessageSegments(
    message: string,
    items: DeleteUndoItemSummary[]
): DeleteUndoMessageSegment[] {
    const previewsByReference = new Map<number, {
        annotation: IAnnotationStore
        comments: IAnnotationComment[]
    }>()
    items.forEach((item) => {
        if (item.annotationReferenceNumber === undefined) return
        const preview = previewsByReference.get(item.annotationReferenceNumber) ?? {
            annotation: item.previewAnnotation,
            comments: []
        }
        if (item.previewComment) preview.comments.push(item.previewComment)
        previewsByReference.set(item.annotationReferenceNumber, preview)
    })

    const segments: DeleteUndoMessageSegment[] = []
    let cursor = 0
    for (const match of message.matchAll(REFERENCE_PATTERN)) {
        const index = match.index
        if (index > cursor) segments.push({ kind: 'text', value: message.slice(cursor, index) })
        const preview = previewsByReference.get(Number(match[1]))
        if (preview) {
            segments.push({
                kind: 'reference',
                value: match[0],
                annotation: preview.annotation,
                comments: preview.comments
            })
        } else {
            segments.push({ kind: 'text', value: match[0] })
        }
        cursor = index + match[0].length
    }
    if (cursor < message.length) segments.push({ kind: 'text', value: message.slice(cursor) })
    return segments
}
