import {
    applyAnnotationCommentDraft,
    applyAnnotationReplyDraft,
    createAnnotationReply
} from '../comment_mutations'
import type { IAnnotationComment } from '../../../const/definitions'

const reference = {
    type: 'annotation' as const,
    annotationId: 'annotation-2',
    label: '#2'
}

describe('annotation comment reference mutations', () => {
    it('writes and clears main-comment references without losing other contents fields', () => {
        expect(applyAnnotationCommentDraft(
            { text: 'Old', image: 'data:image/png', references: [reference] },
            { content: 'See #2.', references: [reference] }
        )).toEqual({
            text: 'See #2.',
            image: 'data:image/png',
            references: [reference]
        })

        expect(applyAnnotationCommentDraft(
            { text: 'See #2.', references: [reference] },
            { content: 'No link.' }
        )).toEqual({
            text: 'No link.',
            references: undefined
        })
    })

    it('writes references into a newly created reply', () => {
        expect(createAnnotationReply({
            id: 'reply-1',
            title: 'Bob',
            date: 'D:20260727120000+08\'00\'',
            draft: { content: 'See #2.', references: [reference] },
            user: { id: 'bob', name: 'Bob' }
        })).toMatchObject({
            id: 'reply-1',
            content: 'See #2.',
            references: [reference]
        })
    })

    it('updates or clears only the edited reply references', () => {
        const comments: IAnnotationComment[] = [
            {
                id: 'reply-1',
                title: 'Alice',
                date: null,
                content: 'Keep',
                references: [reference]
            },
            {
                id: 'reply-2',
                title: 'Bob',
                date: null,
                content: 'Old',
                references: [reference]
            }
        ]

        const updated = applyAnnotationReplyDraft(
            comments,
            'reply-2',
            { content: 'No link.' },
            'D:20260727130000+08\'00\'',
            'Bob'
        )

        expect(updated[0]).toBe(comments[0])
        expect(updated[1]).toMatchObject({
            id: 'reply-2',
            content: 'No link.',
            references: undefined
        })
    })
})
