import type { IAnnotationStore } from '../../const/definitions'

const MAX_REFERENCE_CANDIDATES = 20
const REFERENCE_QUERY_PATTERN = /^[\p{L}\p{N}_-]*$/u
const VALID_TRIGGER_PREFIX_PATTERN = /[\s([{'",.!?;:“‘，。！？、：；]/

export interface AnnotationReferenceQuery {
    start: number
    end: number
    query: string
}

export function findAnnotationReferenceQuery(
    content: string,
    caretPosition: number
): AnnotationReferenceQuery | null {
    const beforeCaret = content.slice(0, caretPosition)
    const hashIndex = beforeCaret.lastIndexOf('#')
    if (hashIndex === -1) return null

    const prefix = content[hashIndex - 1]
    if (prefix && !VALID_TRIGGER_PREFIX_PATTERN.test(prefix)) return null

    const query = beforeCaret.slice(hashIndex + 1)
    if (!REFERENCE_QUERY_PATTERN.test(query)) return null

    return {
        start: hashIndex,
        end: caretPosition,
        query
    }
}

export function filterAnnotationReferenceCandidates(
    annotations: readonly IAnnotationStore[],
    query: string,
    excludeAnnotationId: string
): IAnnotationStore[] {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return annotations
        .filter((annotation) => {
            if (
                annotation.id === excludeAnnotationId
                || annotation.referenceNumber === undefined
            ) {
                return false
            }
            if (!normalizedQuery) return true

            const searchableText = [
                annotation.referenceNumber,
                `#${annotation.referenceNumber}`,
                annotation.title,
                annotation.pageNumber,
                annotation.subtype,
                annotation.contentsObj?.text
            ]
                .filter((value) => value !== undefined && value !== null)
                .join(' ')
                .toLocaleLowerCase()

            return searchableText.includes(normalizedQuery)
        })
        .sort((a, b) => a.referenceNumber! - b.referenceNumber!)
        .slice(0, MAX_REFERENCE_CANDIDATES)
}

export { MAX_REFERENCE_CANDIDATES }
