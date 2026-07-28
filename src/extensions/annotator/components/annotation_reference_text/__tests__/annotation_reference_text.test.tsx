/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { AnnotationReferenceText } from '..'
import { createAnnotationReferenceSegments } from '../reference_segments'
import {
    AnnotationType,
    PdfjsAnnotationType,
    type IAnnotationStore
} from '../../../const/definitions'

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { value?: string }) =>
            options?.value ? `${key}:${options.value}` : key
    })
}))

function makeAnnotation(
    id: string,
    referenceNumber: number
): IAnnotationStore {
    return {
        id,
        referenceNumber,
        pageNumber: referenceNumber,
        konvaString: '{}',
        konvaClientRect: { x: 0, y: 0, width: 20, height: 20 },
        title: 'Alice',
        type: AnnotationType.RECTANGLE,
        color: '#000000',
        subtype: 'Square',
        pdfjsType: PdfjsAnnotationType.SQUARE,
        date: null,
        contentsObj: { text: '' },
        comments: [],
        user: { id: 'alice', name: 'Alice' },
        native: false
    }
}

describe('createAnnotationReferenceSegments', () => {
    it('only turns metadata-backed labels into reference segments', () => {
        expect(createAnnotationReferenceSegments(
            'See #2 and manual #3.',
            [{
                type: 'annotation',
                annotationId: 'annotation-2',
                label: '#2'
            }]
        )).toEqual([
            { kind: 'text', value: 'See ' },
            {
                kind: 'reference',
                value: '#2',
                annotationId: 'annotation-2'
            },
            { kind: 'text', value: ' and manual #3.' }
        ])
    })

    it('does not match a shorter label inside a longer number', () => {
        expect(createAnnotationReferenceSegments(
            '#2 #20',
            [{
                type: 'annotation',
                annotationId: 'annotation-2',
                label: '#2'
            }]
        )).toEqual([
            { kind: 'reference', value: '#2', annotationId: 'annotation-2' },
            { kind: 'text', value: ' #20' }
        ])
    })
})

describe('AnnotationReferenceText', () => {
    it('uses the target current number and activates it without selecting the parent card', () => {
        const onActivate = jest.fn()
        const onParentClick = jest.fn()

        render(
            <div onClick={onParentClick}>
                <AnnotationReferenceText
                    annotations={[makeAnnotation('annotation-2', 4)]}
                    content="See #2."
                    references={[{
                        type: 'annotation',
                        annotationId: 'annotation-2',
                        label: '#2'
                    }]}
                    onActivate={onActivate}
                />
            </div>
        )

        const reference = screen.getByRole('button', {
            name: 'comment.reference.open:#4'
        })
        expect(reference.textContent).toBe('#4')

        fireEvent.click(reference)
        expect(onActivate).toHaveBeenCalledWith('annotation-2')
        expect(onParentClick).not.toHaveBeenCalled()
    })

    it('shows a missing target as unavailable and non-interactive', () => {
        render(
            <AnnotationReferenceText
                annotations={[]}
                content="See #2."
                references={[{
                    type: 'annotation',
                    annotationId: 'missing',
                    label: '#2'
                }]}
                onActivate={jest.fn()}
            />
        )

        expect(screen.queryByRole('button')).toBeNull()
        expect(screen.getByLabelText('comment.reference.unavailable:#2').textContent)
            .toBe('#2')
    })
})
