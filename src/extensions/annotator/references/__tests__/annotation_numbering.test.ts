import type { IAnnotationStore } from '../../const/definitions'
import {
    assignAnnotationReferenceNumber,
    normalizeAnnotationReferenceNumbers
} from '../annotation_numbering'

function makeAnnotation(
    id: string,
    overrides: Partial<IAnnotationStore> = {}
): IAnnotationStore {
    return {
        id,
        pageNumber: 1,
        date: null,
        ...overrides
    } as IAnnotationStore
}

describe('annotation reference numbering', () => {
    it('keeps valid numbers and continues after the greatest one', () => {
        const annotations = [
            makeAnnotation('a', { referenceNumber: 1 }),
            makeAnnotation('b', { referenceNumber: 2 }),
            makeAnnotation('c')
        ]

        expect(normalizeAnnotationReferenceNumbers(annotations).map((annotation) => annotation.referenceNumber))
            .toEqual([1, 2, 3])
        expect(assignAnnotationReferenceNumber(
            makeAnnotation('d'),
            normalizeAnnotationReferenceNumbers(annotations)
        ).referenceNumber).toBe(4)
    })

    it('does not fill deleted-number gaps', () => {
        const annotations = [
            makeAnnotation('a', { referenceNumber: 1 }),
            makeAnnotation('c', { referenceNumber: 3 })
        ]

        expect(assignAnnotationReferenceNumber(makeAnnotation('d'), annotations).referenceNumber).toBe(4)
    })

    it('supports a session high-water mark after the greatest annotation is deleted', () => {
        const annotations = [
            makeAnnotation('a', { referenceNumber: 1 }),
            makeAnnotation('b', { referenceNumber: 2 })
        ]

        expect(assignAnnotationReferenceNumber(makeAnnotation('d'), annotations, 4).referenceNumber).toBe(4)
    })

    it('uses date, page number, and id instead of input order for legacy data', () => {
        const annotations = [
            makeAnnotation('z', { date: 'D:20260727100000+08\'00\'', pageNumber: 2 }),
            makeAnnotation('b', { date: 'D:20260727090000+08\'00\'', pageNumber: 1 }),
            makeAnnotation('a', { date: 'D:20260727100000+08\'00\'', pageNumber: 2 }),
            makeAnnotation('c', { date: 'not-a-date', pageNumber: 1 })
        ]

        const forward = normalizeAnnotationReferenceNumbers(annotations)
        const reversed = normalizeAnnotationReferenceNumbers([...annotations].reverse())
        const toMap = (items: IAnnotationStore[]) =>
            Object.fromEntries(items.map((annotation) => [annotation.id, annotation.referenceNumber]))

        expect(toMap(forward)).toEqual({
            a: 2,
            b: 1,
            c: 4,
            z: 3
        })
        expect(toMap(reversed)).toEqual(toMap(forward))
    })

    it('moves invalid and conflicting numbers after the greatest preserved number', () => {
        const annotations = [
            makeAnnotation('b', { date: '2026-07-27T09:00:00Z', referenceNumber: 7 }),
            makeAnnotation('a', { date: '2026-07-27T08:00:00Z', referenceNumber: 7 }),
            makeAnnotation('c', { referenceNumber: 0 }),
            makeAnnotation('d', { referenceNumber: 2.5 }),
            makeAnnotation('e', { referenceNumber: Number.NaN })
        ]

        const result = normalizeAnnotationReferenceNumbers(annotations)
        const byId = Object.fromEntries(result.map((annotation) => [annotation.id, annotation.referenceNumber]))

        expect(byId).toEqual({
            a: 7,
            b: 8,
            c: 9,
            d: 10,
            e: 11
        })
    })

    it('does not mutate annotations whose numbers are already valid', () => {
        const annotation = makeAnnotation('a', { referenceNumber: 1 })

        expect(normalizeAnnotationReferenceNumbers([annotation])[0]).toBe(annotation)
        expect(assignAnnotationReferenceNumber(annotation, [])).toBe(annotation)
    })

    it('rejects allocation beyond the safe integer range', () => {
        const lastAnnotation = makeAnnotation('last', {
            referenceNumber: Number.MAX_SAFE_INTEGER
        })

        expect(() => assignAnnotationReferenceNumber(
            makeAnnotation('next'),
            [lastAnnotation]
        )).toThrow(RangeError)
        expect(() => normalizeAnnotationReferenceNumbers([
            lastAnnotation,
            makeAnnotation('missing')
        ])).toThrow(RangeError)
    })
})
