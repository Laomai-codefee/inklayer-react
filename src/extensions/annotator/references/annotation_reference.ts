import type {
    IAnnotationReference,
    IAnnotationStore
} from '../const/definitions'

const ANNOTATION_REFERENCE_LABEL_PATTERN = /^#([1-9]\d*)$/

export function isValidAnnotationReference(reference: unknown): reference is IAnnotationReference {
    if (!reference || typeof reference !== 'object') return false

    const candidate = reference as Partial<IAnnotationReference>
    if (
        candidate.type !== 'annotation'
        || typeof candidate.annotationId !== 'string'
        || candidate.annotationId.length === 0
        || typeof candidate.label !== 'string'
    ) {
        return false
    }

    const match = ANNOTATION_REFERENCE_LABEL_PATTERN.exec(candidate.label)
    return Boolean(match && Number.isSafeInteger(Number(match[1])))
}

function findReferenceLabel(content: string, label: string): number {
    let fromIndex = 0

    while (fromIndex < content.length) {
        const index = content.indexOf(label, fromIndex)
        if (index === -1) return -1

        const nextCharacter = content[index + label.length]
        if (!nextCharacter || !/\d/.test(nextCharacter)) return index

        fromIndex = index + label.length
    }

    return -1
}

/**
 * Produces the canonical JSON metadata stored beside a plain-text comment.
 * Invalid entries, entries no longer present in the text, and duplicate
 * annotationId/label pairs are removed. Output follows first text occurrence.
 */
export function normalizeAnnotationReferences(
    content: string,
    references: readonly unknown[] | undefined
): IAnnotationReference[] | undefined {
    if (!references?.length) return undefined

    const uniqueReferences = new Map<string, { reference: IAnnotationReference; index: number }>()
    const annotationIdsByLabel = new Map<string, string>()
    const ambiguousLabels = new Set<string>()

    references.forEach((reference) => {
        if (!isValidAnnotationReference(reference)) return
        if (ambiguousLabels.has(reference.label)) return

        const index = findReferenceLabel(content, reference.label)
        if (index === -1) return

        const existingAnnotationId = annotationIdsByLabel.get(reference.label)
        if (existingAnnotationId && existingAnnotationId !== reference.annotationId) {
            ambiguousLabels.add(reference.label)
            annotationIdsByLabel.delete(reference.label)
            Array.from(uniqueReferences.entries()).forEach(([key, value]) => {
                if (value.reference.label === reference.label) {
                    uniqueReferences.delete(key)
                }
            })
            return
        }

        annotationIdsByLabel.set(reference.label, reference.annotationId)
        const key = `${reference.annotationId}\u0000${reference.label}`
        if (!uniqueReferences.has(key)) {
            uniqueReferences.set(key, { reference, index })
        }
    })

    const normalized = Array.from(uniqueReferences.values())
        .sort((a, b) => a.index - b.index)
        .map(({ reference }) => ({ ...reference }))

    return normalized.length > 0 ? normalized : undefined
}

export interface AnnotationReferenceContent {
    content: string
    references?: IAnnotationReference[]
}

/**
 * Rewrites stale visible labels from current annotation numbers in one pass.
 * One-pass replacement keeps swaps such as #2 ↔ #3 from overwriting each other.
 */
export function synchronizeAnnotationReferenceLabels(
    content: string,
    references: readonly unknown[] | undefined,
    annotations: readonly IAnnotationStore[]
): AnnotationReferenceContent {
    const normalizedReferences = normalizeAnnotationReferences(content, references)
    if (!normalizedReferences) return { content }

    const annotationsById = new Map(
        annotations.map((annotation) => [annotation.id, annotation])
    )
    const labels = new Map<string, string>()
    const updatedReferences = normalizedReferences.map((reference) => {
        const referenceNumber = annotationsById.get(reference.annotationId)?.referenceNumber
        if (referenceNumber === undefined) return reference

        const currentLabel = `#${referenceNumber}`
        labels.set(reference.label, currentLabel)
        return currentLabel === reference.label
            ? reference
            : { ...reference, label: currentLabel }
    })
    const changedLabels = Array.from(labels.entries())
        .filter(([oldLabel, currentLabel]) => oldLabel !== currentLabel)

    if (changedLabels.length === 0) {
        return { content, references: normalizedReferences }
    }

    const escapedLabels = changedLabels
        .map(([label]) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length)
    const labelPattern = new RegExp(`(?:${escapedLabels.join('|')})(?!\\d)`, 'g')
    const synchronizedContent = content.replace(
        labelPattern,
        (label) => labels.get(label) ?? label
    )

    return {
        content: synchronizedContent,
        references: normalizeAnnotationReferences(
            synchronizedContent,
            updatedReferences
        )
    }
}

export { ANNOTATION_REFERENCE_LABEL_PATTERN }
