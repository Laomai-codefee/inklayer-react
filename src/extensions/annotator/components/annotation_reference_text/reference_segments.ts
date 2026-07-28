import type { IAnnotationReference } from '../../const/definitions'

interface TextSegment {
    kind: 'text'
    value: string
}

interface ReferenceSegment {
    kind: 'reference'
    value: string
    annotationId: string
}

export type AnnotationReferenceSegment = TextSegment | ReferenceSegment

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createAnnotationReferenceSegments(
    content: string,
    references: readonly IAnnotationReference[] | undefined
): AnnotationReferenceSegment[] {
    if (!content || !references?.length) {
        return [{ kind: 'text', value: content }]
    }

    const referencesByLabel = new Map(
        references.map((reference) => [reference.label, reference])
    )
    const labels = Array.from(referencesByLabel.keys())
        .sort((a, b) => b.length - a.length)
    const labelPattern = new RegExp(
        `(${labels.map(escapeRegExp).join('|')})(?!\\d)`,
        'g'
    )
    const segments: AnnotationReferenceSegment[] = []
    let lastIndex = 0

    content.replace(labelPattern, (label, _capture, offset: number) => {
        if (offset > lastIndex) {
            segments.push({
                kind: 'text',
                value: content.slice(lastIndex, offset)
            })
        }

        const reference = referencesByLabel.get(label)
        if (reference) {
            segments.push({
                kind: 'reference',
                value: label,
                annotationId: reference.annotationId
            })
        }
        lastIndex = offset + label.length
        return label
    })

    if (lastIndex < content.length) {
        segments.push({
            kind: 'text',
            value: content.slice(lastIndex)
        })
    }

    return segments.length > 0
        ? segments
        : [{ kind: 'text', value: content }]
}
