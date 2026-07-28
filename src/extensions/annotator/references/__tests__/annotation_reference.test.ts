import {
    isValidAnnotationReference,
    normalizeAnnotationReferences,
    synchronizeAnnotationReferenceLabels
} from '../annotation_reference'
import type { IAnnotationStore } from '../../const/definitions'

describe('annotation reference serialization', () => {
    it('accepts the canonical annotation reference shape', () => {
        expect(isValidAnnotationReference({
            type: 'annotation',
            annotationId: 'annotation-2',
            label: '#2'
        })).toBe(true)
    })

    it.each([
        null,
        {},
        { type: 'comment', annotationId: 'annotation-2', label: '#2' },
        { type: 'annotation', annotationId: '', label: '#2' },
        { type: 'annotation', annotationId: 'annotation-2', label: '2' },
        { type: 'annotation', annotationId: 'annotation-2', label: '#0' },
        { type: 'annotation', annotationId: 'annotation-2', label: '#02' },
        { type: 'annotation', annotationId: 'annotation-2', label: `#${Number.MAX_SAFE_INTEGER + 1}` }
    ])('rejects a malformed reference: %p', (reference) => {
        expect(isValidAnnotationReference(reference)).toBe(false)
    })

    it('removes stale and duplicate metadata while preserving readable text order', () => {
        const references = normalizeAnnotationReferences(
            'Compare #2 with #7. #2 is the source.',
            [
                { type: 'annotation', annotationId: 'annotation-7', label: '#7' },
                { type: 'annotation', annotationId: 'annotation-2', label: '#2' },
                { type: 'annotation', annotationId: 'annotation-2', label: '#2' },
                { type: 'annotation', annotationId: 'deleted', label: '#9' }
            ]
        )

        expect(references).toEqual([
            { type: 'annotation', annotationId: 'annotation-2', label: '#2' },
            { type: 'annotation', annotationId: 'annotation-7', label: '#7' }
        ])
    })

    it('does not match a shorter label inside a longer number', () => {
        expect(normalizeAnnotationReferences(
            'See #20.',
            [{ type: 'annotation', annotationId: 'annotation-2', label: '#2' }]
        )).toBeUndefined()
    })

    it('does not serialize one visible label with two ambiguous targets', () => {
        expect(normalizeAnnotationReferences(
            'See #2.',
            [
                { type: 'annotation', annotationId: 'annotation-a', label: '#2' },
                { type: 'annotation', annotationId: 'annotation-b', label: '#2' }
            ]
        )).toBeUndefined()
    })

    it('returns undefined instead of serializing an empty references array', () => {
        expect(normalizeAnnotationReferences('No references.', [])).toBeUndefined()
        expect(normalizeAnnotationReferences(
            'No references.',
            [{ type: 'annotation', annotationId: 'annotation-2', label: '#2' }]
        )).toBeUndefined()
    })

    it('synchronizes changed labels in one pass without breaking swaps', () => {
        const annotations = [
            { id: 'annotation-a', referenceNumber: 3 },
            { id: 'annotation-b', referenceNumber: 2 }
        ] as IAnnotationStore[]

        expect(synchronizeAnnotationReferenceLabels(
            'Compare #2 with #3.',
            [
                { type: 'annotation', annotationId: 'annotation-a', label: '#2' },
                { type: 'annotation', annotationId: 'annotation-b', label: '#3' }
            ],
            annotations
        )).toEqual({
            content: 'Compare #3 with #2.',
            references: [
                { type: 'annotation', annotationId: 'annotation-a', label: '#3' },
                { type: 'annotation', annotationId: 'annotation-b', label: '#2' }
            ]
        })
    })

    it('keeps a deleted target reference available for the later unavailable state', () => {
        expect(synchronizeAnnotationReferenceLabels(
            'See #7.',
            [{ type: 'annotation', annotationId: 'deleted', label: '#7' }],
            []
        )).toEqual({
            content: 'See #7.',
            references: [
                { type: 'annotation', annotationId: 'deleted', label: '#7' }
            ]
        })
    })
})
