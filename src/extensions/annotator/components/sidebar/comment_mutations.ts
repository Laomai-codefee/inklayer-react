import type {
    IAnnotationComment,
    IAnnotationContentsObj
} from '../../const/definitions'
import type { User } from '@/types'
import type { AnnotationReferenceContent } from '../../references/annotation_reference'
import type { CommentStatus } from '../../const/definitions'

export function applyAnnotationCommentDraft(
    contentsObj: IAnnotationContentsObj | null | undefined,
    draft: AnnotationReferenceContent
): IAnnotationContentsObj {
    return {
        ...(contentsObj || { text: '' }),
        text: draft.content,
        references: draft.references
    }
}

export function createAnnotationReply({
    id,
    title,
    date,
    draft,
    status,
    user
}: {
    id: string
    title: string
    date: string | null
    draft: AnnotationReferenceContent
    status?: CommentStatus
    user?: User
}): IAnnotationComment {
    return {
        id,
        title,
        date,
        content: draft.content,
        references: draft.references,
        status,
        user
    }
}

export function applyAnnotationReplyDraft(
    comments: readonly IAnnotationComment[],
    replyId: string,
    draft: AnnotationReferenceContent,
    date: string | null,
    title: string
): IAnnotationComment[] {
    return comments.map((comment) => comment.id === replyId
        ? {
            ...comment,
            content: draft.content,
            references: draft.references,
            date,
            title
        }
        : comment)
}
