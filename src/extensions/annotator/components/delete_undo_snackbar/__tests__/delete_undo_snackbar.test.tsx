/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { Theme } from '@radix-ui/themes'
import type { Painter } from '../../../painter'
import { PainterContext } from '../../../context/painter_context_value'
import { DeleteUndoSnackbar } from '..'
import { getDeleteUndoMessage, getDeleteUndoMessageSegments } from '../message'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'
import { DELETE_UNDO_DURATION_MS, type DeleteUndoSnapshot } from '../../../painter/delete_undo'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            if (key === 'common:restore') return '恢复'
            if (key === 'annotator:deleteUndo.annotationDeletedDetailed') {
                return `已删除${options?.reference} · ${options?.detail}`
            }
            return key
        },
        i18n: { language: 'zh-CN', resolvedLanguage: 'zh-CN' }
    })
}))

function makeAnnotation(referenceNumber: number): IAnnotationStore {
    return {
        id: `annotation-${referenceNumber}`,
        referenceNumber,
        pageNumber: 3,
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
        title: 'Alice',
        type: AnnotationType.RECTANGLE,
        color: '#000000',
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        contentsObj: { text: '请调整这里的内容' },
        comments: [],
        user: { id: 'alice', name: 'Alice' },
        native: false
    }
}

describe('DeleteUndoSnackbar', () => {
    it('renders inside its InkLayer container and delegates timer controls and undo', () => {
        const snapshot = {
            annotationCount: 1,
            commentCount: 0,
            totalCount: 1,
            expiresAt: Date.now() + DELETE_UNDO_DURATION_MS,
            items: [{
                kind: 'annotation' as const,
                previewAnnotation: makeAnnotation(12),
                annotationReferenceNumber: 12,
                annotationType: AnnotationType.RECTANGLE,
                pageNumber: 3,
                content: '请调整这里的内容'
            }]
        }
        const painter = {
            subscribeDeleteUndo: jest.fn(() => () => {}),
            getDeleteUndoSnapshot: jest.fn(() => snapshot),
            pauseDeleteUndo: jest.fn(),
            resumeDeleteUndo: jest.fn(),
            undoDelete: jest.fn()
        } as unknown as Painter
        const container = document.createElement('div')
        container.id = 'InkLayer'
        document.body.appendChild(container)

        render(
            <Theme>
                <PainterContext.Provider value={{
                    painter,
                    setPainter: jest.fn(),
                    refreshPainter: jest.fn(),
                    revision: 0
                }}>
                    <DeleteUndoSnackbar />
                </PainterContext.Provider>
            </Theme>,
            { container }
        )

        const status = screen.getByRole('status')
        expect(container.contains(status)).toBe(true)
        fireEvent.mouseEnter(status)
        fireEvent.mouseLeave(status)
        expect(status.textContent).toContain('已删除 #12 · “请调整这里的内容”')
        expect(screen.getByRole('button', { name: '#12' })).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: '恢复' }))

        expect(painter.pauseDeleteUndo).toHaveBeenCalledTimes(1)
        expect(painter.resumeDeleteUndo).toHaveBeenCalledTimes(1)
        expect(painter.undoDelete).toHaveBeenCalledTimes(1)
    })

    it('identifies the parent annotation and truncates deleted comment content', () => {
        const translate = jest.fn((key: string) => key)
        const snapshot: DeleteUndoSnapshot = {
            annotationCount: 0,
            commentCount: 1,
            totalCount: 1,
            expiresAt: Date.now() + DELETE_UNDO_DURATION_MS,
            items: [{
                kind: 'comment',
                previewAnnotation: makeAnnotation(18),
                annotationReferenceNumber: 18,
                content: '  这是一条需要被压缩空格并且长度超过二十四个字符的评论内容  ',
                author: 'Alice'
            }]
        }

        getDeleteUndoMessage(snapshot, translate, 'zh-CN')

        expect(translate).toHaveBeenLastCalledWith(
            'annotator:deleteUndo.commentDeletedDetailed',
            {
                reference: ' #18',
                detail: '“这是一条需要被压缩空格并且长度超过二十四个字符的…”'
            }
        )
    })

    it('lists annotation numbers for a batch', () => {
        const translate = jest.fn((key: string) => key)
        const snapshot: DeleteUndoSnapshot = {
            annotationCount: 2,
            commentCount: 0,
            totalCount: 2,
            expiresAt: Date.now() + DELETE_UNDO_DURATION_MS,
            items: [12, 18].map((annotationReferenceNumber) => ({
                kind: 'annotation' as const,
                previewAnnotation: makeAnnotation(annotationReferenceNumber),
                annotationReferenceNumber,
                annotationType: AnnotationType.RECTANGLE,
                pageNumber: 1
            }))
        }

        getDeleteUndoMessage(snapshot, translate, 'zh-CN')

        expect(translate).toHaveBeenLastCalledWith(
            'annotator:deleteUndo.annotationsDeletedDetailed',
            { count: 2, references: '#12、#18' }
        )
    })

    it('turns each available annotation number into a hover-card reference', () => {
        const annotation12 = makeAnnotation(12)
        const annotation18 = makeAnnotation(18)

        const segments = getDeleteUndoMessageSegments('已删除 2 个批注 · #12、#18', [
            {
                kind: 'annotation',
                previewAnnotation: annotation12,
                annotationReferenceNumber: 12
            },
            {
                kind: 'annotation',
                previewAnnotation: annotation18,
                annotationReferenceNumber: 18
            }
        ])

        expect(segments.filter((segment) => segment.kind === 'reference')).toEqual([
            { kind: 'reference', value: '#12', annotation: annotation12, comments: [] },
            { kind: 'reference', value: '#18', annotation: annotation18, comments: [] }
        ])
    })

    it('carries deleted comments into the parent annotation hover reference', () => {
        const annotation = makeAnnotation(18)
        const previewComment = {
            id: 'comment-1',
            title: 'Bob',
            date: null,
            content: 'Deleted comment'
        }

        const segments = getDeleteUndoMessageSegments('已删除 #18 的评论', [{
            kind: 'comment',
            previewAnnotation: annotation,
            previewComment,
            annotationReferenceNumber: 18
        }])

        expect(segments.find((segment) => segment.kind === 'reference')).toEqual({
            kind: 'reference',
            value: '#18',
            annotation,
            comments: [previewComment]
        })
    })
})
