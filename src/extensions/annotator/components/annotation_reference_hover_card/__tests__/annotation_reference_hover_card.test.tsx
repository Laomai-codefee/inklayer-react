/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { AnnotationReferenceHoverCard } from '..'
import { createAnnotationPreview } from '../annotation_preview'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'

jest.mock('@radix-ui/themes', () => ({
    HoverCard: {
        Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Content: ({
            children,
            onClick
        }: {
            children: React.ReactNode
            onClick?: React.MouseEventHandler<HTMLDivElement>
        }) => (
            <div
                data-testid="hover-card"
                onClick={onClick}
            >
                {children}
            </div>
        )
    }
}))

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { value?: number; count?: number }) => {
            if (options?.value !== undefined) return `${key}:${options.value}`
            if (options?.count !== undefined) return `${key}:${options.count}`
            return key
        }
    })
}))

function makeAnnotation(overrides: Partial<IAnnotationStore> = {}): IAnnotationStore {
    return {
        id: 'annotation-2',
        referenceNumber: 2,
        pageNumber: 8,
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
        title: 'Alice',
        type: AnnotationType.RECTANGLE,
        color: '#000000',
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        contentsObj: {
            text: 'Important context from the annotation.',
            selectedText: 'Quoted source text.'
        },
        comments: [{
            id: 'reply-1',
            title: 'Bob',
            date: null,
            content: 'A reply'
        }],
        user: { id: 'alice', name: 'Alice' },
        native: false,
        ...overrides
    }
}

describe('AnnotationReferenceHoverCard', () => {
    it('shows the target identity, main content, page, and reply count', () => {
        render(
            <AnnotationReferenceHoverCard
                annotation={makeAnnotation()}
                onActivate={jest.fn()}
            >
                <button type="button">#2</button>
            </AnnotationReferenceHoverCard>
        )

        expect(screen.getAllByText('#2')).toHaveLength(2)
        expect(screen.getByText('Alice')).toBeTruthy()
        expect(screen.getByText('Quoted source text.')).toBeTruthy()
        expect(screen.getByText('Important context from the annotation.')).toBeTruthy()
        expect(screen.getByText('comment.reference.previewPage:8')).toBeTruthy()
        expect(screen.getByText('comment.reference.replyCount:1')).toBeTruthy()
    })

    it('shows an empty state without rendering a reply summary', () => {
        render(
            <AnnotationReferenceHoverCard
                annotation={makeAnnotation({
                    contentsObj: { text: '  ', selectedText: '  ' },
                    comments: []
                })}
                onActivate={jest.fn()}
            >
                <button type="button">#2</button>
            </AnnotationReferenceHoverCard>
        )

        expect(screen.getByText('comment.reference.previewNoContent')).toBeTruthy()
        expect(screen.queryByText(/comment\.reference\.replyCount/)).toBeNull()
    })

    it('shows the deleted comment instead of only summarizing its parent annotation', () => {
        render(
            <AnnotationReferenceHoverCard
                annotation={makeAnnotation()}
                previewComments={[{
                    id: 'deleted-reply',
                    title: 'Bob',
                    date: null,
                    content: 'This deleted reply must remain visible.'
                }]}
            >
                <button type="button">#2</button>
            </AnnotationReferenceHoverCard>
        )

        expect(screen.getByText('deleteUndo.deletedCommentPreview')).toBeTruthy()
        expect(screen.getByText('Bob')).toBeTruthy()
        expect(screen.getByText('This deleted reply must remain visible.')).toBeTruthy()
        expect(screen.queryByText('Important context from the annotation.')).toBeNull()
        expect(screen.queryByText(/comment\.reference\.replyCount/)).toBeNull()
    })

    it('only activates the preview number without selecting its source annotation', () => {
        const onActivate = jest.fn()
        const onSourceClick = jest.fn()

        render(
            <div onClick={onSourceClick}>
                <AnnotationReferenceHoverCard
                    annotation={makeAnnotation()}
                    onActivate={onActivate}
                >
                    <button type="button">#2</button>
                </AnnotationReferenceHoverCard>
            </div>
        )

        fireEvent.click(screen.getByText('Important context from the annotation.'))

        expect(onActivate).not.toHaveBeenCalled()
        expect(onSourceClick).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', {
            name: 'comment.reference.open:#2'
        }))

        expect(onActivate).toHaveBeenCalledWith('annotation-2')
        expect(onSourceClick).not.toHaveBeenCalled()
    })
})

describe('createAnnotationPreview', () => {
    it('normalizes whitespace and truncates long content', () => {
        expect(createAnnotationPreview('  First\n\nsecond  ')).toBe('First second')

        const preview = createAnnotationPreview('a'.repeat(600))
        expect(preview).toHaveLength(501)
        expect(preview.endsWith('…')).toBe(true)
    })
})
